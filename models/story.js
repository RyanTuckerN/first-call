const { DataTypes, Op, Model } = require("sequelize");
const sequelize = require("../db");
// const CallStackModel = require("../helpers/CallStackModel");

class Story extends Model {
  vote(userId) {
    if(this.likers.includes(userId)){
      this.likers = this.likers.filter(id=>id!==userId)
      this.purifyVoters()
      return this.likers.length
    }
    this.likers.push(userId)
    this.purifyVoters()
    return this.likers.length
  }

  purifyVoters() {
    const arr = this.likers;
    this.likers = [...new Set(arr.sort((a, b) => a - b).filter((v) => v))];
  }
}

Story.init(
  {
    text: { type: DataTypes.STRING(255), allowNull: false },
    imageUrl: { type: DataTypes.STRING(2048), allowNull: false },
    likers: { type: DataTypes.ARRAY(DataTypes.INTEGER), defaultValue: [], allowNull: false },
  },
  {
    sequelize,
    modelName: "story",
    hooks: {
      beforeCreate: async (story, options) => {
        story.vote(story.userId);
      },
    },
  }
);

module.exports = Story;
