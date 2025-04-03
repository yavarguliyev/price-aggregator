export function getLiveViewTemplate (): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Live Product Data</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; padding: 0; }
        h1, h2 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        th { background-color: #2c3e50; color: white; }
        #status { 
          margin: 10px 0; 
          padding: 8px; 
          background-color: #f8f9fa; 
          border-left: 4px solid #17a2b8; 
        }
        .available { 
          background-color: #d4edda; 
          color: #155724; 
          padding: 3px 6px;
          border-radius: 3px;
        }
        .unavailable { 
          background-color: #f8d7da; 
          color: #721c24; 
          padding: 3px 6px;
          border-radius: 3px;
        }
        .price-changed {
          animation: highlight 2s;
        }
        .tab {
          overflow: hidden;
          border: 1px solid #ccc;
          background-color: #f1f1f1;
        }
        .tab button {
          background-color: inherit;
          float: left;
          border: none;
          outline: none;
          cursor: pointer;
          padding: 14px 16px;
          transition: 0.3s;
        }
        .tab button:hover {
          background-color: #ddd;
        }
        .tab button.active {
          background-color: #2c3e50;
          color: white;
        }
        .tabcontent {
          display: none;
          padding: 6px 12px;
          border: 1px solid #ccc;
          border-top: none;
        }
        @keyframes highlight {
          0% { background-color: #fff3cd; }
          100% { background-color: transparent; }
        }
      </style>
    </head>
    <body>
      <h1>Live Product Data</h1>
      <div id="status">Connecting to server...</div>
      <div id="count"></div>

      <div class="tab">
        <button class="tablinks active" onclick="openTab(event, 'AllProducts')">All Products</button>
      </div>
      
      <div id="AllProducts" class="tabcontent" style="display: block;">
        <h2>All Products</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Provider</th>
              <th>Price</th>
              <th>Currency</th>
              <th>Available</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="productsBody"></tbody>
        </table>
      </div>

      <div id="RecentChanges" class="tabcontent">
        <h2>Recent Price & Availability Changes</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Provider</th>
              <th>New Price</th>
              <th>Currency</th>
              <th>Available</th>
              <th>Changed At</th>
            </tr>
          </thead>
          <tbody id="changesBody"></tbody>
        </table>
      </div>

      <div id="ProductDetails" class="tabcontent">
        <h2>Product Details</h2>
        <div id="productDetailsContent">
          <p>Select a product to view details</p>
        </div>
      </div>

      <script>
        // Keep track of previous values to detect changes
        let previousData = { products: [], changes: [] };
        let selectedProductId = null;
        
        function openTab(evt, tabName) {
          const tabcontent = document.getElementsByClassName("tabcontent");
          for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
          }
          
          const tablinks = document.getElementsByClassName("tablinks");
          for (let i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
          }
          
          document.getElementById(tabName).style.display = "block";
          evt.currentTarget.className += " active";
        }

        function viewProductDetails(productId) {
          selectedProductId = productId;
          // Switch to product details tab
          const tablinks = document.getElementsByClassName("tablinks");
          for (let i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
          }
          
          const tabcontent = document.getElementsByClassName("tabcontent");
          for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
          }
          
          document.getElementById("ProductDetails").style.display = "block";
          document.getElementsByClassName("tablinks")[2].className += " active";
          
          // Fetch and display product details
          fetch(\`/api/products/\${productId}\`)
            .then(response => response.json())
            .then(details => {
              const content = document.getElementById('productDetailsContent');
              
              if (!details.data) {
                content.innerHTML = '<p>Product not found</p>';
                return;
              }
              
              const product = details.data;
              const priceHistory = details.priceHistory || [];
              const availabilityHistory = details.availabilityHistory || [];
              
              let html = \`
                <h3>\${product.name}</h3>
                <p><strong>Description:</strong> \${product.description || 'N/A'}</p>
                <p><strong>Current Price:</strong> \${product.price} \${product.currency}</p>
                <p><strong>Provider:</strong> \${product.provider}</p>
                <p><strong>Provider ID:</strong> \${product.providerId}</p>
                <p><strong>Available:</strong> \${product.isAvailable ? 'Yes' : 'No'}</p>
                <p><strong>Last Fetched:</strong> \${new Date(product.lastFetchedAt).toLocaleString()}</p>
                <p><strong>Stale:</strong> \${product.isStale ? 'Yes' : 'No'}</p>
                
                <h4>Price History</h4>
              \`;
              
              if (priceHistory.length > 0) {
                html += '<table><thead><tr><th>Price</th><th>Currency</th><th>Timestamp</th></tr></thead><tbody>';
                priceHistory.forEach(entry => {
                  html += \`<tr>
                    <td>\${entry.amount.toFixed(2)}</td>
                    <td>\${entry.currency}</td>
                    <td>\${new Date(entry.timestamp).toLocaleString()}</td>
                  </tr>\`;
                });
                html += '</tbody></table>';
              } else {
                html += '<p>No price history available</p>';
              }
              
              html += '<h4>Availability History</h4>';
              
              if (availabilityHistory.length > 0) {
                html += '<table><thead><tr><th>Available</th><th>Timestamp</th></tr></thead><tbody>';
                availabilityHistory.forEach(entry => {
                  html += \`<tr>
                    <td>\${entry.isAvailable ? 'Yes' : 'No'}</td>
                    <td>\${new Date(entry.timestamp).toLocaleString()}</td>
                  </tr>\`;
                });
                html += '</tbody></table>';
              } else {
                html += '<p>No availability history available</p>';
              }
              
              content.innerHTML = html;
            })
            .catch(error => {
              console.error('Error fetching product details:', error);
              document.getElementById('productDetailsContent').innerHTML = 
                '<p>Error loading product details</p>';
            });
        }

        document.addEventListener('DOMContentLoaded', function() {
          const statusDiv = document.getElementById('status');
          const countDiv = document.getElementById('count');
          const productsBody = document.getElementById('productsBody');
          const changesBody = document.getElementById('changesBody');
          
          // Log for debugging
          console.log('Page loaded, connecting to SSE...');
          
          // Create event source with absolute URL to avoid path issues
          const evtSource = new EventSource('/api/live/events');
          
          evtSource.onopen = function() {
            console.log('SSE connection opened');
            statusDiv.textContent = 'Connected to server - waiting for data...';
          };
          
          evtSource.onmessage = function(event) {
            console.log('Received SSE message');
            statusDiv.textContent = 'Data received at ' + new Date().toLocaleTimeString();
            
            try {
              // Parse the event data with error handling
              let data;
              try {
                data = JSON.parse(event.data);
              } catch (parseError) {
                console.error('Failed to parse event data:', parseError);
                data = { products: [], changes: [] };
              }
              
              // Ensure data structure is as expected with defensive checks
              const products = data && Array.isArray(data.products) ? data.products : [];
              const changes = data && Array.isArray(data.changes) ? data.changes : [];
              
              // Update count
              countDiv.textContent = \`Displaying \${products.length} products and \${changes.length} recent changes\`;
              
              // Update All Products tab
              productsBody.innerHTML = '';
              
              if (products.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="7">No products available</td>';
                productsBody.appendChild(row);
              } else {
                // Add rows to table
                products.forEach(product => {
                  if (!product) return; // Skip invalid products
                  
                  const row = document.createElement('tr');
                  
                  const updatedAt = product.updatedAt ? new Date(product.updatedAt).toLocaleString() : 'N/A';
                  const availableClass = product.isAvailable ? 'available' : 'unavailable';
                  const availableText = product.isAvailable ? 'Yes' : 'No';
                  
                  // Check if price changed since last update
                  const prevProduct = previousData.products && Array.isArray(previousData.products) ? 
                    previousData.products.find(p => p && p.id === product.id) : null;
                  const priceChanged = prevProduct && prevProduct.price !== product.price;
                  
                  if (priceChanged) {
                    row.classList.add('price-changed');
                  }
                  
                  row.innerHTML = \`
                    <td>\${product.name || 'N/A'}</td>
                    <td>\${product.provider || 'N/A'}</td>
                    <td>\${product.price !== undefined ? product.price.toFixed(2) : 'N/A'}</td>
                    <td>\${product.currency || 'N/A'}</td>
                    <td><span class="\${availableClass}">\${availableText}</span></td>
                    <td>\${updatedAt}</td>
                    <td><button onclick="viewProductDetails('\${product.id}')">View Details</button></td>
                  \`;
                  
                  productsBody.appendChild(row);
                });
              }
              
              // Update Recent Changes tab
              changesBody.innerHTML = '';
              
              if (changes.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="6">No recent changes</td>';
                changesBody.appendChild(row);
              } else {
                // Add rows to table
                changes.forEach(change => {
                  if (!change) return; // Skip invalid changes
                  
                  const row = document.createElement('tr');
                  
                  const changedAt = change.changedAt ? new Date(change.changedAt).toLocaleString() : 'N/A';
                  const availableClass = change.isAvailable ? 'available' : 'unavailable';
                  const availableText = change.isAvailable ? 'Yes' : 'No';
                  
                  row.innerHTML = \`
                    <td>\${change.name || 'N/A'}</td>
                    <td>\${change.provider || 'N/A'}</td>
                    <td>\${change.price !== undefined ? change.price.toFixed(2) : 'N/A'}</td>
                    <td>\${change.currency || 'N/A'}</td>
                    <td><span class="\${availableClass}">\${availableText}</span></td>
                    <td>\${changedAt}</td>
                  \`;
                  
                  changesBody.appendChild(row);
                });
              }
              
              // Update product details if a product is selected
              if (selectedProductId) {
                viewProductDetails(selectedProductId);
              }
              
              // Save current data for next comparison
              previousData = data;
            } catch (error) {
              console.error('Error processing data:', error);
              statusDiv.textContent = 'Error processing data: ' + error.message;
            }
          };
          
          evtSource.onerror = function(error) {
            console.error('SSE Error:', error);
            statusDiv.textContent = 'Connection error - retrying...';
          };
        });
      </script>
    </body>
    </html>
  `;
}
