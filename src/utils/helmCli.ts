import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';

const execAsync = promisify(exec);

export interface HelmResult {
    success: boolean;
    output: string;
    error?: string;
}

export class HelmCLI {
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Helm Copilot');
    }

    /**
     * Execute a Helm command and return the result
     */
    private async execute(command: string): Promise<HelmResult> {
        try {
            this.outputChannel.appendLine(`Executing: helm ${command}`);
            const { stdout, stderr } = await execAsync(`helm ${command}`);
            
            if (stderr) {
                this.outputChannel.appendLine(`Warning: ${stderr}`);
            }
            
            this.outputChannel.appendLine(`Output: ${stdout}`);
            return {
                success: true,
                output: stdout,
                error: stderr || undefined
            };
        } catch (error) {
            this.outputChannel.appendLine(`Error: ${error.message}`);
            return {
                success: false,
                output: '',
                error: error.message
            };
        }
    }

    /**
     * Create a new Helm chart
     */
    async createChart(name: string, directory?: string): Promise<HelmResult> {
        const dir = directory ? `--directory "${directory}"` : '';
        return this.execute(`create ${name} ${dir}`);
    }

    /**
     * Install a Helm chart
     */
    async install(
        releaseName: string, 
        chart: string, 
        namespace?: string, 
        values?: Record<string, any>
    ): Promise<HelmResult> {
        let command = `install ${releaseName} ${chart}`;
        
        if (namespace) {
            command += ` --namespace ${namespace}`;
        }

        if (values) {
            // Create temporary values file
            // TODO: Implement values file creation
        }

        return this.execute(command);
    }

    /**
     * Upgrade a Helm release
     */
    async upgrade(
        releaseName: string, 
        chart: string, 
        namespace?: string
    ): Promise<HelmResult> {
        let command = `upgrade ${releaseName} ${chart}`;
        
        if (namespace) {
            command += ` --namespace ${namespace}`;
        }

        return this.execute(command);
    }

    /**
     * Uninstall a Helm release
     */
    async uninstall(releaseName: string, namespace?: string): Promise<HelmResult> {
        let command = `uninstall ${releaseName}`;
        
        if (namespace) {
            command += ` --namespace ${namespace}`;
        }

        return this.execute(command);
    }

    /**
     * List all Helm releases
     */
    async listReleases(namespace?: string, all?: boolean): Promise<HelmResult> {
        let command = 'list';
        
        if (namespace) {
            command += ` --namespace ${namespace}`;
        }
        
        if (all) {
            command += ' --all';
        }

        return this.execute(command);
    }

    /**
     * Get the status of a Helm release
     */
    async getStatus(releaseName: string, namespace?: string): Promise<HelmResult> {
        let command = `status ${releaseName}`;
        
        if (namespace) {
            command += ` --namespace ${namespace}`;
        }

        return this.execute(command);
    }

    /**
     * Get the manifest for a release
     */
    async getManifest(releaseName: string, namespace?: string): Promise<HelmResult> {
        let command = `get manifest ${releaseName}`;
        
        if (namespace) {
            command += ` --namespace ${namespace}`;
        }

        return this.execute(command);
    }

    /**
     * Get the values for a release
     */
    async getValues(releaseName: string, namespace?: string, all?: boolean): Promise<HelmResult> {
        let command = `get values ${releaseName}`;
        
        if (namespace) {
            command += ` --namespace ${namespace}`;
        }
        
        if (all) {
            command += ' --all';
        }

        return this.execute(command);
    }

    /**
     * Lint a Helm chart
     */
    async lintChart(chartPath: string): Promise<HelmResult> {
        return this.execute(`lint ${chartPath}`);
    }

    /**
     * Add a Helm repository
     */
    async addRepo(name: string, url: string): Promise<HelmResult> {
        return this.execute(`repo add ${name} ${url}`);
    }

    /**
     * Update Helm repositories
     */
    async updateRepos(): Promise<HelmResult> {
        return this.execute('repo update');
    }

    /**
     * Check if Helm is installed and get its version
     */
    async validateHelm(): Promise<HelmResult> {
        return this.execute('version');
    }
}