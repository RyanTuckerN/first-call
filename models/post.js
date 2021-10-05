const { DataTypes, where, Op, Model } = require("sequelize");
const sequelize = require("../db");
// const CallStackModel = require("../helpers/CallStackModel");

class Post extends Model {
  // /**
  //  * adds *Message* class instance to *threads* array property
  //  * @param {Object} message class instance
  //  * @returns count of top-level threads
  //  */
  // addMessage(message) {
  //   this.threads.push(message)
  //   return this.threads.length
  // }
  // /**
  //  * find and return a message by it's unique ID
  //  * @param {Number} id representing message
  //  * @returns {Object} JSON class instance of the message
  //  */
  // findMessage(id){
  //   const roots = this.threads.map(root=>root.id)
  //   if(roots.includes(id))
  //   return this.threads[this.threads.indexOf(id)]
  // }
  addUpvote(userId) {
    if (this.voters.includes(userId)) {
      return -1;
    }
    this.voters.push(userId);
    this.upvotes++;
    return this.upvotes;
  }

  logText() {
    console.log(this.text);
  }

  purifyVoters() {
    const arr = this.voters;
    this.voters = [
      ...new Set(arr.sort((a, b) => a - b).filter((v) => v)),
    ];
  }
}

Post.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    text: { type: DataTypes.STRING, allowNull: false },
    childOf: DataTypes.INTEGER,
    upvotes: { type: DataTypes.INTEGER, defaultValue: 0 },
    voters: { type: DataTypes.ARRAY(DataTypes.INTEGER) },
  },
  {
    sequelize,
    modelName: "post",
  }
);

module.exports = Post;
