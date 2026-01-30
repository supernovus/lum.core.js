"use strict";

/**
 * The complete `types` module.
 * 
 * As `@lumjs/core` is the foundation for all my JS libraries,
 * this module is the foundation for `@lumjs/core`.
 * 
 * @module @lumjs/core/types
 */

const def = require('./def');

// Compose in sub-modules.
Object.assign(exports,
  require('./basics'), 
  require('./root'),
  require('./isa'),
  require('./needs'),
  { // A few standalone exports.
    def,
    TYPES: require('./typelist'),
    ownCount: require('../obj/owncount'), // ← TODO: nix in 2.x
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

// Deprecated alias for `lazy` function.
wrapDepr(exports, 'lazy', 
{
  dep: 'core.types.lazy',
  rep: 'core.obj.lazy',
  get: () => require('../obj/df').lazy,
});

// And for the stringify library
wrapDepr(exports, 'stringify', {
  dep: 'core.types.stringify',
  rep: '@lumjs/describe',
  get: () => require('./stringify').stringify,
});

wrapDepr(exports, 'Stringify', {
  dep: 'core.types.Stringify',
  rep: '@lumjs/describe',
  get: () => require('./stringify').Stringify,
});
