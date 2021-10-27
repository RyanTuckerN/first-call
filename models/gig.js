const { DataTypes } = require("sequelize");
const CallStackModel = require("./CallStackModel");
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
  gigLocation: {
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
  photo: DataTypes.STRING,
  token: { type: DataTypes.UUID, allowNull: false },
  openCalls: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
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

    // console.log(user.name)
    // console.log(gig.description)

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

    // await gig.addUser(user)
    console.log('ADD USER TO GIG RESPONSE: ', response)
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
    const gig = await Gig.findOne({ where: { id: gigId } });
    const posts = await sequelize.models.post.findAndCountAll({
      where: { gigId },
    });
    const callStack = await sequelize.models.callStack.findOne({
      where: { gigId },
    });

    // console.log(posts)
    if (gig) {
      // console.log('*** *** *** ** ** * ** * * ',gig)
      const response = {
        gig: {
          description: gig.description,
          date: gig.date,
          payment: gig.payment,
          optionalInfo: gig.optionalInfo,
          callStack: callStack ?? "no callstack created yet",
          posts,
        },
      };
 
      response.bandLeader = await sequelize.models.user.findOne({
        where: { id: gig.ownerId },
        attributes: ["id", "email", "name", "photo"],
      });

      //find all users that have an account
      const users = await gig.getUsers({});
      // console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥', users)
      
      const roleHash = callStack
        ? new CallStackModel(callStack)?.returnConfirmed().reduce((a, b) => {
            a[b.email] = b.role;
            return a;
          }, {})
        : {};

        

      //filter out owner, and map over members returning only their email addresses and ids
      response.bandMembers = users
        .filter((user) => user.id !== gig.ownerId)
        .map((user) => {
          return user.name
            ? //include name if user has added it
              {
                id: user.id,
                email: user.email,
                name: user.name,
                role: roleHash[user.email],
              }
            : {
                id: user.id,
                email: user.email,
                role: roleHash[user.email],
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
