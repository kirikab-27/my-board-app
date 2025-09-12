/**
 * Canary Deployment Implementation
 * Issue #62: 段階的リリース機能
 */

import { CanaryConfig, DeploymentEnvironment } from '../../../deployment/deployment.config';

export interface CanaryState {
  enabled: boolean;
  version: string;
  baselineVersion: string;
  trafficPercentage: number;
  startTime: Date | null;
  lastIncrementTime: Date | null;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'rolled_back';
  metrics: CanaryMetrics;
}

export interface CanaryMetrics {
  totalRequests: number;
  canaryRequests: number;
  baselineRequests: number;
  errorRate: number;
  canaryErrorRate: number;
  baselineErrorRate: number;
  averageResponseTime: number;
  canaryResponseTime: number;
  baselineResponseTime: number;
}

export interface TrafficSplitRule {
  version: string;
  percentage: number;
  criteria?: {
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    userAgents?: string[];
    ipRanges?: string[];
  };
}

export class CanaryDeploymentManager {
  private config: CanaryConfig;
  private environment: DeploymentEnvironment;
  private state: CanaryState;
  private metricsInterval?: NodeJS.Timeout;
  private incrementInterval?: NodeJS.Timeout;

  constructor(config: CanaryConfig, environment: DeploymentEnvironment) {
    this.config = config;
    this.environment = environment;
    this.state = {
      enabled: false,
      version: '',
      baselineVersion: '',
      trafficPercentage: 0,
      startTime: null,
      lastIncrementTime: null,
      status: 'idle',
      metrics: this.initializeMetrics(),
    };
  }

  /**
   * Start a canary deployment
   */
  async startCanary(version: string, baselineVersion: string): Promise<void> {
    if (this.state.status === 'running') {
      throw new Error('Canary deployment already in progress');
    }

    console.log(`[Canary] Starting canary deployment for version ${version}`);

    try {
      // Initialize state
      this.state = {
        enabled: true,
        version,
        baselineVersion,
        trafficPercentage: this.config.initialTrafficPercentage,
        startTime: new Date(),
        lastIncrementTime: new Date(),
        status: 'running',
        metrics: this.initializeMetrics(),
      };

      // Apply initial traffic split
      await this.applyTrafficSplit(this.config.initialTrafficPercentage);

      // Start monitoring
      this.startMetricsCollection();
      this.startAutoIncrement();

      console.log(`[Canary] Started with ${this.config.initialTrafficPercentage}% traffic`);
    } catch (error) {
      console.error('[Canary] Failed to start canary deployment:', error);
      this.state.status = 'idle';
      throw error;
    }
  }

  /**
   * Pause the canary deployment
   */
  async pauseCanary(): Promise<void> {
    if (this.state.status !== 'running') {
      throw new Error('No canary deployment in progress');
    }

    console.log('[Canary] Pausing canary deployment');
    this.state.status = 'paused';
    this.stopAutoIncrement();
  }

  /**
   * Resume the canary deployment
   */
  async resumeCanary(): Promise<void> {
    if (this.state.status !== 'paused') {
      throw new Error('Canary deployment is not paused');
    }

    console.log('[Canary] Resuming canary deployment');
    this.state.status = 'running';
    this.startAutoIncrement();
  }

  /**
   * Complete the canary deployment (100% traffic)
   */
  async completeCanary(): Promise<void> {
    if (this.state.status !== 'running' && this.state.status !== 'paused') {
      throw new Error('No canary deployment to complete');
    }

    console.log('[Canary] Completing canary deployment');

    try {
      // Route 100% traffic to canary
      await this.applyTrafficSplit(100);

      this.state.trafficPercentage = 100;
      this.state.status = 'completed';

      // Stop monitoring
      this.stopMetricsCollection();
      this.stopAutoIncrement();

      console.log(`[Canary] Successfully promoted version ${this.state.version}`);
    } catch (error) {
      console.error('[Canary] Failed to complete canary deployment:', error);
      throw error;
    }
  }

  /**
   * Rollback the canary deployment
   */
  async rollbackCanary(): Promise<void> {
    if (this.state.status === 'idle' || this.state.status === 'rolled_back') {
      throw new Error('No canary deployment to rollback');
    }

    console.log('[Canary] Rolling back canary deployment');

    try {
      // Route 0% traffic to canary (100% to baseline)
      await this.applyTrafficSplit(0);

      this.state.trafficPercentage = 0;
      this.state.status = 'rolled_back';

      // Stop monitoring
      this.stopMetricsCollection();
      this.stopAutoIncrement();

      console.log(`[Canary] Rolled back to version ${this.state.baselineVersion}`);
    } catch (error) {
      console.error('[Canary] Failed to rollback canary deployment:', error);
      throw error;
    }
  }

  /**
   * Manually adjust traffic percentage
   */
  async adjustTraffic(percentage: number): Promise<void> {
    if (this.state.status !== 'running' && this.state.status !== 'paused') {
      throw new Error('No active canary deployment');
    }

    if (percentage < 0 || percentage > 100) {
      throw new Error('Traffic percentage must be between 0 and 100');
    }

    console.log(`[Canary] Adjusting traffic to ${percentage}%`);

    await this.applyTrafficSplit(percentage);
    this.state.trafficPercentage = percentage;
    this.state.lastIncrementTime = new Date();
  }

