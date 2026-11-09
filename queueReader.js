
const crypto = require("crypto");

const incomingQueue = [];
const processedMessages = [];

let workerTimer = null;
let isProcessing = false;

function addIncomingMessage(body) {
  const message = {
    id: crypto.randomUUID(),
    body,
    createdAt: new Date().toISOString(),
  };

  incomingQueue.push(message);

  return message;
}

function processNextMessage() {
  if (incomingQueue.length === 0) {
    return null;
  }

  const message = incomingQueue.shift();

  const processedMessage = {
    ...message,
    processedAt: new Date().toISOString(),
    status: "processed",
  };

  processedMessages.push(processedMessage);

  return processedMessage;
}

function getQueueStatus() {
  return {
    pendingCount: incomingQueue.length,
    processedCount: processedMessages.length,
    pendingMessages: [...incomingQueue],
    processedMessages: [...processedMessages],
    workerRunning: workerTimer !== null,
  };
}

function startQueueWorker(intervalMs = 2000) {
  if (workerTimer !== null) {
    return;
  }

  console.log("Queue worker started");

  workerTimer = setInterval(() => {
    if (isProcessing || incomingQueue.length === 0) {
      return;
    }

    isProcessing = true;

    try {
      const message = processNextMessage();

      if (message) {
        console.log(
          `Queue worker processed message: ${message.id}`
        );
      }
    } catch (error) {
      console.error("Queue worker error:", error);
    } finally {
      isProcessing = false;
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
