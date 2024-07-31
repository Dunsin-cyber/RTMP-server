const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const http = require("http");
const WebSocket = require("ws");

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const streamServer = "rtmp://34.173.223.115:1935/live"; // replace with your actual stream server
const streamKey = "YOUR_STREAM_KEY_HERE"; // replace with your actual stream key

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  let ffmpegProcess;

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "start-stream") {
      // Start the FFmpeg process
      ffmpegProcess = spawn("ffmpeg", [
        "-f",
        "webm",
        "-i",
        "pipe:0",
        "-vcodec",
        "libx264",
        "-acodec",
        "aac",
        "-f",
        "flv",
        `${streamServer}/${streamKey}`,
      ]);

      ffmpegProcess.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
      });

      ffmpegProcess.on("close", (code) => {
        console.log(`ffmpeg process exited with code ${code}`);
      });
    } else if (data.type === "signal") {
      // Relay signaling data
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } else if (data.type === "stream-data") {
      // Write stream data to FFmpeg
      if (ffmpegProcess) {
        ffmpegProcess.stdin.write(Buffer.from(data.stream));
      }
    }
  });

  ws.on("close", () => {
    if (ffmpegProcess) {
      ffmpegProcess.stdin.end();
    }
  });
});

server.listen(3001, () => {
  console.log("Server started on port 3001");
});
