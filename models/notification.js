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
    hooks: {
      // beforeCreate: async (post, options) => {
      //   post.voters = [];
      //   post.addUpvote(post.author);
      // },
    },
  }
);

module.exports = Notification;
