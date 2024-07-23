const express = require("express");
const { spawn } = require("child_process");

const app = express();
app.use(express.json());

app.post("/start-stream", (req, res) => {
  const { stream_server, stream_key } = req.body;

  const ffmpeg = spawn("ffmpeg", [
    "-f",
    "lavfi",
    "-i",
    "anullsrc",
    "-f",
    "gdigrab",
    "-i",
    "desktop",
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

app.listen(3001, () => {
  console.log("Server started on port 3001");
});
