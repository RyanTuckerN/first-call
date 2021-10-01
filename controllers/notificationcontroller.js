const express = require("express");
const { Notification } = require("../models");
const router = express.Router();
const validateSession = require("../middleware/validateSession");

router.post("/:id", validateSession, async (req, res) => {
  const { message, optionalInfo } = req.body;
  try {
    const newNotification = await Notification.create({
      message,
      optionalInfo,
      source: req.user.id,
      userId: req.params.id
    });
    res.status(200).json({ newNotification });
  } catch (err) {
    res.status(500).json({ err });
  }
});

module.exports = router;
