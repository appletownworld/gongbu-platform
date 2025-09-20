import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ValidationPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  PluginService,
  CreatePluginRequest,
  InstallPluginRequest,
  UpdatePluginRequest,
  PluginSearchQuery,
  PluginExecutionContext
} from './plugin.service';
import {
  PluginType,
  PluginCategory,
  PluginStatus,
  InstallationStatus
} from '@prisma/client';
import { IsOptional, IsString, IsBoolean, IsEnum, IsArray, IsNumber, IsObject } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// DTOs
class CreatePluginDto implements CreatePluginRequest {
  @IsString()
  name: string;

  @IsString()
  displayName: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsEnum(PluginType)
  type: PluginType;

  @IsEnum(PluginCategory)
  category: PluginCategory;

  @IsString()
  authorId: string;

  @IsString()
  authorName: string;

  @IsOptional()
  @IsString()
  authorEmail?: string;

  @IsString()
  version: string;

  @IsOptional()
  @IsString()
  repositoryUrl?: string;

  @IsOptional()
  @IsString()
  homepageUrl?: string;

  @IsOptional()
  @IsString()
  licenseType?: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsBoolean()
  sandboxed?: boolean;

  @IsOptional()
  @IsObject()
  configSchema?: any;

  @IsOptional()
  @IsObject()
  defaultConfig?: any;

  @IsOptional()
  @IsString()
  minGongbuVersion?: string;

  @IsOptional()
  @IsObject()
  dependencies?: Record<string, string>;
}

class InstallPluginDto implements InstallPluginRequest {
  @IsString()
  pluginId: string;

  @IsOptional()
  @IsString()
  versionId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  autoUpdate?: boolean;
}

class UpdatePluginDto implements UpdatePluginRequest {
  @IsString()
  pluginId: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsObject()
  configSchema?: any;

  @IsOptional()
  @IsObject()
  defaultConfig?: any;
}

class SearchPluginsDto implements PluginSearchQuery {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsEnum(PluginType)
  type?: PluginType;

  @IsOptional()
  @IsEnum(PluginCategory)
  category?: PluginCategory;

  @IsOptional()
  @IsEnum(PluginStatus)
  status?: PluginStatus;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  verified?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  featured?: boolean;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  minRating?: number;

  @IsOptional()
  @IsString()
  sortBy?: 'downloads' | 'rating' | 'updated' | 'created' | 'name';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  offset?: number;
}

class ExecutePluginDto implements PluginExecutionContext {
  @IsString()
  pluginId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  hookName?: string;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  timeout?: number;
}

class UpdateConfigurationDto {
  @IsObject()
  configuration: Record<string, any>;
}

@ApiTags('Plugins')
@Controller('plugins')
@ApiBearerAuth()
export class PluginController {
  private readonly logger = new Logger(PluginController.name);

