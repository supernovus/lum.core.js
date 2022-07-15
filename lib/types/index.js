/// Type checking and other features common to everything else.

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

// Okay, add all those to our exports.
// Further tests can be added by `TYPES.add()` later.
module.exports =
{
  O, F, S, B, N, U, SY, BI, TYPES, root, unbound, def,
  isObj, isComplex, isNil, notNil, isScalar, isArray, isTypedArray, 
  nonEmptyArray, isArguments, isProperty, doesDescriptor, 
  isInstance, isType, isa, needObj, needType, needs,
}

// Last but not least, this will be the module for TYPES.add()
def(TYPES, '$module', module);
