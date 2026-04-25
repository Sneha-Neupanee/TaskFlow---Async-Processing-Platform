# 🚀 TaskFlow: Architecture & Job Processing System

TaskFlow is a production-style, full-stack job processing engine. It utilizes a decoupled architecture where an Express API ingests job requests, pushes them to a Redis queue using BullMQ, and a dedicated Node.js Worker process executes them asynchronously. Real-time updates are pushed to the frontend via Socket.io.

## 🏗️ Architecture Design

```mermaid
graph TD;
    Client[Next.js Client] -->|1. HTTP Auto/Job Req| API(Express API);
    API -->|2. Store Job (Pending)| DB[(MongoDB)];
    API -->|3. Push to Queue| Queue[(Redis / BullMQ)];
    Queue -->|4. Consume Job| Worker(Node.js Worker process);
    Worker -->|5. Update Job (Processing/Done)| DB;
    Worker -->|6. Emit Status Event| API;
    API -->|7. WebSocket Broadcast| Client;
```

### Components
1. **Frontend**: Next.js 15, TailwindCSS, Axios, Socket.io-client.
2. **Backend**: Express, BullMQ, Socket.io Server, Mongoose.
3. **Queue**: Redis for state management and job queuing.
4. **Worker**: Distinct background node process, manages BullMQ concurrency and heavy processing without blocking the API. Let's UI track progress seamlessly.

## 🚀 Setup Instructions

### Prerequisites
* Docker & Docker Compose
* Node.js v20+

### Option 1: Docker (Easiest)
1. Rename `.env.example` to `.env` in the root directory (Variables are pre-configured for Docker).
2. Start the entire cluster:
   ```bash
   docker-compose up --build
   ```
3. Visit `http://localhost:3000` to access the application.

*Services Started:*
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Redis Server**: localhost:6379
- **MongoDB**: localhost:27017
- **Worker**: Background process

### Option 2: Running Locally
If you prefer not to use docker-compose, ensure Redis and MongoDB are running on your machine.
1. Populate your `.env` (Use `.env.example` as a template).
2. Install dependencies:
   ```bash
   # Backend
   cd backend && npm install
   
   # Worker
   cd worker && npm install

   # Frontend
   cd frontend && npm install
   ```
3. Start the services in separate terminals:
   ```bash
   cd backend && npm run dev
   cd worker && npm run dev
   cd frontend && npm run dev
   ```

## 🛠️ Job Types Available
TaskFlow ships with 3 mock job processors to showcase the worker logic:
- `image`: Simulates heavy image processing operations (3s delay).
- `csv`: Simulates parsing large data files (4s delay).
- `simulation`: Simulates complex mathematical modelling (5s delay).
