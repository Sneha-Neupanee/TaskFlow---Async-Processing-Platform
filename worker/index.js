require("dotenv").config();

const { Worker } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

// -------------------
// Worker Logic
// -------------------
const worker = new Worker(
  process.env.QUEUE_NAME || "taskflow_queue",
  async (job) => {
    console.log("Processing job:", job.name);

    // Simulate different job types
    if (job.name === "image") {
      await new Promise((res) => setTimeout(res, 3000));
      return { message: "Image processed" };
    }

    if (job.name === "csv") {
      await new Promise((res) => setTimeout(res, 4000));
      return { message: "CSV processed" };
    }

    if (job.name === "simulation") {
      await new Promise((res) => setTimeout(res, 5000));
      return { message: "Simulation complete" };
    }

    return { message: "Unknown job type" };
  },
  { connection }
);

// -------------------
// Worker Events
// -------------------
worker.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed`, result);
});

worker.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed`, err.message);
});

console.log("Worker started 🚀");