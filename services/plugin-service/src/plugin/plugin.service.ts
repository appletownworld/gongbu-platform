import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { 
  Plugin,
  PluginVersion,
  PluginInstallation,
  PluginType,
  PluginCategory,
  PluginStatus,
  InstallationStatus,
  MarketplaceStatus 
} from '@prisma/client';
import { EnvironmentVariables } from '../config/env.validation';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as tar from 'tar';
import * as semver from 'semver';
import * as crypto from 'crypto';
import { VM } from 'vm2';

export interface CreatePluginRequest {
  name: string;
  displayName: string;
  description: string;
  shortDescription?: string;
  type: PluginType;
  category: PluginCategory;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  version: string;
  repositoryUrl?: string;
  homepageUrl?: string;
  licenseType?: string;
  iconUrl?: string;
  tags?: string[];
  keywords?: string[];
  permissions?: string[];
  sandboxed?: boolean;
  configSchema?: any;
  defaultConfig?: any;
  minGongbuVersion?: string;
  dependencies?: Record<string, string>;
}

export interface InstallPluginRequest {
  pluginId: string;
  versionId?: string; // If not specified, install latest
  userId?: string;
  organizationId?: string;
  configuration?: Record<string, any>;
  autoUpdate?: boolean;
}

export interface UpdatePluginRequest {
  pluginId: string;
  version?: string;
  displayName?: string;
  description?: string;
  shortDescription?: string;
  iconUrl?: string;
  tags?: string[];
  keywords?: string[];
  configSchema?: any;
  defaultConfig?: any;
}

export interface PluginSearchQuery {
  query?: string;
  type?: PluginType;
  category?: PluginCategory;
  status?: PluginStatus;
  verified?: boolean;
  featured?: boolean;
  authorId?: string;
  tags?: string[];
  minRating?: number;
  sortBy?: 'downloads' | 'rating' | 'updated' | 'created' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PluginExecutionContext {
  pluginId: string;
  userId?: string;
  organizationId?: string;
  hookName?: string;
  parameters?: Record<string, any>;
  timeout?: number;
}

export interface PluginExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  memoryUsage?: number;
}

@Injectable()
export class PluginService {
  private readonly logger = new Logger(PluginService.name);
  private readonly pluginDirectory: string;
  private readonly maxExecutionTime: number;
  private readonly maxMemoryUsage: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.pluginDirectory = this.configService.get('PLUGIN_DIRECTORY', '/app/plugins');
    this.maxExecutionTime = this.configService.get('PLUGIN_MAX_EXECUTION_TIME', 5000);
    this.maxMemoryUsage = this.configService.get('PLUGIN_MAX_MEMORY_MB', 100) * 1024 * 1024;
    
