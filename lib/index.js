// The core library is made up of a bunch of child modules,
// as well as some standalone classes and functions.

/**
 * Constants and functions for basic type checking.
 */
const types = require('./types');

/**
 * Array utility functions.
 */
const arrays = require('./arrays');

/**
 * Information about the JS context we're running in.
 */
const context = require('./context');

/**
 * Functions for working with strings and locales.
 */
const strings = require('./strings');

/**
 * Functions for working with binary flags.
 */
const flags = require('./flags');

/**
 * Functions for manipulating objects.
 */
const obj = require('./obj');

/**
 * Functions for getting values and properties with fallback defaults.
 */
const opt = require('./opt');

/**
 * Meta functions related to JS modules.
 */
const modules = require('./modules');

// A few modules that we're going to expand into the main exports. 
const {randomNumber, InternalObjectId} = require('./objectid');
const {stacktrace,AbstractClass,Functions,NYI} = require('./meta');

// And finally some standalone functions.
const Enum = require('./enum');
const lazy = require('./lazy');
const observable = require('./observable');
const def = types.def;

module.exports =
{
  types, arrays, context, strings, flags, obj, opt, modules,
  def, randomNumber, InternalObjectId, Enum, lazy, observable,
  stacktrace, AbstractClass, Functions, NYI,
}
