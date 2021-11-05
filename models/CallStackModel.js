// const { Gig } = require("../models");

module.exports = class CallStackModel {
  /**
   *
   * @param {Object} param0 callStack instance from sequelize.
   * @param {Boolean} param0.filled whether the gigStack is filled, meaning all roles have been confirmed
   * @param {Object} param0.stackTable object with 'roles' as keys, one role for each intstrument with a call stack
   * @param {Number} param0.gigId id of corresponding gig
   */
  constructor({ filled, stackTable, gigId }) {
    this.filled = filled;
    this.stackTable = stackTable;
    this.gigId = gigId;
  }

  /**
   * sets this callStack instance to filled
   * returns true
   * @returns {Boolean}
   */
  setGigFilled() {
    this.filled = true;
    return this.filled;
  }

  setGigNotFilled() {
    this.filled = false;
    return this.filled;
  }

  /**
   * sets first call in each stack to 'oncall'.
   * should only be called once when the callstack is instantiated
   * @returns {Number} roles.length
   */
  setFirstCalls() {
    const roles = this.returnRoles();
    roles.forEach((role) => this.returnNext(role));
    return roles.length;
  }

  /**
   * returns an array of all roles defined on this gig stack
   * @returns {Array} of {Strings}
   */
  returnRoles() {
    return Object.keys(this.stackTable);
  }

  returnConfirmed() {
    return this.returnRoles()
      .filter((r) => this.stackTable[r].filled)
      .map((r) => {
        return { email: this.stackTable[r].confirmed, role: r };
      });
  }
  /**
   *   sets specific stack to filled, takes role as string
  sets current 'oncall' to 'confirmed' and removes 'oncall' key
   * @param {String} role to set as filled
   * @param {String} name of the person accepting
   * @returns {String} confirmed call
   */
  setStackFilled(role, name) {
    if (name) {
      this.stackTable[role].confirmed = {
        email: this.stackTable[role].onCall,
        name,
      };
    } else {
      this.stackTable[role].confirmed = this.stackTable[role].onCall;
    }
    this.stackTable[role].filled = true;
    this.stackTable[role].onCall = null;
    this.checkFilled();
    return this.stackTable[role].confirmed;
  }

  //returns next call from specific role callstack, takes role as string
  /**
   * ### Add next call in stack as *oncall*
   * sets next call as onCall, returns email address of *next* or empty stack if the callstack is empty
   * @param {String} role to setNext on
   * @returns {String}
   */
  returnNext(role) {
    const next = this.stackTable[role].calls.shift();

    if (!next) {
      this.stackTable[role].emptyStack = true;
      this.stackTable[role].onCall = null;
      const openCalls = this.returnRoles()
        .map((r) => this.stackTable[r].onCall)
        //remove nulls
        .filter((a) => a);
      return "Empty stack!";
    }

    this.stackTable[role].onCall = next;

    return next;
  }

  /**
   * returns array containing the onCall email address for each role
   * @returns {Array}
   */
  returnOpenCalls() {
    return [
      ...new Set(
        this.returnRoles()
          .map((role) => this.stackTable[role].onCall)
          .filter((r) => r)
      ),
    ];
  }

  /**
   * adds an email address to the end of a specific call list, returns callStack
   * @param {String} role
   * @param {String} call email address. Also accepts array of email addresses
   * @returns {Object} contains keys 'updatedStack' {Array}, current onCall {String}, and *option* message if applicable
   */
  addCallToStack(role, call) {
    //if the role doesn't exist create it.
    if (!this.returnRoles().includes(role)) {
      if (Array.isArray(call)) {
        //if call argument is an array, use it in addRole method
        //change name from 'call' to 'calls' because it is an array
        const calls = call;
        this.addRoleToStackTable(role, calls);
      } else {
        //if call argument is string as expected, add it to an array
        this.addRoleToStackTable(role, [call]);
      }
      if (this.stackTable[role].onCall === null) {
        this.returnNext(role);
      }
      return {
        stack: this.stackTable[role].calls,
        onCall: this.stackTable[role].onCall,
        message: "The stack didn't exist, but it does now.",
      };
    }

    //if call argument is an array, push each address therein to callStack
    if (Array.isArray(call)) {
      const calls = call;
      //recursive?
      calls.forEach((c) => this.addCallToStack(role, c));
      if (this.stackTable[role].onCall === null) {
        this.returnNext(role);
      }

      return {
        stack: this.stackTable[role].calls,
        onCall: this.stackTable[role].onCall,
        message: "Added them all!",
      };
    }

    //don't add if it already exists in calls array:
    if (
      this.stackTable[role].calls.includes(call) ||
      this.stackTable[role].onCall === call
    ) {
      return {
        stack: this.stackTable[role].calls,
        onCall: this.stackTable[role].onCall,
        message: "This call already existed here.",
      };
    }

    //if this role is confirmed, just add as backup 
    if (this.stackTable[role].filled){
      this.stackTable[role].calls =[...this.stackTable[role].calls, call]
      return {
        stack: this.stackTable[role].calls,
        onCall: this.stackTable[role].onCall,
        message: `${call} added successfully`,
      };
    }
    //otherwise do add it
    else {
      this.stackTable[role].calls.push(call);
      if (this.stackTable[role].emptyStack) {
        this.returnNext(role);
        this.stackTable[role].emptyStack = false;
      }
      if (this.stackTable[role].onCall === null) {
        this.returnNext(role);
      }
      return {
        stack: this.stackTable[role].calls,
        onCall: this.stackTable[role].onCall,
        message: `${call} added successfully`,
      };
    }
  }

  /**
   *
   * @param {String} role name of the role to add
   * @param {Array} calls array of emailadress strings, ordered from first to last call. A single call as sting is also acceptable
   * @returns {Object} all values associated with new role
   */
  addRoleToStackTable(role, calls = []) {
    if (!Array.isArray(calls) && typeof calls !== "string") {
      return -1;
    }

    if (!Array.isArray(calls) && typeof calls === "string") {
      calls = [calls];
    }

    this.stackTable[role] = { calls, filled: false };
    if (!calls.length) {
      this.stackTable[role].onCall = null;
      return this.stackTable[role];
    }
    this.returnNext(role);
    return this.stackTable[role];
  }

  /**
   * remove duplicates and filter falsy values from each callstack
   */
  filterStacks() {
    this.returnRoles().forEach((role) => {
      this.stackTable[role].calls = [
        ...new Set(this.stackTable[role].calls),
      ].filter((r) => r);
    });
  }

  /**
   * returns specific role and associated properties, takes name of role as string
   * @param {{String}} role to return
   * @returns {Object}
   */
  returnStack(role) {
    return this.stackTable[role];
  }

  //logs whole stackTable
  logStacks() {
    console.log(this.stackTable);
  }

  //logs whole gigStack
  log() {
    console.log(this);
  }

  /**
   * returns role count
   * @returns {Number}
   */
  returnStackCount() {
    return this.returnRoles().length;
  }

  /**
   * #### Getter
   * @returns {Number} number of stacks in this GigStack
   */
  get stackCount() {
    return this.returnStackCount();
  }

  /**
   * Remove an email address from a stack, whether it is oncall or not
   * @param {String} role 
   * @param {String} call 
   * @returns {Object} updated stack
   */
  removeCall(role, call) {
    if (this.stackTable[role].onCall === call) {
      this.returnNext(role);
      return this.stackTable[role];
    }
    this.stackTable[role].calls = this.stackTable[role].calls.filter(
      (c) => c !== call
    );
    return this.stackTable[role]
  }
  /**
   * checks each stack. if all are filled, set gig to filled and return true, otherwise return false
   * @returns {Boolean}
   */
  checkFilled() {
    const roles = this.returnRoles();
    const mappedRoles = roles.map((role) => this.stackTable[role].filled);
    // console.log('MAPPEDROLES: ',mappedRoles)
    let response;
    if (mappedRoles.every((roleFilled) => roleFilled === true)) {
      this.setGigFilled();
      response = true;
    } else {
      response = false;
    }
    return response;
  }
};
