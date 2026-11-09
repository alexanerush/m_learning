
const { randomUUID } = require('node:crypto');

const incomingQueue = [];
const processedMessages = [];

function addIncomingMessage(body) {
  const message = {
    id: randomUUID(),
    body,
    createdAt: new Date().toISOString()
  };

  incomingQueue.push(message);
  return message;
}

function processNextMessage() {
  if (incomingQueue.length === 0) {
    return null;
  }

  const message = incomingQueue.shift();

  const processed = {
    ...message,
    processedAt: new Date().toISOString(),
    status: 'processed'
  };

  processedMessages.push(processed);
  return processed;
}

function getQueueStatus() {
  return {
    pending: incomingQueue.length,
    processed: processedMessages.length,
    incomingQueue,
    processedMessages
  };
}

module.exports = {
  addIncomingMessage,
  processNextMessage,
  getQueueStatus
};
