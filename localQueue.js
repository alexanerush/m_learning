
const messages = [];

async function sendMessage(message) {
  const newMessage = {
    id: crypto.randomUUID(),
    body: message,
    createdAt: new Date().toISOString()
  };

  messages.push(newMessage);

  console.log('Message added to local queue:', newMessage);

  return newMessage;
}

function getMessages() {
  return messages;
}

module.exports = {
  sendMessage,
  getMessages
};
