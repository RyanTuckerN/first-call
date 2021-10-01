const { DataTypes } = require("sequelize"); 
const sequelize = require("../db"); 

const User = sequelize.define("user", {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  passwordhash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: DataTypes.STRING,
  description: DataTypes.STRING,
  location: DataTypes.STRING,
  paymentPreference: DataTypes.JSONB,
  specialties: DataTypes.ARRAY(DataTypes.STRING(20)),
});



module.exports = User;
