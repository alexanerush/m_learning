
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.NODE_ENV === 'test'
    ? ':memory:'
    : './mlearning.sqlite',
  logging: false
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  }
});

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

User.hasMany(Task, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

Task.belongsTo(User, {
  foreignKey: 'userId'
});

async function initializeDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();

  console.log('Database connected successfully');
}

module.exports = {
  sequelize,
  User,
  Task,
  initializeDatabase
};
