const express = require("express");
const { Gig, User, CallStack } = require("../models");
const CallStackModel = require("../helpers/CallStackModel");
const newEmail = require("../helpers/newEmail");
const router = express.Router();
const validateSession = require("../middleware/validateSession");

//CREATE A GIG
router.post("/", validateSession, async (req, res) => {
  const { description, date, payment, location, optionalInfo } = req.body;
  try {
    const newGig = await Gig.create({
      ownerId: req.user.id,
      description,
      date,
      payment,
      location,
      optionalInfo,
    });
    res.status(200).json({ newGig });
  } catch (err) {
    res.status(500).json({ err });
  }
});

//CREATE A CALLSTACK OBJ FOR YOUR GIG.
//CALLSTACK REQUEST SHOULD BE JSON OBJ 'stackTable' WITH A KEY REPRESENTING EACH INTSTRUMENT
//EACH KEY HAS VALUE OF ARRAY OF EMAIL ADDRESSES, IN ORDER OF CALL (1ST, 2ND, 3RD ETC)
router.post("/:gigId/callStack", validateSession, async (req, res) => {
  try {
    const { stackTable } = req.body;
    const { gigId } = req.params;
    const gig = await Gig.findOne({ where: { id: gigId } });
    const gigOwner = await User.findOne({ where: { id: gig.ownerId } });
    // UNCOMMENT FOLLOWING FOR DEPLOYMENT
    if (gig.ownerId != req.user.id) {
      res.status(403).json({ message: "Not Authorized!" });
      return;
    }

    //model method 'newStackTable' takes the request body and organizes it into a more detailed object
    //CallStackModel will set the properties of that 'callStack' model instance to a class instance with methods
    //these methods will be used to control changes to the callStack
    const callStack = await CallStack.newStackTable(stackTable, gigId);
    const GigStack = new CallStackModel(callStack);
    const roles = GigStack.returnRoles();
    roles.forEach(async (role) => {
      const { onCall } = GigStack.stackTable[role];
      // send a new email!
      await newEmail(onCall, 100, gigId, gigOwner.email);
    });

    console.log(callStack);
    // ["drums1@gmail.com"],
      res.status(200).json({ message: "Success!", callStack });
  } catch (err) {
    res.status(500).json({ err });
  }
});

//GET SPECIFIC GIG INFORMATION
//SHOULD PROBABLY MAKE THIS A PROTECTED ROUTE
router.get("/:gigId", validateSession, async (req, res) => {
  const { gigId } = req.params;
  try {
    const query = await Gig.getGigInfo(gigId);
    if (query) {
      res.status(200).json(query);
    } else {
      res.status(404).json({ message: "Gig not found" });
    }
  } catch (err) {
    res.status(500).json({ err });
  }
});

//ACCEPT A GIG OFFER
router.post(
  "/:gigId/addUser/:userId/:role",
  validateSession,
  async (req, res) => {
    const { userId, gigId, role } = req.params;

    const gig = await Gig.findOne({ where: { id: gigId } });
    const gigOwner = await User.findOne({ where: { id: gig.ownerId } });
    const user = await User.findOne({ where: { id: userId } });
    const callStack = await CallStack.findOne({ where: { gigId } });

    //converts callStack to CallStack instance, with methods included
    const GigStack = new CallStackModel(callStack);
    const userAuth = parseInt(userId) === req.user.id;
    // if (!userAuth) {
    if (false) {
      //use this for testing, in reality we want userAuth so only logged-in user can accept the gig
      res
        .status(400)
        .json({ message: "You are not authorized to join this gig!" });
      return;
    } else if (user.email != GigStack?.stackTable[role]?.onCall) {
      res.status(403).json({
        message: "You are not on call for this gig!",
      });
    } else
      try {
        GigStack.setStackFilled(role);
        GigStack.checkFilled();
        if (GigStack.filled) {
          await newEmail(gigOwner.email, 300, gigId, user.email);
        } else await newEmail(gigOwner.email, 201, gigId, user.email);

        await Gig.addUserToGig(userId, gigId);
        await CallStack.update(GigStack, {
          where: { gigId },
        });
        res.status(200).json({ updatedStack: GigStack });
      } catch (err) {
        res.status(500).json({ err });
      }
  }
);

