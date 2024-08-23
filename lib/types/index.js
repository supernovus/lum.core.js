"use strict";

/**
 * The complete `types` module.
 * 
 * As `@lumjs/core` is the foundation for all my JS libraries,
 * this module is the foundation for `@lumjs/core`.
 * 
 * Re-exports everything from the {@link @lumjs/core/types/basics}
 * sub-module with the same names, and adds a whole lot more!
 * 
 * @module @lumjs/core/types
 */

const def = require('./def'), lazy = require('./lazy');

// Compose in sub-modules.
Object.assign(exports,
  require('./basics'), 
  require('./root'),
  require('./isa'),
  require('./needs'),
  { // A few standalone exports.
    def, lazy,
    TYPES: require('./typelist'),
    stringify: require('./stringify'),
    ownCount: require('./owncount'),
  },
);

// Replace the configurable constant props with readonly ones
exports.JS.addTo(exports);

// Deprecated alias for `console` module, lazy-loaded if requested.
const {wrapDepr} = require('../meta');
wrapDepr(exports, 'console',
{
  dep: 'core.types.console',
  rep: 'core.console',
  get: () => require('../console'),
});

// This will be the module for TYPES.add()
def(exports.TYPES, '$module', module);

// Extend `unbound` with add() and remove() methods.
require('./unbound/extend')(exports.unbound);
