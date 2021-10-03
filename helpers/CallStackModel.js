module.exports = class CallStackModel {
  constructor({ filled, stackTable, gigId }) {
    this.filled = filled;
    this.stackTable = stackTable;
    this.gigId = gigId;
  }

  //***METHODS!***/

  //sets this callStack instance to filled
  setGigFilled() {
    this.filled = true;
  }
  //returns an array of all roles defined in callstack http request
  returnRoles() {
    return Object.keys(this.stackTable);
  }
  //sets first call to 'oncall'.
  //should only be called once when the callstack is instantiated
  setFirstCalls() {
    const roles = this.returnRoles();
    roles.forEach((role) => this.returnNext(role));
    return roles.length;
  }
  //sets specific stack to filled, takes role as string
  //sets current 'oncall' to 'confirmed' and removes 'oncall' key
  setStackFilled(role) {
    this.stackTable[role].filled = true;
    this.stackTable[role].confirmed = this.stackTable[role].onCall;
    this.stackTable[role].onCall = null;
  }
  //returns next call from specific role callstack, takes role as string
  returnNext(role) {
    const next = this.stackTable[role].calls.shift();
    if (!next) {
      this.stackTable[role].emptyStack = true;
      delete this.stackTable[role].onCall
      return "Empty stack!";
    }
    this.stackTable[role].onCall = next;
    return next;
  }
  //logs specific role, takes role as string
  logStack(role) {
    console.log(this.stackTable[role]);
  }
  //logs whole stackTable
  logStacks() {
    console.log(this.stackTable);
  }
  // logs role count
  logStackCount() {
    console.log(Object.keys(this.stackTable).length);
  }
  // checks each stack. if all are filled, set gig to filled and return true, otherwise return false
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