//DECLINE A GIG OFFER
router.post(
  "/:gigId/decline/:userId/:role",
  validateSession,
  async (req, res) => {
    const { userId, gigId, role } = req.params;

    const gig = await Gig.findOne({ where: { id: gigId } });
    const callStack = await CallStack.findOne({ where: { gigId } });
    const gigOwner = await User.findOne({ where: { id: gig.ownerId } });
    const user = await User.findOne({ where: { id: req.user.id } });

    //converts callStack to CallStack instance, with methods included
    const GigStack = new CallStackModel(callStack);

    if (user.email !== GigStack.stackTable[role].onCall) {
      res.status(403).json({
        message:
          "You are not on call for this gig! Did you wait too long to respond?",
      });
      return;
    }

    const nextUser = GigStack.returnNext(role);
    if (nextUser === "Empty stack!") {
      await newEmail(gigOwner.email, 301, gigId, user.email, { role });
    } else {
      await newEmail(gigOwner.email, 200, gigId, user.email);
      await newEmail(nextUser, 100, gigId, gigOwner.email);
    }

    const userAuth = parseInt(userId) === req.user.id;
    // if (!userAuth) {
    if (false) {
      //use this for testing, in reality we want userAuth so only logged-in user can accept the gig
      res
        .status(400)
        .json({ message: "You are not authorized to join this gig!" });
      return;
    }
    //check if user is on call
    try {
      await CallStack.update(GigStack, { where: { gigId } });
      res.status(200).json({ updatedStack: GigStack });
    } catch (err) {
      res.status(500).json({ err });
    }
  }
);

//PUSH USER TO EXISTING CALLSTACK
router.post(
  "/:gigId/callStack/addUser/:role/:email",
  validateSession,
  async (req, res) => {
    try {
      const { gigId, role, email } = req.params;
      const gig = await Gig.findOne({
        where: { id: gigId, ownerId: req.user.id },
        include: { model: CallStack },
      });

      if (!gig || !gig.callStack) {
        res
          .status(403)
          .json({ message: `You must have gotten here on accident!` });
        console.log(
          `🔥🔥🔥 Gig does not exist at push new user to callStack, gigcontroller.js`
        );
        return;
      }
      const GigStack = new CallStackModel(gig.callStack);

      //if the role doesn't exist on this callStack
      if (!GigStack.returnRoles().includes(role)) {
        res.status(400).json({
          message: `The role ${role} doesn't exist on this callstack, but you can add it!`,
        });
        return;
      }

      GigStack.addCallToStack(role, email);

      await CallStack.update(GigStack, { where: { gigId } });

      res
        .status(200)
        .json({ message: `getting there!`, updatedCallStack: GigStack });
    } catch (err) {
      res.status(500).json({ message: `Something has gone wrong!` });
    }
  }
);

//ADD NEW ROLE TO STACKTABLE
router.post(
  "/:gigId/callstack/addRole/:role",
  validateSession,
  async (req, res) => {
    const { gigId, role } = req.params;
    const { calls } = req.body;
    const gig = await Gig.findOne({
      where: { id: gigId, ownerId: req.user.id },
      include: { model: CallStack },
    });

    if (!gig || !gig.callStack) {
      res
        .status(403)
        .json({ message: `You must have gotten here on accident!` });
      console.log(
        `🔥🔥🔥 Gig does not exist at add new role to callStack, gigcontroller.js`
      );
      return;
    }
    const GigStack = new CallStackModel(gig.callStack);

    GigStack.addRoleToStackTable(role, calls);
    console.log(GigStack);
    res.status(200).json({ GigStack });
  }
);

router.get("/email/:gigId", validateSession, async (req, res) => {
  try {
    const { to, emailCode, sender, options } = req.body;
    const { gigId } = req.params;
    await newEmail(to, emailCode, gigId, sender, options);
    res.status(200).json({ message: 'I did my part! Not sure if it worked lol' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong', err });
  }
});

module.exports = router;
