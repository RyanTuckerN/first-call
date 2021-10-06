const { DataTypes, where, Op, Model } = require("sequelize");
const sequelize = require("../db");
// const CallStackModel = require("../helpers/CallStackModel");

class Post extends Model {
  /**
   * adds upvote to post
   * @param {Number} userId user making request
   * @returns {Number} Upvote count, or -1 if not successful
   */
  addUpvote(userId) {
    if (this.voters.includes(userId)) {
      return -1;
    }
    this.voters.push(userId);
    // console.log(this.voters)
    this.upvotes++;
    this.purifyVoters();
    return this.upvotes;
  }

  /**
   * removes upvote from a post
   * @param {Number} userId user making request
   * @returns {Number} Upvote count, or -1 if not successful
   */
  removeUpvote(userId) {
    if (!this.voters.includes(userId)) {
      return -1;
    }
    this.voters = this.voters.filter((id) => id !== userId);
    this.upvotes--;
    this.purifyVoters();
    return this.upvotes;
  }

  logText() {
    console.log(this.text);
  }

  /**
   * removes duplicates, sorts, removes falsy values
   */
  purifyVoters() {
    const arr = this.voters;
    this.voters = [...new Set(arr.sort((a, b) => a - b).filter((v) => v))];
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
    author: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    text: { type: DataTypes.STRING, allowNull: false },
    childOf: DataTypes.INTEGER,
    upvotes: { type: DataTypes.INTEGER, defaultValue: 0 },
    voters: { type: DataTypes.ARRAY(DataTypes.INTEGER) },
    details: { type: DataTypes.JSONB, defaultValue: {} },
  },
  {
    sequelize,
    modelName: "post",
    hooks: {
      beforeCreate: async (post, options) => {
        post.voters = [];
        post.addUpvote(post.author);
      },
    },
  }
);

module.exports = Post;
