import { Controller, Get, Res, Sse } from '@nestjs/common';
import { Response } from 'express';
import { Observable, interval, map } from 'rxjs';
import { AggregatorService } from './aggregator.service';
import { join } from 'path';
import * as fs from 'fs';

@Controller('visualize')
export class SseController {
  constructor(private readonly aggregatorService: AggregatorService) {}

  @Get()
  serveHtml(@Res() res: Response) {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Product Price Aggregator</title>
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        th { background-color: #4CAF50; color: white; }
      </style>
    </head>
    <body>
      <h1>Product Price Aggregator</h1>
      <table id="productsTable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Provider</th>
            <th>Price</th>
            <th>Currency</th>
            <th>Available</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody id="productsBody"></tbody>
      </table>

      <script>
        const evtSource = new EventSource('/visualize/sse');
        const productsBody = document.getElementById('productsBody');

        evtSource.onmessage = function(event) {
          const products = JSON.parse(event.data);
          
          productsBody.innerHTML = '';
          
          products.forEach(product => {
            const row = document.createElement('tr');
            
            row.innerHTML = \`
              <td>\${product.name}</td>
              <td>\${product.provider}</td>
              <td>\${product.price}</td>
              <td>\${product.currency}</td>
              <td>\${product.isAvailable ? 'Yes' : 'No'}</td>
              <td>\${new Date(product.updatedAt).toLocaleString()}</td>
            \`;
            
            productsBody.appendChild(row);
          });
        };

        evtSource.onerror = function() {
          console.error('EventSource failed');
        };
      </script>
    </body>
    </html>
    `;
    
    res.type('text/html').send(htmlContent);
  }

  @Sse('sse')
  sse(): Observable<{ data: string }> {
    return new Observable<{ data: string }>(subscriber => {
      const intervalId = setInterval(async () => {
        try {
          const products = await this.aggregatorService.getAllProducts();
          subscriber.next({ data: JSON.stringify(products) });
        } catch (error) {
          console.error('Error in SSE stream:', error);
        }
      }, 2000);

      // Clean up on unsubscribe
      return () => clearInterval(intervalId);
    });
  }
} 