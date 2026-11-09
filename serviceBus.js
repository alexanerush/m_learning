
require('dotenv').config();

const { ServiceBusClient } = require('@azure/service-bus');

const connectionString =
  process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;

const queueName =
  process.env.AZURE_SERVICE_BUS_QUEUE_NAME;

async function sendMessage(message) {
  if (!connectionString) {
    throw new Error('Azure Service Bus connection string is missing');
  }

  const client = new ServiceBusClient(connectionString);
  const sender = client.createSender(queueName);

  try {
    await sender.sendMessages({
      body: message
    });

    console.log('Message sent to Azure Service Bus');
  } finally {
    await sender.close();
    await client.close();
  }
}

module.exports = { sendMessage };
