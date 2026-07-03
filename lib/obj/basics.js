'use strict';

const getProperty = require('./getproperty.js');
const getPrototypeOf = require('./getprotos.js');
const { getOwnKeys, isEmptyObject, keyName } = require('./keys.js');
const ownCount = require('./owncount.js');
const unlocked = require('./unlocked.js');

module.exports = {
  getOwnKeys, getProperty, getPrototypeOf, keyName, isEmptyObject,
  ownCount, unlocked,
}
