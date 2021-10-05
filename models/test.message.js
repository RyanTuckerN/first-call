const Message = require('./message')

const optionsObj = {
  id : 4, 
  author : 'nickteedo', 
  text: 'this is some fking text!', 
}

const NewMessage = new Message(optionsObj)
const NewMessage1 = new Message(optionsObj)
const NewMessage2 = new Message(optionsObj)
const NewMessage3 = new Message(optionsObj)
const NewMessage4 = new Message(optionsObj)
const NewMessage5 = new Message(optionsObj)
const NewMessage6 = new Message(optionsObj)
const NewMessage7 = new Message(optionsObj)

const optionsObj2 = {
  id : 4, 
  author : 'nickteedo', 
  text: 'this is some fking text!', 
  children: [NewMessage, NewMessage1, NewMessage2]
}


const NewMessage8 = new Message(optionsObj2)
const NewMessage10 = new Message(optionsObj2)
const NewMessage9 = new Message(optionsObj2)

const optionsObj3 = {
  id : 4, 
  author : 'nickteedo', 
  text: 'this is some fking text!', 
  children: [NewMessage8, NewMessage10, NewMessage9]
}

const NewMessage11 = new Message (optionsObj3)
console.log(NewMessage11.children.flat())