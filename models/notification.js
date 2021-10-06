const { DataTypes, where, Op, Model } = require("sequelize");
const sequelize = require("../db");
// const CallStackModel = require("../helpers/CallStackModel");

class Notification extends Model {

  /**
   * creates a new instance of the Notification model and returns it
   * @param {Number} ownerId of user it belongs to
   * @param {String} text body of the notification
   * @param {String} heading title/subject of the notification
   * @param {Object} details useful/flexible storage of details
   * @returns {Object} instance of Notification
   */
  createNotification(ownerId, text, heading, details){

  }
}

Notification.init(
  {
    text: { type: DataTypes.STRING, allowNull: false },
    details: DataTypes.JSONB,
    userId: {type: DataTypes.INTEGER, allowNull: false}
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
