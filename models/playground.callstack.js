// const CallStackModel = require("./CallStackModel");

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
};

const obj2 = {
  filled: false,
  stackTable: {
    drums: {
      calls: ["drums1@gmail.com", "drums2@gmail.com"],
      filled: false,
    },
    saxophone: {
      calls: ["sax1@gmail.com", "sax2@gmail.com"],
      filled: false,
    },
  },
  gigId: 4
};

// const GigStack = new CallStackModel(obj2);
// GigStack.setFirstCalls()
// // GigStack.addRoleToStackTable('bass', ['bass1@gmail.com', "bass2@gmail.com"])
// console.log(GigStack.addCallToStack('bass', ['testing@gmail.com', 'feather@heather.com']))
// console.log(GigStack.addCallToStack('bass', ['testing321@gmail.com', 'test23', 'fart']))
// console.log(GigStack.addCallToStack('bass', 'soMuchForRushing@gmail.com'))
// console.log('*************************')
// GigStack.logStacks()
// console.log('*************************')
// // GigStack.setF
// // GigStack.returnRoles
// GigStack.addRoleToStackTable('baixon', ['Markopetrichiv@me.com', 'test@me.com'])
// GigStack.returnRoles().forEach(role=>GigStack.setStackFilled(role))
// // console.log(GigStack.stackTable);
// GigStack.log()

// console.log(GigStack.returnNext("accordian"));
// console.log(GigStack.returnNext("accordian"));
// console.log(GigStack.returnNext("accordian"));
// GigStack.addCallToStack("accordian", "test@gmail.com");
// GigStack.addCallToStack("accordian", "test23@gmail.com");
// GigStack.addCallToStack("accordian", "test4325@gmail.com");
// console.log(GigStack.setStackFilled("accordian"));
// console.log(GigStack.setStackFilled("saxophone"));
// // console.log('***********************')
// // console.log(GigStack)
// console.log(GigStack.filled);
// console.log(GigStack.gigId);
// console.log(GigStack.stackTable);

