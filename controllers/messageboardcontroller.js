const express = require("express");
const { Post, Gig, User } = require("../models");
const router = express.Router();
const validateSession = require("../middleware/validateSession");
const postOrganizer = require("../helpers/postOrganizer");

//ALL OF THESE NEED VALIDATION
//  -VALIDATESESSION MIDDLEWARE
//  -AUTHENTICATION BASED ON req.user.id

//new post
router.post("/:gigId/newPost/:childOf?", async (req, res) => {
  try {
    const { gigId, childOf } = req.params;
    const { text } = req.body;

    // const userId = req.user.id
    const userId = 3;

    const parentPost = childOf
      ? await Post.findOne({ where: { id: childOf } })
      : null;

    const post = {
      author: userId,
      text,
      //Only add childOf column if there is a parent post
      childOf: parentPost?.id ?? null,
      gigId: parseInt(gigId),
    };

    const newPost = await Post.create(post);

    res.status(200).json({ newPost });
  } catch (err) {
    res.status(500).json({ err });
  }
});

//upvvote a post
router.post("/:gigId/post/:postId/upvote", async (req, res) => {
  const { gigId, postId } = req.params;
  // const userId = req.user.id
  const userId = 1;

  try {
    const post = await Post.findOne({ where: { id: postId, gigId } });
    if (!post) {
      res
        .status(403)
        .json({ message: `You must have gotten here on accident!` });
      console.log(
        `🔥 Post does not exist at upvote a post, messageboardcontroller.js`
      );
      return;
    }

    const upvotes = await post.addUpvote(userId);

    //
    if (upvotes === -1) {
      res.status(400).json({ message: "You can only upvote once!" });
      return;
    }

    //update the array 'voters'
    await Post.update({ voters: post.voters }, { where: { id: postId } });

    //persist the changes
    const updatedPost = await post.save();

    res.status(200).json({ updatedPost });
  } catch (err) {
    res.status(500).json({ err });
  }
});

//remove an upvote
router.post("/:gigId/post/:postId/removeUpvote", async (req, res) => {
  const { gigId, postId } = req.params;
  // const userId = req.user.id
  const userId = 221;

  try {
    const post = await Post.findOne({ where: { id: postId, gigId } });
    if (!post) {
      res
        .status(403)
        .json({ message: `You must have gotten here on accident!` });
      console.log(
        `🔥 Post does not exist at remove upvote, messageboardcontroller.js`
      );
      return;
    }

    const upvotes = await post.removeUpvote(userId);
    //
    if (upvotes === -1) {
      res.status(400).json({ message: "You haven't voted on this yet!" });
      return;
    }

    //update the array 'voters'
    await Post.update({ voters: post.voters }, { where: { id: postId } });

    //persist the changes
    const updatedPost = await post.save();

    res.status(200).json({ updatedPost });
  } catch (err) {
    res.status(500).json({ err });
  }
});

//edit text of post
router.put("/:gigId/post/:postId/edit", async (req, res) => {
  const { gigId, postId } = req.params;
  const { text } = req.body;
  // const userId = req.user.id
  const userId = 3;

  try {
    const post = await Post.findOne({
      where: { id: postId, gigId, author: userId },
    });
    if (!post || post.details.deleted) {
      res
        .status(403)
        .json({ message: `You must have gotten here on accident!` });
      console.log(
        `🔥 Post does not exist at edit text of post, messageboardcontroller.js`
      );
      return;
    }
    if (post.text === text) {
      res.status(400).json({ message: "this text is no different" });
      return;
    }

    //update the text content and add details of update
    const update = await Post.update(
      {
        text,
        details: {
          ...post.details,
          edited: true,
          editHistory: post.details.editHistory
            ? [
                ...post.details.editHistory,
                { editedAt: new Date(), originalText: post.text },
              ]
            : [{ editedAt: new Date(), originalText: post.text }],
        },
      },
      { where: { id: postId }, returning: true }
    );

    //if update sucessful, send as response, otherwise send null
    const updatedPost = update.length === 2 ? update[1] : null;

    //persist the changes
    // const updatedPost = await post.save();

    res.status(200).json({ updatedPost });
  } catch (err) {
    res.status(500).json({ err });
  }
});

//"delete" a post
router.post("/:gigId/post/:postId/delete", async (req, res) => {
  const { gigId, postId } = req.params;
  // const userId = req.user.id
  const userId = 3;

  try {
    const post = await Post.findOne({
      where: { id: postId, gigId, author: userId },
    });
    if (!post) {
      res
        .status(403)
        .json({ message: `You must have gotten here on accident!` });
      console.log(
        `🔥 Post does not exist at "delete" post, messageboardcontroller.js`
      );
      return;
    } else if (post.details.deleted) {
      res.status(403).json({ message: `This post has already been deleted!` });
      return;
    }

    //update the text and author, add details of deletion
    const update = await Post.update(
      {
        text: "deleted",
        author: userId,
        details: {
          ...post.details,
          deleted: true,
          deletedAt: new Date(),
          originalText: post.text,
        },
      },
      { where: { id: postId }, returning: true }
    );

    //if update sucessful, send as response, otherwise send null
    const updatedPost = update.length === 2 ? update[1] : null;

    //persist the changes
    // const updatedPost = await post.save();

    res.status(200).json({ updatedPost });
  } catch (err) {
    res.status(500).json({ err });
  }
});

//get all posts by gigId
router.get("/:gigId", async (req, res) => {
  try {
    const { gigId } = req.params;
    // const { id } = req.user
    const id = 1;

    const gig = await Gig.findOne({
      where: { id: gigId },
      include: [
        {
          model: Post,
          include: { model: User, attributes: ["name", "email"] },
        },
      ],
    });
    const users = await gig.getUsers();

    //if user is not on the gig
    if (!users.map((u) => u.id).includes(id)) {
      res.status(403).json({ message: "not authorized!" });
      return;
    }
    const response = postOrganizer(gig.posts);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ err });
  }
  // res.status(200).json({ count: posts.count, posts: posts.rows });
  // res
  //   .status(200)
  //   .json({ posts: gig.posts, count: gig.posts.length, message: "success" });
});

router.get("/:gigId/test", validateSession, async (req, res) => {
  try {
    const posts = await Post.findAll({});
    res.status(200).json({ posts });
  } catch (err) {
    res.status(500).json({ err });
  }
});

module.exports = router;
