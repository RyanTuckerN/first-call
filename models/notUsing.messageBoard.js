const { DataTypes, where, Op, Model } = require("sequelize");
const sequelize = require("../db");
// const CallStackModel = require("../helpers/CallStackModel");

class MessageBoard extends Model {
  /**
   * checks if there are no messages on this board
   * @returns {Boolean}
   */
  get empty() {
    return this.empty
  }

}

MessageBoard.init(
  {
    gigId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
    },
    empty: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: "messageBoard",
  }
);

module.exports = MessageBoard;
