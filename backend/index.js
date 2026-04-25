require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const connectDB = require("./src/config/db");

const authRoutes = require("./src/routes/auth");
const jobRoutes = require("./src/routes/jobs");

const app = express();
const server = http.createServer(app);

// -------------------
// Socket.io Setup
// -------------------
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

// Export io so worker / services can use it
module.exports.io = io;

// -------------------
// Middleware
// -------------------
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// -------------------
// MongoDB Connection
// -------------------
connectDB();

// -------------------
// Routes
// -------------------
app.get("/", (req, res) => {
  res.json({ status: "TaskFlow Backend running 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

// -------------------
// Socket.io Events
// -------------------
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Frontend clients join their user room to receive job updates
  socket.on("join", (userId) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined room user:${userId}`);
  });

  // Worker emits this event to broadcast job status updates to the user's room
  socket.on("worker:job_update", ({ userId, jobId, status, result }) => {
    io.to(`user:${userId}`).emit("job:update", { jobId, status, result });
    console.log(`Job ${jobId} status → ${status} for user ${userId}`);
  });

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