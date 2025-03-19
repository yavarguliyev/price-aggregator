import { Controller, Get, Sse } from "@nestjs/common";
import { Observable, interval } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { Public } from "../core/auth/public.decorator";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AggregatorService } from "../application/services/aggregator.service";
import * as fs from "fs";
import * as path from "path";

@Controller("visualize")
@ApiTags("Real-time Visualization")
@Public()
export class SseController {
  constructor(private readonly aggregatorService: AggregatorService) {}

  @Get()
  async getVisualizationPage() {
    const htmlPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "visualization.html",
    );
    if (fs.existsSync(htmlPath)) {
      return fs.readFileSync(htmlPath, "utf8");
    } else {
      return this.getDefaultHtml();
    }
  }

  @Sse("events")
  @ApiOperation({
    summary: "Server-Sent Events endpoint for real-time updates",
  })
  sse(): Observable<MessageEvent> {
    return interval(2000).pipe(
      switchMap(() => this.aggregatorService.getAllProducts()),
      map((response) => {
        const data = JSON.stringify(response.data);
        return { data } as MessageEvent;
      }),
    );
  }

  private getDefaultHtml() {
    return `
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
            <th>Updated At</th>
          </tr>
        </thead>
        <tbody id="productsBody">
          <!-- Products will be loaded here -->
        </tbody>
      </table>

      <script>
        const evtSource = new EventSource('/api/visualize/events');
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
  }
}
