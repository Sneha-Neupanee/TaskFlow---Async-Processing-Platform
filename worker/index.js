require("dotenv").config();

const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const http = require("http");
const { io: socketIO } = require("socket.io-client");

// -------------------
// MongoDB Connection
// -------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Worker: MongoDB Connected"))
  .catch((err) => {
    console.error("Worker: MongoDB connection failed", err);
    process.exit(1);
  });

// -------------------
// Job Model (inline to avoid circular deps)
// -------------------
const JobSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["image", "csv", "simulation"] },
    status: {
      type: String,
      enum: ["pending", "processing", "done", "failed"],
      default: "pending",
    },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

const Job = mongoose.models.Job || mongoose.model("Job", JobSchema);

// -------------------
// Redis Connection
// -------------------
const connection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

const QUEUE_NAME = process.env.QUEUE_NAME || "taskflow_queue";
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:5000";

// -------------------
// Socket.io Client — connect to backend to emit events
// -------------------
const socket = socketIO(BACKEND_URL, { reconnection: true });

socket.on("connect", () =>
  console.log("Worker connected to backend socket:", socket.id)
);
socket.on("connect_error", (err) =>
  console.log("Worker socket error:", err.message)
);

// Helper: emit job update to backend which broadcasts to user room
const emitJobUpdate = (userId, jobId, status, result = null) => {
  socket.emit("worker:job_update", { userId: userId.toString(), jobId, status, result });
};

// -------------------
// Job Processors
// -------------------
async function imageProcessor(data) {
  console.log("Processing image job:", data);
  await new Promise((res) => setTimeout(res, 3000));
  return { message: "Image processed successfully", processedAt: new Date().toISOString() };
}

async function csvProcessor(data) {
  console.log("Processing CSV job:", data);
  await new Promise((res) => setTimeout(res, 4000));
  return { message: "CSV parsed and processed", rows: 1000, processedAt: new Date().toISOString() };
}

async function simulationProcessor(data) {
  console.log("Processing simulation job:", data);
  await new Promise((res) => setTimeout(res, 5000));
  return { message: "Simulation complete", iterations: 10000, processedAt: new Date().toISOString() };
}

const processors = {
  image: imageProcessor,
  csv: csvProcessor,
  simulation: simulationProcessor,
};

// -------------------
// Worker
// -------------------
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { jobId, type, payload } = job.data;
    console.log(`Processing job [${type}] id=${jobId}`);

    // Mark processing in DB
    const dbJob = await Job.findByIdAndUpdate(
      jobId,
      { status: "processing" },
      { new: true }
    );

    if (dbJob) {
      emitJobUpdate(dbJob.userId, jobId, "processing");
    }

    // Run the appropriate processor
    const processor = processors[type];
    if (!processor) throw new Error(`Unknown job type: ${type}`);

    const result = await processor(payload);

    // Mark done in DB
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { status: "done", result },
      { new: true }
    );

    if (updatedJob) {
      emitJobUpdate(updatedJob.userId, jobId, "done", result);
    }

    return result;
  },
  { connection, concurrency: 5 }
);

// -------------------
// Worker Events
// -------------------
worker.on("completed", (job, result) => {
  console.log(`✅ Job ${job.id} [${job.name}] completed`, result);
});

worker.on("failed", async (job, err) => {
  console.log(`❌ Job ${job.id} [${job.name}] failed:`, err.message);

  if (job?.data?.jobId) {
    const dbJob = await Job.findByIdAndUpdate(
      job.data.jobId,
      { status: "failed", result: { error: err.message } },
      { new: true }
    ).catch(() => null);

    if (dbJob) {
      emitJobUpdate(dbJob.userId, job.data.jobId, "failed", { error: err.message });
    }
  }
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});

console.log(`🚀 Worker started, listening on queue: ${QUEUE_NAME}`);