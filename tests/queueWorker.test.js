
const {
    addIncomingMessage,
    getQueueStatus,
    startQueueWorker,
    stopQueueWorker,
  } = require("../queueReader");
  
  describe("Automatic Queue Worker", () => {
    afterEach(() => {
      stopQueueWorker();
    });
  
    test("starts and stops the worker", () => {
      startQueueWorker(20);
  
      expect(getQueueStatus().workerRunning).toBe(true);
  
      stopQueueWorker();
  
      expect(getQueueStatus().workerRunning).toBe(false);
    });
  
    test("automatically processes a queued message", async () => {
      const message = addIncomingMessage(
        "Automatic processing test"
      );
  
      startQueueWorker(20);
  
      const deadline = Date.now() + 2000;
      let processedMessage;
  
      while (Date.now() < deadline) {
        processedMessage = getQueueStatus()
          .processedMessages.find(
            (item) => item.id === message.id
          );
  
        if (processedMessage) {
          break;
        }
  
        await new Promise((resolve) =>
          setTimeout(resolve, 20)
        );
      }
  
      expect(processedMessage).toBeDefined();
      expect(processedMessage.status).toBe("processed");
      expect(processedMessage.body).toBe(
        "Automatic processing test"
      );
      expect(processedMessage.processedAt).toBeDefined();
  
      const status = getQueueStatus();
  
      expect(
        status.pendingMessages.some(
          (item) => item.id === message.id
        )
      ).toBe(false);
    });
  
    test("does not start duplicate workers", () => {
      startQueueWorker(20);
      startQueueWorker(20);
  
      expect(getQueueStatus().workerRunning).toBe(true);
  
      stopQueueWorker();
  
      expect(getQueueStatus().workerRunning).toBe(false);
    });
  });
  