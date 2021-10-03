const { DataTypes, where, Op } = require("sequelize");
const sequelize = require("../db");
const CallStackModel = require("../helpers/CallStackModel");

const CallStack = sequelize.define("callStack", {
  gigId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    unique: true,
  },
  stackTable: DataTypes.JSONB,
  filled: { type: DataTypes.BOOLEAN, defaultValue: false },
});

//
CallStack.newStackTable = async (table, gigId) => {
  const stackTable = {};
  const roles = Object.keys(table);
  console.log("roles: ", roles);
  roles.forEach((role) => {
    stackTable[role] = {};
    stackTable[role].filled = false;
    stackTable[role].calls = table[role];
  });
  const constructorObj = {stackTable, gigId, filled: false, }

  const GigStack = new CallStackModel(constructorObj)
  GigStack.setFirstCalls()

  console.log('GigStack in callStack.js: ', GigStack);
  return await CallStack.create(GigStack);
};
module.exports = CallStack;
