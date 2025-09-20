import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

@Injectable()
export class CustomHealthIndicator extends HealthIndicator {
  /**
   * Check application-specific health metrics
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check application-specific health conditions
      const checks = await Promise.all([
        this.checkEventLoop(),
        this.checkGarbageCollection(),
        this.checkActiveHandles(),
      ]);

      const isHealthy = checks.every((check) => check.healthy);

      if (isHealthy) {
        return this.getStatus(key, true, {
          eventLoop: checks[0],
          gc: checks[1],
          handles: checks[2],
        });
      }

      throw new HealthCheckError('Custom health check failed', {
        eventLoop: checks[0],
        gc: checks[1],
        handles: checks[2],
      });
    } catch (error) {
      throw new HealthCheckError('Custom health check failed', {
        error: error.message,
      });
    }
  }

  /**
   * Check event loop lag
   */
  private async checkEventLoop(): Promise<{ healthy: boolean; lag: number }> {
    return new Promise((resolve) => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
        resolve({
          healthy: lag < 100, // Alert if event loop lag > 100ms
          lag,
        });
      });
    });
  }

  /**
   * Check garbage collection metrics (if available)
   */
  private async checkGarbageCollection(): Promise<{ healthy: boolean; info: any }> {
    try {
      // This requires --expose-gc flag or performance hooks
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;

      return {
        healthy: heapUsedMB < 100, // Alert if heap usage > 100MB
        info: {
          heapUsedMB: Math.round(heapUsedMB * 100) / 100,
          heapTotalMB: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
          externalMB: Math.round((memUsage.external / 1024 / 1024) * 100) / 100,
        },
      };
    } catch (error) {
      return {
        healthy: true, // Don't fail if GC info is not available
        info: { error: 'GC info not available' },
      };
    }
  }

  /**
   * Check active handles and requests
   */
  private async checkActiveHandles(): Promise<{ healthy: boolean; count: number }> {
    try {
      // Get active handles count (requires Node.js internal APIs)
      const activeHandles = (process as any)._getActiveHandles?.()?.length || 0;
      const activeRequests = (process as any)._getActiveRequests?.()?.length || 0;
      const total = activeHandles + activeRequests;

      return {
        healthy: total < 50, // Alert if too many active handles
        count: total,
      };
    } catch (error) {
      return {
        healthy: true, // Don't fail if handle info is not available
        count: 0,
      };
    }
  }

  /**
   * Check database connection pool health
   */
  async checkDatabasePool(key: string, poolInfo?: any): Promise<HealthIndicatorResult> {
    try {
      // This would be implemented based on your database connection pool
      // For now, we'll return a basic check
      const isHealthy = true; // Replace with actual pool health check

      if (isHealthy) {
        return this.getStatus(key, true, {
          pool: poolInfo || { status: 'healthy' },
        });
      }

      throw new HealthCheckError('Database pool unhealthy', poolInfo);
    } catch (error) {
      throw new HealthCheckError('Database pool check failed', {
        error: error.message,
      });
    }
  }

  /**
   * Check external service dependencies
   */
  async checkExternalServices(key: string, services: string[]): Promise<HealthIndicatorResult> {
    try {
      const serviceChecks = services.map((service) => ({
        name: service,
        healthy: true, // Replace with actual service health checks
        responseTime: Math.random() * 100, // Mock response time
      }));

      const allHealthy = serviceChecks.every((service) => service.healthy);

      if (allHealthy) {
        return this.getStatus(key, true, { services: serviceChecks });
      }

      throw new HealthCheckError('External services unhealthy', { services: serviceChecks });
    } catch (error) {
      throw new HealthCheckError('External services check failed', {
        error: error.message,
      });
    }
  }
}
