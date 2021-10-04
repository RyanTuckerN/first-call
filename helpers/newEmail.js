const { CLIENT_URL, EMAIL_PASSWORD, EMAIL_USER } = process.env;
const { User, Gig, CallStack } = require("../models");
const { properize, returnTime, addHours } = require("../helpers/helpers");
const nodemailer = require("nodemailer");

/**
 *
 * @param {Object} gig instance of Gig model
 * @param {Object} sender instance of User model initiating message
 * @param {Number} emailCode 3 digit email code: {100: gig invite, 200: gig decline, 201: gig accept, 300: gig filled!}
 * @param {String} role *OPTIONAL* role the email is in reference to, if applicable
 * @returns {Object} containing 'html' and 'subject', both Strings
 */
const emailController = async (gig, senderEmail, emailCode, role) => {
  const gigDate = new Date(gig.date);

  //will be undefined if user doesn't have an account
  const sender = await User.findOne({ where: { email: senderEmail } });
  console.log('sender in newEmail.js', sender)
  // console.log("📦 📦 📦 gig object in emailController: ", gig.callStack);

  const infoMapper = (info) => {
    //include optionalInfo about gig in the body of the email
    const infoTopics = Object.keys(info);
    if (!infoTopics.length) return;
    let htmlOutput = "";
    infoTopics.forEach((topic) => {
      htmlOutput += `<dt><strong>${properize(topic)}:</strong></dt><dd>${
        info[topic]
      }</dd>`;
    });
    return htmlOutput;
  };

  if (emailCode === 100) {
    /************************************************************
     //gig invite

     * THIS WILL SEND USER LINKS
     * LINKS WILL DEPEND ON FRONT END CODE
     * SHOULD TAKE USER APP RUN A FETCH FROM INSIDE APP DEPENDING ON LINK CLICKED
     *************************************************************/
    return {
      html: `<h4>${sender?.name ?? senderEmail} is inviting you to a gig! </h4>
   <h6> ${gigDate.toLocaleDateString()}, ${returnTime(gigDate)} </h6>
   
   <div>  
     <dl>
       <dt><strong>What:</strong></dt><dd>${gig.description}</dd>
       <dt><strong>Where:</strong></dt><dd>${gig.location}</dd
       <dt><strong>How much:</strong></dt><dd>$${gig.payment}</dd
       ${gig.optionalInfo ? infoMapper(gig.optionalInfo) : null}
     </dl>
   </div>
   <div>
     <a href='www.google.com'>Click here to accept the offer</a>
   </div>
   <div>
     <a href='www.bing.com'>Click here to decline the offer</a>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjMzMzAxOTg2LCJleHAiOjE2MzMzODgzODZ9.F1ABJsKJbNCIBNqqn-0hdcozy6Qb8yaPvCL2ObWa8q8
   </div>`,
      subject: `Gig request from ${sender?.name ?? senderEmail}`,
    };
  }
  if (emailCode === 200) {
    //user declined gig
    return {
      html: `<p>${sender?.name ?? senderEmail} cannot do the gig! </p>`,
      subject: `${
        sender?.name ?? senderEmail
      } has turned down a gig offer on ${gigDate.toLocaleDateString()}.`,
    };
  }
  if (emailCode === 201) {
    //user accepted gig
    return {
      html: `<p>${sender?.name ?? senderEmail} has accepted your offer! </p>`,
      subject: `Score!!! ${
        sender?.name ?? senderEmail
      } can do the gig on ${gigDate.toLocaleDateString()}.`,
    };
  }
  if (emailCode === 300) {
    //gig is fully booked
    return {
      html: `<p>${
        sender?.name ?? senderEmail
      } has accepted your offer, and with that, your gig is fully booked! Hooray! </p>`,
      subject: `Score!!! the gig on ${gigDate.toLocaleDateString()} has been filled!`,
    };
  }
  if (emailCode === 301) {
    //gig has empty stack

    return {
      html: `<p><strong>Uh-oh!</strong> ${sender?.name ?? senderEmail} declined your gig offer on ${gigDate.toLocaleDateString()} and now you ${role} stack is empty! Please add more email addresses to your stack. </p>`,
      subject: `firstCall: Your gig on ${gigDate.toLocaleDateString()} has an empty stack!`,
    };
  }
};

/**
 * @param {String} to email address
 * @param {Number} emailCode 3 digit email code: {100: gig invite, 
 * 200: gig decline, 
 * 201: gig accept, 
 * 300: gig filled!, 
 * 301: gig has empty stack}
 * @param {Number} gigId id of Gig instance being referenced
 * @param {String} senderEmail email address of person initiating message
 * @param {String} role *OPTIONAL* role the email is in reference to, if applicable
 */
const newEmail = async (to, emailCode, gigId, senderEmail, role) => {
  if (!to || !emailCode || !gigId || !senderEmail) {
    console.error("LOCATION: newEmail.js *** missing email arguments: ", to, emailCode, gigId, senderEmail);
    return;
  }
  try {
    const gig = await Gig.findOne({
      where: { id: gigId },
      include: { model: CallStack },
    });

    // const receiver = await User.findOne({ where: { email: to } }); //might be undefined/null
    // const sender = await User.findOne({ where: { id: senderId } });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
      // logger: true,
      // debug: true
    });

    const { subject, html } = await emailController(
      gig,
      senderEmail,
      emailCode,
      role
    );

    const mailOptions = {
      from: EMAIL_USER,
      to, //email address
      subject: subject,
      html: html,
    };

    //FOR TESTING PURPOSES:
    console.log("🔥🔥🌁 🌁 MOCK EMAIL 🌁 🌁🔥🔥: ", mailOptions);

    //UNCOMMENT THE FOLLOWING TO ACTUALLY SEND EMAILS!!!
    // transporter.sendMail(mailOptions, (err, info) => {
    //   if (err) {
    //     console.error(err);
    //   } else {
    //     console.log(`Email sent: ${info}.`);
    //   }
    // });
  } catch (err) {
    console.log(err);
  }
};

module.exports = newEmail;
