TaskFlow: Architecture & Job Processing System

TaskFlow is a production-style full-stack job processing engine built with a decoupled architecture. It uses an Express API to ingest job requests, Redis (BullMQ) for queue management, a dedicated Node.js worker for asynchronous processing, and Socket.io for real-time updates.

------------------------------------------------------------

ARCHITECTURE OVERVIEW

Client (Next.js)
    ↓ HTTP Request
Express API Server
    ↓
MongoDB (Job Storage)
    ↓
Redis Queue (BullMQ)
    ↓
Node.js Worker (Background Processing)
    ↓
MongoDB (Status Updates)
    ↓
Socket.io Events
    ↓
Client (Real-time Updates)

------------------------------------------------------------

TECH STACK

Frontend:
- Next.js 15
- TailwindCSS
- Axios
- Socket.io Client

Backend:
- Node.js + Express
- MongoDB (Mongoose)
- Redis (BullMQ)
- Socket.io

Worker:
- Node.js background service
- BullMQ queue processor
- Concurrent job execution

Infrastructure:
- Docker
- Docker Compose

------------------------------------------------------------

FOLDER STRUCTURE

TaskFlow/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── socket/
│   └── server.js
│
├── worker/
│   ├── processors/
│   ├── queue/
│   └── worker.js
│
├── docker-compose.yml
├── .env.example
└── README.md

------------------------------------------------------------

SETUP INSTRUCTIONS

Prerequisites:
- Docker & Docker Compose
- Node.js v20+

Option 1: Docker (Recommended)

1. Rename .env.example to .env
2. Run:
   docker-compose up --build
3. Open:
   http://localhost:3000

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Redis: localhost:6379
- MongoDB: localhost:27017

------------------------------------------------------------

Option 2: Manual Setup

Backend:
cd backend
npm install
npm run dev

Worker:
cd worker
npm install
npm run dev

Frontend:
cd frontend
npm install
npm run dev

------------------------------------------------------------

JOB TYPES

- image: Simulates image processing (3s delay)
- csv: Simulates CSV parsing (4s delay)
- simulation: Simulates heavy computation (5s delay)

------------------------------------------------------------

FEATURES

- Asynchronous job processing with Redis + BullMQ
- Real-time job tracking using Socket.io
- Decoupled worker architecture
- Scalable backend design
- Dockerized full-stack setup
- Persistent job storage in MongoDB
