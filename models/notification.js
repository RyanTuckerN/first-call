const { DataTypes, where, Op, Model } = require("sequelize");
const sequelize = require("../db");
// const CallStackModel = require("../helpers/CallStackModel");

class Notification extends Model {}

Notification.init(
  {
    text: { type: DataTypes.STRING, allowNull: false },
    userId: {type: DataTypes.INTEGER, allowNull: false},
    details: DataTypes.JSONB,
  },
  {
    sequelize,
    modelName: "notification",
  }
);

module.exports = Notification;
