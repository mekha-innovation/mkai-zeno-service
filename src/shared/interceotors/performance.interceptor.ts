import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger = new Logger(PerformanceInterceptor.name)) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = performance.now();

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const path = request.url;

    return next
      .handle()
      .pipe(tap(() => this.logger.log(`[${method}] ${path} ${(performance.now() - start).toFixed(3)} ms`)));
  }
}
