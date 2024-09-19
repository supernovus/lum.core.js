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

/// see also: `docs/src/index.js`

// Get a bunch of properties from a submodule.
function from(submod)
{
  for (const key in submod)
  {
    def(exports, key, submod[key]);
  }
}

const types = require('./types');
const {def,lazy} = types;

def(exports, 'types', types);
def(exports, 'def',   def);
def(exports, 'lazy',  lazy);

def(exports, 'context', require('./context'));
def(exports, 'state', {value: require('./state')});

// ObjectID stuff is imported directly without registering a sub-module.
from(require('./objectid'));

// These are exported directly, but a meta sub-module also exists.
// Unlike most sub-modules there is no `meta` property in the main library.
const meta = require('./meta');
from(meta);
def(exports, 'AbstractClass', 
{
  get() { return meta.AbstractClass; }
});

lazy(exports, 'arrays', () => require('./arrays'));
lazy(exports, 'maps', () => require('./maps'));
lazy(exports, 'strings', () => require('./strings'));
lazy(exports, 'flags', () => require('./flags'));
lazy(exports, 'obj', () => require('./obj'));
lazy(exports, 'console', () => require('./console'));
lazy(exports, 'traits', () => require('./traits'));
lazy(exports, 'opt', () => require('./opt'), {def:{autoDesc: false}});
lazy(exports, 'Enum', () => require('./enum'));
lazy(exports, 'observable', () => require('./observable'));
lazy(exports, 'events', () => require('./events'));
