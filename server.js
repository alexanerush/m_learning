
require("dotenv").config();

const app = require("./index");
const { initializeDatabase } = require("./database");
const {
  startQueueWorker,
  stopQueueWorker,
} = require("./queueReader");

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initializeDatabase();

    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Swagger: http://localhost:${PORT}/swagger/`);

      startQueueWorker(2000);
    });

    async function shutdown() {
      console.log("Shutting down...");

      stopQueueWorker();

      server.close(() => {
        process.exit(0);
      });
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

start();
