const express = require("express");
const {
  User,
  Gig,
  CallStack,
  Notification,
  Story,
  Post,
} = require("../models");
// const CallStackModel = require("../models/CallStackModel");
const { Op } = require("sequelize");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validateSession = require("../middleware/validateSession");

//SIGNUP FOR NEW USER
router.post("/signup", (req, res) => {
  const { password, email, name, photo } = req.body;

  User.create({
    passwordhash: bcrypt.hashSync(password, 13),
    email,
    name,
    photo,
  })
    .then((user) => {
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: 86400,
      });
      Gig.findAll({
        where: { confirmedNoAccount: { [Op.contains]: [email] } },
        include: { model: CallStack },
      }).then((gigs) => {
        const proms = gigs.map(
          async (gig) => await Gig.addUserToGig(user.id, gig.id)
        );
        Promise.all(proms).then((resolutions) => {
          // console.log(gigs)
          res.status(200).json({
            user: {
              id: user.id,
              email,
              name,
            },
            resolutions,
            message: `Success! Account created for ${name}!`,
            sessionToken: token,
            success: true,
            gigs,
          });
        });
      });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
      console.log(err);
    });
});

//LOGIN EXISTING USER
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  User.findOne({
    where: { email },
    include: { model: Gig, include: { model: CallStack } },

    // include: {all: true, nested: true}
    // attributes: { include: ["passwordhash"] },
  })
    .then((user) => {
      // console.log(user);
      if (user) {
        bcrypt.compare(password, user.passwordhash, (err, match) => {
          if (match) {
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
              expiresIn: 86400,
            });
            delete user.passwordhash;
            res.status(200).json({
              user,
              message: `Success! ${user.name} logged in!`,
              success: true,
              sessionToken: token,
            });
          } else {
            res.status(502).send({ message: "🛑 Incorrect Password 🛑", err });
          }
        });
      } else {
        res.status(500).json({ message: "User does not exist" });
      }
    })
    .catch((err) =>
      res.status(500).json({ message: "Something went wrong", err })
    );
});

