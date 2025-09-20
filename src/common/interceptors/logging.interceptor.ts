import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const correlationId = request.headers['x-correlation-id'] || this.generateCorrelationId();
    
    // Add correlation ID to request for downstream use
    request.headers['x-correlation-id'] = correlationId as string;
    
    const startTime = Date.now();

    const requestLog = {
      correlationId,
      method,
      url,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    };

    // Log incoming request
    this.logger.log(
      `Incoming Request: ${method} ${url}`,
      requestLog,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;

          const responseLog = {
            ...requestLog,
            statusCode,
            duration: `${duration}ms`,
            responseSize: JSON.stringify(data).length,
          };

          this.logger.log(
            `Outgoing Response: ${method} ${url} - ${statusCode} (${duration}ms)`,
            responseLog,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error?.status || 500;

          const errorLog = {
            ...requestLog,
            statusCode,
            duration: `${duration}ms`,
            error: error?.message || 'Unknown error',
          };

          this.logger.error(
            `Request Error: ${method} ${url} - ${statusCode} (${duration}ms)`,
            errorLog,
          );
        },
      }),
    );
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
