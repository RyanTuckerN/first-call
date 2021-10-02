const express = require("express");
const { Gig, User, CallStack } = require("../models");
const CallStackModel = require("../helpers/CallStackModel");
const { CLIENT_URL, EMAIL_PASSWORD, EMAIL_USER } = process.env;
const router = express.Router();
const nodemailer = require("nodemailer");
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
    console.log("callStack instance: ", callStack);
    const GigStack = new CallStackModel(callStack);
    console.log('GIGSTACK: ',GigStack)
    GigStack.setStackFilled(role)
    // console.log('GigStack: ',GigStack)
    GigStack.checkFilled()
    const userAuth = parseInt(userId) === req.user.id;
    // if (!userAuth) {
    if (false) { //use this for testing, in reality we want userAuth so only logged-in user can accept the gig
      res
        .status(400)
        .json({ message: "You are not authorized to join this gig!" });
    } else
      try {
        const query = await Gig.addUserToGig(userId, gigId);
        const updatedStack = await CallStack.update(GigStack, {where: {gigId}})
        res.status(200).json({ query, updatedStack: GigStack, updateCount: updatedStack });
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

    if (gig.ownerId != req.user.id) {
      res.status(403).json({ message: "Not Authorized!" });
    }
    //model method 'newStackTable' takes the request body and organizes it into a more detailed object
    //CallStackModel will take properties of following 'callStack' model instance to a class instance with methods
    //these methods will be used to control changes to the callStack
    const callStack = await CallStack.newStackTable(stackTable, gigId);
    // here I should set up logic to automatically send notificaitons/invites to each firstCall
    console.log(callStack)

    res.status(200).json({ message: "Success!", callStack });
  } catch (err) {
    res.status(500).json({ err });
  }
});

//SEND EMAIL WITH ACCEPT/REJECT LINKS
router.post("/:gigId/email", validateSession, async (req, res) => {
  const { to, subject, html } = req.body;

  const user = await User.findOne({ where: { email: to } });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });

  /************************************************************
   * THIS URL WILL DEPEND ON FRONT END CODE
   * SHOULD TAKE USER TO LOGIN/SIGNUP AND RUN A FETCH FROM INSIDE APP
   *    *FETCH SHOULD SUBSCRIBE THE USER TO THE GIG AND PERSIST TO DB
   *    *IT SHOULD ALSO FREEZE THIS 'ROLE'
   *************************************************************/
  const acceptUrl = `${CLIENT_URL}/home/offers?email=${to}`; //accept offer and include email address
  const mailOptions = {
    from: EMAIL_USER,
    to, //email address
    subject,
    html: user
      ? `<b>This is a test, yo! </b><p> PARAGRAPH </p><div><a href=${acceptUrl}>Click here to accept the offer</a></div>`
      : `<b>This is a test, yo! </b><p> PARAGRAPH </p><div><a href=${acceptUrl}>Click here to signup and accept the offer</a></div>`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      // console.error(err);
      res.status(500).json({ message: "server error", err });
    } else {
      // console.log(`Email sent: ${info}.`);
      res.status(200).json({ message: "Email sent", info });
    }
  });
});

module.exports = router;

/**
 * I NEED TO FIGURE OUT HOW TO, WHEN A USER ACCEPTS THE OFFER, ADD THEM
 * TO THE GIG AND ***FREEZE*** THE PROCESS OF NEXT CALL. IF THEY DECLINE, I
 * NEED TO TRIGGER NOTIFICATION TO THE NEXT EMAIL ADDRESS IN THE CALLSTACK.
 *
 * filled offer : boolean
 *
 *
 */
