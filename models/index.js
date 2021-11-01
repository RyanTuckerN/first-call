const User = require('./user')
const Gig = require('./gig')
const Notification = require('./notification')
const CallStack = require('./callStack')
const Post = require('./post')
const Story = require('./story')

Gig.hasOne(CallStack)
CallStack.belongsTo(Gig)

User.hasMany(Gig, {foreignKey: 'ownerId'})
Gig.belongsTo(User, {foreignKey: 'ownerId'})

Gig.hasMany(Post)
Post.belongsTo(Gig)

User.hasMany(Post, {foreignKey: 'author'})
Post.belongsTo(User, {foreignKey: 'author'})

User.hasMany(Notification)
Notification.belongsTo(User)

User.belongsToMany(Gig, {through: 'user_gigs'})
Gig.belongsToMany(User, {through: 'user_gigs'})

User.hasMany(Story)
Story.belongsTo(User)

Story.hasMany(Post)
Post.belongsTo(Story)

module.exports = { 
  User, 
  Gig, 
  Notification,
  CallStack,
  Post,
  Story
}