    this.ensurePluginDirectory();
  }

  /**
   * Create a new plugin
   */
  async createPlugin(request: CreatePluginRequest): Promise<Plugin> {
    this.logger.log(`Creating plugin: ${request.name}`, {
      type: request.type,
      category: request.category,
      authorId: request.authorId,
    });

    try {
      // Generate slug from name
      const slug = this.generateSlug(request.name);

      // Check if plugin with this slug already exists
      const existingPlugin = await this.prisma.plugin.findUnique({
        where: { slug },
      });

      if (existingPlugin) {
        throw new ConflictException(`Plugin with slug '${slug}' already exists`);
      }

      // Create plugin
      const plugin = await this.prisma.plugin.create({
        data: {
          name: request.name,
          slug,
          displayName: request.displayName,
          description: request.description,
          shortDescription: request.shortDescription,
          type: request.type,
          category: request.category,
          authorId: request.authorId,
          authorName: request.authorName,
          authorEmail: request.authorEmail,
          currentVersion: request.version,
          repositoryUrl: request.repositoryUrl,
          homepageUrl: request.homepageUrl,
          licenseType: request.licenseType || 'MIT',
          iconUrl: request.iconUrl,
          tags: request.tags || [],
          keywords: request.keywords || [],
          permissions: request.permissions || [],
          sandboxed: request.sandboxed !== false,
          configSchema: request.configSchema,
          defaultConfig: request.defaultConfig || {},
          minGongbuVersion: request.minGongbuVersion,
          dependencies: request.dependencies || {},
          status: PluginStatus.DRAFT,
        },
      });

      // Create initial version
      await this.createPluginVersion(plugin.id, {
        version: request.version,
        isPrerelease: false,
        isCurrent: true,
        title: `${request.displayName} v${request.version}`,
        minGongbuVersion: request.minGongbuVersion,
        dependencies: request.dependencies || {},
      });

      // Emit event
      this.eventEmitter.emit('plugin.created', {
        plugin,
        authorId: request.authorId,
      });

      this.logger.log(`✅ Plugin created successfully: ${plugin.id} - ${plugin.name}`);

      return plugin;
    } catch (error) {
      this.logger.error('❌ Failed to create plugin:', error);
      throw error;
    }
  }

  /**
   * Get plugin by ID or slug
   */
  async getPlugin(identifier: string, includeVersions = false): Promise<Plugin | null> {
    return this.prisma.plugin.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier },
        ],
      },
      include: {
        versions: includeVersions,
        marketplace: true,
        installations: {
          where: { status: InstallationStatus.INSTALLED },
          take: 10,
        },
        _count: {
          select: {
            installations: true,
            reviews: true,
          },
        },
      },
    });
  }

  /**
   * Search and list plugins
   */
  async searchPlugins(query: PluginSearchQuery): Promise<{
    plugins: Plugin[];
    total: number;
    facets?: Record<string, any>;
  }> {
    this.logger.debug('Searching plugins', query);

    const where: any = {};

    // Text search
    if (query.query) {
      where.OR = [
        { name: { contains: query.query, mode: 'insensitive' } },
        { displayName: { contains: query.query, mode: 'insensitive' } },
        { description: { contains: query.query, mode: 'insensitive' } },
        { tags: { has: query.query } },
        { keywords: { has: query.query } },
      ];
    }

    // Filters
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.verified !== undefined) where.verified = query.verified;
    if (query.featured !== undefined) where.featured = query.featured;
    if (query.authorId) where.authorId = query.authorId;
    if (query.minRating) where.rating = { gte: query.minRating };
    
    if (query.tags && query.tags.length > 0) {
      where.tags = { hasEvery: query.tags };
    }

    // Sorting
    const orderBy: any = {};
    switch (query.sortBy) {
      case 'downloads':
        orderBy.downloadCount = query.sortOrder || 'desc';
        break;
      case 'rating':
        orderBy.rating = query.sortOrder || 'desc';
        break;
      case 'updated':
        orderBy.updatedAt = query.sortOrder || 'desc';
        break;
      case 'created':
        orderBy.createdAt = query.sortOrder || 'desc';
        break;
      case 'name':
        orderBy.displayName = query.sortOrder || 'asc';
        break;
      default:
        orderBy.downloadCount = 'desc';
        break;
    }

    const [plugins, total] = await Promise.all([
      this.prisma.plugin.findMany({
        where,
        orderBy,
        take: query.limit || 20,
        skip: query.offset || 0,
        include: {
          marketplace: true,
          _count: {
            select: {
              installations: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.plugin.count({ where }),
    ]);

    // Generate facets for filtering
    const facets = await this.generateSearchFacets(where);

    return {
      plugins,
      total,
      facets,
    };
  }

  /**
   * Install plugin for user or organization
   */
  async installPlugin(request: InstallPluginRequest): Promise<PluginInstallation> {
    this.logger.log(`Installing plugin ${request.pluginId}`, {
      userId: request.userId,
      organizationId: request.organizationId,
      versionId: request.versionId,
    });

    try {
      // Validate plugin exists
      const plugin = await this.getPlugin(request.pluginId);
      if (!plugin) {
        throw new NotFoundException('Plugin not found');
      }

      // Check if already installed
      const existingInstallation = await this.prisma.pluginInstallation.findFirst({
        where: {
          pluginId: plugin.id,
          ...(request.userId && { userId: request.userId }),
          ...(request.organizationId && { organizationId: request.organizationId }),
        },
      });

      if (existingInstallation && existingInstallation.status === InstallationStatus.INSTALLED) {
        throw new ConflictException('Plugin is already installed');
      }

      // Get version to install
      let version: PluginVersion;
      if (request.versionId) {
        version = await this.prisma.pluginVersion.findUnique({
          where: { id: request.versionId },
        });
        if (!version) {
          throw new NotFoundException('Plugin version not found');
        }
      } else {
        // Install latest version
        version = await this.prisma.pluginVersion.findFirst({
          where: {
            pluginId: plugin.id,
            status: 'PUBLISHED',
          },
          orderBy: { createdAt: 'desc' },
        });
        if (!version) {
          throw new NotFoundException('No published version found');
        }
      }

      // Create installation
      const installation = await this.prisma.pluginInstallation.create({
        data: {
          pluginId: plugin.id,
          versionId: version.id,
          userId: request.userId,
          organizationId: request.organizationId,
          status: InstallationStatus.PENDING,
          configuration: request.configuration || {},
          autoUpdate: request.autoUpdate || false,
          installationType: 'manual',
        },
      });

      // Start installation process
      await this.processPluginInstallation(installation.id);

      // Update plugin metrics
      await this.updatePluginMetrics(plugin.id, {
        installCount: { increment: 1 },
        activeInstalls: { increment: 1 },
      });

      // Emit event
      this.eventEmitter.emit('plugin.installed', {
        installation,
        plugin,
        userId: request.userId,
        organizationId: request.organizationId,
      });

      this.logger.log(`✅ Plugin installation initiated: ${installation.id}`);

      return installation;
    } catch (error) {
      this.logger.error('❌ Failed to install plugin:', error);
      throw error;
    }
  }

  /**
   * Uninstall plugin
   */
  async uninstallPlugin(
    pluginId: string,
    userId?: string,
    organizationId?: string
  ): Promise<void> {
    this.logger.log(`Uninstalling plugin ${pluginId}`, { userId, organizationId });

    try {
      const installation = await this.prisma.pluginInstallation.findFirst({
        where: {
          pluginId,
          ...(userId && { userId }),
          ...(organizationId && { organizationId }),
          status: InstallationStatus.INSTALLED,
        },
      });

      if (!installation) {
        throw new NotFoundException('Plugin installation not found');
      }

      // Update installation status
      await this.prisma.pluginInstallation.update({
        where: { id: installation.id },
        data: {
          status: InstallationStatus.UNINSTALLING,
        },
      });

      // Remove plugin files
      await this.removePluginFiles(installation.id);

      // Mark as uninstalled
      await this.prisma.pluginInstallation.update({
        where: { id: installation.id },
        data: {
          status: InstallationStatus.UNINSTALLED,
          uninstalledAt: new Date(),
        },
      });

      // Update plugin metrics
      await this.updatePluginMetrics(pluginId, {
        activeInstalls: { decrement: 1 },
      });

      // Emit event
      this.eventEmitter.emit('plugin.uninstalled', {
        installation,
        pluginId,
        userId,
        organizationId,
      });

      this.logger.log(`✅ Plugin uninstalled successfully: ${installation.id}`);
    } catch (error) {
      this.logger.error('❌ Failed to uninstall plugin:', error);
      throw error;
    }
  }

  /**
   * Execute plugin code in sandbox
   */
  async executePlugin(context: PluginExecutionContext): Promise<PluginExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Get plugin installation
      const installation = await this.prisma.pluginInstallation.findFirst({
        where: {
          pluginId: context.pluginId,
          ...(context.userId && { userId: context.userId }),
          ...(context.organizationId && { organizationId: context.organizationId }),
          status: InstallationStatus.INSTALLED,
          enabled: true,
        },
        include: {
          plugin: true,
          version: true,
        },
      });

      if (!installation) {
        throw new Error('Plugin not installed or not enabled');
      }

      // Load plugin code
      const pluginCode = await this.loadPluginCode(installation.id);
      
      // Create sandbox
      const vm = new VM({
        timeout: context.timeout || this.maxExecutionTime,
        sandbox: {
          console: {
            log: (...args: any[]) => this.logger.debug(`Plugin[${context.pluginId}]:`, ...args),
            error: (...args: any[]) => this.logger.error(`Plugin[${context.pluginId}]:`, ...args),
            warn: (...args: any[]) => this.logger.warn(`Plugin[${context.pluginId}]:`, ...args),
          },
          require: this.createSafeRequire(),
          params: context.parameters || {},
          pluginId: context.pluginId,
          hookName: context.hookName,
          config: installation.configuration,
        },
        wasm: false,
        eval: false,
      });

      // Execute plugin
      const result = vm.run(pluginCode);

      const executionTime = Date.now() - startTime;

      // Update usage statistics
      await this.updatePluginUsage(installation.id);

      return {
        success: true,
        result,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error(`Plugin execution failed [${context.pluginId}]:`, error);

      // Track error
      await this.trackPluginError(context.pluginId, error.message);

      return {
        success: false,
        error: error.message,
        executionTime,
      };
    }
  }

  /**
   * Get installed plugins for user/organization
   */
  async getInstalledPlugins(
    userId?: string,
    organizationId?: string
  ): Promise<PluginInstallation[]> {
    return this.prisma.pluginInstallation.findMany({
      where: {
        ...(userId && { userId }),
        ...(organizationId && { organizationId }),
        status: InstallationStatus.INSTALLED,
      },
      include: {
        plugin: true,
        version: true,
      },
      orderBy: { installedAt: 'desc' },
    });
  }

  /**
   * Update plugin configuration
   */
  async updatePluginConfiguration(
    pluginId: string,
    configuration: Record<string, any>,
    userId?: string,
    organizationId?: string
  ): Promise<void> {
    const installation = await this.prisma.pluginInstallation.findFirst({
      where: {
        pluginId,
        ...(userId && { userId }),
        ...(organizationId && { organizationId }),
        status: InstallationStatus.INSTALLED,
      },
    });

    if (!installation) {
      throw new NotFoundException('Plugin installation not found');
    }

    await this.prisma.pluginInstallation.update({
      where: { id: installation.id },
      data: {
        configuration: {
          ...installation.configuration,
          ...configuration,
        },
        updatedAt: new Date(),
      },
    });

    // Emit configuration change event
    this.eventEmitter.emit('plugin.configuration.updated', {
      pluginId,
      configuration,
      userId,
      organizationId,
    });
  }

  /**
   * Clean up inactive plugins
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupInactivePlugins(): Promise<void> {
    this.logger.log('🧹 Cleaning up inactive plugins...');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days

      // Find inactive installations
      const inactiveInstallations = await this.prisma.pluginInstallation.findMany({
        where: {
          status: InstallationStatus.INSTALLED,
          lastUsed: {
            lt: cutoffDate,
          },
        },
      });

      for (const installation of inactiveInstallations) {
        await this.prisma.pluginInstallation.update({
          where: { id: installation.id },
          data: {
            enabled: false,
          },
        });

        this.logger.log(`Disabled inactive plugin: ${installation.pluginId}`);
      }

      // Clean up old uninstalled plugins
      const cleanupDate = new Date();
      cleanupDate.setDate(cleanupDate.getDate() - 90); // 90 days

      const oldUninstalled = await this.prisma.pluginInstallation.deleteMany({
        where: {
          status: InstallationStatus.UNINSTALLED,
          uninstalledAt: {
            lt: cleanupDate,
          },
        },
      });

      this.logger.log(`✅ Cleanup completed: ${inactiveInstallations.length} disabled, ${oldUninstalled.count} deleted`);
    } catch (error) {
      this.logger.error('❌ Failed to cleanup plugins:', error);
    }
  }

  // Private helper methods

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private ensurePluginDirectory(): void {
    if (!fs.existsSync(this.pluginDirectory)) {
      fs.mkdirSync(this.pluginDirectory, { recursive: true });
    }
  }

  private async createPluginVersion(pluginId: string, versionData: any): Promise<PluginVersion> {
    return this.prisma.pluginVersion.create({
      data: {
        pluginId,
        ...versionData,
        packageHash: this.generateHash(JSON.stringify(versionData)),
        status: 'DRAFT',
      },
    });
  }

  private async processPluginInstallation(installationId: string): Promise<void> {
    try {
      // Update status
      await this.prisma.pluginInstallation.update({
        where: { id: installationId },
        data: {
          status: InstallationStatus.INSTALLING,
        },
      });

      // Create plugin directory
      const pluginDir = path.join(this.pluginDirectory, installationId);
      await fs.ensureDir(pluginDir);

      // Download and extract plugin (if package URL exists)
      // This is a placeholder - actual implementation would download from packageUrl
      await fs.writeFile(
        path.join(pluginDir, 'index.js'),
        '// Plugin code would be extracted here\nexports.default = function() { return "Hello from plugin!"; };'
      );

      // Mark as installed
      await this.prisma.pluginInstallation.update({
        where: { id: installationId },
        data: {
          status: InstallationStatus.INSTALLED,
          installPath: pluginDir,
        },
      });

      this.logger.log(`Plugin installation completed: ${installationId}`);
    } catch (error) {
      // Mark as failed
      await this.prisma.pluginInstallation.update({
        where: { id: installationId },
        data: {
          status: InstallationStatus.FAILED,
          lastError: error.message,
        },
      });

      throw error;
    }
  }

  private async removePluginFiles(installationId: string): Promise<void> {
    const pluginDir = path.join(this.pluginDirectory, installationId);
    if (await fs.pathExists(pluginDir)) {
      await fs.remove(pluginDir);
    }
  }

  private async loadPluginCode(installationId: string): Promise<string> {
    const pluginFile = path.join(this.pluginDirectory, installationId, 'index.js');
    
    if (!(await fs.pathExists(pluginFile))) {
      throw new Error('Plugin code not found');
    }

    return fs.readFile(pluginFile, 'utf-8');
  }

  private createSafeRequire(): (module: string) => any {
    const allowedModules = ['lodash', 'moment', 'uuid'];
    
    return (module: string) => {
      if (allowedModules.includes(module)) {
        return require(module);
      }
      throw new Error(`Module '${module}' is not allowed`);
    };
  }

  private async updatePluginMetrics(pluginId: string, metrics: any): Promise<void> {
    await this.prisma.plugin.update({
      where: { id: pluginId },
      data: metrics,
    });
  }

  private async updatePluginUsage(installationId: string): Promise<void> {
    await this.prisma.pluginInstallation.update({
      where: { id: installationId },
      data: {
        lastUsed: new Date(),
        usageCount: { increment: 1 },
      },
    });
  }

  private async trackPluginError(pluginId: string, error: string): Promise<void> {
    // Update error count in installation
    await this.prisma.pluginInstallation.updateMany({
      where: { pluginId },
      data: {
        errorCount: { increment: 1 },
        lastError: error,
      },
    });
  }

  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async generateSearchFacets(baseWhere: any): Promise<Record<string, any>> {
    // Generate facets for search filtering
    const [types, categories, authors] = await Promise.all([
      this.prisma.plugin.groupBy({
        by: ['type'],
        where: baseWhere,
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
      }),
      this.prisma.plugin.groupBy({
        by: ['category'],
        where: baseWhere,
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      }),
      this.prisma.plugin.groupBy({
        by: ['authorName'],
        where: baseWhere,
        _count: { authorName: true },
        orderBy: { _count: { authorName: 'desc' } },
        take: 20,
      }),
    ]);

    return {
      types: types.map(t => ({ value: t.type, count: t._count.type })),
      categories: categories.map(c => ({ value: c.category, count: c._count.category })),
      authors: authors.map(a => ({ value: a.authorName, count: a._count.authorName })),
    };
  }
}
