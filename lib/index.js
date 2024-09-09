/**
 * Core Library
 * 
 * This is the foundation upon which all the rest of my JS libraries
 * are built. It provides fundamental helper functions and classes.
 * 
 * Properties marked as «Lazy» will be loaded on-demand the first time
 * the property is accessed. All other properties are always loaded.
 * 
 * @module @lumjs/core
 */

/**
 * Constants and functions for type checks
 * and other fundamental functions
 * 
 * @alias module:@lumjs/core.types
 * @see module:@lumjs/core/types
 */
const types = require('./types');

/**
 * Define properties on an object or function
 * @name module:@lumjs/core.def
 * @function
 * @see module:@lumjs/core/types.def
 */
const def = types.def;

/**
 * Define *lazy* properties on an object or function
 * @alias module:@lumjs/core.lazy
 * @function
 * @see module:@lumjs/core/types.lazy
 */
const lazy = types.lazy;

def(exports, 'types', types);
def(exports, 'def',   def);
def(exports, 'lazy',  lazy);

/**
 * Array utility functions «Lazy»
 * @name module:@lumjs/core.arrays
 * @type {module:@lumjs/core/arrays}
 */
lazy(exports, 'arrays', () => require('./arrays'));

/**
 * Map utility functions «Lazy»
 * @name module:@lumjs/core.maps
 * @type {module:@lumjs/core/maps}
 */
lazy(exports, 'maps', () => require('./maps'));

/**
 * Information about the JS context we're running in
 * @name module:@lumjs/core.context
 * @type {module:@lumjs/core/context}
 */
def(exports, 'context', require('./context'));

/**
 * Functions for working with strings and locales «Lazy»
 * @name module:@lumjs/core.strings
 * @type {module:@lumjs/core/strings}
 */
lazy(exports, 'strings', () => require('./strings'));

/**
 * Functions for working with binary flags «Lazy»
 * @name module:@lumjs/core.flags
 * @type {module:@lumjs/core/flags}
 */
lazy(exports, 'flags', () => require('./flags'));

/**
 * Functions for manipulating objects «Lazy»
 * @name module:@lumjs/core.obj
 * @type {module:@lumjs/core/obj}
 */
lazy(exports, 'obj', () => require('./obj'));

/**
 * A wrapper around the Javascript console «Lazy»
 * @name module:@lumjs/core.console
 * @type {module:@lumjs/core/console}
 */
lazy(exports, 'console', () => require('./console'));

/**
 * A simplistic implementation of class/object traits «Lazy»
 * @name module:@lumjs/core.traits
 * @type {module:@lumjs/core/traits}
 */
lazy(exports, 'traits', () => require('./traits'));

/**
 * Functions for getting values and properties with fallback defaults «Lazy»
 * @name module:@lumjs/core.opt
 * @type {module:@lumjs/core/opt}
 */
lazy(exports, 'opt', () => require('./opt'), {def:{autoDesc: false}});

// Get a bunch of properties from a submodule.
function from(submod)
{
  for (const key in submod)
  {
    def(exports, key, submod[key]);
  }
}

// ObjectID stuff is imported directly without registering a sub-module.
from(require('./objectid'));

/**
 * Get a simplistic debugging stacktrace
 * @name module:@lumjs/core.stacktrace
 * @function
 * @see module:@lumjs/core/meta.stacktrace
 */

/**
 * A simple base class for making *abstract* classes
 * @name module:@lumjs/core.AbstractClass
 * @see module:@lumjs/core/meta.AbstractClass
 */

/**
 * A *factory* for special types of JS `function` constructors
 * @name module:@lumjs/core.Functions
 * @see module:@lumjs/core/meta.Functions
 */

/**
 * Throw an `Error` saying that a feature is not yet implemented
 * @name module:@lumjs/core.NYI
 * @function
 * @see module:@lumjs/core/meta.NYI
 */

/**
 * A function indicating that something is deprecated
 * @name module:@lumjs/core.deprecated
 * @function
 * @see module:@lumjs/core/meta.deprecated
 */

/**
 * Assign a getter property to an object that calls the `deprecated`
 * function with a specific message before returning the proxied value.
 * @name module:@lumjs/core.wrapDepr
 * @function
 * @see module:@lumjs/core/meta.wrapDepre
 */

// These are exported directly, but a meta sub-module also exists.
// Unlike most sub-modules there is no `meta` property in the main library.
const meta = require('./meta');
from(meta);
def(exports, 'AbstractClass', 
{
  get() { return meta.AbstractClass; }
});

/**
 * Create a magic *Enum* object «Lazy»
 * @name module:@lumjs/core.Enum
 * @function
 * @see module:@lumjs/core/enum
 */
lazy(exports, 'Enum', () => require('./enum'));

/**
 * Make an object support the *Observable* API «Lazy»
 * @name module:@lumjs/core.observable
 * @function
 * @see module:@lumjs/core/observable
 */
lazy(exports, 'observable', () => require('./observable'));

/**
 * The Events module «Lazy»
 * @name module:@lumjs/core.events
 * @see module:@lumjs/core/events
 */
lazy(exports, 'events', () => require('./events'));
