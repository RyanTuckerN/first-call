const { CLIENT_URL, EMAIL_PASSWORD, EMAIL_USER } = process.env;
const { User, Gig } = require("../models");
const nodemailer = require("nodemailer");

//This could be better organized, but it basically controls what the output of the email will be.
//should set up switch statement for emailCodes, 100 will be an invitation

const emailController = (gig, sender, emailCode) => {
  const gigDate = new Date(gig.date);

  const infoMapper = (info) => {
    const infoTopics = Object.keys(info);
    if (!infoTopics.length) return;

    let htmlOutput = "";
    infoTopics.forEach((topic) => {
      htmlOutput += `<dt>${topic}:</dt><dd>${info[topic]}</dd>`;
    });
    return htmlOutput;
  };

  if (emailCode === 100) {
    return {
      html: `<h1>${sender.name ?? sender.email} is inviting you to a gig! </h1>
   <h4> ${gigDate.toLocaleDateString()}, ${gigDate.getHours()}:${gigDate.getMinutes()} </h4>
   <ul>
     <li> <b>❓ What: ${gig.description}</b></li>
     <li> <b>📌 Where: ${gig.location}</b></li>
     <li> <b>💰 How much: $${gig.payment}</b></li>
   </ul>  
   <div>  
     <dl>
     ${gig.optionalInfo ? infoMapper(gig.optionalInfo) : null}
     </dl>
   </div>
   <div>
     <a href='www.google.com'>Click here to accept the offer</a>
   </div>
   <div>
     <a href='www.bing.com'>Click here to decline the offer</a>
   </div>`,
      subject: `Gig request from ${sender.name ?? sender.email}`,
    };
  }
};
/*this function should take:
to: email address of recipient
emailCode: different emails will be categorized by codes
*/
module.exports = async (to, emailCode, gigId) => {
  try {
    const gig = await Gig.findOne({ where: { id: gigId } });
    const receier = await User.findOne({ where: { email: to } }); //might be undefined/null
    const sender = await User.findOne({ where: { id: gig.ownerId } });

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
    // const acceptUrl = `${CLIENT_URL}/home/offers/${gig.id}?email=${to}`; //accept offer and include email address
    const content = emailController(gig, sender, emailCode);
    const mailOptions = {
      from: EMAIL_USER,
      to, //email address
      subject: content.subject,
      html: content.html,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Email sent: ${info}.`);
      }
    });
  } catch (err) {
    console.log(err);
  }
};

