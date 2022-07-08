// The core library is made up of a bunch of child modules,
// as well as some standalone classes and functions.

/**
 * Constants and functions for basic type checking.
 * @namespace types
 */
const types = require('./types');
const def = types.def;

/**
 * Information about the JS context we're running in.
 * @namespace context
 */
const context = require('./context');

/**
 * Functions for working with strings and locales.
 * @namespace strings
 */
const strings = require('./strings');

/**
 * Functions for working with binary flags.
 * @namespace flags
 */
const flags = require('./flags');

/**
 * Functions and Enums for working with Descriptors.
 * @namespace descriptors
 */
const descriptors = require('./descriptors');
// The *primary* export from descriptors is DESC.
const DESC = descriptors.DESC;

/**
 * Functions for manipulating objects.
 * @namespace obj
 */
const obj = require('./obj');

/**
 * Functions for getting values and properties with fallback defaults.
 * @namespace opt
 */
const opt = require('./opt');

/**
 * Meta functions related to JS modules.
 */
const modules = require('./modules');

// A few modules that we're going to expand into the main exports. 
const {randomNumber, InternalObjectId} = require('./objectid');
const {stacktrace,AbstractClass,Functions} = require('./meta');

// And finally some standalone functions.
const Enum = require('./enum');
const prop = require('./prop');
const lazy = require('./lazy');
const observable = require('./observable');

module.exports =
{
  types, context, strings, flags, descriptors, obj, opt,
  randomNumber, InternalObjectId, Enum, prop, lazy, observable,
  stacktrace, AbstractClass, Functions, def, DESC, modules,
}
