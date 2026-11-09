
const express = require('express');

const {
  addIncomingMessage,
  processNextMessage,
  getQueueStatus
} = require('./queueReader');

const router = express.Router();

/**
 * @swagger
 * /queue/send:
 *   post:
 *     summary: Send a message to the second queue
 *     tags: [Queue Reader]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: Hello from second queue!
 *     responses:
 *       201:
 *         description: Message added to second queue
 *       400:
 *         description: Invalid message
 */
router.post('/send', (req, res) => {
  const { message } = req.body || {};

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Message must be a non-empty string'
    });
  }

  const result = addIncomingMessage(message);

  res.status(201).json({
    success: true,
    message: 'Message added to second queue',
    data: result
  });
});

/**
 * @swagger
 * /queue/process:
 *   post:
 *     summary: Process the next message from second queue
 *     tags: [Queue Reader]
 *     responses:
 *       200:
 *         description: Message processed or queue empty
 */
router.post('/process', (req, res) => {
  const processed = processNextMessage();

  if (!processed) {
    return res.json({
      success: true,
      message: 'Queue is empty',
      data: null
    });
  }

  res.json({
    success: true,
    message: 'Message processed successfully',
    data: processed
  });
});

/**
 * @swagger
 * /queue/status:
 *   get:
 *     summary: Get second queue status
 *     tags: [Queue Reader]
 *     responses:
 *       200:
 *         description: Queue status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    ...getQueueStatus()
  });
});

module.exports = router;
