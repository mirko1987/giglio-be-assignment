# Health Monitoring System

This document describes the comprehensive health monitoring system implemented in the NestJS Order System.

## Overview

The health monitoring system provides multiple endpoints for checking the application's health status, suitable for production deployment, Kubernetes probes, and monitoring systems.

## Health Endpoints

### 1. Comprehensive Health Check
**Endpoint:** `GET /health`

**Description:** Returns overall application health including database, memory, disk, and custom application checks.

**Response Format:**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "storage": { "status": "up" },
    "application": { "status": "up" }
  },
  "error": {},
  "details": {
    // Detailed information for each check
  }
}
```

### 2. Readiness Probe
**Endpoint:** `GET /health/ready`

**Description:** Kubernetes readiness probe - checks if application is ready to receive traffic.

**Checks:**
- Database connectivity
- Basic memory usage (< 200MB heap)

### 3. Liveness Probe
**Endpoint:** `GET /health/live`

**Description:** Kubernetes liveness probe - checks if application is alive and should not be restarted.

**Checks:**
- Memory usage (< 500MB heap, < 1GB RSS)
- Basic application responsiveness

### 4. Detailed Health Information
**Endpoint:** `GET /health/detailed`

**Description:** Returns comprehensive system information for monitoring and debugging.

**Additional Information:**
- System uptime
- Node.js version and platform
- Memory usage details
- CPU information
- Load averages

## Health Checks Implemented

### Database Health
- **TypeORM Health Indicator**: Pings the database connection
- **Connection Pool**: Monitors database connection pool status
- **Query Performance**: Basic query response time monitoring

### Memory Monitoring
- **Heap Memory**: Monitors V8 heap usage
  - Warning threshold: 150MB
  - Critical threshold: 200MB (readiness)
  - Failure threshold: 500MB (liveness)
- **RSS Memory**: Monitors Resident Set Size
  - Warning threshold: 300MB
  - Failure threshold: 1GB (liveness)

### Disk Monitoring
- **Storage Space**: Monitors available disk space
  - Alert when 90% full
  - Path monitored: `/` (root filesystem)

### Custom Application Checks
- **Event Loop Lag**: Monitors Node.js event loop performance
  - Alert threshold: > 100ms lag
- **Active Handles**: Monitors active handles and requests
  - Alert threshold: > 50 active handles
- **Garbage Collection**: Monitors memory management
  - Tracks heap usage and GC performance

## Configuration

### Environment Variables
The health checks can be configured through environment variables:

```bash
# Health check thresholds (optional)
HEALTH_MEMORY_HEAP_THRESHOLD=150000000    # 150MB in bytes
HEALTH_MEMORY_RSS_THRESHOLD=300000000     # 300MB in bytes
HEALTH_DISK_THRESHOLD=0.9                 # 90% full
HEALTH_EVENT_LOOP_THRESHOLD=100           # 100ms
HEALTH_ACTIVE_HANDLES_THRESHOLD=50        # 50 handles
```

### Kubernetes Integration

#### Readiness Probe
```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

#### Liveness Probe
```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 5
```

## Monitoring Integration

### Prometheus Metrics
The health endpoints can be integrated with Prometheus for metrics collection:

```yaml
# Add to your Prometheus config
- job_name: 'nestjs-health'
  static_configs:
    - targets: ['your-app:3000']
  metrics_path: '/health/detailed'
  scrape_interval: 30s
```

### Alerting Rules
Example Prometheus alerting rules:

```yaml
groups:
  - name: nestjs-health
    rules:
      - alert: ApplicationUnhealthy
        expr: up{job="nestjs-health"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "NestJS application is down"
          
      - alert: HighMemoryUsage
        expr: nodejs_heap_size_used_bytes > 200000000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
```

## Testing

### Manual Testing
Use the provided test script:
```bash
node test-health.js
```

### Automated Testing
Health endpoints are included in the E2E test suite:
```bash
npm run test:e2e:rest
```

### Load Testing
For load testing health endpoints:
```bash
# Using wrk (if installed)
wrk -t4 -c100 -d30s http://localhost:3000/health

# Using curl in a loop
for i in {1..100}; do curl -s http://localhost:3000/health > /dev/null; done
```

## Troubleshooting

### Common Issues

1. **Database Health Check Fails**
   - Verify database connection configuration
   - Check if database is running and accessible
   - Review database connection pool settings

2. **Memory Alerts**
   - Check for memory leaks in application code
   - Review garbage collection patterns
   - Consider adjusting Node.js memory limits

3. **Disk Space Alerts**
   - Clean up log files and temporary data
   - Review disk usage patterns
   - Consider log rotation policies

4. **Event Loop Lag**
   - Identify blocking operations in code
   - Review CPU-intensive operations
   - Consider using worker threads for heavy tasks

### Debug Mode
Enable detailed logging for health checks:
```bash
DEBUG=health:* npm run start:dev
```

## Security Considerations

- Health endpoints expose system information
- Consider restricting access in production
- Use internal load balancer for Kubernetes probes
- Monitor for abuse of health endpoints
- Consider rate limiting for public health endpoints

## Performance Impact

- Health checks are designed to be lightweight
- Typical response time: < 50ms
- Memory overhead: < 1MB
- CPU impact: Negligible under normal load

## Future Enhancements

- [ ] Redis health checks (if using Redis)
- [ ] External service dependency checks
- [ ] Custom business logic health indicators
- [ ] Historical health data storage
- [ ] Health check result caching
- [ ] Integration with APM tools (New Relic, Datadog)
