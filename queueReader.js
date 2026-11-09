
const { QueueMessage } = require("./database");

const MAX_ATTEMPTS = 3;

let workerTimer = null;
let isProcessing = false;

function formatMessage(message) {
  if (!message) return null;

  const item = message.toJSON();

  return {
    id: item.id,
    body: item.body,
    createdAt: item.createdAt,
    processedAt: item.processedAt,
    status: item.status,
    attempts: item.attempts,
    lastError: item.lastError,
  };
}

async function addIncomingMessage(body) {
  const message = await QueueMessage.create({
    body,
    status: "pending",
  });

  return formatMessage(message);
}

async function processNextMessage() {
  if (isProcessing) return null;

  isProcessing = true;

  try {
    const message = await QueueMessage.findOne({
      where: { status: "pending" },
      order: [["createdAt", "ASC"]],
    });

    if (!message) return null;

    message.status = "processing";
    message.attempts += 1;
    await message.save();

    try {
      // Local processing logic.
      // Replace with real business logic when needed.
      if (!message.body.trim()) {
        throw new Error("Message body is empty");
      }

      message.status = "processed";
      message.processedAt = new Date();
      message.lastError = null;

      await message.save();

      console.log(
        `Queue worker processed message: ${message.id}`
      );

      return formatMessage(message);
    } catch (error) {
      message.lastError = error.message;

      message.status =
        message.attempts >= MAX_ATTEMPTS
          ? "failed"
          : "pending";

      await message.save();

      console.error(
        `Message ${message.id} failed: ${error.message}`
      );

      return formatMessage(message);
    }
  } finally {
    isProcessing = false;
  }
}

async function getQueueStatus() {
  const pendingMessages = await QueueMessage.findAll({
    where: { status: "pending" },
    order: [["createdAt", "ASC"]],
  });

  const processedMessages = await QueueMessage.findAll({
    where: { status: "processed" },
    order: [["createdAt", "ASC"]],
  });

  const failedMessages = await QueueMessage.findAll({
    where: { status: "failed" },
    order: [["createdAt", "ASC"]],
  });

  return {
    pendingCount: pendingMessages.length,
    processedCount: processedMessages.length,
    failedCount: failedMessages.length,
    pendingMessages: pendingMessages.map(formatMessage),
    processedMessages: processedMessages.map(formatMessage),
    failedMessages: failedMessages.map(formatMessage),
    workerRunning: workerTimer !== null,
  };
}

function startQueueWorker(intervalMs = 2000) {
  if (workerTimer !== null) return;

  console.log("Persistent queue worker started");

  workerTimer = setInterval(async () => {
    try {
      await processNextMessage();
    } catch (error) {
      console.error("Queue worker error:", error);
    }
  }, intervalMs);
}

function stopQueueWorker() {
  if (workerTimer !== null) {
    clearInterval(workerTimer);
    workerTimer = null;

    console.log("Queue worker stopped");
  }
}

module.exports = {
  addIncomingMessage,
  processNextMessage,
  getQueueStatus,
  startQueueWorker,
  stopQueueWorker,
};
