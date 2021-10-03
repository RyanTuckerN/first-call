const express = require("express");
const { Gig, User, CallStack } = require("../models");
const CallStackModel = require("../helpers/CallStackModel");
const newEmail = require('../helpers/newEmail')
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

//ACCEPT A GIG OFFER
router.post(
  "/:gigId/addUser/:userId/:role",
  validateSession,
  async (req, res) => {
    const { userId, gigId, role } = req.params;
    const user = User.findOne({ where: { id: userId } });
    const callStack = await CallStack.findOne({ where: { gigId } });

    //converts callStack to CallStack instance, with methods included
    const GigStack = new CallStackModel(callStack);
    GigStack.setStackFilled(role);
    GigStack.checkFilled();

    const userAuth = parseInt(userId) === req.user.id;
    // if (!userAuth) {
    if (false) {
      //use this for testing, in reality we want userAuth so only logged-in user can accept the gig
      res
        .status(400)
        .json({ message: "You are not authorized to join this gig!" });
    }
    if (user.email != GigStack.stackTable[role].onCall) {
      res.status(403).json({
        message:
          "You are not on call for this gig! Did you wait too long to respond?",
      });
    }
    try {
      const query = await Gig.addUserToGig(userId, gigId);
      const updatedStack = await CallStack.update(GigStack, {
        where: { gigId },
      });
      res
        .status(200)
        .json({ query, updatedStack: GigStack, updateCount: updatedStack });
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
    const user = await User.findOne({ where: { id: req.user.id } });
    const callStack = await CallStack.findOne({ where: { gigId } });

    //converts callStack to CallStack instance, with methods included
    const GigStack = new CallStackModel(callStack);

    if (user.email != GigStack.stackTable[role].onCall) {
      res.status(403).json({
        message:
          "You are not on call for this gig! Did you wait too long to respond?",
      });
      return;
    }

    const nextUser = GigStack.returnNext(role);
    console.log("🔥👨‍🦲👨‍🦲🔥 next user: ", nextUser);

    const userAuth = parseInt(userId) === req.user.id;
    // if (!userAuth) {
    if (false) {
      //use this for testing, in reality we want userAuth so only logged-in user can accept the gig
      res
        .status(400)
        .json({ message: "You are not authorized to join this gig!" });
    }
    //check if user is on call
    try {
      const updatedStack = await CallStack.update(GigStack, {
        where: { gigId },
      });
      res
        .status(200)
        .json({ updatedStack: GigStack, updateCount: updatedStack });
    } catch (err) {
      res.status(500).json({ err });
    }
  }
);

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

//CREATE A CALLSTACK OBJ FOR YOUR GIG.
//CALLSTACK REQUEST SHOULD BE JSON OBJ 'stackTable' WITH A KEY REPRESENTING EACH INTSTRUMENT
//EACH KEY HAS VALUE OF ARRAY OF EMAIL ADDRESSES, IN ORDER OF CALL (1ST, 2ND, 3RD ETC)
router.post("/:gigId/callStack", validateSession, async (req, res) => {
  try {
    const { stackTable } = req.body;
    const { gigId } = req.params;
    const gig = await Gig.findOne({ where: { id: gigId } });

    // UNCOMMENT FOLLOWING FOR DEPLOYMENT
    if (gig.ownerId != req.user.id) {
      res.status(403).json({ message: "Not Authorized!" });
      return
    }

    //model method 'newStackTable' takes the request body and organizes it into a more detailed object
    //CallStackModel will take properties of following 'callStack' model instance to a class instance with methods
    //these methods will be used to control changes to the callStack
    const callStack = await CallStack.newStackTable(stackTable, gigId);


    /* here I should set up logic to automatically send notificaitons/invites to each firstCall

    SOMETHING LIKE:
     
      const GigStack = new CallStackModel(callStack)
      const roles = GigStack.returnRoles()
      roles.forEach(role=>{
        const { onCall } = GigStack.stackTable[role]
      send a new email!
      newEmail(onCall, "You are invited to a gig!", emailCode(100?))
    })

    OR MAYBE I WAIT AND KEEP EMAILS WITH NOTIFICATIONS?
    */
    
    
    console.log(callStack);

    res.status(200).json({ message: "Success!", callStack });
  } catch (err) {
    res.status(500).json({ err });
  }
});

router.get('/email/:gigId/', validateSession, async(req,res)=>{
  newEmail('ryantuckern@gmail.com', 100, req.params.gigId)
  res.status(200).json({message: 'who knows lets check'})
})

module.exports = router;