
require("dotenv").config();

const { sendMessage, receiveMessages } = require("./serviceBus");

async function main() {
  try {
    console.log("Connecting to Azure Service Bus...");

    const message = `Azure test ${new Date().toISOString()}`;

    await sendMessage(message, "secondary");
    console.log("Message sent:", message);

    const received = await receiveMessages("secondary", 1);
    console.log("Received messages:", received);

    console.log("Azure Service Bus test completed!");
  } catch (error) {
    console.error("Azure Service Bus error:", error.message);
    process.exitCode = 1;
  }
}

main();
