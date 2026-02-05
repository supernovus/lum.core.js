/**
 * Array helper libraries
 * 
 * A lot of this sub-module has been moved into the @lumjs/lists package now.
 * Aliases will continue to exist here until v2.x is released.
 * 
 * @module @lumjs/core/arrays
 */

const {lazy} = require('../obj/df');
const {move, powerset, random, swap} = require('./util');

// Utils; the only bits that will remain here in v2.
module.exports = exports = {move, powerset, random, swap};

// TODO: wrap the following via wrapDepr for the v1.39.x; remove in v2.0.

const loadLists = () => require('@lumjs/lists');

const listsExports = [
  'add',
  'containsAll',
  'containsAny',
  'ConvertType',
  'List',
  'makeTyped',
  'removeItems',
  'TypedArray',
];

for (let le of listsExports) {
  lazy(exports, le, () => loadLists()[le]);
}
