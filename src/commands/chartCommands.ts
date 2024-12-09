import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ChartConfig } from '../types/chart';
import { ResponseMessage } from '@microsoft/powertools-chat-core';

export class ChartCommands {
    constructor(private workspaceRoot: string) {}

    async generateChart(command: string): Promise<ResponseMessage> {
        try {
            // Extract configuration from command
            const config = await this.parseChartConfig(command);
            
            // Create chart directory
            const chartPath = path.join(this.workspaceRoot, config.name);
            await this.createChartStructure(chartPath, config);

            return {
                content: `Successfully created Helm chart at ${chartPath}. The chart includes:\n` +
                        `- Chart.yaml: Basic chart information\n` +
                        `- values.yaml: Default configuration values\n` +
                        `- templates/: Kubernetes resource templates\n\n` +
                        `Would you like me to explain the generated files or help you customize them?`
            };
        } catch (error) {
            return {
                content: `Failed to generate chart: ${error.message}`
            };
        }
    }

    private async parseChartConfig(command: string): Promise<ChartConfig> {
        // Default configuration
        const config: ChartConfig = {
            name: 'my-app',
            version: '0.1.0',
            description: 'A Helm chart for Kubernetes',
            appVersion: '1.0.0',
            type: 'application',
            serviceType: 'ClusterIP',
            replicas: 1,
            port: 80
        };

        // Extract name from command
        const nameMatch = command.match(/for\s+(\w+[-\w]*)/i);
        if (nameMatch) {
            config.name = nameMatch[1].toLowerCase();
        }

        // Extract service type
        if (command.toLowerCase().includes('loadbalancer')) {
            config.serviceType = 'LoadBalancer';
        } else if (command.toLowerCase().includes('nodeport')) {
            config.serviceType = 'NodePort';
        }

        // Extract replica count
        const replicaMatch = command.match(/(\d+)\s+replicas?/i);
        if (replicaMatch) {
            config.replicas = parseInt(replicaMatch[1]);
        }

        return config;
    }

    private async createChartStructure(chartPath: string, config: ChartConfig): Promise<void> {
        // Create directories
        await fs.mkdir(chartPath, { recursive: true });
        await fs.mkdir(path.join(chartPath, 'templates'), { recursive: true });

        // Create Chart.yaml
        await this.createChartYaml(chartPath, config);

        // Create values.yaml
        await this.createValuesYaml(chartPath, config);

        // Create templates
        await this.createTemplates(chartPath, config);
    }

    private async createChartYaml(chartPath: string, config: ChartConfig): Promise<void> {
        const content = `apiVersion: v2
name: ${config.name}
description: ${config.description}
type: ${config.type}
version: ${config.version}
appVersion: ${config.appVersion}
`;
        await fs.writeFile(path.join(chartPath, 'Chart.yaml'), content);
    }

    private async createValuesYaml(chartPath: string, config: ChartConfig): Promise<void> {
        const content = `# Default values for ${config.name}
replicaCount: ${config.replicas}

image:
  repository: nginx
  pullPolicy: IfNotPresent
  tag: ""

nameOverride: ""
fullnameOverride: ""

service:
  type: ${config.serviceType}
  port: ${config.port}

resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi

nodeSelector: {}
tolerations: []
affinity: {}
`;
        await fs.writeFile(path.join(chartPath, 'values.yaml'), content);
    }

    private async createTemplates(chartPath: string, config: ChartConfig): Promise<void> {
        // Create _helpers.tpl
        const helpersContent = `{{/*
Expand the name of the chart.
*/}}
{{- define "${config.name}.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "${config.name}.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "${config.name}.labels" -}}
helm.sh/chart: {{ include "${config.name}.chart" . }}
{{ include "${config.name}.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}
`;
        await fs.writeFile(path.join(chartPath, 'templates', '_helpers.tpl'), helpersContent);

        // Create deployment.yaml
        const deploymentContent = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "${config.name}.fullname" . }}
  labels:
    {{- include "${config.name}.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "${config.name}.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "${config.name}.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.service.port }}
              protocol: TCP
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
`;
        await fs.writeFile(path.join(chartPath, 'templates', 'deployment.yaml'), deploymentContent);

        // Create service.yaml
        const serviceContent = `apiVersion: v1
kind: Service
metadata:
  name: {{ include "${config.name}.fullname" . }}
  labels:
    {{- include "${config.name}.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{- include "${config.name}.selectorLabels" . | nindent 4 }}
`;
        await fs.writeFile(path.join(chartPath, 'templates', 'service.yaml'), serviceContent);
    }
}