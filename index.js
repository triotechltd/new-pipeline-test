require("dotenv").config();
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 4500;

let counter = 1;
let isShuttingDown = false;

console.log("🚀 Server starting...");

// Serve UI
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Live Counter (WebSocket)</title>
  <style>
    body {
      font-family: Arial;
      text-align: center;
      margin-top: 100px;
    }
    h1 { font-size: 40px; }
    #count { font-size: 80px; color: green; }
  </style>
</head>
<body>
  <h1>🔥 Live Counter (Real-Time)</h1>
  <div id="count">0</div>

  <script>
    const ws = new WebSocket("ws://" + location.host);

    ws.onmessage = (event) => {
      document.getElementById("count").innerText = event.data;
    };

    ws.onopen = () => console.log("Connected to server");
  </script>
</body>
</html>
  `);
});

// WebSocket connections
wss.on("connection", (ws) => {
  console.log("📡 Client connected");

  ws.send(counter);

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});

// Broadcast function
function broadcast(value) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(value);
    }
  });
}

// Counter loop (REAL TIME PUSH)
const interval = setInterval(() => {
  if (isShuttingDown) return;

  counter++;
  broadcast(counter);

  if (counter >= 1000) {
    console.log("✅ Reached 1000");
    clearInterval(interval);
  }
}, 1000);

// Start server
server.listen(PORT, () => {
  console.log(`🌐 Running at http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`⚠️ ${signal} received. Shutting down gracefully...`);
  isShuttingDown = true;

  server.close(() => {
    console.log("🛑 HTTP server closed");

    setTimeout(() => {
      clearInterval(interval);
      process.exit(0);
    }, 3000);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
