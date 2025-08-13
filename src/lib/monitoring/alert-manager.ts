import * as Sentry from '@sentry/nextjs';

export interface MetricsData {
  errorRate: number;
  avgResponseTime: number;
  memoryUsage: number;
  dbConnectionErrors: number;
}

export interface AlertRule {
  name: string;
  condition: (metrics: MetricsData) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldown: number; // 秒
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'email' | 'slack' | 'sentry' | 'console';
  config: Record<string, unknown>;
}

export class AlertManager {
  private static instance: AlertManager;
  private lastAlerted: Map<string, number> = new Map();
  private rules: AlertRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  private initializeDefaultRules() {
    this.rules = [
      {
        name: 'high_error_rate',
        condition: (m) => m.errorRate > 5,
        severity: 'critical',
        message: 'エラー率が5%を超えています',
        cooldown: 300,
        actions: [
          { type: 'sentry', config: {} },
          { type: 'console', config: {} },
        ],
      },
      {
        name: 'slow_response_time',
        condition: (m) => m.avgResponseTime > 1000,
        severity: 'high',
        message: '平均応答時間が1秒を超えています',
        cooldown: 600,
        actions: [
          { type: 'sentry', config: {} },
          { type: 'console', config: {} },
        ],
      },
      {
        name: 'memory_usage_high',
        condition: (m) => m.memoryUsage > 80,
        severity: 'medium',
        message: 'メモリ使用率が80%を超えています',
        cooldown: 300,
        actions: [
          { type: 'console', config: {} },
        ],
      },
      {
        name: 'database_connection_issues',
        condition: (m) => m.dbConnectionErrors > 3,
        severity: 'high',
        message: 'データベース接続エラーが多発しています',
        cooldown: 300,
        actions: [
          { type: 'sentry', config: {} },
          { type: 'console', config: {} },
        ],
      },
    ];
  }

  public checkAlerts(metrics: MetricsData) {
    this.rules.forEach(rule => {
      if (rule.condition(metrics)) {
        this.triggerAlert(rule, metrics);
      }
    });
  }

  private triggerAlert(rule: AlertRule, metrics: MetricsData) {
    const now = Date.now();
    const lastAlerted = this.lastAlerted.get(rule.name) || 0;

    // クールダウン期間中はアラート送信をスキップ
    if (now - lastAlerted < rule.cooldown * 1000) {
      return;
    }

    console.log(`🚨 Alert: ${rule.name} - ${rule.message}`);

    // アクション実行
    rule.actions.forEach(action => {
      this.executeAction(action, rule, metrics);
    });

    this.lastAlerted.set(rule.name, now);
  }

  private executeAction(action: AlertAction, rule: AlertRule, metrics: MetricsData) {
    switch (action.type) {
      case 'sentry':
        Sentry.captureMessage(rule.message, this.getSentryLevel(rule.severity));
        break;

      case 'console':
        console.error(`🚨 ${rule.severity.toUpperCase()}: ${rule.message}`, metrics);
        break;

      case 'slack':
        this.sendSlackAlert(rule, metrics, action.config);
        break;

      case 'email':
        this.sendEmailAlert(rule, metrics, action.config);
        break;
    }
  }

  private getSentryLevel(severity: string): 'info' | 'warning' | 'error' | 'fatal' {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'fatal';
      default: return 'warning';
    }
  }

  private async sendSlackAlert(rule: AlertRule, metrics: MetricsData) {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    const payload = {
      text: `🚨 ${rule.severity.toUpperCase()}: ${rule.message}`,
      attachments: [{
        color: this.getAlertColor(rule.severity),
        fields: Object.entries(metrics).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true,
        })),
        timestamp: Math.floor(Date.now() / 1000),
      }],
    };

    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Slack通知送信エラー:', error);
    }
  }

  private async sendEmailAlert(rule: AlertRule, metrics: MetricsData, config: Record<string, unknown>) {
    try {
      await fetch('/api/monitoring/send-alert-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: config.to,
          subject: `Alert: ${rule.message}`,
          rule,
          metrics,
        }),
      });
    } catch (error) {
      console.error('メールアラート送信エラー:', error);
    }
  }

  private getAlertColor(severity: string): string {
    switch (severity) {
      case 'low': return '#36a64f';      // green
      case 'medium': return '#ff9500';   // orange  
      case 'high': return '#e01e5a';     // red
      case 'critical': return '#8b0000'; // dark red
      default: return '#808080';         // gray
    }
  }

  public addRule(rule: AlertRule) {
    this.rules.push(rule);
  }

  public removeRule(name: string) {
    this.rules = this.rules.filter(rule => rule.name !== name);
  }

  public getRules(): AlertRule[] {
    return [...this.rules];
  }
}

export const alertManager = AlertManager.getInstance();