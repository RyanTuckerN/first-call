const { CLIENT_URL, EMAIL_PASSWORD, EMAIL_USER } = process.env;
const { User, Gig, CallStack, Notification } = require("../models");
const { properize, returnTime } = require("./helpers");
const nodemailer = require("nodemailer");

/**
 * @param {String} to email address
 * @param {Number} emailCode 3 digit email code: {100: gig invite, 200: gig decline, 201: gig accept, 300: gig filled!, 301: gig has empty stack, 400: custom email}
 * @param {Number} gigId id of Gig instance being referenced
 * @param {String} senderEmail email address of person initiating message
 * @param {Object?} [options]
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
      };
      console.log(error);
      throw error;
    }
    const gig = await Gig.findOne({
      where: { id: gigId },
      include: { model: CallStack },
    });

    const receiver = await User.findOne({ where: { email: to } }); //might be undefined/null

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });

    //add properties to options object
    options.receiverExists = receiver ? true : false;
    options.to = to;

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
          details: { ...details, ...options, code: emailCode },
        })
      : `${to} doesn't have an account yet.`;

    if (emailCode === 400) return notification;
    const mailOptions = {
      from: EMAIL_USER,
      to, //email address
      subject: subject,
      html: html,
    };

    //FOR TESTING PURPOSES:
    console.log(
      // "🔥🔥🌁 🌁 MOCK EMAIL 🌁 🌁🔥🔥: ",
      // mailOptions,
      "NOTIFICATION: ",
      notification.text
    );
    // return mailOptions;

    //🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡 //

    //only send invitations
    emailCode === 100 &&
      //don't send if emptystack
      to !== "Empty stack!" &&
      //only send if user exists and hasnt opted out, default to true for non-accountholders
      (receiver?.emails ?? true) &&
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("NEWEMAIL TRANSPORTER: ", err, "TO:", to);
          return { err };
        } else {
          const { messageId, envelope, accepted, rejected, pending, response } =
            info;
          console.log(
            `Email sent: ${
              (messageId, envelope, accepted, rejected, pending, response)
            }.`
          );
          return info;
        }
      });
  } catch (err) {
    console.log(err);
  }
};

/**
 *
 * @param {object} gig instance of Gig model
 * @param {object} sender instance of User model initiating message
 * @param {number} emailCode 3 digit email code
 * @param {object} [options]
 * @param {string} options.to email address of recipient
 * @param {string} options.role role the email is referencing, if applicable
 * @param {string} options.body body of the email if emailCode is 400 (custom email)
 * @param {string} options.subject subject of the email if emailCode is 400 (custom email)
 * @param {boolean} options.receiverExists for conditional email content
 * @param {string} options.senderName name if open accept
 * @returns {object} containing 'html' and 'subject', both Strings and details, an object
 */
