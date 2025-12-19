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
const meta = require('./meta');

exports = module.exports = 
{
  context: require('./context'),
  def: types.def,  // ← TODO: nix in 2.x
  df,
  Enum: require('./enum'),
  env: require('./env'),
  flags: require('./flags'),
  lazy,
  maps: require('./maps'),
  meta,
  ...(meta), // ← TODO: nix in 2.x
  ...(require('./objectid')),
  // obj: require('./obj'), // ← TODO: uncomment in 2.x
  opt: require('./opt'),
  state: require('./state'),
  strings: require('./strings'),
  types,
}

// ↓ TODO: nix everything below here in 2.x 

df(exports, 'AbstractClass', 
{
  get() { return meta.AbstractClass; }
});

lazy(exports, 'arrays', () => require('./arrays'));
lazy(exports, 'obj', () => require('./obj'));
lazy(exports, 'console', () => require('./console'));
lazy(exports, 'traits', () => require('./traits'));
lazy(exports, 'observable', () => require('./observable'));
lazy(exports, 'events', () => require('./events'));
