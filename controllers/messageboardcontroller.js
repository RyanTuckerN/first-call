const express = require("express");
const { MessageBoard, Post } = require("../models");
const router = express.Router();
const validateSession = require("../middleware/validateSession");

router.post("/:gigId", async (req, res) => {
  const { gigId } = req.params;
  try {
    const newBoard = await MessageBoard.create({ gigId });

    res.status(200).json({ newBoard });
  } catch (err) {
    res.status(500).json({ err });
  }
});

router.post("/:gigId/newPost", async (req, res) => {
  try {
    const { gigId } = req.params;
    const { text, childOf } = req.body;

    const newPost = await Post.create({
      gigId,
      childOf,
      text,
    });

    res.status(200).json({ newPost });
  } catch (err) {
    res.status(500).json({ err });
  }
});

module.exports = router;
