const express = require("express");
const router = express.Router();
const { Gig, User, CallStack, Post } = require("../models");
const CallStackModel = require("../models/CallStackModel");
const newEmail = require("../helpers/newEmail");
const validateSession = require("../middleware/validateSession");
const { v4: uuidv4 } = require("uuid");
const ERR = "Something went wrong!";
const SUC = "Success!";

//CREATE A GIG
router.post("/", validateSession, async (req, res) => {
  const { description, date, payment, gigLocation, optionalInfo, photo } =
    req.body;
  const token = uuidv4();
  const owner = await User.findOne({ where: { id: req.user.id } });
  try {
    const newGig = await Gig.create({
      ownerId: req.user.id,
      description,
      date,
      payment,
      gigLocation,
      optionalInfo,
      photo,
      token,
    });
    await newGig.addUser(owner);
    res.status(200).json({ newGig, message: SUC, success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err, message: "failure" });
  }
});

//UPDATE GIG
router.put("/:gigId", validateSession, async (req, res) => {
  try {
    const { gigId } = req.params;
    const ownerId = req.user?.id;
    const gig = await Gig.findOne({
      where: { id: gigId, ownerId },
      include: { model: CallStack },
    });
    if (!gig) {
      res.status(500).json({ message: "Gig not found" });
      return;
    }
    const result = await gig.update(req.body);
    res
      .status(200)
      .json({ success: true, message: "Gig updated", gig, result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: ERR, error });
  }
});

//CREATE A CALLSTACK OBJ FOR YOUR GIG.
//CALLSTACK REQUEST SHOULD BE JSON OBJ 'stackTable' WITH A KEY REPRESENTING EACH INTSTRUMENT
//EACH KEY HAS VALUE OF ARRAY OF EMAIL ADDRESSES, IN ORDER OF CALL (1ST, 2ND, 3RD ETC)
//PREVENT USERS FROM SUBMITTING DUPLICATES TO CALLSTACKS ON THE FRONT END
router.post("/:gigId/callStack", validateSession, async (req, res) => {
  const { stackTable } = req.body;
  const { gigId } = req.params;
  try {
    const [roles, stacks] = [
      Object.keys(stackTable),
      Object.values(stackTable),
    ];

    if (
      //if no roles are defined in request
      roles.length === 0 ||
      //if the callstacks are not arrays
      !stacks.every((stack) => Array.isArray(stack))
    ) {
      throw {
        message: "improper stackTable",
        error: new Error("improper stackTable"),
      };
    }
    const gig = await Gig.findOne({ where: { id: gigId } });
    const gigOwner = await User.findOne({ where: { id: gig?.ownerId } });
    if (gig.ownerId != req.user.id) {
      res.status(403).json({ message: "Not Authorized!" });
      return;
    }

    const callStack = await CallStack.newStackTable(stackTable, gigId);
    // if (!callStack.stackTable.bandLeader) {
    //   callStack.stackTable.bandLeader = {
    //     confirmed: gigOwner.email,
    //     filled: true,
    //   };
    // }
    await Gig.addUserToGig(gig.ownerId, gig.id);

    /*** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***
     *** *** *** *** *** *** DO I NEED TO DO THIS LIKE THIS? *** *** *** *** *** ***
     *** *** *** OR WILL MY CODE AWAIT THIS BLOCK OUTSIDE OF ITS SCOPE?* *** *** ***
     *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***/
    const sendEmails = async () => {
      roles.forEach(async (role) => {
        if (role === "bandLeader") return;
        const { onCall } = callStack.stackTable[role];
        // send a new email!
        await newEmail(onCall, 100, gigId, gigOwner.email, { role });
      });
    };
    await sendEmails();
    /*** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***
     *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***
     *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***/

    const GigStack = new CallStackModel(callStack);
    await gig.update({ openCalls: GigStack.returnOpenCalls() });
    res
      .status(200)
      .json({ message: "Success!", callStack, success: true, gig });
  } catch (err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      res
        .status(400)
        .json({ message: `Callstack already exists for gig ${gigId}.` });
      return;
    }
    res.status(500).json({ err, message: ERR });
    console.error(err);
  }
});

