
const express = require("express");

const {
  addIncomingMessage,
  processNextMessage,
  getQueueStatus,
} = require("./queueReader");

function getAzureServiceBus() {
  return require("./serviceBus");
}

const router = express.Router();

function isAzure() {
  return process.env.QUEUE_PROVIDER === "azure";
}

/**
 * @swagger
 * /queue/send:
 *   post:
 *     summary: Send a message to the secondary queue
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
 *                 example: Hello from Azure!
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid message
 *       500:
 *         description: Queue error
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
    if (isAzure()) {
      const result = await getAzureServiceBus().sendMessage(
        message,
        "secondary"
      );

      return res.status(201).json({
        success: true,
        provider: "azure",
        message: "Message sent to Azure Service Bus",
        data: result,
      });
    }

    const result = await addIncomingMessage(message);

    return res.status(201).json({
      success: true,
      provider: "local",
      message: "Message saved to persistent queue",
      data: result,
    });
  } catch (error) {
    console.error("Queue send error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to send message",
    });
  }
});

/**
 * @swagger
 * /queue/process:
 *   post:
 *     summary: Process messages from the secondary queue
 *     tags: [Queue Reader]
 *     responses:
 *       200:
 *         description: Messages processed
 *       500:
 *         description: Processing error
 */
router.post("/process", async (req, res) => {
  try {
    if (isAzure()) {
      const messages = await getAzureServiceBus().receiveMessages(
        "secondary",
        10
      );

      return res.json({
        success: true,
        provider: "azure",
        processedCount: messages.length,
        data: messages,
      });
    }

    const processed = await processNextMessage();

    if (!processed) {
      return res.json({
        success: true,
        provider: "local",
        message: "Queue is empty or worker is busy",
        data: null,
      });
    }

    return res.json({
      success: processed.status === "processed",
      provider: "local",
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
 *     summary: Get queue provider and status
 *     tags: [Queue Reader]
 *     responses:
 *       200:
 *         description: Queue status
 *       500:
 *         description: Queue error
 */
router.get("/status", async (req, res) => {
  try {
    if (isAzure()) {
      return res.json({
        success: true,
        provider: "azure",
        queue:
          process.env
            .AZURE_SERVICE_BUS_SECOND_QUEUE_NAME,
        message:
          "Azure Service Bus is configured. Use Azure Portal to view queue metrics.",
      });
    }

    const status = await getQueueStatus();

    return res.json({
      success: true,
      provider: "local",
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
