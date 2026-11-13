
require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { ValidationError, UniqueConstraintError } = require('sequelize');

const { sendMessage, getMessages } = require('./localQueue');
const { sequelize, User, Task, initializeDatabase } = require('./database');
const { register, metricsMiddleware } = require('./metrics');
const queueRoutes = require('./queueRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(metricsMiddleware);
app.use('/queue', queueRoutes);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mlearning API',
      version: '3.0.0',
      description: 'Cloud Practice API with SQLite, Queue and Monitoring'
    },
    servers: [{ url: '/' }],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            completed: { type: 'boolean' },
            userId: { type: 'integer', nullable: true }
          }
        }
      }
    }
  },
  apis: ['./index.js', './queueRoutes.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

function handleError(res, error) {
  console.error('API error:', error.message);

  if (error instanceof UniqueConstraintError) {
    return res.status(409).json({
      error: 'Record already exists'
    });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: error.errors.map(item => item.message)
    });
  }

  return res.status(500).json({
    error: 'Internal server error'
  });
}

function validId(id) {
  return Number.isSafeInteger(Number(id)) && Number(id) > 0;
}

function validText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * @swagger
 * /:
 *   get:
 *     summary: Check if API is working
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 */
app.get('/', (req, res) => {
  res.json({ message: 'Mlearning API is working!' });
});

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a message to the local queue
 *     tags: [Messages]
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
 *                 example: Hello from Mlearning!
 *     responses:
 *       200:
 *         description: Message added successfully
 *       400:
 *         description: Invalid message
 *       500:
 *         description: Queue error
 *   get:
 *     summary: Get all messages
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: List of local messages
 */
app.post('/messages', async (req, res) => {
  const { message } = req.body || {};

  if (!validText(message)) {
    return res.status(400).json({
      error: 'Message must be a non-empty string'
    });
  }

  try {
    await sendMessage(message);

    res.json({
      success: true,
      message: 'Message added to local queue successfully'
    });
  } catch (error) {
    return handleError(res, error);
  }
});

app.get('/messages', (req, res) => {
  const messages = getMessages();

  res.json({
    success: true,
    count: messages.length,
    messages
  });
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sasha
 *               email:
 *                 type: string
 *                 example: sasha@example.com
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email already exists
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 */
app.post('/users', async (req, res) => {
  const { name, email } = req.body || {};

  if (!validText(name) || !validText(email)) {
    return res.status(400).json({
      error: 'Name and email are required'
    });
  }

  try {
    const user = await User.create({
      name: name.trim(),
      email: email.trim()
    });

    res.status(201).json(user);
  } catch (error) {
    return handleError(res, error);
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Task }]
    });

    res.json(users);
  } catch (error) {
    return handleError(res, error);
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
app.get('/users/:id', async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Task }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    return handleError(res, error);
  }
});

app.put('/users/:id', async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const { name, email } = req.body || {};

  if (
    (name === undefined && email === undefined) ||
    (name !== undefined && !validText(name)) ||
    (email !== undefined && !validText(email))
  ) {
    return res.status(400).json({ error: 'Invalid user data' });
  }

  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email: email.trim() })
    });

    res.json(user);
  } catch (error) {
    return handleError(res, error);
  }
});

app.delete('/users/:id', async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    return handleError(res, error);
  }
});

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Learn Azure
 *               description:
 *                 type: string
 *                 example: Complete cloud practice
 *               completed:
 *                 type: boolean
 *                 example: false
 *               userId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         description: Invalid task
 *       404:
 *         description: User not found
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: List of tasks
 */
app.post('/tasks', async (req, res) => {
  const { title, description, completed, userId } = req.body || {};

  if (
    !validText(title) ||
    (description !== undefined &&
      description !== null &&
      typeof description !== 'string') ||
    (completed !== undefined && typeof completed !== 'boolean') ||
    (userId !== undefined && userId !== null && !validId(userId))
  ) {
    return res.status(400).json({ error: 'Invalid task data' });
  }

  try {
    if (userId != null) {
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      completed,
      userId
    });

    res.status(201).json(task);
  } catch (error) {
    return handleError(res, error);
  }
});

app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [{ model: User }]
    });

    res.json(tasks);
  } catch (error) {
    return handleError(res, error);
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task found
 *       404:
 *         description: Task not found
 *   put:
 *     summary: Update task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               completed:
 *                 type: boolean
 *               userId:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Task updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Task or user not found
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task deleted
 *       404:
 *         description: Task not found
 */
app.get('/tasks/:id', async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: User }]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    return handleError(res, error);
  }
});

app.put('/tasks/:id', async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const { title, description, completed, userId } = req.body || {};

  if (
    Object.keys(req.body || {}).length === 0 ||
    (title !== undefined && !validText(title)) ||
    (description !== undefined &&
      description !== null &&
      typeof description !== 'string') ||
    (completed !== undefined && typeof completed !== 'boolean') ||
    (userId !== undefined && userId !== null && !validId(userId))
  ) {
    return res.status(400).json({ error: 'Invalid task data' });
  }

  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (userId != null) {
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    await task.update({
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description }),
      ...(completed !== undefined && { completed }),
      ...(userId !== undefined && { userId })
    });

    res.json(task);
  } catch (error) {
    return handleError(res, error);
  }
});

app.delete('/tasks/:id', async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.destroy();
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    return handleError(res, error);
  }
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check application and database health
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Application is healthy
 *       503:
 *         description: Database unavailable
 */
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();

    res.json({
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected'
    });
  }
});

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Get Prometheus metrics
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Prometheus metrics
 */
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).json({
      error: 'Failed to collect metrics'
    });
  }
});

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Swagger: http://localhost:${PORT}/swagger`);
    });
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
