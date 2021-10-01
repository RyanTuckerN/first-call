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
    if (gig) {
      const response = {
        gig: {
          description: gig.description,
          date: gig.date,
          payment: gig.payment,
          optionalInfo: gig.optionalInfo,
        },
      };
      response.bandLeader = await sequelize.models.user.findOne({
        where: { id: gig.ownerId },
        attributes: ["id", "email", "role"],
        // include: { model: sequelize.models.profile },
      });
      const users = await gig.getUsers();
      // const profiles = await sequelize.models.profile.findAll({where: { id: { [Op.in]: users.map((u) => u.id) } }})
        // .map((profile) => {
        //   const {
        //     firstName,
        //     lastName,
        //     description,
        //     location,
        //     paymentPreference,
        //     specialties,
        //   } = profile;
        //   return {
        //     firstName,
        //     lastName,
        //     description,
        //     location,
        //     paymentPreference,
        //     specialties,
        //   };
        // });
      // console.log(profiles);
      response.bandMembers = users.map((user) => {
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          // profile: profiles.filter((profile) => profile.id === user.id)[0],
        };
      });
      // response.users = users;
      return response;
    }
  } catch (err) {
    return err;
  }
};

module.exports = Gig;
