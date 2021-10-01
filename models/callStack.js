const { DataTypes, where, Op } = require("sequelize");
const sequelize = require("../db");

const CallStack = sequelize.define("callStack", {
  gigId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    unique: true
  },
  stackTable : DataTypes.JSONB
});

module.exports = CallStack