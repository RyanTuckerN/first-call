const User = require('./user')
const Gig = require('./gig')
const Notification = require('./notification')
const CallStack = require('./callStack')

Gig.hasOne(CallStack)
CallStack.belongsTo(Gig)

User.hasMany(Notification)
Notification.belongsTo(User)

User.belongsToMany(Gig, {through: 'user_gigs'})
Gig.belongsToMany(User, {through: 'user_gigs'})


module.exports = { 
  User, 
  Gig, 
  Notification,
  CallStack
}