import { ResourceType } from '../types/chart';

export enum CommandIntent {
    CREATE_CHART = 'CREATE_CHART',
    UPDATE_CHART = 'UPDATE_CHART',
    SCAN_CHART = 'SCAN_CHART',
    INSTALL_CHART = 'INSTALL_CHART',
    UNINSTALL_CHART = 'UNINSTALL_CHART',
    LIST_RELEASES = 'LIST_RELEASES',
    GET_STATUS = 'GET_STATUS',
    UNKNOWN = 'UNKNOWN'
}

export interface ParsedCommand {
    intent: CommandIntent;
    params: CommandParameters;
    originalCommand: string;
}

export interface CommandParameters {
    chartName?: string;
    releaseName?: string;
    namespace?: string;
    resources?: ResourceType[];
    values?: Record<string, any>;
    version?: string;
}

export class IntentParser {
    /**
     * Parse a natural language command to determine intent and extract parameters
     */
    public parse(command: string): ParsedCommand {
        const normalizedCommand = command.toLowerCase().trim();
        
        // Default response structure
        const result: ParsedCommand = {
            intent: CommandIntent.UNKNOWN,
            params: {},
            originalCommand: command
        };

        // Determine primary intent
        result.intent = this.determineIntent(normalizedCommand);

        // Extract parameters based on the intent
        result.params = this.extractParameters(normalizedCommand, result.intent);

        return result;
    }

    /**
     * Determine the primary intent of the command
     */
    private determineIntent(command: string): CommandIntent {
        // Create/Generate chart patterns
        if (this.matchesAny(command, [
            'create', 'generate', 'new', 'scaffold', 'initialize'
        ]) && command.includes('chart')) {
            return CommandIntent.CREATE_CHART;
        }

        // Update/Modify chart patterns
        if (this.matchesAny(command, [
            'update', 'modify', 'change', 'edit'
        ]) && command.includes('chart')) {
            return CommandIntent.UPDATE_CHART;
        }

        // Scan/Check chart patterns
        if (this.matchesAny(command, [
            'scan', 'check', 'analyze', 'validate', 'verify'
        ])) {
            return CommandIntent.SCAN_CHART;
        }

        // Install chart patterns
        if (this.matchesAny(command, [
            'install', 'deploy', 'release'
        ])) {
            return CommandIntent.INSTALL_CHART;
        }

        // Uninstall chart patterns
        if (this.matchesAny(command, [
            'uninstall', 'remove', 'delete', 'destroy'
        ])) {
            return CommandIntent.UNINSTALL_CHART;
        }

        // List releases patterns
        if (this.matchesAny(command, [
            'list', 'show', 'get'
        ]) && command.includes('release')) {
            return CommandIntent.LIST_RELEASES;
        }

        // Get status patterns
        if (command.includes('status') || 
            (command.includes('get') && command.includes('logs'))) {
            return CommandIntent.GET_STATUS;
        }

        return CommandIntent.UNKNOWN;
    }

    /**
     * Extract relevant parameters based on the command and intent
     */
    private extractParameters(command: string, intent: CommandIntent): CommandParameters {
        const params: CommandParameters = {};

        // Extract chart name
        const chartNameMatch = command.match(/(?:for|chart|named?)\s+([a-z0-9-]+)/i);
        if (chartNameMatch) {
            params.chartName = chartNameMatch[1].toLowerCase();
        }

        // Extract namespace
        const namespaceMatch = command.match(/(?:in|namespace|ns)\s+([a-z0-9-]+)/i);
        if (namespaceMatch) {
            params.namespace = namespaceMatch[1].toLowerCase();
        }

        // Extract version
        const versionMatch = command.match(/version\s+([0-9.]+)/i);
        if (versionMatch) {
            params.version = versionMatch[1];
        }

        // Extract resources for chart creation
        if (intent === CommandIntent.CREATE_CHART) {
            params.resources = this.extractResources(command);
        }

        // Extract values for installation or updates
        if (intent === CommandIntent.INSTALL_CHART || 
            intent === CommandIntent.UPDATE_CHART) {
            params.values = this.extractValues(command);
        }

        return params;
    }

    /**
     * Extract requested Kubernetes resources from command
     */
    private extractResources(command: string): ResourceType[] {
        const resources: ResourceType[] = ['Deployment', 'Service']; // Default resources
        
        if (command.includes('ingress')) {
            resources.push('Ingress');
        }
        if (command.includes('configmap') || command.includes('config map')) {
            resources.push('ConfigMap');
        }
        if (command.includes('secret')) {
            resources.push('Secret');
        }
        if (command.includes('pvc') || command.includes('volume')) {
            resources.push('PersistentVolumeClaim');
        }
        if (command.includes('hpa') || command.includes('autoscal')) {
            resources.push('HorizontalPodAutoscaler');
        }

        return resources;
    }

    /**
     * Extract configuration values from command
     */
    private extractValues(command: string): Record<string, any> {
        const values: Record<string, any> = {};

        // Extract replica count
        const replicaMatch = command.match(/(\d+)\s+replicas?/i);
        if (replicaMatch) {
            values.replicaCount = parseInt(replicaMatch[1]);
        }

        // Extract service type
        if (command.includes('loadbalancer')) {
            values.service = { type: 'LoadBalancer' };
        } else if (command.includes('nodeport')) {
            values.service = { type: 'NodePort' };
        }

        // Extract resource requests/limits
        const resourceMatch = command.match(/(\d+)(m|mi|g)?\s*(cpu|memory|ram)/gi);
        if (resourceMatch) {
            values.resources = {
                requests: {},
                limits: {}
            };
            // Parse resource specifications
            // TODO: Implement resource parsing logic
        }

        return values;
    }

    /**
     * Helper method to check if command contains any of the given terms
     */
    private matchesAny(command: string, terms: string[]): boolean {
        return terms.some(term => command.includes(term));
    }
}