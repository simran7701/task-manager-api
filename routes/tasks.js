
const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// All task endpoints require a valid JWT
router.use(authenticateToken);

const allowedFields = ["title", "description", "status"];

function validTaskId(id) {
  return mongoose.isValidObjectId(id);
}

function validateTaskInput(body, isUpdate = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object";
  }

  const keys = Object.keys(body);

  if (keys.some((key) => !allowedFields.includes(key))) {
    return "Only title, description and status are allowed";
  }

  if (isUpdate && keys.length === 0) {
    return "Provide at least one field to update";
  }

  if (!isUpdate && !Object.hasOwn(body, "title")) {
    return "Task title is required";
  }

  if (Object.hasOwn(body, "title")) {
    if (
      typeof body.title !== "string" ||
      body.title.trim().length < 1 ||
      body.title.trim().length > 120
    ) {
      return "Title must be between 1 and 120 characters";
    }
  }

  if (Object.hasOwn(body, "description")) {
    if (
      typeof body.description !== "string" ||
      body.description.length > 1000
    ) {
      return "Description must be a string of at most 1000 characters";
    }
  }

  if (
    Object.hasOwn(body, "status") &&
    !["pending", "in-progress", "completed"].includes(body.status)
  ) {
    return "Status must be pending, in-progress or completed";
  }

  return null;
}

// CREATE: POST /api/tasks
router.post("/", async (req, res) => {
  try {
    const error = validateTaskInput(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const task = await Task.create({
      title: req.body.title.trim(),
      description: req.body.description?.trim() || "",
      status: req.body.status || "pending",
      owner: req.userId,
    });

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// READ ALL: GET /api/tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ owner: req.userId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// READ ONE: GET /api/tasks/:id
router.get("/:id", async (req, res) => {
  try {
    if (!validTaskId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ task });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE: PUT /api/tasks/:id
router.put("/:id", async (req, res) => {
  try {
    if (!validTaskId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const error = validateTaskInput(req.body, true);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const updates = {};

    for (const field of allowedFields) {
      if (Object.hasOwn(req.body, field)) {
        updates[field] =
          typeof req.body[field] === "string" &&
          field !== "status"
            ? req.body[field].trim()
            : req.body[field];
      }
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }

    console.error(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE: DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!validTaskId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;