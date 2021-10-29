const express = require("express");
const { Notification } = require("../models");
const router = express.Router();
const validateSession = require("../middleware/validateSession");
const { Op } = require("sequelize");

router.delete("/delete/:id", validateSession, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const deleteCount = await Notification.destroy({ where: { id, userId } });
    const notifications = await Notification.findAll({ where: { userId } });

    deleteCount
      ? res.status(200).json({
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

router.delete("/deleteMany", validateSession, async (req, res) => {
  try {
    const { id } = req.user;
    const { deletions } = req.body;
    const result = await Notification.destroy({
      where: { id: {[Op.in]: deletions }, userId: id },
    });
    res.status(200).json({ result, success: true, message: "Success!" });
  } catch (error) {
    res.status(500).json({ error, message: "Failure!" });
  }
});

router.delete("/deleteAll", validateSession, async (req, res) => {
  try {
    const { id } = req.user;
    const deletions = await Notification.destroy({ where: { userId: id } });
    res.status(200).json({ success: true, deletions });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
});
module.exports = router;
