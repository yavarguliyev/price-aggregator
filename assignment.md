Technical Assignment: Senior Backend Software Engineer
This assignment should take the candidate 3-6 hours to solve. 4h on average.
Candidates will be given 24h to submit the solution (from receiving the assignment).
The instructions on how to submit is written below
the interview will happen 2-3 days after they candidate submits the assignment , to discuss their solution, and answer more technical questions.

Technical Assignment: Product Price Aggregator with NestJS and Prisma
Objective:
Develop a Product Price Aggregation API using NestJS and Prisma. This assignment focuses on building a system that collects, processes, and serves pricing and availability data for digital products from multiple external APIs. It aims to assess your ability to handle real-time data aggregation, concurrency, external API integration, and provide efficient, scalable solutions.
Estimated Time to Complete: Approximately 4 hours (3-6 hours range)
Deadline: 24 hours from receipt of the assignment.
Note: Its not a production grade service its just an assignments , don’ be perfectionism just provide a minimal working MVP to showcase your experience and development mindset.

Assignment Details:
Project Description:
Build a service that aggregates pricing and availability data for digital products (e.g., e-books, software licenses, digital courses) from multiple third-party providers. The API should collect data in real-time, process and normalize it, store it efficiently, and provide endpoints for consumers to query the aggregated data.
Requirements and Constraints :
Technology Stack:
Backend Framework: NestJS (TypeScript)
Database ORM: Prisma
Database: PostgreSQL (its recommended to use Docker for setup)
Concurrency Handling: Utilize NestJS's asynchronous capabilities
External APIs: Simulate third-party provider APIs
Testing: Jest for unit and integration tests(Optional)
Documentation: Swagger (OpenAPI) integrated into NestJS
Version Control: GitHub
Functional Requirements:
External Provider Simulation:
Create three simulated external provider APIs that serve digital product data.
Each provider should have an endpoint that returns a list of products with fields: id, name, description, price, currency, availability, and lastUpdated.
Simulate data changes by updating prices and availability every few seconds.
Minimum of 2 providers to be simulated with different payload.
Data Aggregation Service:
Real-Time Data Collection:
Implement a service that periodically fetches data from all external providers.
Ensure that data fetching from providers is handled concurrently.
Handle network errors and retries gracefully.
Data Normalization:
Normalize the data from different providers into a consistent format.
Handle discrepancies in data structures or field names.
Data Storage:
Store the aggregated data in a PostgreSQL database using Prisma.
Implement efficient upsert operations to update existing records without duplication.
Data Freshness:
Ensure that the aggregated data reflects the most recent information from providers.
Implement a mechanism to mark data as stale if not updated within a certain timeframe.
Data Visualization (Optional):
A simple html page with no style to show the products changes in a realtime
Don’t use websocket a simple SSE is perfect.
API Endpoints:
GET /products:
Returns a list of aggregated products with current prices and availability.
Support query parameters for filtering by name, price range, availability, and provider.
GET /products/:id:
Returns detailed information for a specific product, including price history.
GET /products/changes:
Returns a list of products that have had price or availability changes within a specified timeframe.
Price History Tracking:
Keep a history of price changes for each product.
Store timestamps of when changes occurred.
Concurrency and Performance:
Ensure that the data aggregation and API services are efficient and can handle concurrent requests.
Optimize database queries and indexing for performance.
Error Handling and Resilience:
Handle failures in external API calls without crashing the service.
Log errors and continue processing other providers if one fails.
Non-Functional Requirements:
API Design:
Follow RESTful principles.
Use appropriate HTTP methods and status codes.
Implement pagination for listing endpoints.
Security(Optional):
Implement basic authentication using API keys or tokens for accessing the API endpoints.
Protect the service against common vulnerabilities (e.g., injection attacks).
Configuration Management:
Use environment variables for configuration (e.g., API endpoints, database credentials).
Provide a way to configure the data fetch interval.
Code Quality:
Write clean, maintainable, and well-organized code.
Follow SOLID principles and appropriate design patterns.
Use TypeScript features effectively.
Testing:
Write unit tests for services, particularly the data aggregation logic.
Include integration tests for API endpoints.
Aim for high test coverage of critical components.
Documentation:
Integrate Swagger for API documentation.
Provide a clear README with setup instructions, explanations of the architecture, and usage examples.

Submission Instructions:
Version Control and Repository:
Use Git for version control with regular, meaningful commits.
Host your repository on GitHub (preferred) or Bitbucket.
Set the repository to private.
Access:
Add the following GitHub username/email as a collaborator to your repository: alhasan.nasiry@digitalzone.app, suhaib@digitalzone.app, khairy.mohamed@digitalzone.app.
Ensure we have the necessary permissions to clone and review your code.
Deliverables:
The complete source code in the repository.
A README.md file that includes:
Project overview and description.
Setup and installation instructions.
How to run the application and tests.
Instructions to access Swagger documentation(i.e. swagger route).
Design decisions, assumptions, and any trade-offs made.
Prisma schema and migration files.
Test files and relevant scripts.
Dockerfile or Docker Compose file.
Additional Notes:
Do not include unnecessary files (e.g., node_modules).
Ensure the application runs without errors and passes tests.
Use environment variables for sensitive configurations.
Be prepared to discuss your solution during the interview.

