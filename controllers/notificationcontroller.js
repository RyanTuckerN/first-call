const express = require("express");
const { Notification } = require("../models");
const router = express.Router();
const validateSession = require("../middleware/validateSession");

router.delete("/:id", validateSession, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const deleteCount = await Notification.destroy({ where: { id, userId } });
    const notifications = await Notification.findAll({ where: { userId } });

    deleteCount
      ? res
          .status(200)
          .json({
            deleteCount,
            notifications,
            success: true,
            message: "Success! Notification deleted.",
          })
      : res.status(204).json({ deleteCount, message: "nothing to delete" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error });
  }
});

module.exports = router;
