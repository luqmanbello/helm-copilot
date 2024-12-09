import { IntentParser, CommandIntent } from '../../core/intentParser';

describe('IntentParser', () => {
    let parser: IntentParser;

    beforeEach(() => {
        parser = new IntentParser();
    });

    describe('Chart Creation Commands', () => {
        test('should recognize basic chart creation command', () => {
            const result = parser.parse('create a helm chart for my-app');
            expect(result.intent).toBe(CommandIntent.CREATE_CHART);
            expect(result.params.chartName).toBe('my-app');
        });

        test('should extract service type from command', () => {
            const result = parser.parse('create a helm chart for my-app with LoadBalancer service');
            expect(result.intent).toBe(CommandIntent.CREATE_CHART);
            expect(result.params.values?.service?.type).toBe('LoadBalancer');
        });

        test('should extract replica count from command', () => {
            const result = parser.parse('create a helm chart for my-app with 3 replicas');
            expect(result.intent).toBe(CommandIntent.CREATE_CHART);
            expect(result.params.values?.replicaCount).toBe(3);
        });

        test('should handle complex chart creation command', () => {
            const result = parser.parse(
                'create a helm chart for my-nodejs-app with 3 replicas, LoadBalancer service, and ingress'
            );
            expect(result.intent).toBe(CommandIntent.CREATE_CHART);
            expect(result.params.chartName).toBe('my-nodejs-app');
            expect(result.params.values?.replicaCount).toBe(3);
            expect(result.params.values?.service?.type).toBe('LoadBalancer');
            expect(result.params.resources).toContain('Ingress');
        });
    });

    describe('Chart Scanning Commands', () => {
        test('should recognize security scan command', () => {
            const result = parser.parse('scan my chart for vulnerabilities');
            expect(result.intent).toBe(CommandIntent.SCAN_CHART);
        });

        test('should recognize lint command', () => {
            const result = parser.parse('check my chart for issues');
            expect(result.intent).toBe(CommandIntent.SCAN_CHART);
        });
    });

    describe('Chart Installation Commands', () => {
        test('should recognize install command with namespace', () => {
            const result = parser.parse('install my-release from my-chart in production namespace');
            expect(result.intent).toBe(CommandIntent.INSTALL_CHART);
            expect(result.params.releaseName).toBe('my-release');
            expect(result.params.chartName).toBe('my-chart');
            expect(result.params.namespace).toBe('production');
        });

        test('should handle install command with values', () => {
            const result = parser.parse('install my-app with 5 replicas in staging');
            expect(result.intent).toBe(CommandIntent.INSTALL_CHART);
            expect(result.params.values?.replicaCount).toBe(5);
            expect(result.params.namespace).toBe('staging');
        });
    });

    describe('Release Management Commands', () => {
        test('should recognize list releases command', () => {
            const result = parser.parse('list all releases');
            expect(result.intent).toBe(CommandIntent.LIST_RELEASES);
        });

        test('should recognize status check command', () => {
            const result = parser.parse('get status of my-release');
            expect(result.intent).toBe(CommandIntent.GET_STATUS);
            expect(result.params.releaseName).toBe('my-release');
        });
    });

    describe('Error Handling', () => {
        test('should handle empty command', () => {
            const result = parser.parse('');
            expect(result.intent).toBe(CommandIntent.UNKNOWN);
        });

        test('should handle unrecognized command', () => {
            const result = parser.parse('do something random');
            expect(result.intent).toBe(CommandIntent.UNKNOWN);
        });

        test('should handle malformed commands gracefully', () => {
            const result = parser.parse('cre@te ch&rt with $pecial chars!!');
            expect(result.intent).toBe(CommandIntent.UNKNOWN);
            expect(result.params).toEqual({});
        });
    });

    describe('Parameter Extraction Edge Cases', () => {
        test('should handle multiple numbers in command', () => {
            const result = parser.parse('create chart with 3 replicas and port 8080');
            expect(result.params.values?.replicaCount).toBe(3);
            // Assuming we add port extraction logic
            expect(result.params.values?.service?.port).toBe(8080);
        });

        test('should handle various service type specifications', () => {
            const variations = [
                'with LoadBalancer',
                'using LoadBalancer service',
                'type LoadBalancer',
                'service type LoadBalancer'
            ];

            variations.forEach(variation => {
                const result = parser.parse(`create chart ${variation}`);
                expect(result.params.values?.service?.type).toBe('LoadBalancer');
            });
        });
    });
});

export interface Values {
    replicaCount?: number;
    service?: {
        type?: string;
        port?: number;
    };
    resources?: {
        requests?: {
            cpu?: string;
            memory?: string;
        };
        limits?: {
            cpu?: string;
            memory?: string;
        };
    };
}

export interface CommandParameters {
    chartName?: string;
    releaseName?: string;
    namespace?: string;
    resources?: ResourceType[];
    values?: Values;
    version?: string;
}