/* const express = require("express");
const { spawn } = require("child_process");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");
const bodyParser = require("body-parser");

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    // Broadcast the signal data to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });
});

app.post("/start-stream", (req, res) => {
  const { stream_server, stream_key } = req.body;
  console.log(stream_server, "BREAK", stream_key);

  const ffmpeg = spawn("ffmpeg", [
    "-f",
    "lavfi",
    "-i",
    "anullsrc",
    "-f",
    "x11grab",
    "-probesize",
    "10M",
    "-thread_queue_size",
    "1024",
    "-i",
    ":0.0",
    "-vcodec",
    "libx264",
    "-preset",
    "ultrafast",
    "-f",
    "flv",
    `${stream_server}/${stream_key}`,
  ]);

  ffmpeg.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  ffmpeg.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  ffmpeg.on("close", (code) => {
    console.log(`ffmpeg process exited with code ${code}`);
  });

  res.send("Streaming started");
});

server.listen(3001, () => {
  console.log("Server started on port 3001");
});
 */

const { spawn } = require("child_process");
const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3001;
// const STREAM_KEY = "vTt0eSMQQJxAf264qFlto0AlTPGyn7dw";
// const RTMP_SERVER = "rtmp://34.173.223.115:1935/live";
const HLS_DIR = path.join(__dirname, "hls"); // Directory to save HLS files

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
// Create the HLS directory if it doesn't exist
const fs = require("fs");
if (!fs.existsSync(HLS_DIR)) {
  fs.mkdirSync(HLS_DIR, { recursive: true });
}

app.post("/start-stream", (req, res) => {
  const { stream_key, stream_server } = req.body;

  // FFmpeg command to convert RTMP to HLS
  const ffmpeg = spawn("ffmpeg", [
    "-f",
    "lavfi",
    "-i",
    "anullsrc",
    "-f",
    "x11grab",
    "-probesize",
    "10M",
    "-thread_queue_size",
    "1024",
    "-i",
    ":0.0",
    "-vcodec",
    "libx264",
    "-preset",
    "ultrafast",
    "-f",
    "flv",
    `${stream_server}/${stream_key}`,
    "-f",
    "hls",
    "-hls_time",
    "10",
    "-hls_list_size",
    "6",
    "-hls_flags",
    "delete_segments",
    path.join(HLS_DIR, "playlist.m3u8"),
    "-loglevel",
    "debug",
  ]);

  ffmpeg.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  ffmpeg.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  ffmpeg.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });

  res.status(200).send("Streaming started");
});

// Serve static files (HLS segments and playlist)
app.use("/hls", express.static(path.join(__dirname, "hls")));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
