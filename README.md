
# Mlearning API

**University Cloud Computing Practice | Node.js · Express · Microsoft Azure**

A cloud-based REST API developed for a university assignment. The project demonstrates cloud deployment, relational database operations, asynchronous messaging, automated testing, health monitoring, and Prometheus-compatible metrics.

## Live Deployment

- **API:** https://mlearning-api.purpleground-c0374063.germanywestcentral.azurecontainerapps.io
- **Swagger UI:** https://mlearning-api.purpleground-c0374063.germanywestcentral.azurecontainerapps.io/swagger/
- **Health Check:** https://mlearning-api.purpleground-c0374063.germanywestcentral.azurecontainerapps.io/health
- **Metrics:** https://mlearning-api.purpleground-c0374063.germanywestcentral.azurecontainerapps.io/metrics

> Cloud endpoints are available while the corresponding Azure resources remain active.

## Implemented Features

- REST API using Node.js and Express
- Swagger/OpenAPI documentation
- Docker containerization
- Cloud deployment using Azure Container Apps
- Azure SQL Database integration
- Database tables: Users, Tasks, and QueueMessages
- CRUD operations for users and tasks
- Azure Service Bus integration
- Two active Service Bus queues
- Message sending and processing
- Automated tests using Jest and Supertest
- 26 passing tests across 3 test suites
- Application health checks
- Prometheus-compatible metrics
- Azure Pipelines YAML configuration

## Technology Stack

| Component | Technology |
|---|---|
| Backend | Node.js, Express |
| ORM | Sequelize |
| Cloud Database | Azure SQL Database |
| Local Database | SQLite |
| Messaging | Azure Service Bus |
| Containerization | Docker |
| Cloud Hosting | Azure Container Apps |
| Documentation | Swagger / OpenAPI |
| Testing | Jest, Supertest |
| Monitoring | prom-client |
| CI/CD Configuration | Azure Pipelines YAML |
| Version Control | Git, GitHub |

## System Architecture

```text
             Client / Swagger UI
                     |
                     v
              REST API (Express)
                     |
                     v
             Azure Container Apps
                     |
           +---------+---------+
           |                   |
           v                   v
    Azure SQL Database   Azure Service Bus
           |                   |
    +------+------+       +----+----+
    |      |      |       |         |
  Users  Tasks  Queue   Primary  Processing
                Messages Queue     Queue

Additional endpoints:
  /health  -> Health Monitoring
  /metrics -> Prometheus Metrics
```

## Azure Infrastructure

All cloud resources are located in the same resource group.

**Resource Group:** `mlearning-rg`

**Region:** Germany West Central

| Resource | Name |
|---|---|
| Container App | `mlearning-api` |
| Container Apps Environment | `managedEnvironment-mlearningrg-a92b` |
| SQL Server | `mlearning-sql-2026` |
| SQL Database | `mlearning-db` |
| Service Bus Namespace | `mlearning-servicebus-2026` |

### Azure Container Apps

The backend is packaged into a Docker container and deployed using Azure Container Apps.

The application provides a public HTTPS endpoint and interactive Swagger documentation.

### Azure SQL Database

The application uses Azure SQL Database for persistent data storage.

Three database tables are available:

- `Users` — user information
- `Tasks` — task records
- `QueueMessages` — message-related records

Database operations are implemented through the REST API using Sequelize.

### Azure Service Bus

The Service Bus namespace uses the Basic pricing tier.

Two queues are configured:

- `mlearning-queue`
- `mlearning-processing-queue`

Both queues are active.

The API supports sending messages to the secondary queue and processing pending messages.

## REST API Endpoints

### System

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API information |
| GET | `/health` | Application health |
| GET | `/metrics` | Prometheus metrics |

