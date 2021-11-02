const express = require("express");
const router = express.Router();
const { Gig, User, CallStack } = require("../models");
const CallStackModel = require("../models/CallStackModel");
const newEmail = require("../helpers/newEmail");

//ACCEPT A GIG OFFER
router.post("/:gigId/accept/:email/:role/:token", async (req, res) => {
  try {
    const { email, gigId, role, token } = req.params;
    const { name } = req.body;

    const gig = await Gig.findOne({
      where: { id: gigId, token },
      include: [{ model: CallStack }, { model: User }],
    });
    const callStack = gig.callStack;
    const gigOwner = gig.user;
    if (!callStack || !gig || !gigOwner || !token || !name)
      throw "something is wrong with the query";

    const GigStack = new CallStackModel(callStack);

    const onCall = GigStack?.stackTable[role]?.onCall;
    if (!onCall)
      throw "Something went wrong! Are you sure you're on call for this gig!";

    // console.log(Buffer.from(email, "base64").toString("utf8"));
    const [err, success] = [
      Buffer.from(email, "base64").toString("utf8") !== onCall,
      Buffer.from(email, "base64").toString("utf8") === onCall,
    ];
    if (err) {
      res.status(500).json({
        message:
          "Something went wrong! Are you sure you're on call for this gig!",
        err,
      });
    } else if (success) {
      GigStack.setStackFilled(role, name);
      GigStack.checkFilled()
        ? await newEmail(gigOwner.email, 300, gigId, onCall, { role })
        : await newEmail(gigOwner.email, 201, gigId, onCall, { role });

      await CallStack.update(GigStack, { where: { gigId } });
      await gig.update({ openCalls: GigStack.returnOpenCalls() });
      res.status(200).json({ message: "success!", success: true, confirmed: {name, email: onCall} });
    } else {
      res.status(500).json({
        message: "Something went wrong! You sure you're on call for this gig?",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ err, message: err });
  }
});

//DECLINE A GIG OFFER
router.post("/:gigId/decline/:email/:role/:token", async (req, res) => {
  try {
    const { email, gigId, role, token } = req.params;

    const gig = await Gig.findOne({
      where: { id: gigId },
      include: [{ model: CallStack }, { model: User }],
    });
    const callStack = gig.callStack;
    const gigOwner = gig.user;
    if (!callStack || !gig || !gigOwner)
      throw "Something is wrong with the query";

    const GigStack = new CallStackModel(callStack);
    const onCall = GigStack?.stackTable[role]?.onCall;
    if (!onCall)
      throw "Something went wrong! Are you sure you're on call for this gig!";


    const [err, success] = [
      Buffer.from(email, "base64").toString("utf8") !== onCall,
      Buffer.from(email, "base64").toString("utf8") === onCall,
    ];
    if (err) {
      console.log(err);
      res.status(500).json({
        err,
        message:
          "Something went wrong! Are you sure you're on call for this gig!",
      });
    } else if (success) {
      // console.log(success);
      const nextUser = GigStack.returnNext(role);
      if (nextUser === "Empty stack!") {
        await newEmail(gigOwner.email, 301, gigId, onCall, { role });
      } else {
        await newEmail(gigOwner.email, 200, gigId, onCall, {
          role,
          nextUser,
        });
        await newEmail(nextUser, 100, gigId, gigOwner.email, { role });
      }
      await CallStack.update(GigStack, { where: { gigId } });
      await gig.update({ openCalls: GigStack.returnOpenCalls() });
      res.status(200).json({ message: "success!", success: true });
    } else {
      res.status(500).json({
        message: "Something went wrong! You sure you're on call for this gig?",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      err,
      message: "Something went wrong! You sure you're on call for this gig?",
    });
  }
});

//get gig info
router.get("/:gigId/:token", async (req, res) => {
  try {
    const { gigId, token } = req.params;
    const gig = await Gig.findOne({
      where: { id: gigId, token },
      include: { model: CallStack },
    });

    const GigStack = new CallStackModel(gig.callStack);
    const confirmed = gig.callStack ? GigStack.returnConfirmed() : [];
    const onCalls = gig.callStack ? GigStack.returnOpenCalls() : [];

    const details = await Gig.getGigInfo(gigId);

    confirmed.forEach((person) => {
      if (!details.bandMembers.map((p) => p.email).includes(person.email)) {
        details.bandMembers.push(person);
      }
    });
    delete details.gig.callStack;

    res.status(200).json({ success: true, message: "Success!", gig, details });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err, message: "Something went wrong!" });
  }
});

module.exports = router;
