import * as vscode from 'vscode';
import { ChatMessage, ResponseMessage } from '@microsoft/powertools-chat-core';
import { HelmCLI } from './utils/helmCli';
import { IntentParser, CommandIntent } from './core/intentParser';
import { ChartCommands } from './commands/chartCommands';

export class HelmCopilot {
    private helmCli: HelmCLI;
    private intentParser: IntentParser;
    private chartCommands: ChartCommands;

    constructor(private context: vscode.ExtensionContext) {
        this.helmCli = new HelmCLI();
        this.intentParser = new IntentParser();
        this.chartCommands = new ChartCommands(this.getWorkspaceRoot());
    }

    private getWorkspaceRoot(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder found');
        }
        return workspaceFolders[0].uri.fsPath;
    }

    async handleChatMessage(message: ChatMessage): Promise<ResponseMessage> {
        try {
            // First validate if Helm is installed
            const helmVersion = await this.helmCli.validateHelm();
            if (!helmVersion.success) {
                return {
                    content: "It seems Helm is not installed or accessible. Please install Helm and try again."
                };
            }

            // Parse the user's intent
            const parsedCommand = this.intentParser.parse(message.content);

            // Handle different intents
            switch (parsedCommand.intent) {
                case CommandIntent.CREATE_CHART:
                    return this.chartCommands.generateChart(message.content);

                case CommandIntent.SCAN_CHART:
                    return this.handleScanChart(parsedCommand);

                case CommandIntent.INSTALL_CHART:
                    return this.handleInstallChart(parsedCommand);

                case CommandIntent.LIST_RELEASES:
                    return this.handleListReleases(parsedCommand);

                case CommandIntent.GET_STATUS:
                    return this.handleGetStatus(parsedCommand);

                case CommandIntent.UNKNOWN:
                    return {
                        content: `I'm not sure how to help with that. Here are some things you can ask me to do:
- Create a new Helm chart
- Scan a chart for security issues
- Install or upgrade a chart
- List releases
- Check release status
What would you like to do?`
                    };

                default:
                    return {
                        content: "I don't know how to handle that request yet."
                    };
            }
        } catch (error) {
            console.error('Error handling message:', error);
            return {
                content: `Sorry, I encountered an error: ${error.message}`
            };
        }
    }

    private async handleScanChart(parsedCommand: any): Promise<ResponseMessage> {
        // For now, just run helm lint
        const lintResult = await this.helmCli.lintChart(parsedCommand.params.chartName || '.');
        if (lintResult.success) {
            return {
                content: "Chart validation successful! No issues found."
            };
        } else {
            return {
                content: `Found some issues with the chart:\n${lintResult.error}`
            };
        }
    }

    private async handleInstallChart(parsedCommand: any): Promise<ResponseMessage> {
        const { releaseName, chartName, namespace } = parsedCommand.params;
        if (!releaseName || !chartName) {
            return {
                content: "Please provide both a release name and chart name for installation."
            };
        }

        const result = await this.helmCli.install(releaseName, chartName, namespace);
        if (result.success) {
            return {
                content: `Successfully installed ${chartName} as ${releaseName}${namespace ? ` in namespace ${namespace}` : ''}`
            };
        } else {
            return {
                content: `Failed to install chart: ${result.error}`
            };
        }
    }

    private async handleListReleases(parsedCommand: any): Promise<ResponseMessage> {
        const result = await this.helmCli.listReleases(parsedCommand.params.namespace);
        if (result.success) {
            return {
                content: `Current Helm releases:\n${result.output}`
            };
        } else {
            return {
                content: `Failed to list releases: ${result.error}`
            };
        }
    }

    private async handleGetStatus(parsedCommand: any): Promise<ResponseMessage> {
        const { releaseName, namespace } = parsedCommand.params;
        if (!releaseName) {
            return {
                content: "Please specify which release you'd like to check."
            };
        }

        const result = await this.helmCli.getStatus(releaseName, namespace);
        if (result.success) {
            return {
                content: `Status for ${releaseName}:\n${result.output}`
            };
        } else {
            return {
                content: `Failed to get status: ${result.error}`
            };
        }
    }
}

let helmCopilot: HelmCopilot;

export function activate(context: vscode.ExtensionContext) {
    helmCopilot = new HelmCopilot(context);

    // Register the chat message handler for @helm commands
    context.subscriptions.push(
        vscode.chat.registerChatParticipant('helm', {
            name: 'Helm Assistant',
            handle: 'helm',
            description: 'Helps with Helm chart operations and management',
            iconPath: vscode.Uri.joinPath(context.extensionUri, 'media', 'helm-icon.png'),
            
            // Define what triggers this participant
            routingRules: [
                {
                    type: 'prefix',
                    prefix: '@helm'
                }
            ],
            
            // Handle incoming messages
            handleChatMessage: async (message: ChatMessage) => {
                return helmCopilot.handleChatMessage(message);
            }
        })
    );

    vscode.window.showInformationMessage('Helm Copilot is now active! Use @helm in GitHub Copilot Chat to get started.');
}

export function deactivate() {
    // Cleanup code if needed
}