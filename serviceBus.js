
const { ServiceBusClient } = require("@azure/service-bus");

function getClient() {
  const connectionString =
    process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;

  if (!connectionString) {
    throw new Error(
      "AZURE_SERVICE_BUS_CONNECTION_STRING is missing"
    );
  }

  return new ServiceBusClient(connectionString);
}

function getQueueName(type = "primary") {
  const variable =
    type === "secondary"
      ? "AZURE_SERVICE_BUS_SECOND_QUEUE_NAME"
      : "AZURE_SERVICE_BUS_QUEUE_NAME";

  const queueName = process.env[variable];

  if (!queueName) {
    throw new Error(`${variable} is missing`);
  }

  return queueName;
}

async function sendMessage(message, type = "primary") {
  const client = getClient();
  let sender;

  try {
    sender = client.createSender(getQueueName(type));

    await sender.sendMessages({
      body: message,
      contentType: "text/plain",
    });

    console.log(`Message sent to ${type} Azure queue`);

    return {
      success: true,
      queue: type,
      message,
    };
  } finally {
    if (sender) await sender.close();
    await client.close();
  }
}

async function receiveMessages(
  type = "secondary",
  maxMessages = 10
) {
  const client = getClient();
  let receiver;

  try {
    receiver = client.createReceiver(getQueueName(type));

    const messages = await receiver.receiveMessages(
      maxMessages,
      { maxWaitTimeInMs: 5000 }
    );

    const results = [];

    for (const message of messages) {
      try {
        const body = message.body;

        // Replace this with application-specific processing.
        console.log("Azure message received:", body);

        await receiver.completeMessage(message);

        results.push({
          id: message.messageId,
          body,
          status: "processed",
        });
      } catch (error) {
        await receiver.abandonMessage(message);
        throw error;
      }
    }

    return results;
  } finally {
    if (receiver) await receiver.close();
    await client.close();
  }
}

module.exports = {
  sendMessage,
  receiveMessages,
};
