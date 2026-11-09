
const {
    sequelize,
    QueueMessage,
    initializeDatabase,
  } = require("../database");
  
  const {
    addIncomingMessage,
    processNextMessage,
    getQueueStatus,
    startQueueWorker,
    stopQueueWorker,
  } = require("../queueReader");
  
  beforeAll(async () => {
    await initializeDatabase();
  });
  
  beforeEach(async () => {
    stopQueueWorker();
    await QueueMessage.destroy({ where: {} });
  });
  
  afterEach(() => {
    stopQueueWorker();
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  async function waitFor(check, timeoutMs = 2000) {
    const deadline = Date.now() + timeoutMs;
  
    while (Date.now() < deadline) {
      const result = await check();
  
      if (result) return result;
  
      await new Promise((resolve) =>
        setTimeout(resolve, 20)
      );
    }
  
    throw new Error("Timed out waiting for queue processing");
  }
  
  describe("Persistent Queue Worker", () => {
    test("saves a message to SQLite", async () => {
      const message = await addIncomingMessage(
        "Persistent queue test"
      );
  
      const saved = await QueueMessage.findByPk(message.id);
  
      expect(saved).not.toBeNull();
      expect(saved.body).toBe("Persistent queue test");
      expect(saved.status).toBe("pending");
    });
  
    test("starts and stops the worker", async () => {
      startQueueWorker(20);
  
      expect(
        (await getQueueStatus()).workerRunning
      ).toBe(true);
  
      stopQueueWorker();
  
      expect(
        (await getQueueStatus()).workerRunning
      ).toBe(false);
    });
  
    test("automatically processes messages", async () => {
      const message = await addIncomingMessage(
        "Automatic persistent processing"
      );
  
      startQueueWorker(20);
  
      const processed = await waitFor(async () => {
        const saved = await QueueMessage.findByPk(message.id);
  
        return saved?.status === "processed"
          ? saved
          : null;
      });
  
      expect(processed.status).toBe("processed");
      expect(processed.attempts).toBe(1);
      expect(processed.processedAt).not.toBeNull();
  
      const status = await getQueueStatus();
  
      expect(status.pendingCount).toBe(0);
      expect(status.processedCount).toBe(1);
    });
  
    test("does not start duplicate workers", async () => {
      startQueueWorker(20);
      startQueueWorker(20);
  
      expect(
        (await getQueueStatus()).workerRunning
      ).toBe(true);
  
      stopQueueWorker();
  
      expect(
        (await getQueueStatus()).workerRunning
      ).toBe(false);
    });
  
    test("retries failed messages up to 3 times", async () => {
      const message = await addIncomingMessage(" ");
  
      for (let attempt = 1; attempt <= 3; attempt++) {
        const result = await processNextMessage();
  
        expect(result.attempts).toBe(attempt);
  
        expect(result.status).toBe(
          attempt === 3 ? "failed" : "pending"
        );
      }
  
      const saved = await QueueMessage.findByPk(message.id);
  
      expect(saved.status).toBe("failed");
      expect(saved.attempts).toBe(3);
      expect(saved.lastError).toBe("Message body is empty");
    });
  
    test("restores interrupted messages", async () => {
      const message = await QueueMessage.create({
        body: "Interrupted processing",
        status: "processing",
        attempts: 1,
      });
  
      await initializeDatabase();
  
      const restored = await QueueMessage.findByPk(message.id);
  
      expect(restored.status).toBe("pending");
      expect(restored.attempts).toBe(1);
    });
  });
  