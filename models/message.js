class Message{
  /**
   * returns message instance
   * @param {Object} param0 Object containing options for creating the post
   * @param {Number} param0.id id of this message
   * @param {String} param0.author message author
   * @param {String} param0.text text of this message
   * @param {Number} param0.childOf id of parent message, null if top level
   * @param {Array} param0.children array of all message instances in response to this message
   * @param {Number} param0.upVotes number of upVotes
   * @param {Array} param0.voted ids of those who have voted, prevents voting again
   */
  constructor({id, author, text, childOf=null, children = [], upVotes = 1, voted = [author]}){
    this.id = id
    this.author = author,
    this.text = text
    this.childOf = childOf
    this.children = children
    this.upVotes = upVotes
    this.voted = voted
  }

  

} 

module.exports = Message