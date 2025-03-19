import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { LoggerService } from "../services/logger.service";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      const requestLog = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        ip: req.ip || "0.0.0.0",
      };
      this.logger.logHttpRequest(requestLog, res, duration);
    });

    next();
  }
}
