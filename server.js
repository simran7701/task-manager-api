const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");


const app = express();

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Task Manager API is running",
    version: "1.0.0",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Handle invalid JSON and other errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  console.error(err.message);
  res.status(500).json({ message: "Internal server error" });
});

async function startServer() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI must be set in .env");
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET must be set in .env");
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.error("JWT_SECRET must be at least 32 characters long");
    process.exit(1);
  }

  let mongoUri = process.env.MONGO_URI;
  if (/^(?:MONGO_URI=)+/i.test(mongoUri)) {
    mongoUri = mongoUri.replace(/^(?:MONGO_URI=)+/i, "");
    console.warn(
      "MONGO_URI had an extra variable-name prefix; removed it for this run. Correct the value in .env."
    );
  }

  let parsedMongoUri;
  try {
    parsedMongoUri = new URL(mongoUri);
  } catch {
    console.error("MONGO_URI is not a valid connection URI; its value is hidden.");
    process.exit(1);
  }

  let mongoUsername;
  try {
    mongoUsername = decodeURIComponent(parsedMongoUri.username);
  } catch {
    console.error("MONGO_URI has an invalid encoded username; its value is hidden.");
    process.exit(1);
  }

  console.log(
    `MongoDB URI present: yes; hostname=${parsedMongoUri.hostname}; username=${mongoUsername || "(not set)"}`
  );

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";

    if (/bad auth|authentication failed/i.test(errorMessage)) {
      console.error(
        "MongoDB authentication failed. Check the Atlas database username and password, password URL encoding, and database-user settings."
      );
    } else if (/querySrv|ENOTFOUND|ECONNREFUSED|ESERVFAIL|ETIMEDOUT/i.test(errorMessage)) {
      console.error(
        "MongoDB DNS or network connection failed. Check DNS resolution and Atlas Network Access."
      );
    } else {
      console.error(
        "MongoDB connection failed. Check MONGO_URI, Atlas Network Access, and database-user settings."
      );
    }

    process.exit(1);
  }
}

startServer();