const express = require("express");
const { Post, Gig, User } = require("../models");
const router = express.Router();
const validateSession = require("../middleware/validateSession");

//ALL OF THESE NEED VALIDATION
//  -VALIDATESESSION MIDDLEWARE
//  -AUTHENTICATION BASED ON req.user.id

//new post
router.post("/:gigId/newPost/:childOf?", validateSession, async (req, res) => {
  try {
    const { gigId, childOf } = req.params;
    const { text } = req.body;

    const userId = req.user.id;
    // const userId = 3;

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

    const newPost = await Post.create(post, { include: { model: User } });
    const user = await newPost.getUser();

    res.status(200).json({ post: newPost, user });
  } catch (err) {
    res.status(500).json({ err });
  }
});

//upvvote a post
router.post(
  "/:gigId/post/:postId/upvote",
  validateSession,
  async (req, res) => {
    const { gigId, postId } = req.params;
    const userId = req.user.id;
    // const userId = 1;
    try {
      const post = await Post.findOne({
        where: { id: postId, gigId },
        include: { model: User },
      });


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

      res.status(200).json({ post: updatedPost, success: true, add: "upvote" });
    } catch (err) {
      res.status(500).json({ err });
    }
  }
);

//remove an upvote
router.post(
  "/:gigId/post/:postId/removeUpvote",
  validateSession,
  async (req, res) => {
    const { gigId, postId } = req.params;
    const userId = req.user.id;
    // const userId = req.;

    try {
      const post = await Post.findOne({
        where: { id: postId, gigId },
        include: { model: User },
      });
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

      if (upvotes === -1) {
        res.status(400).json({ message: "You haven't voted on this yet!" });
        return;
      }

      //update the array 'voters'
      await Post.update({ voters: post.voters }, { where: { id: postId } });

      //persist the changes
      const updatedPost = await post.save();

      res
        .status(200)
        .json({ success: true, post: updatedPost, remove: "upvote" });
    } catch (err) {
      res.status(500).json({ err });
    }
  }
);

//edit text of post
router.put("/:gigId/post/:postId/edit", validateSession, async (req, res) => {
  const { gigId, postId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;
  // const userId = 3;

  try {
    const post = await Post.findOne({
      where: { id: postId, gigId, author: userId }, include: {model: User}
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
      { where: { id: postId }, returning: true, include: {model: User} }
    );

    //if update sucessful, send as response, otherwise send null
    const updatedPost = update.length === 2 ? update[1] : null;

    //persist the changes
    // const updatedPost = await post.save();

    res.status(200).json({ post :updatedPost[0], success: true });
  } catch (err) {
    res.status(500).json({ err });
  }
});

//"delete" a post
router.post(
  "/:gigId/post/:postId/delete",
  validateSession,
  async (req, res) => {
    const { gigId, postId } = req.params;
    const userId = req.user.id;
    // const userId = 3;

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
        res
          .status(403)
          .json({ message: `This post has already been deleted!` });
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
  }
);

//get all posts by gigId
router.get("/:gigId", validateSession, async (req, res) => {
  try {
    const { gigId } = req.params;

    const gig = await Gig.findOne({
      where: { id: gigId },
      include: [
        {
          model: Post,
          include: { model: User, attributes: ["name", "email"] },
        },
      ],
    });

    res.status(200).json({ posts: gig.posts, success: true });
  } catch (err) {
    res.status(500).json({ err });
  }
});

module.exports = router;
