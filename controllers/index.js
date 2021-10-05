const user = require("./usercontroller");
const gig = require("./gigcontroller")
const notification = require("./notificationcontroller")
const messageboard = require("./messageboardcontroller")

module.exports = { 
  user, 
  gig, 
  notification,
  messageboard
};
