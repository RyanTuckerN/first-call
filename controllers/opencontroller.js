const express = require("express");
const router = express.Router();
const { Gig, User, CallStack } = require("../models");
const CallStackModel = require("../helpers/CallStackModel");
const newEmail = require("../helpers/newEmail");
// use bcrypt to hash email address?? too much?? 
// const bcrypt = require('bcryptjs')

//ACCEPT A GIG OFFER
router.post("/:gigId/addUser/:email/:role", async (req, res) => {
  const { email, gigId, role } = req.params;

  console.log(req.params)
  try {
    const gig = await Gig.findOne({ where: { id: gigId } });
    const callStack = await CallStack.findOne({ where: { gigId } });
    const gigOwner = await User.findOne({ where: { id: gig.ownerId } });
    const GigStack = new CallStackModel(callStack);

    if (email !== GigStack?.stackTable[role]?.onCall) {
      res.status(403).json({
        message:
          "You are not on call for this gig! Did you wait too long to respond?",
      });
      return;
    } else GigStack.setStackFilled(role);
    GigStack.checkFilled();
    GigStack.filled
      ? await newEmail(gigOwner.email, 300, gigId, email, { role })
      : await newEmail(gigOwner.email, 201, gigId, email, { role });

    // await Gig.addUserToGig(userId, gigId);
    await CallStack.update(GigStack, { where: { gigId } });
    res.status(200).json({ updatedStack: GigStack });
  } catch (err) {
    res.status(500).json({ err });
  }
});

//DECLINE A GIG OFFER
router.post("/:gigId/decline/:email/:role", async (req, res) => {
  const { email, gigId, role } = req.params;

  try {
    const gig = await Gig.findOne({ where: { id: gigId } });
    const callStack = await CallStack.findOne({ where: { gigId } });
    const gigOwner = await User.findOne({ where: { id: gig.ownerId } });

    const GigStack = new CallStackModel(callStack);

    if (email !== GigStack.stackTable[role].onCall) {
      res.status(403).json({
        message:
          "You are not on call for this gig! Did you wait too long to respond?",
      });
      return;
    }

    const nextUser = GigStack.returnNext(role);
    if (nextUser === "Empty stack!") {
      await newEmail(gigOwner.email, 301, gigId, email, { role });
    } else {
      await newEmail(gigOwner.email, 200, gigId, email, {
        role,
        nextUser,
      });
      await newEmail(nextUser, 100, gigId, gigOwner.email, { role });
    }

    await CallStack.update(GigStack, { where: { gigId } });
    res.status(200).json({ updatedStack: GigStack });
  } catch (err) {
    res.status(500).json({ err });
  }
});

module.exports = router;
