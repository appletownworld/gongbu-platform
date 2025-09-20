#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class SimpleTerminalMCP {
  constructor() {
    this.server = new Server(
      {
        name: 'simple-terminal-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'execute_command',
            description: 'Выполнить команду в терминале',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'Команда для выполнения',
                },
                workingDirectory: {
                  type: 'string',
                  description: 'Рабочая директория (опционально)',
                  default: process.cwd(),
                },
              },
              required: ['command'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'execute_command':
            return await this.executeCommand(args);
          default:
            throw new Error(`Неизвестная команда: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Ошибка: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async executeCommand(args) {
    const { command, workingDirectory = process.cwd() } = args;

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workingDirectory,
        timeout: 30000,
        encoding: 'utf8',
      });

      return {
        content: [
          {
            type: 'text',
            text: `Команда: ${command}\nДиректория: ${workingDirectory}\n\nРезультат:\n${stdout}${stderr ? `\nОшибки:\n${stderr}` : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Ошибка выполнения "${command}": ${error.message}`,
          },
        ],
      };
    }
  }


  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Simple Terminal MCP Server запущен');
  }
}

const server = new SimpleTerminalMCP();
server.run().catch(console.error);
