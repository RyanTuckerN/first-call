const express = require("express");
const { User } = require("../models");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validateSession = require("../middleware/validateSession");

//SIGNUP FOR NEW USER
router.post("/signup", (req, res) => {
  const { password, email, role } = req.body;

  User.create({
    passwordhash: bcrypt.hashSync(password, 13),
    email,
    role,
  })
    .then((user) => {
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: 86400,
      });
      res.status(200).json({
        user,
        message: `Success! Account created for ${email}!`,
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
  })
    .then((user) => {
      if (user) {
        bcrypt.compare(password, user.passwordhash, (err, match) => {
          if (match) {
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
              expiresIn: 86400,
            });
            res.status(200).json({
              user,
              message: `Successfully logged in!`,
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
  const { email, role, name, description, location, paymentPreference, specialties } = req.body;
  const { id } = req.user;
  const updateUser = { email, role, name, description, location, paymentPreference, specialties };
  const query = { where: { id } };
  try {
    const result = await User.update(updateUser, query);
    if (!result[0]) {
      res.status(403).json({ message: "Account not found" });
    } else {
      res.status(200).json({ message: `${email}'s profile has been updated!'`});
    }
  } catch (err) {
    res.status(500).json({ message: "Oops, something went wrong!",err });
  }
});

module.exports = router;
