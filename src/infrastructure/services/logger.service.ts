import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

interface RequestLog {
  method: string;
  url: string;
  statusCode?: number;
  ip: string;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, {
      context,
      trace,
      timestamp: new Date().toISOString()
    });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  logError(error: Error, context?: string) {
    this.error(error.message, error.stack, context);
  }

  logHttpRequest(request: RequestLog, response: any, duration: number): void {
    this.logger.info('HTTP Request', {
      method: request.method,
      url: request.url,
      statusCode: response.statusCode || request.statusCode,
      ip: request.ip,
      duration,
      timestamp: new Date()
    });
  }

  logDatabaseQuery(query: string, duration: number, context?: string) {
    this.logger.debug('Database Query', {
      query,
      duration: `${duration}ms`,
      context
    });
  }

  logRequest(request: RequestLog): void {
    this.logger.info({
      method: request.method,
      url: request.url,
      statusCode: request.statusCode,
      ip: request.ip,
      timestamp: new Date()
    });
  }

  logInfo(message: string): void {
    this.logger.info({
      message,
      timestamp: new Date()
    });
  }

  logWarning(message: string): void {
    this.logger.warn({
      message,
      timestamp: new Date()
    });
  }
}