  constructor(private readonly pluginService: PluginService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new plugin',
    description: 'Creates a new plugin in the system. Plugin will be in DRAFT status initially.'
  })
  @ApiResponse({
    status: 201,
    description: 'Plugin created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        slug: { type: 'string' },
        displayName: { type: 'string' },
        type: { type: 'string' },
        category: { type: 'string' },
        status: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid plugin data' })
  @ApiResponse({ status: 409, description: 'Plugin with this name already exists' })
  async createPlugin(@Body() createPluginDto: CreatePluginDto) {
    this.logger.log(`Creating plugin: ${createPluginDto.name}`, {
      type: createPluginDto.type,
      category: createPluginDto.category,
      authorId: createPluginDto.authorId,
    });

    const plugin = await this.pluginService.createPlugin(createPluginDto);

    return {
      id: plugin.id,
      name: plugin.name,
      slug: plugin.slug,
      displayName: plugin.displayName,
      type: plugin.type,
      category: plugin.category,
      status: plugin.status,
      createdAt: plugin.createdAt,
    };
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search plugins',
    description: 'Search and filter plugins with various criteria and faceted search'
  })
  @ApiQuery({ name: 'query', required: false, description: 'Text search query' })
  @ApiQuery({ name: 'type', required: false, enum: PluginType })
  @ApiQuery({ name: 'category', required: false, enum: PluginCategory })
  @ApiQuery({ name: 'status', required: false, enum: PluginStatus })
  @ApiQuery({ name: 'verified', required: false, type: 'boolean' })
  @ApiQuery({ name: 'featured', required: false, type: 'boolean' })
  @ApiQuery({ name: 'authorId', required: false, description: 'Filter by author ID' })
  @ApiQuery({ name: 'tags', required: false, description: 'Comma-separated tags' })
  @ApiQuery({ name: 'minRating', required: false, type: 'number' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['downloads', 'rating', 'updated', 'created', 'name'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Results per page' })
  @ApiQuery({ name: 'offset', required: false, type: 'number', description: 'Results offset' })
  @ApiResponse({
    status: 200,
    description: 'Plugin search results',
    schema: {
      type: 'object',
      properties: {
        plugins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              displayName: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              category: { type: 'string' },
              rating: { type: 'number' },
              downloadCount: { type: 'number' },
              iconUrl: { type: 'string' },
              authorName: { type: 'string' },
              verified: { type: 'boolean' },
              featured: { type: 'boolean' },
            }
          }
        },
        total: { type: 'number' },
        facets: {
          type: 'object',
          properties: {
            types: { type: 'array' },
            categories: { type: 'array' },
            authors: { type: 'array' },
          }
        }
      }
    }
  })
  async searchPlugins(@Query() searchQuery: SearchPluginsDto) {
    this.logger.log('Searching plugins', searchQuery);

    const result = await this.pluginService.searchPlugins(searchQuery);

    return {
      plugins: result.plugins.map(plugin => ({
        id: plugin.id,
        name: plugin.name,
        slug: plugin.slug,
        displayName: plugin.displayName,
        description: plugin.description,
        shortDescription: plugin.shortDescription,
        type: plugin.type,
        category: plugin.category,
        rating: plugin.rating,
        ratingCount: plugin.ratingCount,
        downloadCount: plugin.downloadCount,
        installCount: plugin.installCount,
        iconUrl: plugin.iconUrl,
        authorName: plugin.authorName,
        verified: plugin.verified,
        featured: plugin.featured,
        tags: plugin.tags,
        price: plugin.price,
        currency: plugin.currency,
        createdAt: plugin.createdAt,
        updatedAt: plugin.updatedAt,
      })),
      total: result.total,
      facets: result.facets,
    };
  }

  @Get(':identifier')
  @ApiOperation({
    summary: 'Get plugin details',
    description: 'Retrieves detailed information about a plugin by ID or slug'
  })
  @ApiParam({ name: 'identifier', description: 'Plugin ID or slug' })
  @ApiQuery({ name: 'includeVersions', required: false, type: 'boolean', description: 'Include version history' })
  @ApiResponse({
    status: 200,
    description: 'Plugin details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        slug: { type: 'string' },
        displayName: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string' },
        category: { type: 'string' },
        status: { type: 'string' },
        currentVersion: { type: 'string' },
        rating: { type: 'number' },
        downloadCount: { type: 'number' },
        installCount: { type: 'number' },
        iconUrl: { type: 'string' },
        screenshots: { type: 'array', items: { type: 'string' } },
        authorName: { type: 'string' },
        repositoryUrl: { type: 'string' },
        homepageUrl: { type: 'string' },
        verified: { type: 'boolean' },
        featured: { type: 'boolean' },
        tags: { type: 'array', items: { type: 'string' } },
        permissions: { type: 'array', items: { type: 'string' } },
        configSchema: { type: 'object' },
        defaultConfig: { type: 'object' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        versions: { type: 'array' },
        marketplace: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Plugin not found' })
  async getPlugin(
    @Param('identifier') identifier: string,
    @Query('includeVersions') includeVersions?: boolean
  ) {
    this.logger.log(`Getting plugin: ${identifier}`);

    const plugin = await this.pluginService.getPlugin(identifier, includeVersions);
    
    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    return {
      id: plugin.id,
      name: plugin.name,
      slug: plugin.slug,
      displayName: plugin.displayName,
      description: plugin.description,
      shortDescription: plugin.shortDescription,
      type: plugin.type,
      category: plugin.category,
      status: plugin.status,
      currentVersion: plugin.currentVersion,
      latestVersion: plugin.latestVersion,
      rating: plugin.rating,
      ratingCount: plugin.ratingCount,
      downloadCount: plugin.downloadCount,
      installCount: plugin.installCount,
      activeInstalls: plugin.activeInstalls,
      iconUrl: plugin.iconUrl,
      bannerUrl: plugin.bannerUrl,
      screenshots: plugin.screenshots,
      videos: plugin.videos,
      authorName: plugin.authorName,
      authorEmail: plugin.authorEmail,
      publisherName: plugin.publisherName,
      repositoryUrl: plugin.repositoryUrl,
      homepageUrl: plugin.homepageUrl,
      documentationUrl: plugin.documentationUrl,
      verified: plugin.verified,
      featured: plugin.featured,
      price: plugin.price,
      currency: plugin.currency,
      licenseType: plugin.licenseType,
      tags: plugin.tags,
      keywords: plugin.keywords,
      permissions: plugin.permissions,
      sandboxed: plugin.sandboxed,
      minGongbuVersion: plugin.minGongbuVersion,
      maxGongbuVersion: plugin.maxGongbuVersion,
      dependencies: plugin.dependencies,
      configSchema: plugin.configSchema,
      defaultConfig: plugin.defaultConfig,
      readme: plugin.readme,
      changelog: plugin.changelog,
      createdAt: plugin.createdAt,
      updatedAt: plugin.updatedAt,
      publishedAt: plugin.publishedAt,
      versions: plugin.versions,
      marketplace: plugin.marketplace,
      installationCount: plugin._count?.installations,
      reviewCount: plugin._count?.reviews,
    };
  }

  @Post('install')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Install plugin',
    description: 'Installs a plugin for a user or organization'
  })
  @ApiResponse({
    status: 201,
    description: 'Plugin installation initiated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        pluginId: { type: 'string' },
        versionId: { type: 'string' },
        status: { type: 'string' },
        installedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Plugin or version not found' })
  @ApiResponse({ status: 409, description: 'Plugin already installed' })
  async installPlugin(@Body() installPluginDto: InstallPluginDto) {
    this.logger.log(`Installing plugin: ${installPluginDto.pluginId}`, {
      userId: installPluginDto.userId,
      organizationId: installPluginDto.organizationId,
    });

    const installation = await this.pluginService.installPlugin(installPluginDto);

    return {
      id: installation.id,
      pluginId: installation.pluginId,
      versionId: installation.versionId,
      status: installation.status,
      configuration: installation.configuration,
      autoUpdate: installation.autoUpdate,
      installedAt: installation.installedAt,
    };
  }

  @Delete(':pluginId/install')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Uninstall plugin',
    description: 'Uninstalls a plugin for a user or organization'
  })
  @ApiParam({ name: 'pluginId', description: 'Plugin ID to uninstall' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID (for user installations)' })
  @ApiQuery({ name: 'organizationId', required: false, description: 'Organization ID (for org installations)' })
  @ApiResponse({ status: 204, description: 'Plugin uninstalled successfully' })
  @ApiResponse({ status: 404, description: 'Plugin installation not found' })
  async uninstallPlugin(
    @Param('pluginId') pluginId: string,
    @Query('userId') userId?: string,
    @Query('organizationId') organizationId?: string
  ) {
    this.logger.log(`Uninstalling plugin: ${pluginId}`, { userId, organizationId });

    await this.pluginService.uninstallPlugin(pluginId, userId, organizationId);
  }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute plugin code',
    description: 'Executes plugin code in a secure sandbox environment'
  })
  @ApiResponse({
    status: 200,
    description: 'Plugin executed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        result: { type: 'object' },
        error: { type: 'string' },
        executionTime: { type: 'number' },
        memoryUsage: { type: 'number' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Plugin execution failed' })
  async executePlugin(@Body() executeDto: ExecutePluginDto) {
    this.logger.log(`Executing plugin: ${executeDto.pluginId}`, {
      hookName: executeDto.hookName,
      userId: executeDto.userId,
    });

    return this.pluginService.executePlugin(executeDto);
  }

  @Get('installed/list')
  @ApiOperation({
    summary: 'List installed plugins',
    description: 'Retrieves all installed plugins for a user or organization'
  })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID' })
  @ApiQuery({ name: 'organizationId', required: false, description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Installed plugins retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          plugin: { type: 'object' },
          version: { type: 'object' },
          status: { type: 'string' },
          enabled: { type: 'boolean' },
          configuration: { type: 'object' },
          installedAt: { type: 'string', format: 'date-time' },
          lastUsed: { type: 'string', format: 'date-time' },
          usageCount: { type: 'number' },
        }
      }
    }
  })
  async getInstalledPlugins(
    @Query('userId') userId?: string,
    @Query('organizationId') organizationId?: string
  ) {
    this.logger.log('Getting installed plugins', { userId, organizationId });

    const installations = await this.pluginService.getInstalledPlugins(userId, organizationId);

    return installations.map(installation => ({
      id: installation.id,
      plugin: {
        id: installation.plugin.id,
        name: installation.plugin.name,
        displayName: installation.plugin.displayName,
        description: installation.plugin.description,
        type: installation.plugin.type,
        category: installation.plugin.category,
        iconUrl: installation.plugin.iconUrl,
        authorName: installation.plugin.authorName,
        verified: installation.plugin.verified,
      },
      version: {
        id: installation.version.id,
        version: installation.version.version,
        releaseNotes: installation.version.releaseNotes,
        publishedAt: installation.version.publishedAt,
      },
      status: installation.status,
      enabled: installation.enabled,
      autoUpdate: installation.autoUpdate,
      configuration: installation.configuration,
      installedAt: installation.installedAt,
      lastUsed: installation.lastUsed,
      usageCount: installation.usageCount,
      errorCount: installation.errorCount,
      lastError: installation.lastError,
    }));
  }

  @Put(':pluginId/configuration')
  @ApiOperation({
    summary: 'Update plugin configuration',
    description: 'Updates configuration for an installed plugin'
  })
  @ApiParam({ name: 'pluginId', description: 'Plugin ID' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID' })
  @ApiQuery({ name: 'organizationId', required: false, description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Plugin configuration updated successfully'
  })
  @ApiResponse({ status: 404, description: 'Plugin installation not found' })
  async updatePluginConfiguration(
    @Param('pluginId') pluginId: string,
    @Body() updateConfigDto: UpdateConfigurationDto,
    @Query('userId') userId?: string,
    @Query('organizationId') organizationId?: string
  ) {
    this.logger.log(`Updating plugin configuration: ${pluginId}`, {
      userId,
      organizationId,
    });

    await this.pluginService.updatePluginConfiguration(
      pluginId,
      updateConfigDto.configuration,
      userId,
      organizationId
    );

    return { message: 'Plugin configuration updated successfully' };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('package'))
  @ApiOperation({
    summary: 'Upload plugin package',
    description: 'Uploads a plugin package file (.zip) for installation'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        package: {
          type: 'string',
          format: 'binary',
          description: 'Plugin package file (.zip)',
        },
        metadata: {
          type: 'string',
          description: 'JSON metadata about the plugin',
        },
      },
      required: ['package'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Plugin package uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        packageId: { type: 'string' },
        filename: { type: 'string' },
        size: { type: 'number' },
        hash: { type: 'string' },
        uploadedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid package file' })
  async uploadPluginPackage(
    @UploadedFile() file: Express.Multer.File,
    @Body('metadata') metadata?: string
  ) {
    this.logger.log(`Uploading plugin package: ${file.originalname}`, {
      size: file.size,
      mimetype: file.mimetype,
    });

    // TODO: Implement package validation and storage
    // This would involve:
    // 1. Validating the zip file structure
    // 2. Extracting and validating plugin manifest
    // 3. Security scanning
    // 4. Storing in plugin registry
    // 5. Creating plugin version record

    return {
      packageId: 'temp-package-id',
      filename: file.originalname,
      size: file.size,
      hash: 'temp-hash',
      uploadedAt: new Date(),
    };
  }

  @Get('analytics/overview')
  @ApiOperation({
    summary: 'Get plugin analytics overview',
    description: 'Retrieves overview analytics for all plugins'
  })
  @ApiResponse({
    status: 200,
    description: 'Plugin analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalPlugins: { type: 'number' },
        publishedPlugins: { type: 'number' },
        totalInstalls: { type: 'number' },
        activeInstalls: { type: 'number' },
        totalDownloads: { type: 'number' },
        averageRating: { type: 'number' },
        popularPlugins: { type: 'array' },
        recentPlugins: { type: 'array' },
        categories: { type: 'object' },
      }
    }
  })
  async getPluginAnalytics() {
    this.logger.log('Getting plugin analytics overview');

    // TODO: Implement comprehensive analytics
    // This would aggregate data from various sources

    return {
      totalPlugins: 0,
      publishedPlugins: 0,
      totalInstalls: 0,
      activeInstalls: 0,
      totalDownloads: 0,
      averageRating: 0,
      popularPlugins: [],
      recentPlugins: [],
      categories: {},
    };
  }

  @Get('health/plugins')
  @ApiOperation({
    summary: 'Get plugin system health',
    description: 'Returns health status of the plugin system'
  })
  @ApiResponse({
    status: 200,
    description: 'Plugin system health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        totalPlugins: { type: 'number' },
        activePlugins: { type: 'number' },
        pluginErrors: { type: 'number' },
        systemLoad: { type: 'object' },
        sandboxStatus: { type: 'string' },
        lastCleanup: { type: 'string', format: 'date-time' },
      }
    }
  })
  async getPluginSystemHealth() {
    // TODO: Implement actual health checks
    return {
      status: 'healthy',
      totalPlugins: 0,
      activePlugins: 0,
      pluginErrors: 0,
      systemLoad: {
        cpu: 0.3,
        memory: 0.4,
        disk: 0.2,
      },
      sandboxStatus: 'operational',
      lastCleanup: new Date(),
    };
  }
}
