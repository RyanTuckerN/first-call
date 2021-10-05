const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Gig = sequelize.define("gig", {
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  payment: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  optionalInfo: DataTypes.JSONB,
});

/**
 * Gig method that associates User instance to Gig instance, persists the relationship to the Database via user_gigs table
 * @param {Number} userId user to add
 * @param {Number} gigId gig to add them to
 * @returns {Object} with properties **errors**, **query**, and **message**,
 */
Gig.addUserToGig = async (userId, gigId) => {
  try {
    const user = await sequelize.models.user.findOne({ where: { id: userId } });
    const gig = await Gig.findOne({ where: { id: gigId } });

    let response = { errors: [] };
    if (!user) response.errors.push(`User ${userId} doesn't exist!`);
    if (!gig) response.errors.push(`Gig ${gigId} doesn't exist!`);
    if (response.errors?.length) {
      response.message = `Something went wrong!`;
    } else {
      const query = await gig.addUser(user);
      if (query) {
        response.query = query;
        response.message = `Success!`;
      } else {
        response.message = `Something went wrong! That user has probably already been added to that gig.`;
      }
    }
    
    return response;
  } catch (err) {
    return err;
  }
};

/**
 * 
 * @param {Number} gigId 
 * @returns {Object} gig: {
          {String} description,
          {String} date,
          {Number} payment,
          {Object} optionalInfo,
          {Object} callStack if callstack exists, otherwise {String} "no callstack created yet"
        },
 */
Gig.getGigInfo = async (gigId) => {
  try {
    const gig = await Gig.findOne({ where: { id: gigId }});
    const posts = await sequelize.models.post.findAndCountAll({where: {gigId}})
    const callStack = await sequelize.models.callStack.findOne({
      where: { gigId }
    });

    console.log(posts)
    if (gig) {
      const response = {
        gig: {
          description: gig.description,
          date: gig.date,
          payment: gig.payment,
          optionalInfo: gig.optionalInfo,
          callStack: callStack ?? "no callstack created yet",
          posts
        },
      };

      response.bandLeader = await sequelize.models.user.findOne({
        where: { id: gig.ownerId },
        attributes: ["id", "email"],
      });
      const users = await gig.getUsers();

      response.bandMembers = users.map((user) => {
        return {
          id: user.id,
          email: user.email,
        };
      });
      // response.users = users;
      return response;
    } else {
      return { message: "That gig doesn't exist!" };
    }
  } catch (err) {
    return err;
  }
};

module.exports = Gig;
