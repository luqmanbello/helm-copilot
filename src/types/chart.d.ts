/**
 * Configuration for a Helm chart
 */
export interface ChartConfig {
  /** Name of the chart */
  name: string;

  /** Chart version (semantic versioning) */
  version: string;

  /** Description of the chart's purpose */
  description: string;

  /** Version of the application being deployed */
  appVersion: string;

  /** Type of chart (usually 'application' or 'library') */
  type: 'application' | 'library';

  /** Type of Kubernetes service (ClusterIP, LoadBalancer, or NodePort) */
  serviceType: 'ClusterIP' | 'LoadBalancer' | 'NodePort';

  /** Number of pod replicas */
  replicas: number;

  /** Container port to expose */
  port: number;
}

/**
* Chart generation options
*/
export interface ChartGenerationOptions {
  /** Target directory for the chart */
  targetDir?: string;

  /** Whether to overwrite existing files */
  overwrite?: boolean;

  /** Additional templates to include */
  additionalTemplates?: string[];
}

/**
* Supported resource types for templates
*/
export type ResourceType = 
  | 'Deployment'
  | 'Service'
  | 'Ingress'
  | 'ConfigMap'
  | 'Secret'
  | 'PersistentVolumeClaim'
  | 'HorizontalPodAutoscaler';

/**
* Chart validation result
*/
export interface ChartValidationResult {
  /** Whether the chart is valid */
  isValid: boolean;

  /** Array of validation errors, if any */
  errors: string[];

  /** Array of validation warnings, if any */
  warnings: string[];
}