const emailController = async (gig, senderEmail, emailCode, options) => {
  const gigDate = new Date(gig?.date ?? "");
  try {
    //will be undefined if user doesn't have an account
    const sender = await User.findOne({ where: { email: senderEmail } });

    console.log(
      "NOTIFICATION/EMAIL RECEIVER EXISTS? :",
      options.receiverExists
    );

    const details = {
      sender: sender?.name ?? options.senderName ?? senderEmail,
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
      if (!info) return "";
      const infoTopics = Object.keys(info);
      if (!infoTopics.length) return;
      let htmlOutput = "";
      infoTopics.forEach((topic) => {
        htmlOutput += `
        <li>
          <strong>${properize(topic)}:</strong>
        ${info[topic]}</li>`;
      });
      return htmlOutput;
    };

    if (emailCode === 100) {
      const anchorUrl = options?.receiverExists
        ? //either give them a link to sign in
          `https://firstcallapp.herokuapp.com/main/gig/${gig.id}#gig-anchor`
        : //or embed the info in url to be parsed on the front end and run a post fetch to accept or decline
          `https://firstcallapp.herokuapp.com/respond/?email=${Buffer.from(options.to).toString(
            "base64"
          )}&gigId=${gig.id}&role=${options.role}&token=${gig.token}`;

      console.log("ANCHOR URL: ", anchorUrl);
      /************************************************************
     //gig invite

     * THIS WILL SEND USER LINKS
     * LINKS WILL DEPEND ON FRONT END CODE
     * SHOULD TAKE USER APP RUN A FETCH FROM INSIDE APP DEPENDING ON LINK CLICKED
     *************************************************************/

      //here, I can change the URL sent based on {options.receiverExists} Boolean.
      //If so, they can go to their page and accept.
      //Otherwise, they get a link that will let them accept without account
      return {
        html: `<div style="background-color: #f9f9f9">
        <div style="
            background: #f9f9f9;
            background-color: #f9f9f9;
            margin: 0px auto;
            max-width: 600px;
          ">
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="background: #f9f9f9; background-color: #f9f9f9; width: 100%">
            <tbody>
              <tr>
                <td style="
                    border-bottom: #333957 solid 5px;
                    direction: ltr;
                    font-size: 0px;
                    padding: 20px 0;
                    text-align: center;
                    vertical-align: top;
                  "></td>
              </tr>
            </tbody>
          </table>
        </div>
      
        <div style="
            background: #fff;
            background-color: #fff;
            margin: 0px auto;
            max-width: 600px;
          ">
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="background: #fff; background-color: #fff; width: 100%">
            <tbody>
              <tr>
                <td style="
                    border: #dddddd solid 1px;
                    border-top: 0px;
                    direction: ltr;
                    font-size: 0px;
                    padding: 20px 0;
                    text-align: center;
                    vertical-align: top;
                  ">
                  <div class="mj-column-per-100 outlook-group-fix" style="
                      font-size: 13px;
                      text-align: left;
                      direction: ltr;
                      display: inline-block;
                      vertical-align: bottom;
                      width: 100%;
                    ">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align: bottom"
                      width="100%">
                      <tr>
                        <td align="center" style="
                            font-size: 0px;
                            padding: 10px 25px;
                            padding-bottom: 40px;
                            word-break: break-word;
                          ">
                          <div style="
                              font-family: 'Helvetica Neue', Arial, sans-serif;
                              font-size: 60px;
                              font-weight: 900;
                              line-height: 1;
                              color: rgb(38, 38, 38);
                              text-align: center;
                            ">
                            FirstCall
                          </div>
                        </td>
                      </tr>
      
                      <tr>
                        <td align="center" style="
                            font-size: 0px;
                            padding: 10px 25px;
                            padding-bottom: 40px;
                            word-break: break-word;
                          ">
                          <div style="
                              font-family: 'Helvetica Neue', Arial, sans-serif;
                              font-size: 28px;
                              font-weight: 800;
                              line-height: 1;
                              text-align: center;
                              color: #555;
                            ">
                            ${details.sender} has sent you a gig request!
                          </div>
                        </td>
                      </tr>
      
                      <tr>
                        <td align="center" style="
                            font-size: 0px;
                            padding: 10px 25px;
                            padding-bottom: 40px;
                            word-break: break-word;
                          ">
                          <div style="
                              font-family: 'Helvetica Neue', Arial, sans-serif;
                              font-size: 22px;
                              font-weight: bold;
                              line-height: 1;
                              text-align: center;
                              color: #555;
                            ">
                            ${gigDate.toLocaleDateString()}, ${returnTime(
          gigDate
        )}
                          </div>
                        </td>
                      </tr>
      
                      <tr>
                        <td align="center" style="
                            font-size: 0px;
                            padding: 10px 25px;
                            word-break: break-word;
                          ">
                          <div style="
                              font-family: 'Helvetica Neue', Arial, sans-serif;
                              font-size: 20px;
                              font-weight: 800;
                              line-height: 1;
                              text-align: center;
                              color: #555;
                            ">
                            ${gig.description}
                          </div>
                        </td>
                      </tr>
      
                      <tr>
                        <td align="center" style="
                            font-size: 0px;
                            padding: 10px 25px;
                            padding-bottom: 0;
                            word-break: break-word;
                          ">
                          <div style="
                              font-family: 'Helvetica Neue', Arial, sans-serif;
                              font-size: 16px;
                              line-height: 22px;
                              text-align: left;
                              color: #555;
                            ">
                            <ul style="list-style: none">
                              <li><strong>When:</strong> ${gigDate.toLocaleDateString()}, ${returnTime(
          gigDate
        )}</li>
                              <li>
                                <strong>Where:</strong> ${gig.gigLocation}
                              </li>
                              <li><strong>Pay:</strong> $${gig.payment}</li>
                              ${!!details && infoMapper()}
                            </ul>
                          </div>
                        </td>
                      </tr>
      
                      <tr>
                        <td align="center" style="
                            font-size: 0px;
                            padding: 10px 25px;
                            padding-bottom: 20px;
                            word-break: break-word;
                          ">
                          <div style="
                              font-family: 'Helvetica Neue', Arial, sans-serif;
                              font-size: 16px;
                              line-height: 22px;
                              text-align: center;
                              color: #555;
                            ">
                            Please follow the link below to respond. You don't
                            need an account to reply!
                          </div>
                        </td>
                      </tr>
      
                      <tr>
                        <td align="center" style="
                            font-size: 0px;
                            padding: 10px 25px;
                            padding-top: 30px;
                            padding-bottom: 40px;
                            word-break: break-word;
                          ">
                          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                            style="border-collapse: separate; line-height: 100%">
                            <tr>
                              <td align="center" role="presentation" style="
                                  border: none;
                                  border-radius: 3px;
                                  background: #449dbf;
                                  color: #ffffff;
                                  cursor: auto;
                                  padding: 15px 25px;
                                " valign="middle">
                                <p style="
                                    background: #449dbf;
                                    color: #ffffff;
                                    font-family: 'Helvetica Neue', Arial,
                                      sans-serif;
                                    font-size: 15px;
                                    font-weight: normal;
                                    line-height: 120%;
                                    margin: 0;
                                    text-decoration: none;
                                    text-transform: none;
                                  ">
                                  <a href="${anchorUrl}" style="color: #fafafa; text-decoration: none">Click here to
                                    respond!</a>
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
      
                      <tr>
                        <td align="center" style="
                            font-size: 0px;
                            padding: 10px 25px;
                            word-break: break-word;
                          ">
                          <div style="
                              font-family: 'Helvetica Neue', Arial, sans-serif;
                              font-size: 26px;
                              font-weight: bold;
                              line-height: 1;
                              text-align: center;
                              color: #555;
                            ">
                            Need Help? <br />
                            Think something is wrong?
                          </div>
                        </td>
                      </tr>
      
                      <tr>
                        <td align="center" style="
                            font-size: 0px;
                            padding: 10px 25px;
                            word-break: break-word;
                          ">
                          <div style="
                              font-family: 'Helvetica Neue', Arial, sans-serif;
                              font-size: 14px;
                              line-height: 22px;
                              text-align: center;
                              color: #555;
                            ">
                            Please send any feedback to
                            <a href="mailto:info@example.com" style="color: #2f67f6">info@example.com</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      
        <div style="margin: 0px auto; max-width: 600px">
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%">
            <tbody>
              <tr>
                <td style="
                    direction: ltr;
                    font-size: 0px;
                    padding: 20px 0;
                    text-align: center;
                    vertical-align: top;
                  ">
                  <div class="mj-column-per-100 outlook-group-fix" style="
                      font-size: 13px;
                      text-align: left;
                      direction: ltr;
                      display: inline-block;
                      vertical-align: bottom;
                      width: 100%;
                    ">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                      <tbody>
                        <tr>
                          <td style="vertical-align: bottom; padding: 0">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                              <tr>
                                <td align="center" style="
                                    font-size: 0px;
                                    padding: 0;
                                    word-break: break-word;
                                  ">
                                  <div style="
                                      font-family: 'Helvetica Neue', Arial,
                                        sans-serif;
                                      font-size: 12px;
                                      font-weight: 300;
                                      line-height: 1;
                                      text-align: center;
                                      color: #575757;
                                    ">
                                    FirstCall is a gig management tool that
                                    aims to be the #1 software solution for
                                    independant musicians and bandleaders. We know
                                    the stresses of freelancing, and want to help
                                    bandleaders automate the process of booking
                                    musicians for their gigs.
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>`,
        subject: `Gig request from ${details.sender}`,
        details,
      };
    }
    if (emailCode === 200) {
      //user declined gig
      return {
        html: `<p>${details.sender} cannot do the gig! </p>`,
        subject: `${
          details.sender
        } has turned down a gig offer on ${gigDate.toLocaleDateString()}. Sending invitation to ${
          options.nextUser
        }`,
        details,
      };
    }
    if (emailCode === 201) {
      //user accepted gig
      return {
        html: `<p>${details.sender} has accepted your offer! </p>`,
        subject: `Score!!! ${
          details.sender
        } can do the gig on ${gigDate.toLocaleDateString()}.`,
        details,
      };
    }
    if (emailCode === 300) {
      //gig is fully booked
      return {
        html: `<p>${details.sender} has accepted your offer, and with that, your gig is fully booked! Hooray! </p>`,
        subject: `${details.sender} has accepted your offer, and with that, your gig is fully booked! Hooray!`,
        details,
      };
    }
    if (emailCode === 301) {
      //gig has empty stack

      return {
        html: `<p><strong>Uh-oh!</strong> ${
          details.sender
        } declined your gig offer on ${gigDate.toLocaleDateString()} 
        and now your ${
          options.role
        } stack is empty! Please add more email addresses to your stack. </p>`,
        subject: `Your gig on ${gigDate.toLocaleDateString()} has an call list!`,
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
        subject: `${options.subject}`,
        details,
      };
    }
  } catch (err) {
    console.error(err);
    return err;
  }
};

module.exports = newEmail;
