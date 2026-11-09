
const express = require("express");

const {
  addIncomingMessage,
  processNextMessage,
  getQueueStatus,
} = require("./queueReader");

const router = express.Router();

/**
 * @swagger
 * /queue/send:
 *   post:
 *     summary: Send a message to the persistent queue
 *     tags: [Queue Reader]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: Hello from persistent queue!
 *     responses:
 *       201:
 *         description: Message saved to SQLite queue
 *       400:
 *         description: Invalid message
 *       500:
 *         description: Database error
 */
router.post("/send", async (req, res) => {
  const { message } = req.body || {};

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: "Message must be a non-empty string",
    });
  }

  try {
    const result = await addIncomingMessage(message);

    return res.status(201).json({
      success: true,
      message: "Message saved to persistent queue",
      data: result,
    });
  } catch (error) {
    console.error("Queue send error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to save message",
    });
  }
});

/**
 * @swagger
 * /queue/process:
 *   post:
 *     summary: Manually process the next queued message
 *     tags: [Queue Reader]
 *     responses:
 *       200:
 *         description: Message processed or queue empty
 *       500:
 *         description: Processing error
 */
router.post("/process", async (req, res) => {
  try {
    const processed = await processNextMessage();

    if (!processed) {
      return res.json({
        success: true,
        message: "Queue is empty or worker is busy",
        data: null,
      });
    }

    return res.json({
      success: processed.status === "processed",
      message:
        processed.status === "processed"
          ? "Message processed successfully"
          : "Message processing failed",
      data: processed,
    });
  } catch (error) {
    console.error("Queue process error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to process message",
    });
  }
});

/**
 * @swagger
 * /queue/status:
 *   get:
 *     summary: Get persistent queue status
 *     tags: [Queue Reader]
 *     responses:
 *       200:
 *         description: Pending, processed and failed messages
 *       500:
 *         description: Database error
 */
router.get("/status", async (req, res) => {
  try {
    const status = await getQueueStatus();

    return res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error("Queue status error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to retrieve queue status",
    });
  }
});

module.exports = router;
