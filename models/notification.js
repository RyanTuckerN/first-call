const { DataTypes, where, Op } = require("sequelize");
const sequelize = require("../db");

const Notification = sequelize.define("notification", {
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  source: DataTypes.INTEGER,
  optionalInfo: DataTypes.JSONB,
});

module.exports = Notification