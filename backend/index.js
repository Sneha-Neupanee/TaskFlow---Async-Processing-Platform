require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

// -------------------
// Redis Connection
// -------------------
const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

// -------------------
// Queue Setup
// -------------------
const queue = new Queue(process.env.QUEUE_NAME || "taskflow_queue", {
  connection,
});

// -------------------
// MongoDB Connection
// -------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// -------------------
// Routes
// -------------------

// Health check
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// Create Job
app.post("/job", async (req, res) => {
  const { type, data } = req.body;

  try {
    const job = await queue.add(type, data);
    res.json({ success: true, jobId: job.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------
// Socket.io
// -------------------
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// -------------------
// Start Server
// -------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});