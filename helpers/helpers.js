/**
 * 
 * @param {String} s string to Properize
 * @returns {String} Properized string
 */
const properize = (s) => s[0].toUpperCase() + s.slice(1);

/**
 * 
 * @param {Date} d javascript date object
 * @returns {String} string representation of the time with AM/PM
 */
const returnTime = (d) => {
  let m = "";
  let hour = d.getHours();
  let minute = d.getMinutes();
  m = hour >= 12 ? "PM" : "AM";
  hour = hour <= 12 ? hour : hour - 12;
  minute = minute < 10 ? `0${minute}` : minute
  return `${hour}:${minute} ${m}`;
};

/**
 * 
 * @param {Date} d javascript date object
 * @param {Number} h hours to add
 * @returns {Date} javascript date object + hours 
 */
const addHours = (d, h) => {
  d.setTime(d.getTime() + (h*60*60*1000))
  return d
}

/**
 * Function finds key of an object by the value
 * @param {Object} object to search
 * @param {String} value value to locate
 * @returns {String} 
 */
const getKeyByValue = (object, value) => {
  return Object.keys(object).find((key) => object[key] === value);
};

module.exports = { properize, returnTime, addHours, getKeyByValue };
