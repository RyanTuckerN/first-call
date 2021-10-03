const { DataTypes, where, Op } = require("sequelize");
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

Gig.getGigInfo = async (gigId) => {
  try {
    const gig = await Gig.findOne({ where: { id: gigId } });
    const callStack = await sequelize.models.callStack.findOne({
      where: { gigId },
    });
    if (gig) {
      const response = {
        gig: {
          description: gig.description,
          date: gig.date,
          payment: gig.payment,
          optionalInfo: gig.optionalInfo,
          callStack: callStack ?? "no callstack created yet",
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
          // role: user.role,
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