### Users

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users` | Create a user |
| GET | `/users` | Get all users |
| GET | `/users/:id` | Get a user by ID |
| PUT | `/users/:id` | Update a user |
| DELETE | `/users/:id` | Delete a user |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| POST | `/tasks` | Create a task |
| GET | `/tasks` | Get all tasks |
| GET | `/tasks/:id` | Get a task by ID |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |

### Messages and Queues

| Method | Endpoint | Description |
|---|---|---|
| POST | `/messages` | Send a message |
| GET | `/messages` | Retrieve messages |
| POST | `/queue/send` | Send a message to the secondary queue |
| POST | `/queue/process` | Process pending messages |
| GET | `/queue/status` | Check queue status |

## CRUD Operations

The application supports full CRUD operations for users and tasks.

Implemented functionality includes:

1. Creating database records
2. Retrieving existing records
3. Updating stored information
4. Deleting records
5. Handling requests for nonexistent records

Database operations were successfully tested against the deployed Azure API using Swagger UI.

## Azure Service Bus Integration

Azure Service Bus is used for asynchronous message communication.

### Sending Messages

**Endpoint:** `POST /queue/send`

Example request:

```json
{
  "message": "Azure Service Bus demo"
}
```

Successful requests return HTTP `201 Created`.

Example response:

```json
{
  "success": true,
  "provider": "azure",
  "message": "Message sent to Azure Service Bus",
  "data": {
    "success": true,
    "queue": "secondary",
    "message": "Azure Service Bus demo"
  }
}
```

### Processing Messages

**Endpoint:** `POST /queue/process`

This endpoint retrieves and processes pending messages from the secondary queue.

The response includes:

- Processing status
- Messaging provider
- Number of processed messages
- Processed message data

Successful processing can also be verified through the message counters in Azure Portal.

## Automated Testing

The project uses Jest and Supertest for automated testing.

Tests cover API functionality, database operations, and application behavior.

Run tests:

```bash
npm test
```

### Test Results

```text
Test Suites: 3 passed, 3 total
Tests:       26 passed, 26 total
```

All 26 tests passed during the latest test execution.

## Health Monitoring

**Endpoint:** `GET /health`

The health endpoint provides information about application availability and database connectivity.

It can be used to verify the operational status of the deployed API.

## Prometheus Metrics

**Endpoint:** `GET /metrics`

Metrics are collected using the `prom-client` library.

Available metrics include:

- CPU usage
- Memory consumption
- Node.js runtime statistics
- Event loop performance

The metrics endpoint returns data in Prometheus-compatible format.

## Local Development

Clone the repository:

```bash
git clone https://github.com/alexanerush/m_learning.git
cd m_learning
```

Install dependencies:

```bash
npm ci
```

Configure the required environment variables in a local `.env` file.

Do not commit credentials or connection strings to the repository.

Start the application:

```bash
npm start
```

Local Swagger UI:

http://localhost:3000/swagger/

## CI/CD Configuration

The repository includes an `azure-pipelines.yml` file prepared for Azure DevOps integration.

The YAML configuration was created as part of the cloud computing assignment.

However, the pipeline could not be fully executed because of Azure DevOps access restrictions.

Therefore, the CI/CD configuration is included in the repository, but a complete automated deployment pipeline has not been demonstrated.

## Azure Subscription Limitations

During development, several restrictions were encountered with the available Microsoft Azure Student/Free Trial subscription.

### Azure App Service Quota

The original assignment required deployment using Azure App Service Web App.

However, the subscription did not provide the required App Service quota.

As an alternative, the application was successfully deployed using Azure Container Apps.

This allowed the REST API to remain publicly accessible and maintain the required functionality.

### Azure SQL Free-Tier Limits

The free Azure SQL Database usage allowance was exhausted during development.

This introduced additional resource and billing restrictions.

Despite these limitations, the database integration and CRUD operations were successfully implemented and tested.

### Azure DevOps Restrictions

Azure DevOps access restrictions prevented the complete setup and execution of the CI/CD pipeline.

The YAML configuration was prepared and committed to the repository, but the automated pipeline could not be fully demonstrated.

### Implementation Summary

Almost all assignment requirements were successfully implemented.

The project includes:

- A deployed cloud REST API
- Azure SQL Database integration
- Two Azure Service Bus queues
- CRUD operations
- Message sending and processing
- Automated tests
- Health checks
- Prometheus-compatible metrics

The remaining incomplete requirements were caused by Azure subscription quotas and service access restrictions.

## Author

**Alexandra Nerush**

GitHub: https://github.com/alexanerush
