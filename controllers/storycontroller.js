const express = require("express");
const { Story, Post, User } = require("../models");
const router = express.Router();
const validateSession = require("../middleware/validateSession");
const { Op } = require("sequelize");

//create a new story
router.post("/", validateSession, async (req, res) => {
  try {
    const { user } = req;
    const { text, imageUrl } = req.body;
    const story = await Story.create(
      { text, imageUrl, userId: user.id },
      { include: { model: User, attributes: ["name", "photo", "id"] } }
    );
    res.status(200).json({ story, success: true, message: "Success!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error, message: "Something went wrong!" });
  }
});

//add or remove an upvote on a story
router.post("/vote/:storyId", validateSession, async (req, res) => {
  try {
    const { id } = req.user;
    const { storyId } = req.params;
    const story = await Story.findOne({
      where: { id: storyId },
      include: {
        model: Post,
        include: { model: User, attributes: ["name", "photo", "id"] },
      },
    });
    // console.log(story);
    const votes = await story.vote(id);
    // console.log(votes);
    const result = await Story.update(
      { likers: story.likers },
      { where: { id: storyId } }
    );
    console.log(result);
    res
      .status(200)
      .json({ story, votes, result, success: true, message: "Success!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error, message: "Something went wrong!" });
  }
});

//add a comment (post) to a story
router.post("/:storyId/post", validateSession, async (req, res) => {
  try {
    const { user } = req;
    const { text } = req.body;
    const { storyId } = req.params;
    const post = await Post.create(
      { author: user.id, text, storyId },
      { include: { model: User, attributes: ["name", "photo", "id"] } }
    );
    // console.log(post);
    res.status(200).json({ success: true, post, message: "Success!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error, message: "Something went wrong!" });
  }
});

//like or unlike a post
router.post("/:storyId/post/:postId", validateSession, async (req, res) => {
  try {
    const { user } = req;
    const { storyId, postId } = req.params;
    const post = await Post.findOne({
      where: { id: postId, storyId },
      include: { model: User, attributes: ["name", "photo", "id"] },
    });
    post.voters.includes(user.id)
      ? post.removeUpvote(user.id)
      : post.addUpvote(user.id);

    const respons = await Post.update(
      { voters: post.voters, upvotes: post.upvotes },
      { where: { id: postId }, returning: true }
    );
    res.status(200).json({ respons, post, success: true, message: "Success!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error, message: "Something went wrong!" });
  }
});

//get story by id
router.get("/id/:storyId", validateSession, async (req, res) => {
  try {
    // const { user } = req;
    const { storyId } = req.params;
    const story = await Story.findOne({
      where: { id: storyId },
      include: [
        {
          model: Post,
          include: { model: User, attributes: ["name", "photo", "id"] },
        },
        { model: User, attributes: ["name", "photo", "id"] },
      ],
    });

    res.status(200).json({ success: true, story, message: "Success!" });
  } catch (error) {
    res.status(500).json({ error, message: "Something went wrong!" });
  }
});

//get all stories
router.get("/", async (req, res) => {
  try {
    const lt = req.query.lt ?? 1000000000;
    const stories = await Story.findAll({
      where: { id: { [Op.lt]: lt } },
      order: [["id", "DESC"]],
      limit: 3,
      include: [
        { model: User, attributes: ["name", "id", "photo"] },
        {
          model: Post,
          include: { model: User, attributes: ["name", "id", "photo"] },
        },
      ],
    });
    res.status(200).json({ stories, success: true, message: "Success!" });
  } catch (error) {
    res.status(500).json({ error, message: "Something went wrong!" });
  }
});

// delete a story
router.delete("/:storyId", validateSession, async (req, res) => {
  try {
    const { id } = req.user;
    const { storyId } = req.params;
    const result = await Promise.all([
      Post.destroy({ where: { storyId } }),
      Story.destroy({ where: { id: storyId, userId: id } }),
    ]);
    res.status(200).json({ result, success: true, message: "Success!" });
  } catch (error) {
    res.status(500).json({ error, message: "Something went wrong!" });
  }
});

//get three stories for dashboard
router.get("/dashboard", validateSession, async (req, res) => {
  try {
    const stories = await Story.findAll({
      // order: [['createdAt'], ['DESC']],
      limit: 3,
      order: [["id", "DESC"]],
      //FOLLOWING LINE INCLUDES ONLY USERS THAT ARE FOLLOWED
      // where: {userId: req.user.following},
      include: [
        { model: User, attributes: ["name", "id", "photo"] },
        {
          model: Post,
          include: { model: User, attributes: ["name", "id", "photo"] },
        },
      ],
    });
    res.status(200).json({ stories, success: true, message: "Success!" });
  } catch (error) {
    res.status(500).json({ error, message: "Something went wrong!" });
  }
});

module.exports = router;
