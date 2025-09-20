import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    let status: number;
    let message: string;
    let error: string;
    let details: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.name;
        details = (exceptionResponse as any).details;
      } else {
        message = exceptionResponse as string;
        error = exception.name;
      }
    } else if (exception instanceof QueryFailedError) {
      // Database errors
      status = HttpStatus.BAD_REQUEST;
      message = 'Database operation failed';
      error = 'DatabaseError';
      details = {
        query: exception.query,
        parameters: exception.parameters,
      };
      
      // Log database errors with more detail
      this.logger.error(
        `Database Error: ${exception.message}`,
        {
          query: exception.query,
          parameters: exception.parameters,
          driverError: (exception as any).driverError,
        },
      );
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : exception.message;
      error = exception.name;
      details = process.env.NODE_ENV !== 'production' ? {
        stack: exception.stack,
      } : undefined;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown error occurred';
      error = 'UnknownError';
      details = process.env.NODE_ENV !== 'production' ? {
        exception: String(exception),
      } : undefined;
    }

    // Create error response
    const errorResponse = {
      statusCode: status,
      timestamp,
      path,
      method,
      error,
      message,
      ...(details && { details }),
    };

    // Log the error with structured data
    const logContext = {
      statusCode: status,
      method,
      path,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      correlationId: request.headers['x-correlation-id'] || 'unknown',
    };

    if (status >= 500) {
      this.logger.error(
        `${method} ${path} - ${status} - ${message}`,
        {
          ...logContext,
          exception: exception instanceof Error ? exception.stack : exception,
        },
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${method} ${path} - ${status} - ${message}`,
        logContext,
      );
    }

    response.status(status).json(errorResponse);
  }
}
