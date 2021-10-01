const express = require("express");
const { Gig, User, CallStack } = require("../models");
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
  "/addUser/userId/:userId/gigId/:gigId",
  validateSession,
  async (req, res) => {
    const { userId, gigId } = req.params;
    const userAuth = parseInt(userId) === req.user.id;
    if (!userAuth) {
      res
        .status(400)
        .json({ message: "You are not authorized to join this gig!" });
    } else
      try {
        const query = await Gig.addUserToGig(userId, gigId);
        res.status(200).json({ query });
      } catch (err) {
        res.status(500).json({ err });
      }
  }
);

//GET SPECIFIC GIG INFORMATION
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

    const stack = await CallStack.create({ stackTable, gigId });

    res.status(200).json({ message: "Success!", stack });
  } catch (err) {
    res.status(500).json({ err });
  }
});

//SEND EMAIL WITH ACCEPT/REJECT LINKS
router.post("/email", validateSession, async (req, res) => {
  const { to, subject, html } = req.body;

  const user = await User.findOne({ where: { email: to } });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });

  const acceptUrl = `${CLIENT_URL}/home/offers?email=${to}`;
  const mailOptions = {
    from: "RyanTuckerN@gmail.com",
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
