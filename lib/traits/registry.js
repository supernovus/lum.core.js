"use strict";

const {def,F,S,needObj,needType} = require('../types');
const Trait = require('./trait');

/**
 * Get a trait from the specified registry
 * 
 * The exported function version of this is not generally called directly.
 * Instead use the bound `getTrait()` method of a registry object.
 * 
 * @alias module:@lumjs/core/traits.getTrait
 * 
 * @param {module:@lumjs/core/traits~Registry} registry
 * @param {(string|function)} trait - Trait to get
 * 
 * This should almost always be the name of the trait you want
 * to get out of this registry.
 * 
 * If this happens to be a Trait class constructor already, 
 * it will be returned as is.
 * 
 * @returns {?function} A trait class constructor, or `null` if the
 * specified trait name does not exist in the registry.
 */
function getTrait(registry,trait)
{
  if (typeof trait === S)
  { // Assume a string is the name of a trait in this registry
    trait = registry[trait];
  }

  if (typeof trait === F && Trait.isPrototypeOf(trait))
  {
    return trait;
  }
  else
  {
    console.error("invalid trait", {trait});
    return null;
  }
}

/**
 * Get a bunch of traits from the specified registry
 * 
 * The exported function version of this is not generally called directly.
 * Instead use the bound `getTraits()` method from a registry object.
 * 
 * @alias module:@lumjs/core/traits.getTraits
 * 
 * @param {module:@lumjs/core/traits~Registry} registry 
 * @param {Iterable<(string|function)>} inList - List of traits to get
 * 
 * Every item from this list will be passed to `getTrait()` to get
 * the Trait class constructors for the returned set.
 * 
 * @param {Set} [outSet=new Set] Will be populated with requested traits
 * 
 * @returns {Set} The `outSet` with all traits added to it
 */
function getTraits(registry, inList, outSet)
{
  if (!outSet)
  {
    outSet=new Set();
  }
  else if (!(outSet instanceof Set))
  {
    console.error({inList, outSet});
    throw new TypeError("Invalid Set object");
  }

  for (const ti of inList)
  {
    const tc = getTrait(registry, ti);
    if (tc)
    {
      outSet.add(tc);
    }
  }

  return outSet;
}

/**
 * Register a trait class in a registry
 * 
 * The exported function version of this is not generally called directly.
 * Instead use the bound `registerTrait()` method from a registry object.
 * 
 * @function module:@lumjs/core/traits.registerTrait
 * 
 * @param {module:@lumjs/core/traits~Registry} registry
 * @param {string} name - Name to use for the trait in the registry
 * @param {function} getTrait
 * 
 * If the function passed is a class constructor with the `Trait`
 * class in its prototype chain, it will be used as the trait itself.
 * 
 * If it is just a regular function or closure, it will be used as
 * a lazy-loader that must return the actual class constructor.
 * 
 * @param {boolean} [overwrite=false] 
 * 
 * @returns {module:@lumjs/core/traits~Registry} The registry object
 * 
 * As a special exception to the argument type checking, if you omit both
 * arguments, then the registry object will be returned immediately.
 * 
 * @throws {TypeError} If `name` or `getTrait` were not valid values
 */

function registerTrait(registry, name, getTrait, overwrite=false)
{
  if (name === undefined && getTrait === undefined)
  { // A special case, return the registry object
    return registry;
  }

  needType(S, name,  'invalid trait name');
  needType(F, getTrait, 'invalid trait loader value');

  if (!overwrite && registry[name] !== undefined)
  {
    console.error("trait already registered", {name,getTrait,registry});
    return registry;
  }

  if (Trait.isPrototypeOf(getTrait))
  { // Make it available directly.
    def(registry, name, getTrait, def.e);
  }
  else
  { // Lazy-loading engaged.
    def.lazy(registry, name, getTrait, def.e);
  }

  return registry;
}

/**
 * Build a Trait registry.
 * 
 * @param {object} [registry={}] Object for the registry
 * 
 * Generally the `exports` from a Node.js module would be good here.
 * The object will have several properties and methods assigned to it
 * see {@link module:@lumjs/core/traits~Registry} for details. 
 * 
 * @returns {function} A 
 * @alias module:@lumjs/core/traits.makeRegistry
 */
function makeTraitRegistry(registry={})
{
  needObj(registry, false, 'invalid trait registry object');

  def(registry, 'Trait', Trait);
  def(registry, 'getTrait', getTrait.bind(registry, registry));
  def(registry, 'getTraits', getTraits.bind(registry, registry));
  def(registry, 'registerTrait', registerTrait.bind(registry, registry));

  return registerTrait;
}

module.exports = makeTraitRegistry;
