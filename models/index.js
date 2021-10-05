const User = require('./user')
const Gig = require('./gig')
const Notification = require('./notification')
const CallStack = require('./callStack')
// const Board = require('./board')
// const MessageBoard = require('./messageBoard')
const Post = require('./post')

Gig.hasOne(CallStack)
// Gig.hasOne(MessageBoard)
CallStack.belongsTo(Gig)
// MessageBoard.belongsTo(Gig)

Gig.hasMany(Post)
Post.belongsTo(Gig)

User.hasMany(Post, {foreignKey: 'author'})
Post.belongsTo(User, {foreignKey: 'author'})

User.hasMany(Notification)
Notification.belongsTo(User)

User.belongsToMany(Gig, {through: 'user_gigs'})
Gig.belongsToMany(User, {through: 'user_gigs'})


module.exports = { 
  User, 
  Gig, 
  Notification,
  CallStack,
  // MessageBoard,
  Post
}