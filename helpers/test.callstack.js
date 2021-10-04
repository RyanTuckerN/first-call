const CallStackModel = require("./CallStackModel");

const obj = {
    filled: false,
    stackTable: {
      drums: {
        calls: ["drums2@gmail.com"],
        filled: true,
        onCall: null,
        confirmed: "drums1@gmail.com",
      },
      saxophone: {
        calls: ["test@test2.com"],
        filled: false,
        onCall: "test@test.com",
        emptyStack: false,
      },
      accordian: {
        calls: ["Markopetrichiv@baixon.com", "test123@gmail.com"],
        filled: false,
        onCall: "onYourOwnAccordian@gmail.com",
      },
    },
    gigId: 2,
  }

const GigStack = new CallStackModel(obj);

console.log(GigStack.returnNext('accordian'))
console.log(GigStack.returnNext('accordian'))
console.log(GigStack.returnNext('accordian'))
GigStack.addCallToStack('accordian', 'test@gmail.com')
GigStack.addCallToStack('accordian', 'test23@gmail.com')
GigStack.addCallToStack('accordian', 'test4325@gmail.com')
console.log(GigStack.setStackFilled('accordian'))
console.log(GigStack.setStackFilled('saxophone'))
// console.log('***********************')
// console.log(GigStack)

console.log(GigStack.filled)
console.log(GigStack.gigId)
console.log(GigStack.stackTable)