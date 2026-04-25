# TaskFlow

TaskFlow is a Job Processing System with a queue-based backend architecture and a Next.js frontend.

## Architecture

User -> Next.js UI -> Express API -> Redis Queue -> Worker Process -> MongoDB -> UI Updates (via Socket.io)

### Job Types
- **Image Job:** Simulates image processing.
- **CSV Job:** Simulates CSV crunching and stats generation.
- **Simulation Job:** Simulates generating fake dataset (users).

## How to Run locally

### Prerequisites
- Docker and Docker Compose installed.

### Setup
1. Clone the repository natively.
2. In the root directory (where `docker-compose.yml` is located), run:
```bash
docker-compose up --build
```
3. Open your browser:
   - Frontend is running at `http://localhost:3000`
   - Backend API is running at `http://localhost:5000`

### Accessing the Dashboard
1. Go to `http://localhost:3000/register` to create a test user.
2. Login and start submitting tasks. You will see real-time Socket.io updates for the processing queue!
