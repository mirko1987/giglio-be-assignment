import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomHealthIndicator } from './custom-health.indicator';
import * as os from 'os';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private custom: CustomHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Comprehensive health check',
    description: 'Returns overall application health including database, memory, and disk status',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Application is unhealthy',
  })
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Database health check
      () => this.db.pingCheck('database'),

      // Memory health check (alert if using > 150MB of heap)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

      // Memory health check (alert if using > 300MB of RSS)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),

      // Disk health check (alert if less than 250MB free)
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9, // Alert when 90% full
        }),

      // Custom application health checks
      () => this.custom.isHealthy('application'),
    ]);
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Kubernetes readiness probe - checks if application is ready to receive traffic',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is ready to receive traffic',
  })
  @ApiResponse({
    status: 503,
    description: 'Application is not ready',
  })
  @HealthCheck()
  checkReadiness(): Promise<HealthCheckResult> {
    return this.health.check([
      // For readiness, we primarily care about database connectivity
      () => this.db.pingCheck('database'),

      // Basic memory check (more lenient for readiness)
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
    ]);
  }

  @Get('live')
  @ApiOperation({
    summary: 'Liveness probe',
    description:
      'Kubernetes liveness probe - checks if application is alive and should not be restarted',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is alive',
  })
  @ApiResponse({
    status: 503,
    description: 'Application should be restarted',
  })
  @HealthCheck()
  checkLiveness(): Promise<HealthCheckResult> {
    return this.health.check([
      // For liveness, we do very basic checks to avoid false positives
      // that could cause unnecessary pod restarts

      // Basic memory check (very lenient - only fail if severely out of memory)
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),

      // RSS memory check (very lenient)
      () => this.memory.checkRSS('memory_rss', 1000 * 1024 * 1024),
    ]);
  }

  @Get('detailed')
  @ApiOperation({
    summary: 'Detailed health information',
    description: 'Returns detailed health information for monitoring and debugging',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed health information',
  })
  async getDetailedHealth(): Promise<any> {
    const basicHealth = await this.check();

    // Add additional system information
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      nodeEnv: process.env.NODE_ENV,
      memory: {
        used: process.memoryUsage(),
        total: os.totalmem(),
        free: os.freemem(),
      },
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
      },
    };

    return {
      ...basicHealth,
      system: systemInfo,
    };
  }
}
