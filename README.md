# Mlearning API

**Cloud Practice Project | Node.js · Express · SQLite · Swagger · Jest**

A RESTful API developed as part of a university cloud computing practice project. The application demonstrates backend development, database operations, message queue processing, API documentation, automated testing, and application monitoring.

The project currently runs locally and is structured for future integration with Microsoft Azure services and CI/CD workflows.

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-Testing-C21325?logo=jest&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?logo=swagger&logoColor=black)
![License](https://img.shields.io/badge/License-ISC-blue)

---

## Features

- RESTful API built with Express.js
- User and task management with CRUD operations
- SQLite database using Sequelize ORM
- User-to-task database relationships
- Local message queue simulation
- Secondary queue with message processing functionality
- Interactive Swagger / OpenAPI documentation
- Health monitoring endpoint
- Prometheus-compatible application metrics
- Automated unit testing with Jest
- Azure Pipelines YAML configuration

## Technology Stack

| Category | Technology |
|---|---|
| Runtime | Node.js |
| Backend | Express.js |
| Database | SQLite |
| ORM | Sequelize |
| API Documentation | Swagger UI, OpenAPI 3.0 |
| Messaging | Local in-memory queues |
| Cloud Integration | Azure Service Bus SDK |
| Testing | Jest, Supertest |
| Monitoring | Prometheus Client |
| Version Control | Git, GitHub |
| CI/CD Configuration | Azure Pipelines |

## Architecture

```text
                    CLIENT
                       |
                       v
                 EXPRESS API
                       |
          +------------+-------------+
          |            |             |
          v            v             v
      CRUD API     QUEUE API     MONITORING
          |            |             |
          v            v             v
      SEQUELIZE    LOCAL QUEUES    PROMETHEUS
          |            |
          v            v
        SQLITE     QUEUE READER
```

The application follows a modular backend structure, separating database configuration, queue management, monitoring, and HTTP routes.

## Project Structure

```text
mlearning/
|
|-- index.js
|-- database.js
|-- localQueue.js
|-- queueReader.js
|-- queueRoutes.js
|-- serviceBus.js
|-- metrics.js
|
|-- tests/
|   |-- database.test.js
|
|-- azure-pipelines.yml
|-- package.json
|-- package-lock.json
|-- .gitignore
|-- README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/alexanerush/m_learning.git
cd m_learning
```

Install dependencies:

```bash
npm ci
```

Create a `.env` file in the project root:

```env
PORT=3000
```

Additional Azure Service Bus configuration can be added when a valid Azure connection is available.

### Run the Application

```bash
npm start
```

For development with automatic restart:

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:3000
```

### API Documentation

Open Swagger UI:

**http://localhost:3000/swagger/**

Swagger provides interactive documentation and allows API requests to be executed directly from the browser.

## API Endpoints

### System

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check API status |

### Users

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users` | Create a user |
| GET | `/users` | Retrieve all users |
| GET | `/users/:id` | Retrieve a user by ID |
| PUT | `/users/:id` | Update a user |
| DELETE | `/users/:id` | Delete a user |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| POST | `/tasks` | Create a task |
| GET | `/tasks` | Retrieve all tasks |
| GET | `/tasks/:id` | Retrieve a task by ID |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |

### Message Queues

| Method | Endpoint | Description |
|---|---|---|
| POST | `/messages` | Send a message to the primary local queue |
| GET | `/messages` | Retrieve messages |
| POST | `/queue/send` | Add a message to the secondary queue |
| POST | `/queue/process` | Process the next queued message |
| GET | `/queue/status` | View pending and processed messages |

### Monitoring

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check application and database health |
| GET | `/metrics` | Retrieve Prometheus metrics |

## Example API Requests

### Create a User

**POST `/users`**

```json
{
  "name": "Alexandra",
  "email": "alexandra@example.com"
}
```

### Create a Task

**POST `/tasks`**

```json
{
  "title": "Complete Cloud Practice",
  "description": "Implement and test REST API",
  "completed": false,
  "userId": 1
}
```

### Send a Queue Message

**POST `/queue/send`**

```json
{
  "message": "Hello from the secondary queue!"
}
```

Process the next message using:

```text
POST /queue/process
```

Check queue status using:

```text
GET /queue/status
```

## Database

The project uses SQLite with Sequelize ORM.

Two primary models are implemented:

**User**
- id
- name
- email

**Task**
- id
- title
- description
- completed
- userId

A one-to-many relationship connects users and tasks.

The local database file is excluded from Git tracking.

## Automated Testing

Unit tests are implemented using Jest.

Run tests:

```bash
npm test
```

Generate coverage information:

```bash
npm run test:coverage
```

### Latest Local Test Result

```text
PASS tests/database.test.js

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

The tests cover user creation, task creation, task updates, and task deletion.

## Monitoring

The application exposes two monitoring endpoints.

**Health Check**

```text
GET /health
```

Verifies application and database connectivity.

**Prometheus Metrics**

```text
GET /metrics
```

Exposes application and HTTP request metrics in Prometheus-compatible format.

## CI/CD

The repository contains an `azure-pipelines.yml` configuration intended for Azure DevOps integration.

The pipeline is designed to:

1. Install Node.js
2. Install project dependencies
3. Run automated tests
4. Generate test coverage information

Azure DevOps pipeline execution and cloud deployment are not yet configured.

## Azure Integration Status

The project includes the Azure Service Bus SDK and a separate integration module.

Currently, messaging is implemented using local in-memory queues. The application is not yet deployed to Azure, and the SQLite database is not an Azure SQL Database.

Future development includes:

- Connecting to Azure Service Bus queues
- Migrating persistence to Azure SQL
- Deploying the application to Azure App Service
- Configuring Azure DevOps CI/CD deployment

## Current Limitations

- Local queue messages are lost when the server restarts.
- SQLite is intended for local development.
- Queue processing is manually triggered through an API endpoint.
- Cloud deployment requires a configured Azure environment.

## Author

**Alexandra Nerush**

GitHub: [@alexanerush](https://github.com/alexanerush)

## License

This project is licensed under the ISC License.