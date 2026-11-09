
process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../index");
const { sequelize } = require("../database");

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("System API", () => {
  test("GET / returns a successful response", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
  });

  test("GET /health returns a successful response", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
  });

  test("GET /metrics exposes Prometheus metrics", async () => {
    const response = await request(app).get("/metrics");

    expect(response.status).toBe(200);
    expect(response.text).toContain("http");
  });
});

describe("Users API", () => {
  let userId;

  test("POST /users creates a user", async () => {
    const response = await request(app)
      .post("/users")
      .send({
        name: "API Test User",
        email: "apitest@example.com",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    userId = response.body.id;
  });

  test("GET /users returns users", async () => {
    const response = await request(app).get("/users");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("GET /users/:id returns a user", async () => {
    const response = await request(app).get(`/users/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe("apitest@example.com");
  });

  test("PUT /users/:id updates a user", async () => {
    const response = await request(app)
      .put(`/users/${userId}`)
      .send({
        name: "Updated API Test User",
      });

    expect(response.status).toBe(200);
  });

  test("DELETE /users/:id deletes a user", async () => {
    const response = await request(app).delete(`/users/${userId}`);

    expect([200, 204]).toContain(response.status);
  });
});

describe("Tasks API", () => {
  let taskId;

  test("POST /tasks creates a task", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({
        title: "Test API Task",
        description: "Created by Jest and Supertest",
        completed: false,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    taskId = response.body.id;
  });

  test("GET /tasks returns tasks", async () => {
    const response = await request(app).get("/tasks");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("GET /tasks/:id returns a task", async () => {
    const response = await request(app).get(`/tasks/${taskId}`);

    expect(response.status).toBe(200);
  });

  test("PUT /tasks/:id updates a task", async () => {
    const response = await request(app)
      .put(`/tasks/${taskId}`)
      .send({
        completed: true,
      });

    expect(response.status).toBe(200);
  });

  test("DELETE /tasks/:id deletes a task", async () => {
    const response = await request(app).delete(`/tasks/${taskId}`);

    expect([200, 204]).toContain(response.status);
  });
});

describe("Queue Reader API", () => {
  test("GET /queue/status returns queue information", async () => {
    const response = await request(app).get("/queue/status");

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  test("POST /queue/send adds a message", async () => {
    const response = await request(app)
      .post("/queue/send")
      .send({
        message: "Hello from automated API test",
      });

    expect([200, 201, 202]).toContain(response.status);
  });

  test("POST /queue/process processes a message", async () => {
    const response = await request(app).post("/queue/process");

    expect([200, 201, 202]).toContain(response.status);
  });
});
