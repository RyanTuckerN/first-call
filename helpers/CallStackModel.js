module.exports = class CallStackModel {
  constructor({ filled, stackTable, gigId }) {
    this.filled = filled;
    this.stackTable = stackTable;
    this.gigId = gigId;
  }

  //***METHODS!***/

  /**
   * sets this callStack instance to filled
   * returns true
   * @returns {Boolean}
   */
  setGigFilled() {
    this.filled = true;
    return this.filled;
  }

  /**
   * returns an array of all roles defined in callstack http request
   * @returns {Array} of {Strings}
   */
  returnRoles() {
    return Object.keys(this.stackTable);
  }

  /**
   * sets first call to 'oncall'.
   * should only be called once when the callstack is instantiated
   * @returns {Number} roles.length
   */
  setFirstCalls() {
    const roles = this.returnRoles();
    roles.forEach((role) => this.returnNext(role));
    return roles.length;
  }

  /**
   *   sets specific stack to filled, takes role as string
  sets current 'oncall' to 'confirmed' and removes 'oncall' key
   * @param {String} role to set as filled
   * @returns {String} confirmed call
   */
  setStackFilled(role) {
    this.stackTable[role].filled = true;
    this.stackTable[role].confirmed = this.stackTable[role].onCall;
    this.stackTable[role].onCall = null;
    this.checkFilled()
    return this.stackTable[role].confirmed;
  }

  //returns next call from specific role callstack, takes role as string
  /**
   * sets next call as onCall, returns email address of next or empty stack if the callstack is empty
   * @param {String} role to setNext on
   * @returns {String}
   */
  returnNext(role) {
    const next = this.stackTable[role].calls.shift();
    if (!next) {
      this.stackTable[role].emptyStack = true;
      delete this.stackTable[role].onCall;
      return "Empty stack!";
    }
    this.stackTable[role].onCall = next;
    return next;
  }

  /**
   * adds an email address to the end of a specific call list, returns callStack
   * @param {String} role
   * @param {String} call email address
   * @returns {Array|Void} updated callStack, unless call already existed which returns void
   */
  addCallToStack(role, call) {
    //don't add if it already exists in calls array:
    if (this.stackTable[role].calls.includes(call) || this.stackTable[role].onCall === call) return;

    this.stackTable[role].calls.push(call);
    if (this.stackTable[role].emptyStack) {
      this.returnNext(role);
      this.stackTable[role].emptyStack = false;
    }
  }

  /**
   *
   * @param {String} role name of the role to add
   * @param {Array} calls array of emailadress strings, ordered
   */
  addRoleToStackTable(role, calls = []) {
    this.stackTable[role] = { calls, filled: false };
    if (!calls.length) {
      this.stackTable[role].onCall = null;
      return;
    }
    this.returnNext(role);
  }

  /**
   * returns specific role, takes role as string
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

  /**
   * returns role count
   * @returns {Number}
   */
  returnStackCount() {
    return Object.keys(this.stackTable).length;
  }

  /**
   * checks each stack. if all are filled, set gig to filled and return true, otherwise return false
   * @returns {Boolean}
   */
  checkFilled() {
    const roles = Object.keys(this.stackTable);
    const mappedRoles = roles.map((role) => this.stackTable[role].filled);
    // console.log('MAPPEDROLES: ',mappedRoles)
    let response;
    if (!mappedRoles.includes(false)) {
      this.setGigFilled();
      response = true;
    } else {
      response = false;
    }
    return response;
  }
};

