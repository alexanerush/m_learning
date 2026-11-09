
const { sequelize, User, Task } = require('../database');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Database unit tests', () => {
  test('should create a user', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com'
    });

    expect(user.id).toBeDefined();
    expect(user.name).toBe('Test User');
  });

  test('should create a task', async () => {
    const user = await User.findOne();

    const task = await Task.create({
      title: 'Test Azure',
      description: 'Cloud practice',
      completed: false,
      userId: user.id
    });

    expect(task.title).toBe('Test Azure');
    expect(task.completed).toBe(false);
  });

  test('should update a task', async () => {
    const task = await Task.findOne();

    await task.update({ completed: true });

    expect(task.completed).toBe(true);
  });

  test('should delete a task', async () => {
    const task = await Task.findOne();
    const id = task.id;

    await task.destroy();

    const deleted = await Task.findByPk(id);

    expect(deleted).toBeNull();
  });
});
