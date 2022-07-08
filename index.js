// The core library is made up of a bunch of child modules,
// as well as some standalone classes and functions.

/**
 * Constants and functions for basic type checking.
 * @namespace types
 */
const types = require('./src/types');
const def = types.def;

/**
 * Information about the JS context we're running in.
 * @namespace context
 */
const context = require('./src/context');

/**
 * Functions for working with strings and locales.
 * @namespace strings
 */
const strings = require('./src/strings');

/**
 * Functions for working with binary flags.
 * @namespace flags
 */
const flags = require('./src/flags');

/**
 * Functions and Enums for working with Descriptors.
 * @namespace descriptors
 */
const descriptors = require('./src/descriptors');
// The *primary* export from descriptors is DESC.
const DESC = descriptors.DESC;

/**
 * Functions for manipulating objects.
 * @namespace obj
 */
const obj = require('./src/obj');

/**
 * Function for getting values and properties with fallback defaults.
 * @namespace opt
 */
const opt = require('./src/opt');

// A few modules that we're going to expand into the main exports. 
const {randomNumber, InternalObjectId} = require('./src/objectid');
const {stacktrace,AbstractClass,Functions} = require('./src/meta');

// And finally some standalone functions.
const Enum = require('./src/enum');
const prop = require('./src/prop');
const lazy = require('./src/lazy');
const observable = require('./src/observable');

module.exports =
{
  types, context, strings, flags, descriptors, obj, opt,
  randomNumber, InternalObjectId, Enum, prop, lazy, observable,
  stacktrace, AbstractClass, Functions, def, DESC,
}
