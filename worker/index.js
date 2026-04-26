require("dotenv").config();

const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const mongoose = require("mongoose");

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
// Job Model
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

// -------------------
// Processors
// -------------------
async function imageProcessor() {
  await new Promise((r) => setTimeout(r, 3000));
  return { message: "Image processed" };
}

async function csvProcessor() {
  await new Promise((r) => setTimeout(r, 4000));
  return { message: "CSV processed", rows: 1000 };
}

async function simulationProcessor() {
  await new Promise((r) => setTimeout(r, 5000));
  return { message: "Simulation done", users: 10000 };
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

    console.log(`Processing job: ${type}`);

    await Job.findByIdAndUpdate(jobId, {
      status: "processing",
    });

    const processor = processors[type];
    if (!processor) throw new Error("Invalid job type");

    const result = await processor(payload);

    await Job.findByIdAndUpdate(jobId, {
      status: "done",
      result,
    });

    return result;
  },
  { connection, concurrency: 5 }
);

// -------------------
worker.on("completed", (job) => {
  console.log("Job completed:", job.id);
});

worker.on("failed", (job, err) => {
  console.log("Job failed:", err.message);
});

console.log("Worker running...");