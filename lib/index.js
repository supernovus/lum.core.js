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

const types = require('./types');
const {df,lazy} = require('./obj/df');

// Get a bunch of properties from a submodule.
function from(submod)
{
  for (const key in submod)
  {
    df(exports, key, submod[key]);
  }
}

df(exports, 'types', types);
df(exports, 'def',   types.def);
df(exports, 'df',    df);
df(exports, 'lazy',  lazy);

df(exports, 'context', require('./context'));
df(exports, 'state', {value: require('./state')});

// ObjectID stuff is imported directly without registering a sub-module.
from(require('./objectid'));

// These are exported directly, but a meta sub-module also exists.
const meta = require('./meta');
from(meta);
df(exports, 'meta', meta);
df(exports, 'AbstractClass', 
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
lazy(exports, 'opt', () => require('./opt'), {df:{autoDesc: false}});
lazy(exports, 'Enum', () => require('./enum'));
lazy(exports, 'observable', () => require('./observable'));
lazy(exports, 'events', () => require('./events'));