//GET SPECIFIC GIG INFORMATION
//SHOULD PROBABLY MAKE THIS A PROTECTED ROUTE
router.get("/:gigId", validateSession, async (req, res) => {
  const { gigId } = req.params;
  const { id } = req.user;
  try {
    const user = await User.findOne({ where: { id } });

    const gig = await Gig.findOne({
      where: { id: gigId },
      include: { model: CallStack },
    });

    const GigStack = new CallStackModel(gig.callStack);
    const confirmed = gig.callStack ? GigStack.returnConfirmed() : [];
    const onCalls = gig.callStack ? GigStack.returnOpenCalls() : [];

    const query = await Gig.getGigInfo(gigId);

    if (query) {
      const authorizedUsers = [
        query.bandLeader.id,
        ...query.bandMembers.map((p) => p.id),
      ];
      if (!authorizedUsers.includes(id) && !onCalls.includes(user.email)) {
        res.status(403).json({ message: "⛔ You don't have access ⛔" });
        return;
      }
      confirmed.forEach((person) => {
        if (!query.bandMembers.map((p) => p.email).includes(person.email)) {
          query.bandMembers.push(person);
        }
      });
      if (req.user.id !== query.bandLeader.id) {
        delete query.gig.callStack;
      }
      res.status(200).json({ gigInfo: query, message: "success" });
    } else {
      res.status(404).json({ message: "Gig not found" });
    }
  } catch (err) {
    res.status(500).json({ err, message: "failure" });
  }
});

