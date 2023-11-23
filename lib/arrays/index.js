/**
 * Array helper libraries
 * 
 * @module @lumjs/core/arrays
 */

const {lazy} = require('../types');
const {powerset, random} = require('./util');

// Utils.
exports.powerset = powerset;
exports.random   = random;

// List stuff.
lazy(exports, 'List', () => require('./list'));
lazy(exports, 'containsAny', () => exports.List.containsAny);
lazy(exports, 'containsAll', () => exports.List.containsAll);
lazy(exports, 'removeItems', () => exports.List.removeItems);

// Add functions and At class.
lazy(exports, 'add', () => require('./add'));
