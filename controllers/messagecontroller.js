const express = require("express");
const router = express.Router();
const validateSession = require("../middleware/validateSession");
const newEmail = require("../helpers/newEmail");

router.post("/", validateSession, async (req, res) => {
  try {
    const { id } = req.user;
    const { to, from } = req.body;
    const { subject, body } = req.body.options;
    const notification = await newEmail(to, 400, -1, from, {
      subject,
      body,
      senderId: id,
    });

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
});

module.exports = router;
