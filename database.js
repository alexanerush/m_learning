
const { Sequelize, DataTypes } = require("sequelize");

const dialect = process.env.DB_DIALECT || "sqlite";

if (!["sqlite", "mssql"].includes(dialect)) {
  throw new Error(`Unsupported DB_DIALECT: ${dialect}`);
}

function createSequelize() {
  if (process.env.NODE_ENV === "test" || dialect === "sqlite") {
    return new Sequelize({
      dialect: "sqlite",
      storage:
        process.env.NODE_ENV === "test"
          ? ":memory:"
          : process.env.SQLITE_STORAGE || "./mlearning.sqlite",
      logging: false,
    });
  }

  const required = [
    "AZURE_SQL_SERVER",
    "AZURE_SQL_DATABASE",
    "AZURE_SQL_USER",
    "AZURE_SQL_PASSWORD",
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  }

  return new Sequelize(
    process.env.AZURE_SQL_DATABASE,
    process.env.AZURE_SQL_USER,
    process.env.AZURE_SQL_PASSWORD,
    {
      host: process.env.AZURE_SQL_SERVER,
      port: Number(process.env.AZURE_SQL_PORT || 1433),
      dialect: "mssql",
      logging: false,
      dialectOptions: {
        options: {
          encrypt: true,
          trustServerCertificate: false,
        },
      },
    }
  );
}

const sequelize = createSequelize();

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
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "pending",
    validate: {
      isIn: [["pending", "processing", "processed", "failed"]],
    },
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

  await QueueMessage.update(
    { status: "pending" },
    { where: { status: "processing" } }
  );

  console.log(`Database connected successfully (${sequelize.getDialect()})`);
}

module.exports = {
  sequelize,
  User,
  Task,
  QueueMessage,
  initializeDatabase,
};
