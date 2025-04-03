import { Controller, Get, Sse } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable, interval, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

import { Public } from '../core/auth/public.decorator';
import { AggregatorService } from '../application/services/aggregator.service';
import { getLiveViewTemplate } from '../application/templates/live-view.template';

@Controller('live')
@ApiTags('Live Data View')
@Public()
export class LiveViewController {
  constructor (private readonly aggregatorService: AggregatorService) {}

  @Get()
  getVisualizationPage (): string {
    return getLiveViewTemplate();
  }

  @Get('products')
  async getProducts () {
    try {
      const result = await this.aggregatorService.getAllProducts({ limit: 20 });
      return result;
    } catch {
      return { data: [], total: 0, page: 1, limit: 20 };
    }
  }

  @Sse('events')
  @ApiOperation({
    summary: 'Server-Sent Events endpoint for real-time updates'
  })
  sse (): Observable<MessageEvent> {
    return interval(2000).pipe(
      switchMap(() => {
        return new Promise((resolve) => {
          Promise.all([
            this.aggregatorService.getAllProducts({ limit: 20 }),
            this.aggregatorService.getProductChanges(300000)
          ])
            .then(([productsResponse, changes]) => {
              const products = productsResponse && productsResponse.data ? productsResponse.data : [];

              resolve({
                products: products,
                changes: changes || []
              });
            })
            .catch(() => resolve({ products: [], changes: [] }));
        });
      }),
      map((data: any) => {
        return { data: JSON.stringify(data) } as MessageEvent;
      }),
      catchError(() => {
        return of({ data: JSON.stringify({ products: [], changes: [] }) } as MessageEvent);
      })
    );
  }
}
