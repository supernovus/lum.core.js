/**
 * Fundamental Types sub-module.
 * 
 * As `@lumjs/core` is the foundation for all my JS libraries,
 * this sub-module is the foundation for `@lumjs/core`.
 * Everything else is built upon this.
 * 
 * @module @lumjs/core/types
 * @property {string} O - "object"
 * @property {string} F - "function"
 * @property {string} S - "string"
 * @property {string} B - "binary"
 * @property {string} N - "number"
 * @property {string} U - "undefined"
 * @property {string} SY - "symbol"
 * @property {string} BI - "bigint"
 */

// Constants representing core Javascript types.
const {O, F, S, B, N, U, SY, BI} = require('./js');

// Basic type check functions.
const 
{
  isObj, isComplex, isNil, notNil, isScalar, isArray, isTypedArray,
  nonEmptyArray, isArguments, isProperty, doesDescriptor,
} = require('./basics');

// Root namespace helpers.
const {root, unbound} = require('./root');

// Advanced type checks.
const {isInstance, isType, isa} = require('./isa');

// Error-throwing type checks.
const {needObj, needType, needs} = require('./needs');

// A few standalone items.

const def   = require('./def');
const TYPES = require('./typelist');
const stringify = require('./stringify');

// Okay, add all those to our exports.
// Further tests can be added by `TYPES.add()` later.
module.exports =
{
  O, F, S, B, N, U, SY, BI, TYPES, root, unbound, def,
  isObj, isComplex, isNil, notNil, isScalar, isArray, isTypedArray, 
  nonEmptyArray, isArguments, isProperty, doesDescriptor, 
  isInstance, isType, isa, needObj, needType, needs, stringify,
}

// Last but not least, this will be the module for TYPES.add()
def(TYPES, '$module', module);
