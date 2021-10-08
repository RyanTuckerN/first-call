const { CLIENT_URL, EMAIL_PASSWORD, EMAIL_USER } = process.env;
const { User, Gig, CallStack, Notification } = require("../models");
const { properize, returnTime, addHours } = require("../helpers/helpers");
const nodemailer = require("nodemailer");

/**
 * @param {String} to email address
 * @param {Number} emailCode 3 digit email code: {100: gig invite, 200: gig decline, 201: gig accept, 300: gig filled!, 301: gig has empty stack400: custom email}
 * @param {Number} gigId id of Gig instance being referenced
 * @param {String} senderEmail email address of person initiating message
 * @param {Object} [options]  
 * @param {String} options.role role the email is referencing, if applicable
 * @param {String} options.body body of the email if emailCode is 400 (custom email)
 * @param {String} options.subject subject of the email if emailCode is 400 (custom email)
 * @returns {Promise} messageId from nodemailer
 */
const newEmail = async (to, emailCode, gigId, senderEmail, options) => {
  try {
    if (!to || !emailCode || !gigId || !senderEmail) {
      const error = new Error(
        "LOCATION: newEmail.js *** incorrect email arguments ***"
      );
      error.details = {
        to,
        emailCode,
        gigId,
        senderEmail,
        options,
      }
      console.log(error)
      throw error;
    }
    const gig = await Gig.findOne({
      where: { id: gigId },
      include: { model: CallStack },
    });

    const receiver = await User.findOne({ where: { email: to } }); //might be undefined/null
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

    options.to = to
    
    const { subject, html, details } = await emailController(
      gig,
      senderEmail,
      emailCode,
      options
    );

    //create a notification if the email address has an account associated with it
    const notification = receiver?.id
      ? await Notification.create({
          text: subject,
          userId: receiver.id,
          details: { ...details, ...options },
        })
      : `${to} doesn't have an account yet.`;

    const mailOptions = {
      from: EMAIL_USER,
      to, //email address
      subject: subject,
      html: html,
    };

    //FOR TESTING PURPOSES:
    console.log(
      "🔥🔥🌁 🌁 MOCK EMAIL 🌁 🌁🔥🔥: ",
      mailOptions,
      "NOTIFICATION: ",
      notification
    );
    return mailOptions;

    //UNCOMMENT THE FOLLOWING TO ACTUALLY SEND EMAILS!!!
    // transporter.sendMail(mailOptions, (err, info) => {
    //   if (err) {
    //     console.error(err);
    //     return {err}
    //   } else {
    //     console.log(`Email sent: ${info}.`);
    //     return { info }

    //   }
    // });
  } catch (err) {
    console.log(err);
  }
};

/**
 *
 * @param {Object} gig instance of Gig model
 * @param {Object} sender instance of User model initiating message
 * @param {Number} emailCode 3 digit email code
 * @param {Object} [options]
 * @param {String} options.to email address of recipient
 * @param {String} options.role role the email is referencing, if applicable
 * @param {String} options.body body of the email if emailCode is 400 (custom email)
 * @param {String} options.subject subject of the email if emailCode is 400 (custom email)
 * @returns {Object} containing 'html' and 'subject', both Strings and details, an object
 */
const emailController = async (gig, senderEmail, emailCode, options) => {
  const gigDate = new Date(gig.date);
  try {
    //will be undefined if user doesn't have an account
    const sender = await User.findOne({ where: { email: senderEmail } });
    // console.log('sender in newEmail.js', sender?.dataValues)
    // console.log("📦 📦 📦 gig object in emailController: ", gig.callStack);

    const details = {
      sender: sender?.name ?? senderEmail,
      dateTime: gigDate,
      gigId: gig?.id,
    };

    /**
     * loops over optionalInfo and returns each optional topic as html
     * @param {Object} info optionalInfo JSON object on gig, provides extra columns (topics) of details
     * @returns {String}
     */
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
        html: `<h4>${details.sender} is inviting you to a gig! </h4>
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
     <a href='www.fistcallclient.com/acceptGig/?email=${options.to}&gigId=${gig.id}&role=${options.role}'>Click here to accept the offer</a>
   </div>
   <div>
     <a href='www.fistcallclient.com/declineGig/?email=${options.to}&gigId=${gig.id}&role=${options.role}'>Click here to decline the offer</a>
   </div>`,
        subject: `Gig request from ${details.sender}`,
        details,
      };
    }
    if (emailCode === 200) {
      //user declined gig
      return {
        html: `<p>${details.sender} cannot do the gig! </p>`,
        subject: `${details.sender} has turned down a gig offer on ${gigDate.toLocaleDateString()}.`,
        details,
      };
    }
    if (emailCode === 201) {
      //user accepted gig
      return {
        html: `<p>${details.sender} has accepted your offer! </p>`,
        subject: `Score!!! ${details.sender} can do the gig on ${gigDate.toLocaleDateString()}.`,
        details,
      };
    }
    if (emailCode === 300) {
      //gig is fully booked
      return {
        html: `<p>${details.sender} has accepted your offer, and with that, your gig is fully booked! Hooray! </p>`,
        subject: `Score!!! the gig on ${gigDate.toLocaleDateString()} has been filled!`,
        details,
      };
    }
    if (emailCode === 301) {
      //gig has empty stack

      return {
        html: `<p><strong>Uh-oh!</strong> ${details.sender} declined your gig offer on ${gigDate.toLocaleDateString()} 
        and now your ${options.role} stack is empty! Please add more email addresses to your stack. </p>`,
        subject: `firstCall: Your gig on ${gigDate.toLocaleDateString()} has an empty stack!`,
        details,
      };
    }
    if (emailCode === 400) {
      //custom email!
      if (!options.body || !options.subject) {
        console.error("missing arguments for email code 400, aborting");
        return;
      }
      return {
        html: `<p>${options.body}</p>`,
        subject: `firstCall: ${options.subject}`,
        details,
      };
    }
  } catch (err) {
    console.error(err);
    return err;
  }
};

module.exports = newEmail;