//get gig details for multiple gigs
router.post("/details", validateSession, async (req, res) => {
  try {
    const { id } = req.user;
    const gigIds = req.body;

    const promises = gigIds.map(async (gigId) => {
      const gig = await Gig.findOne({
        where: { id: gigId },
        include: { model: CallStack },
      });
      const GigStack = gig?.callStack
        ? new CallStackModel(gig.callStack)
        : null;
      const confirmed = GigStack ? GigStack?.returnConfirmed() : [];
      const query = await Gig.getGigInfo(gigId);
      console.log(query)
      if (query) {
        confirmed.forEach((person) => {
          if (!query.bandMembers.map((p) => p.email).includes(person.email)) {
            query.bandMembers.push(person);
          }
        });
        if (id !== query?.bandLeader?.id) {
          delete query?.gig?.callStack;
        }
        return [gigId, query];
      }
    });
    const arr = await Promise.all(promises);

    const hash = arr.reduce((a, b) => {
      a[b[0]] = b[1];
      return a;
    }, {});
    console.log('::: ::: hash ::: ::: ', hash)
    res.status(200).json({ hash, success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
});

//ACCEPT A GIG OFFER
router.post(
  "/:gigId/accept/:userId/:role",
  validateSession,
  async (req, res) => {
    const { userId, gigId, role } = req.params;
    try {
      const gig = await Gig.findOne({
        where: { id: gigId },
        include: [{ model: CallStack }, { model: User }, { model: Post }],
      });
      const callStack = gig.callStack;
      const gigOwner = gig.user;
      const user = await User.findOne({ where: { id: userId } });

      //converts callStack to CallStack instance, with methods included
      const GigStack = new CallStackModel(callStack);
      const userAuth = parseInt(userId) === req.user.id;
      if (!userAuth) {
        res
          .status(400)
          .json({ message: "You are not authorized to join this gig!" });
        return;
      } else if (user.email != GigStack?.stackTable[role]?.onCall) {
        res.status(403).json({
          message: "You are not on call for this gig!",
        });
        return;
      } else GigStack.setStackFilled(role, user.name);
      GigStack.checkFilled();
      GigStack.filled
        ? await newEmail(gigOwner.email, 300, gigId, user.email, { role })
        : await newEmail(gigOwner.email, 201, gigId, user.email, { role });

      await Gig.addUserToGig(userId, gigId);
      await gig.update({ openCalls: GigStack.returnOpenCalls() });
      // await user.addGig(gig)
      await CallStack.update(GigStack, { where: { gigId } });

      res.status(200).json({
        updatedStack: GigStack,
        message: "success",
        success: true,
        gig,
      });
    } catch (err) {
      res.status(500).json({ err, message: "failure" });
    }
  }
);

//DECLINE A GIG OFFER
router.post(
  "/:gigId/decline/:userId/:role",
  validateSession,
  async (req, res) => {
    const { userId, gigId, role } = req.params;

    try {
      const gig = await Gig.findOne({
        where: { id: gigId },
        include: [{ model: CallStack }, { model: User }],
      });
      const callStack = gig.callStack;
      const gigOwner = gig.user;
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

      const nextUser = await GigStack.returnNext(role);
      if (nextUser === "Empty stack!") {
        await newEmail(gigOwner.email, 301, gigId, user.email, { role });
      } else {
        await newEmail(gigOwner.email, 200, gigId, user.email, {
          role,
          nextUser,
        });
        await newEmail(nextUser, 100, gigId, gigOwner.email, { role });
      }

      await CallStack.update(GigStack, { where: { gigId } });
      await gig.update({ openCalls: GigStack.returnOpenCalls() });
      res.status(200).json({
        // updatedStack: GigStack,
        message: "success",
        success: true,
        gig,
      });
    } catch (err) {
      res.status(500).json({ err, message: "failure" });
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

      const gigOwner = await User.findOne({ where: { id: req.user.id } });

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
      if (GigStack.stackTable[role].onCall === email) {
        await newEmail(email, 100, gigId, gigOwner.email, { role });
      }

      await CallStack.update(GigStack, { where: { gigId } });
      await gig.update({ openCalls: GigStack.returnOpenCalls() });

      res.status(200).json({
        message: `success`,
        callStack: GigStack.stackTable,
        success: true,
      });
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
    try {
      const gig = await Gig.findOne({
        where: { id: gigId, ownerId: req.user.id },
        include: { model: CallStack },
      });
      const gigOwner = await User.findOne({ where: { id: req.user.id } });

      if (!gig || !gig.callStack) {
        res
          .status(403)
          .json({ message: `You must have gotten here by accident!` });
        console.log(
          `🔥🔥🔥 Gig or callstack does not exist at add new role to callStack, gigcontroller.js`
        );
        return;
      }
      const GigStack = new CallStackModel(gig.callStack);
      if (GigStack.returnRoles().includes(role)) {
        res.status(400).json({ message: `${role} already exists` });
        return;
      }

      const roleStack = GigStack.addRoleToStackTable(role, calls);

      const firstCall =
        typeof calls === "string"
          ? calls
          : Array.isArray(calls)
          ? calls[0]
          : null;

      // console.log('FIRST CALL: ⛳⛳⛳⛳⛳⛳⛳,' , firstCall)

      if (roleStack.onCall === firstCall && firstCall !== null) {
        await newEmail(roleStack.onCall, 100, gigId, gigOwner.email, { role });
      }
      GigStack.setGigNotFilled();
      await CallStack.update(GigStack, { where: { gigId } });
      await gig.update({ openCalls: GigStack.returnOpenCalls() });
      res.status(200).json({ roleStack, message: "success", success: true });
    } catch (err) {
      res.status(500).json({ err, message: "failure" });
    }
  }
);

//REMOVE ONCALL AND SEND TO NEXT IN LINE
router.post(
  "/:gigId/callstack/sendToNext/:role",
  validateSession,
  async (req, res) => {
    try {
      const { user } = req;
      const { gigId, role } = req.params;
      const gig = await Gig.findOne({
        where: { id: gigId },
        include: { model: CallStack },
      });
      
      const GigStack = gig && new CallStackModel(gig.callStack);
      const onCall = GigStack.returnNext(role);
      // if (onCall === "Empty stack!" && removing !== "Empty stack!") {
      //   await newEmail(user.email, 301, gigId, removing, { role });
      // }
      if(onCall !== "Empty stack"){
        await newEmail(onCall, 100, gigId, user.email, {role})
      }
      const updateCount = await CallStack.update(GigStack, {where: {gigId}})
      await gig.update({ openCalls: GigStack.returnOpenCalls() });
      res.status(200).json({success: true, message: 'Success!', callStack: GigStack, updateCount, gig})
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

// router.get("/test/test", async (req, res) => {
//   try {
//     const query = await User.findAndCountAll({
//       include: { all: true, nested: true },
//     });
//     // await User.findOne({
//     // where: { gigId: 1 },
//     // include: [{ model: User }, { model: CallStack }],
//     // });
//     res.status(200).json({ query, message: "success" });
//   } catch (err) {
//     res.status(500).json({ err, message: "failure" });
//   }
// });

//remove a call from a callList
router.delete(
  "/:gigId/callStack/remove/:role/:email",
  validateSession,
  async (req, res) => {
    try {
      const { role, email, gigId } = req.params;
      const { id } = req.user;
      const gig = await Gig.findOne({
        where: { id: gigId, ownerId: id },
        include: { model: CallStack },
      });
      const GigStack = new CallStackModel(gig.callStack);
      const stack = GigStack.removeCall(role, email);
      await CallStack.update(GigStack, { where: { gigId } });
      res.status(200).json({ success: true, message: "success", stack });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  }
);

//get array of users associated with gig, bandleader is always position 0
router.get("/:gigId/users", validateSession, async (req, res) => {
  const { gigId } = req.params;
  try {
    const query = await Gig.getGigInfo(gigId);
    if (query) {

      const authorizedUsers = [
        query.bandLeader.id,
        ...query.bandMembers.map((user) => user.id),
      ];
      if (!authorizedUsers.includes(req.user.id)) {
        res.status(403).json({ message: "⛔ You don't have access ⛔" });
        return;
      }
      const users = [query.bandLeader, ...query.bandMembers];
      res.status(200).json({ users, message: "success", success: "true" });
    } else {
      res.status(404).json({ message: "Gig not found", success: false });
    }
  } catch (err) {
    res.status(500).json({ err, message: "failure", success: false });
  }
});

// router.get("/email/:gigId", validateSession, async (req, res) => {
//   try {
//     const { to, emailCode, sender, options } = req.body;
//     const { gigId } = req.params;
//     await newEmail(to, emailCode, gigId, sender, options);
//     res
//       .status(200)
//       .json({ message: "I did my part! Not sure if it worked lol" });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Something went wrong", err });
//   }
// });

module.exports = router;
