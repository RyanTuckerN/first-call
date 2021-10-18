const express = require("express");
const { User, Gig, CallStack, Notification } = require("../models");
const { Op } = require("sequelize");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validateSession = require("../middleware/validateSession");

//SIGNUP FOR NEW USER
router.post("/signup", (req, res) => {
  const { password, email, name } = req.body;

  User.create({
    passwordhash: bcrypt.hashSync(password, 13),
    email,
    name,
  })
    .then((user) => {
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: 86400,
      });

      res.status(200).json({
        user: {
          id: user.id,
          email,
          name,
        },
        message: `Success! Account created for ${name}!`,
        sessionToken: token,
      });
    })
    .catch((err) => res.status(500).json({ error: err }));
});

//LOGIN EXISTING USER
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  User.findOne({
    where: { email },
    // include: {all: true, nested: true}
    // attributes: { include: ["passwordhash"] },
  })
    .then((user) => {
      console.log(user);
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
  console.log(id)
  try {
    const result = await User.update(req.body, {
      where: { id },
      returning: true,
    });
    console.log(result)
    if (!result[0]) {
      res.status(403).json({ message: "Account not found" });
    } else {
      delete result[1][0].dataValues.passwordhash;
      res.status(200).json({
        message: `success`,
        success: true,
        user: result[1][0],
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Oops, something went wrong!", err });
  }
});

//get count and list of gigs that have requesting user oncall
router.get("/offers", validateSession, async (req, res) => {
  const { id } = req.user;
  try {
    const user = await User.findOne({ where: { id } });
    const offers = await Gig.findAndCountAll({
      where: { openCalls: { [Op.contains]: [user.email] } },
      include: { model: CallStack },
    });
    res.status(200).json({ offers, message: "success!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err, message: "failure" });
  }
});

//get count and list of all notifications belonging to requesting user
router.get("/notifications", validateSession, async (req, res) => {
  const { id } = req.user;
  try {
    const notifications = await Notification.findAll({
      where: { userId: id },
    });
    res.status(200).json({auth: true, notifications, message: 'success!'});
  } catch (err) {
    console.log(err), res.status(500).json({ err, message: "failure", auth:false });
  }
});

router.get("/auth", validateSession, async (req, res) => {
  const { id } = req.user;
  try {
    const user = await User.findOne({
      where: { id },
      // include: { all: true, nested: true },
    });
    delete user.passwordhash;
    res
      .status(200)
      .json({ auth: true, user: { ...user.dataValues, passwordhash: null } });
  } catch (err) {
    res.status(500).json({ err, auth: false });
  }
});

module.exports = router;
