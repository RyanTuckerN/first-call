const User = require('./user')
const Gig = require('./gig')
const Notification = require('./notification')

User.hasMany(Notification)
Notification.belongsTo(User)

User.belongsToMany(Gig, {through: 'user_gigs'})
Gig.belongsToMany(User, {through: 'user_gigs'})


module.exports = { 
  User, 
  Gig, 
  Notification,
}