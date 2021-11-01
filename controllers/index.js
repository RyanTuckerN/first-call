const user = require("./usercontroller");
const gig = require("./gigcontroller")
const messageboard = require("./messageboardcontroller")
const open = require('./opencontroller')
const notificiation = require('./notificationcontroller')
const message = require('./messagecontroller')
const story = require('./storycontroller')

module.exports = { 
  user, 
  gig, 
  messageboard,
  open,
  notificiation,
  message,
  story
};
