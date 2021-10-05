const { DataTypes, where, Op, Model } = require("sequelize");
const sequelize = require("../db");
// const CallStackModel = require("../helpers/CallStackModel");

class Board extends Model {
  /**
   * checks if there are no messages on this board
   * @returns {Boolean}
   */
  checkEmpty() {
    return this.threads.length === 0;
  }

  /**
   * adds *Message* class instance to *threads* array property
   * @param {Object} message class instance
   * @returns count of top-level threads
   */
  addMessage(message) {
    this.threads.push(message)
    return this.threads.length
  }



  /**
   * find and return a message by it's unique ID
   * @param {Number} id representing message
   * @returns {Object} JSON class instance of the message
   */
  findMessage(id){
    const roots = this.threads.map(root=>root.id)
    if(roots.includes(id))
    return this.threads[this.threads.indexOf(id)]
  }
}

Board.init(
  {
    gigId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
    },
    threads: { type: DataTypes.ARRAY(DataTypes.JSONB), defaultValue: [] },
    empty: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: "board",
  }
);

// const obj = {gigId: 2, threads: []}

// const ThisBoard = new Board(obj)
// console.log(ThisBoard)

module.exports = Board;
