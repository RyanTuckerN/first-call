const user = require("./usercontroller");
const gig = require("./gigcontroller")
const messageboard = require("./messageboardcontroller")
const open = require('./opencontroller')

module.exports = { 
  user, 
  gig, 
  messageboard,
  open
};
