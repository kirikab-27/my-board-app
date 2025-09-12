/**
 * Deployment Configuration
 * Issue #62: Blue-Green・カナリアデプロイメントシステム
 */

export interface DeploymentEnvironment {
  name: string;
  url: string;
  type: 'production' | 'staging' | 'development';
  region?: string;
  provider: 'vercel' | 'aws' | 'custom';
}

export interface BlueGreenConfig {
  enabled: boolean;
  autoSwitch: boolean;
  switchDelay: number; // minutes
  healthCheckUrl: string;
  healthCheckInterval: number; // seconds
  healthCheckTimeout: number; // seconds
  rollbackOnFailure: boolean;
  warmupTime: number; // seconds
}

export interface CanaryConfig {
  enabled: boolean;
  initialTrafficPercentage: number;
  incrementPercentage: number;
  incrementInterval: number; // minutes
  maxErrorRate: number; // percentage
  autoRollback: boolean;
  metricsEndpoint?: string;
}

export interface DeploymentConfig {
  projectName: string;
  environments: DeploymentEnvironment[];
  blueGreen: BlueGreenConfig;
  canary: CanaryConfig;
  monitoring: {
    sentryDsn?: string;
    slackWebhook?: string;
    emailNotifications?: string[];
  };
  approval: {
    required: boolean;
    approvers?: string[];
    autoApproveAfter?: number; // hours
  };
  rollback: {
    maxVersions: number;
    autoRollbackOnError: boolean;
    errorThreshold: number; // percentage
    cooldownPeriod: number; // minutes
  };
}

// Default configuration
export const defaultDeploymentConfig: DeploymentConfig = {
  projectName: 'my-board-app',
  environments: [
    {
      name: 'production',
      url: 'https://kab137lab.com',
      type: 'production',
      provider: 'vercel',
    },
    {
      name: 'staging',
      url: 'https://staging.kab137lab.com',
      type: 'staging',
      provider: 'vercel',
    },
    {
      name: 'development',
      url: 'http://localhost:3010',
      type: 'development',
      provider: 'custom',
    },
  ],
  blueGreen: {
    enabled: true,
    autoSwitch: false,
    switchDelay: 5,
    healthCheckUrl: '/api/health',
    healthCheckInterval: 30,
    healthCheckTimeout: 10,
    rollbackOnFailure: true,
    warmupTime: 60,
  },
  canary: {
    enabled: true,
    initialTrafficPercentage: 10,
    incrementPercentage: 20,
    incrementInterval: 10,
    maxErrorRate: 5,
    autoRollback: true,
    metricsEndpoint: '/api/metrics',
  },
  monitoring: {
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    emailNotifications: ['admin@kab137lab.com'],
  },
  approval: {
    required: true,
    approvers: ['kirikab-27'],
    autoApproveAfter: 24,
  },
  rollback: {
    maxVersions: 10,
    autoRollbackOnError: true,
    errorThreshold: 10,
    cooldownPeriod: 5,
  },
};

export default defaultDeploymentConfig;
