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
 * A helper for building modules
 * 
 * @alias module:@lumjs/core.ModuleBuilder
 * @see module:@lumjs/core/modulebuilder
 */
const Builder = require('./modulebuilder');

// And we'll use the builder to define the rest of this.
const {has,can,from} = Builder.build(module);

/**
 * Define properties on an object or function
 * @name module:@lumjs/core.def
 * @function
 * @see module:@lumjs/core/types.def
 */

/**
 * Define properties on an object or function
 * @name module:@lumjs/core.lazy
 * @function
 * @see module:@lumjs/core/types.lazy
 */

// Our fundamental bits.
has('types', {value: types});
has('def',   {value: types.def});
has('lazy',  {value: types.lazy});

// The module builder itself.
has('ModuleBuilder', {value: Builder});
// And a shortcut function.
has('buildModule', {value: function(m,o) { return Builder.build(m,o); }});

/**
 * Array utility functions «Lazy»
 * @name module:@lumjs/core.arrays
 * @type {module:@lumjs/core/arrays}
 */
can('arrays');

/**
 * Information about the JS context we're running in
 * @name module:@lumjs/core.context
 * @type {module:@lumjs/core/context}
 */
has('context');

/**
 * Functions for working with strings and locales «Lazy»
 * @name module:@lumjs/core.strings
 * @type {module:@lumjs/core/strings}
 */
can('strings');

/**
 * Functions for working with binary flags «Lazy»
 * @name module:@lumjs/core.flags
 * @type {module:@lumjs/core/flags}
 */
can('flags');

/**
 * Functions for manipulating objects
 * @name module:@lumjs/core.obj
 * @type {module:@lumjs/core/obj}
 */
can('obj');

/**
 * Functions for getting values and properties with fallback defaults «Lazy»
 * @name module:@lumjs/core.opt
 * @type {module:@lumjs/core/opt}
 */
can('opt');

/**
 * Meta functions related to JS modules «Lazy»
 * @alias module:@lumjs/core.modules
 * @see module:@lumjs/core/modules
 */
can('modules');

// ObjectID stuff is imported directly without registering a sub-module.
from('objectid', 'randomNumber', 'InternalObjectId');

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

// These are exported directly, but a meta sub-module also exists.
// Unlike most sub-modules there is no `meta` property in the main library.
from('meta', 'stacktrace', 'AbstractClass', 'Functions', 'NYI');

/**
 * Create a magic *Enum* object
 * @name module:@lumjs/core.Enum
 * @function
 * @see module:@lumjs/core/enum
 */
can('Enum', {module: 'enum'});

/**
 * Make an object support the *Observable* API «Lazy»
 * @name module:@lumjs/core.observable
 * @function
 * @see module:@lumjs/core/observable
 */
can('observable');