//EDIT/ADD PROFILE TO USER ACCOUNT
router.put("/profile", validateSession, async (req, res) => {
  const { id } = req.user;
  try {
    const user = await User.findOne({
      where: { id },
      include: { model: Gig, include: { model: CallStack } },
    });
    if (!user) {
      res.status(403).json({ message: "Account not found" });
    } else {
      const result = await user.update(req.body);
      delete user.passwordhash;
      res.status(200).json({
        message: `success`,
        success: true,
        user,
        result,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Oops, something went wrong!", err });
  }
});

//get count and list of gigs that have requesting user oncall
router.get("/offers", validateSession, async (req, res) => {
  const { id } = req.user;
  try {
    const user = await User.findOne({ where: { id } });
    const offers = await Gig.findAll({
      where: { openCalls: { [Op.contains]: [user.email] } },
      include: [{ model: CallStack }, { model: User }],
    });
    res.status(200).json({ offers, message: "success!", success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err, message: "failure" });
  }
});

//get count and list of all notifications belonging to requesting user
router.get("/notifications", validateSession, async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findOne({ where: { id } });
    const offers = await Gig.findAll({
      where: { openCalls: { [Op.contains]: [user.email] } },
      include: [{ model: CallStack }, { model: User }],
    });

    const mappedOffers = offers.map((o) => o.id);

    const notifications = await Notification.findAll({
      where: { userId: id },
    });

    const filteredNotes = notifications.filter((n) => {
      if (n.details.code !== 100) return n;
      if (mappedOffers.includes(n.details.gigId)) return n;
    });
    // console.log("filtered: ", filteredNotes);
    // console.log("Notifications!!!: ", notifications);

    res.status(200).json({
      auth: true,
      notifications: filteredNotes,
      message: "success!",
      success: true,
    });
  } catch (err) {
    console.log(err),
      res.status(500).json({ err, message: "failure", auth: false });
  }
});

//update password
router.post("/update-password", validateSession, async (req, res) => {
  try {
    const { id } = req.user;
    const { password, newPassword } = req.body;
    const user = await User.findOne({ where: { id } });
    user
      ? bcrypt.compare(password, user.passwordhash, async (err, match) => {
          if (match) {
            //change password
            const passwordhash = bcrypt.hashSync(newPassword, 13);
            await user.update({ passwordhash });
            res.status(200).json({ success: true });
          } else {
            res.status(502).json({
              message: "🛑 Incorrect Password 🛑",
              err,
              success: false,
            });
          }
        })
      : res.status(500).json({ message: "something went wrong!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "failure", err });
  }
});

//authorize a user
router.get("/auth", validateSession, async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findOne({
      where: { id },
      // include: { all: true, nested: true },
      include: { model: Gig, include: { model: CallStack } },
    });
    // const gigs = await user.getGigs()

    delete user.passwordhash;
    res.status(200).json({
      auth: true,
      user: { ...user.dataValues, passwordhash: null, success: true },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err, auth: false });
  }
});

//get users profile
router.get("/profile/:id", validateSession, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findOne({
      where: { id },
      include: {
        model: Story,
        order: [[id, 'DESC']],
        include: [
          {
            model: Post,
            include: { model: User, attributes: ["name"] },
          },
          { model: User, attributes: ["name", "photo"] },
        ],
      },
    });
    res.status(200).json({ user, success: true, message: "success!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
});

//follow user
router.post("/follow/:userId", validateSession, async (req, res) => {
  try {
    const { user } = req;
    const { userId } = req.params;
    const followed = await User.findOne({ where: { id: parseInt(userId) } });
    const result2 = await followed.update({
      followers: [...new Set([...followed.followers, parseInt(user.id)])],
    });
    const result = await user.update({
      following: [...new Set([...user.following, parseInt(userId)])],
    });
    // console.log(result);
    res.status(200).json({
      success: true,
      following: result.following,
      followers: result2.followers,
      message: "Success!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error, message: "Something went wrong!" });
  }
});

//unfollow user
router.post("/unfollow/:userId", validateSession, async (req, res) => {
  try {
    const { user } = req;
    const { userId } = req.params;
    const unfollowed = await User.findOne({ where: { id: parseInt(userId) } });
    const result2 = await unfollowed.update({
      followers: [
        ...new Set([
          ...unfollowed.followers.filter((f) => f !== parseInt(user.id)),
        ]),
      ],
    });
    const result = await user.update({
      following: [
        ...new Set([...user.following.filter((f) => f !== parseInt(userId))]),
      ],
    });
    // console.log(result);
    res.status(200).json({
      success: true,
      following: result.following,
      followers: result2.followers,
      message: "Success!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error, message: "Something went wrong!" });
  }
});

//GET FOLLOWING and FOLLOWERS
router.get("/follows/:userId", validateSession, async (req, res) => {
  try {
    const { following, followers } =
      req.user.id === req.params.userId
        ? req.user
        : await User.findOne({
            where: { id: req.params.userId },
            // attributes: ["following", "followers"],
          });
    const users = await User.findAll({
      where: { id: { [Op.in]: [...new Set([...following, ...followers])] } },
      attributes: ["name", "photo", "role", "id", "email"],
    });
    res.status(200).json({ users, success: true, message: "Success!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error, message: "Something went wrong!" });
  }
});

//SEARCH FOR USER
router.get("/search/:string", validateSession, async (req, res) => {
  try {
    const { string } = req.params;
    const usersRaw = await User.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${string}%` } },
          { role: { [Op.iLike]: `%${string}%` } },
          { location: { [Op.iLike]: `%${string}%` } },
          { email: { [Op.iLike]: `%${string}%` } },
        ],
      },
      attributes: ["name", "role", "photo", "id"],
      limit: 6,
    });
    const users = usersRaw.map((user) => {
      return { ...user.dataValues, url: `/main/profile/${user.id}` };
    });
    res.status(200).json({ success: true, users, message: "success!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error, message: "Something went wrong!" });
  }
});

module.exports = router;
