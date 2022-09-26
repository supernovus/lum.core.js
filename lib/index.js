/**
 * Core Library
 * 
 * This is the foundation upon which all the rest of my JS libraries
 * are built. It provides fundamental helper functions and classes.
 * 
 * @module @lumjs/core
 */

/**
 * Constants and functions for basic type checking.
 * @alias module:@lumjs/core.types
 * @see module:@lumjs/core/types
 */
const types = require('./types');

/**
 * Array utility functions.
 * @alias module:@lumjs/core.arrays
 * @see module:@lumjs/core/arrays
 */
const arrays = require('./arrays');

/**
 * Information about the JS context we're running in.
 * @alias module:@lumjs/core.context
 * @see module:@lumjs/core/context
 */
const context = require('./context');

/**
 * Functions for working with strings and locales.
 * @alias module:@lumjs/core.strings
 * @see module:@lumjs/core/strings
 */
const strings = require('./strings');

/**
 * Functions for working with binary flags.
 * @alias module:@lumjs/core.flags
 * @see module:@lumjs/core/flags
 */
const flags = require('./flags');

/**
 * Functions for manipulating objects.
 * @alis module:@lumjs/core.obj
 * @see module:@lumjs/core/obj
 */
const obj = require('./obj');

/**
 * Functions for getting values and properties with fallback defaults.
 * @alias module:@lumjs/core.opt
 * @see module:@lumjs/core/opt
 */
const opt = require('./opt');

/**
 * Meta functions related to JS modules.
 * @alias module:@lumjs/core.modules
 * @see module:@lumjs/core/modules
 */
const modules = require('./modules');

// ObjectID stuff is imported directly without registering a sub-module.
const {randomNumber, InternalObjectId} = require('./objectid');

/**
 * Get a simplistic debugging stacktrace.
 * @name module:@lumjs/core.stacktrace
 * @function
 * @see module:@lumjs/core/meta.stacktrace
 */

/**
 * A simple base class for making *abstract* classes.
 * @name module:@lumjs/core.AbstractClass
 * @see module:@lumjs/core/meta.AbstractClass
 */

/**
 * A *factory* for special types of JS `function` constructors.
 * @name module:@lumjs/core.Functions
 * @see module:@lumjs/core/meta.Functions
 */

/**
 * Throw an `Error` saying that a feature is not yet implemented.
 * @name module:@lumjs/core.NYI
 * @function
 * @see module:@lumjs/core/meta.NYI
 */

// These are exported directly, but a meta sub-module also exists.
// Unlike most sub-modules there is no `meta` property in the main library.
const {stacktrace,AbstractClass,Functions,NYI} = require('./meta');

/**
 * Create a magic *Enum* object.
 * @alias module:@lumjs/core.Enum
 * @function
 * @see module:@lumjs/core/enum
 */
const Enum = require('./enum');

/**
 * Make an object support the *Observable* API.
 * @alias module:@lumjs/core.observable
 * @function
 * @see module:@lumjs/core/observable
 */
const observable = require('./observable');

/**
 * Define properties on an object or function.
 * @alias module:@lumjs/core.def
 * @function
 * @see module:@lumjs/core/types.def
 */
const def = types.def;

/**
 * Define properties on an object or function.
 * @alias module:@lumjs/core.lazy
 * @function
 * @see module:@lumjs/core/types.lazy
 */
 const lazy = types.lazy;

module.exports =
{
  types, context, flags, obj, opt, modules, arrays, strings,
  def, randomNumber, InternalObjectId, Enum, lazy, observable,
  stacktrace, AbstractClass, Functions, NYI, 
}
