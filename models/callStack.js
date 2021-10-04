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

/**
 * This method takes table and gigId, arranges it in a clean way, and persists it to the database table CallStack
 * @param {Object} table raw json request from user. contains keys of role and values of array of email addresses 
 * @param {Number} gigId represents Gig instance
 * @returns {Object} callStack instance
 */
CallStack.newStackTable = async (table, gigId) => {
  const stackTable = {};
  const roles = Object.keys(table);
  // console.log("roles: ", roles);
  roles.forEach((role) => {
    stackTable[role] = {};
    stackTable[role].filled = false;
    stackTable[role].calls = table[role];
  });
  const constructorObj = {stackTable, gigId, filled: false, }

  const GigStack = new CallStackModel(constructorObj)
  GigStack.setFirstCalls()

  // console.log('GigStack in callStack.js: ', GigStack);
  return await CallStack.create(GigStack);
};
module.exports = CallStack;
