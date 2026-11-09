
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage:
    process.env.NODE_ENV === "test"
      ? ":memory:"
      : "./mlearning.sqlite",
  logging: false,
});

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
});

const Task = sequelize.define("Task", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

User.hasMany(Task, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

Task.belongsTo(User, {
  foreignKey: "userId",
});

const QueueMessage = sequelize.define("QueueMessage", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      "pending",
      "processing",
      "processed",
      "failed"
    ),
    allowNull: false,
    defaultValue: "pending",
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastError: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

async function initializeDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();

  // Restore messages interrupted by a previous shutdown.
  await QueueMessage.update(
    { status: "pending" },
    { where: { status: "processing" } }
  );

  console.log("Database connected successfully");
}

module.exports = {
  sequelize,
  User,
  Task,
  QueueMessage,
  initializeDatabase,
};
