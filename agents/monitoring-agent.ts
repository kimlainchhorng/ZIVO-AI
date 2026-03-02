export type AlertLevel = "info" | "warning" | "error" | "critical";

export interface Alert {
  id: string;
  level: AlertLevel;
  message: string;
  service?: string;
  timestamp: Date;
}

export interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  uptime: number;
  responseTime: number;
  lastChecked: Date;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  apiLatency: number;
  errorRate: number;
  services: ServiceHealth[];
}

const SERVICES = ["AI Engine", "Search Index", "ML Pipeline", "Database", "CDN", "API Gateway"];

export class MonitoringAgent {
  private alerts: Alert[] = [];

  /**
   * Get current system metrics with simulated live values
   */
  async getMetrics(): Promise<SystemMetrics> {
    const services: ServiceHealth[] = SERVICES.map((name) => {
      const uptime = parseFloat((99.5 + Math.random() * 0.5).toFixed(2));
      const responseTime = Math.round(10 + Math.random() * 200);
      const status: ServiceHealth["status"] =
        uptime >= 99.9 ? "healthy" : uptime >= 99.0 ? "degraded" : "down";
      return { name, status, uptime, responseTime, lastChecked: new Date() };
    });

    return {
      cpu: Math.round(30 + Math.random() * 40),
      memory: Math.round(50 + Math.random() * 30),
      apiLatency: Math.round(20 + Math.random() * 60),
      errorRate: parseFloat((Math.random() * 0.5).toFixed(2)),
      services,
    };
  }

  /**
   * Check health of a specific service
   */
  async checkHealth(service: string): Promise<ServiceHealth> {
    const uptime = parseFloat((99.5 + Math.random() * 0.5).toFixed(2));
    const responseTime = Math.round(5 + Math.random() * 100);
    const status: ServiceHealth["status"] =
      uptime >= 99.9 ? "healthy" : uptime >= 99.0 ? "degraded" : "down";

    return {
      name: service,
      status,
      uptime,
      responseTime,
      lastChecked: new Date(),
    };
  }

  /**
   * Create a new monitoring alert
   */
  createAlert(level: AlertLevel, message: string, service?: string): Alert {
    const alert: Alert = {
      id: Date.now().toString(),
      level,
      message,
      service,
      timestamp: new Date(),
    };
    this.alerts.push(alert);
    return alert;
  }

  /**
   * Get all alerts, optionally filtered by level
   */
  getAlerts(level?: AlertLevel): Alert[] {
    if (level) return this.alerts.filter((a) => a.level === level);
    return [...this.alerts];
  }
}
