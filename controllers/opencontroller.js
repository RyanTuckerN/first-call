const express = require("express");
const router = express.Router();
const { Gig, User, CallStack } = require("../models");
const CallStackModel = require("../models/CallStackModel");
const newEmail = require("../helpers/newEmail");
// use bcrypt to hash email address?? too much??
const bcrypt = require("bcryptjs");

//ACCEPT A GIG OFFER
router.post("/:gigId/addUser/:email/:role", async (req, res) => {
  const { email, gigId, role } = req.params;

  try {
    const gig = await Gig.findOne({
      where: { id: gigId },
      include: [{ model: CallStack }, { model: User }],
    });
    const callStack = gig.callStack;
    const gigOwner = gig.user;
    if (!callStack || !gig || !gigOwner)
      throw new Error("something is wrong with the query");

    const GigStack = new CallStackModel(callStack);

    const onCall = GigStack?.stackTable[role]?.onCall;
    console.log(onCall)
    // console.log(onCall);
    bcrypt.compare(onCall, email.replace(/slash/g, "/"), async (err, success) => {
      // console.log(err, success);
      if (err) {
        res.status(500).json({
          err,
        });
      } else if (success) {
        GigStack.setStackFilled(role);
        GigStack.checkFilled()
          ? await newEmail(gigOwner.email, 300, gigId, onCall, { role })
          : await newEmail(gigOwner.email, 201, gigId, onCall, { role });

        // await Gig.addUserToGig(userId, gigId);
        await CallStack.update(GigStack, { where: { gigId } });
        await gig.update({ openCalls: GigStack.returnOpenCalls() });
        res.status(200).json({ updatedStack: GigStack });
      } else {
        res.status(500).json({
          message:
            "Something went wrong! You sure you're on call for this gig?",
        });
      }
    });
  } catch (err) {
    res.status(500).json({ err });
  }
});

//DECLINE A GIG OFFER
router.post("/:gigId/decline/:email/:role", async (req, res) => {
  const { email, gigId, role } = req.params;

  try {
    const gig = await Gig.findOne({
      where: { id: gigId },
      include: [{ model: CallStack }, { model: User }],
    });
    const callStack = gig.callStack;
    const gigOwner = gig.user;
    if (!callStack || !gig || !gigOwner)
      throw new Error("something is wrong with the query");

    const GigStack = new CallStackModel(callStack);
    const onCall = GigStack?.stackTable[role]?.onCall;

    bcrypt.compare(onCall, email.replace(/slash/g, "/"), async (err, success) => {
      console.log(err, success);
      if (err) {
        console.log(err)
        res.status(500).json({
          err,
        });
      } else if (success) {
        console.log(success)
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
        await gig.update({ openCalls: GigStack.returnOpenCalls() });
        res.status(200).json({ updatedStack: GigStack });
      } else {
        res.status(500).json({
          message:
            "Something went wrong! You sure you're on call for this gig?",
        });
      }
    });
  } catch (err) {
    res.status(500).json({ err });
  }
});

module.exports = router;