  /**
   * Apply traffic split configuration
   */
  private async applyTrafficSplit(percentage: number): Promise<void> {
    const rules: TrafficSplitRule[] = [
      {
        version: this.state.version,
        percentage: percentage,
      },
      {
        version: this.state.baselineVersion,
        percentage: 100 - percentage,
      },
    ];

    // This would integrate with your CDN/Load Balancer API
    console.log(`[Canary] Applying traffic split:`, rules);

    // For Vercel, you might use their API or edge functions
    // For Cloudflare, you might use Workers or Load Balancing rules

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  /**
   * Collect and analyze metrics
   */
  private async collectMetrics(): Promise<void> {
    if (!this.config.metricsEndpoint) {
      return;
    }

    try {
      const response = await fetch(this.environment.url + this.config.metricsEndpoint, {
        headers: {
          'X-Canary-Version': this.state.version,
        },
      });

      if (response.ok) {
        const metrics = await response.json();
        this.updateMetrics(metrics);

        // Check if rollback is needed
        if (this.shouldRollback()) {
          console.error('[Canary] Error rate exceeded, initiating rollback');
          await this.rollbackCanary();
        }
      }
    } catch (error) {
      console.error('[Canary] Failed to collect metrics:', error);
    }
  }

  /**
   * Update metrics state
   */
  private updateMetrics(data: Record<string, unknown>): void {
    // Update metrics based on collected data
    this.state.metrics = {
      ...this.state.metrics,
      totalRequests:
        typeof data.totalRequests === 'number'
          ? data.totalRequests
          : this.state.metrics.totalRequests,
      canaryRequests:
        typeof data.canaryRequests === 'number'
          ? data.canaryRequests
          : this.state.metrics.canaryRequests,
      baselineRequests:
        typeof data.baselineRequests === 'number'
          ? data.baselineRequests
          : this.state.metrics.baselineRequests,
      errorRate: typeof data.errorRate === 'number' ? data.errorRate : this.state.metrics.errorRate,
      canaryErrorRate:
        typeof data.canaryErrorRate === 'number'
          ? data.canaryErrorRate
          : this.state.metrics.canaryErrorRate,
      baselineErrorRate:
        typeof data.baselineErrorRate === 'number'
          ? data.baselineErrorRate
          : this.state.metrics.baselineErrorRate,
      averageResponseTime:
        typeof data.averageResponseTime === 'number'
          ? data.averageResponseTime
          : this.state.metrics.averageResponseTime,
      canaryResponseTime:
        typeof data.canaryResponseTime === 'number'
          ? data.canaryResponseTime
          : this.state.metrics.canaryResponseTime,
      baselineResponseTime:
        typeof data.baselineResponseTime === 'number'
          ? data.baselineResponseTime
          : this.state.metrics.baselineResponseTime,
    };
  }

  /**
   * Check if rollback is needed based on metrics
   */
  private shouldRollback(): boolean {
    if (!this.config.autoRollback) {
      return false;
    }

    // Check if canary error rate exceeds threshold
    if (this.state.metrics.canaryErrorRate > this.config.maxErrorRate) {
      return true;
    }

    // Check if canary performs significantly worse than baseline
    const errorRateDiff = this.state.metrics.canaryErrorRate - this.state.metrics.baselineErrorRate;
    if (errorRateDiff > this.config.maxErrorRate / 2) {
      return true;
    }

    // Check response time degradation (>50% increase)
    const responseTimeDiff =
      this.state.metrics.canaryResponseTime / this.state.metrics.baselineResponseTime;
    if (responseTimeDiff > 1.5) {
      return true;
    }

    return false;
  }

  /**
   * Auto-increment traffic percentage
   */
  private async autoIncrement(): Promise<void> {
    if (this.state.status !== 'running') {
      return;
    }

    const newPercentage = Math.min(
      100,
      this.state.trafficPercentage + this.config.incrementPercentage
    );

    if (newPercentage === 100) {
      await this.completeCanary();
    } else {
      await this.adjustTraffic(newPercentage);
      console.log(`[Canary] Auto-incremented traffic to ${newPercentage}%`);
    }
  }

  /**
   * Start metrics collection interval
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000); // Collect every 30 seconds
  }

  /**
   * Stop metrics collection
   */
  private stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }
  }

  /**
   * Start auto-increment interval
   */
  private startAutoIncrement(): void {
    this.incrementInterval = setInterval(
      () => {
        this.autoIncrement();
      },
      this.config.incrementInterval * 60 * 1000
    );
  }

  /**
   * Stop auto-increment
   */
  private stopAutoIncrement(): void {
    if (this.incrementInterval) {
      clearInterval(this.incrementInterval);
      this.incrementInterval = undefined;
    }
  }

  /**
   * Initialize empty metrics
   */
  private initializeMetrics(): CanaryMetrics {
    return {
      totalRequests: 0,
      canaryRequests: 0,
      baselineRequests: 0,
      errorRate: 0,
      canaryErrorRate: 0,
      baselineErrorRate: 0,
      averageResponseTime: 0,
      canaryResponseTime: 0,
      baselineResponseTime: 0,
    };
  }

  /**
   * Get current canary state
   */
  getState(): CanaryState {
    return { ...this.state };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMetricsCollection();
    this.stopAutoIncrement();
  }
}

export default CanaryDeploymentManager;
