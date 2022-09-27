// Thanks to CJS `require()` rules, recursive dependencies are possible.
const unbound = require('./root').unbound;
const {F, B} = require('./js');
const {isObj, isNil, isProperty, doesDescriptor} = require('./basics');
const copy = require('../obj/copyall');

// A really really cheap version of clone().
const clone = obj => copy({}, obj);

/**
 * A wrapper around `Object.defineProperty()`.
 * 
 * This has a few features that makes adding properties a lot nicer.
 * It replaces the `prop()` method from the old Lum.js v4.
 * 
 * @param {(object|function)} obj - The object to add a property to.
 * @param {?(string|symbol|boolean|object)} name 
 * If a `string` or `symbol`, it's the property name.
 * 
 * If this is `null` or `undefined` then the `value` is ignored entirely,
 * and instead a bound version of this function is created with the
 * `obj` already passed as the first parameter, and any of the options from
 * `opts` added to a new default set of options bound to the function.
 * Can be useful if you need to add a lot of properties to the same object.
 * 
 * If this is a `boolean`, then the same logic as if it was `null` or 
 * `undefined` will apply, except that an `enumerable` property with this 
 * value will also be added to the descriptors.
 * 
 * If this is an `object`, we also ignore `value` entirely, as each of 
 * the keys of this object will be used as the name of a property, 
 * and the value associated with the key will be the value to assign it.
 * 
 * @param {*} value - Used to determine the value of the property.
 * 
 * If it is an a valid descriptor object (as per `doesDescriptor()`),
 * it will be used as the descriptor. If it has no `configurable`
 * property defined, one will be added, and will be set to `true`.
 * This behaviour may be overridden by the `opts` parameter.
 * 
 * If this and `opts` are both `function` values, then this will
 * be used as a *getter*, and `opts` will be used a *setter*.
 * 
 * Any other value passed here will be used as the `value` in a
 * pre-canned descriptor, also with `configurable` set to `true`.
 * 
 * @param {*} [opts] - A multi-purpose option.
 * 
 * If this is an `object` then it is reserved for named options.
 * 
 * The named options `configurable`, `enumerable`, and `writable`
 * can be used to define default values to the descriptor properties
 * of the same name.
 * 
 * If `value` and this are both `function` values, then `value` will
 * be used as a *getter* and this will be used as a *setter*.
 * 
 * If this is `true`, it sets `opts.cloneDesc` to `true`.
 *   
 * If this is `false`, it sets `opts.autoDesc` to `false`.
 * 
 * This defaults to `undefined`, except in bound functions.
 * 
 * @param {boolean} [opts.autoDesc=true] Automatically detect descriptors?
 * 
 * If `true` (the default value) then the automatic descriptor detection
 * is used any time the `value` is an `object`.
 * 
 * If `false` the descriptor detection is disabled, and we'll always
 * wrap all values in a new internal descriptor.
 * 
 * @param {boolean} [opts.cloneDesc=false] Clone descriptors?
 * 
 * If `true` then we'll clone detected descriptors before making
 * any changes to them.
 * 
 * If `false` (the default value), we'll use passed descriptors
 * directly, so any changes will be made on the original.
 * 
 * @param {boolean} [opts.configurable=true] Default `configurable` value 
 * @param {boolean} [opts.enumerable=false] Default `enumerable` value
 * @param {boolean} [opts.writable=false] Default `writable` value
 * 
 * Only used with *data descriptors* and will be ignored with
 * *accessor* descriptors.
 * 
 * @returns {*} Normally the `obj` argument with new property added.
 * 
 * The exception is if this is a bound copy of the function created
 * using the syntax described in the `name` parameter documentation.
 * In that case the return value is the bound copy itself.
 * While that might seem strange, it allows for chaining in a way
 * that otherwise would not be possible, take this example:
 * 
 * ```
 *   def(myObj)('name', "Bob")('age', 42);
 * ```
 * 
 * @alias module:@lumjs/core/types.def
 */
function def(obj, name, value, opts)
{
  const isBound // Is this a 'bound' def function?
    = !unbound(this, true, true) 
    && typeof this.bound === F;

  // When we're finished, return this value.
  const done = () => 
  { 
    if (isBound)
    { // Bound version, returns itself recursively.
      return this.bound;
    }
    else 
    { // Not bound, or doesn't have a reference to itself.
      return obj;
    }
  }

  if (isBound && isNil(opts))
  { // We'll use `this` as the options.
    opts = this;
  }

  if (isObj(name))
  { // Assume it's a map of {name: value} entries.
    for (const key in name)
    {
      def(obj, key, name[key], opts);
    }
    // Okay, we're done now.
    return done();
  }
  else if (isNil(name) || typeof name === B)
  { // Create a fresh binding context for the bound function.
    const bind = {};

    if (isObj(opts))
    { // Copy our existing options as defaults.
      copy(bind, opts);
    }

    if (typeof name === B)
    { // A boolean `name` overrides the enumerable option.
      bind.enumerable = name;
    }

    // Create a bound function.
    const bound = def.bind(bind, obj);
    // Add a reference to the function in the binding context.
    bind.bound = bound;
    // And a reference to the binding options from the function.
    bound.$this = bind;

    return bound;
  }
  else if (!isProperty(name))
  { // That's not valid.
    throw new TypeError("Property name must be a string or a Symbol");
  }

  function getOpt(name, defVal)
  {
    const revVal = !defVal;
    if (isObj(opts) && typeof opts[name] === B)
    { // Found the option.
      return opts[name];
    }
    else if (opts === revVal)
    { // A special default rule was found.
      return revVal;
    }
    else 
    { // Return the default.
      return defVal;
    }
  }

  const autoDesc  = getOpt('autoDesc',  true);
  const cloneDesc = getOpt('cloneDesc', false);

  let desc;

  if (autoDesc && doesDescriptor(value))
  { // The value is a descriptor, let's use it.
    desc = cloneDesc ? clone(value) : value;
  }
  else if (typeof value === F && typeof opts === F)
  { // A getter and setter were both specified.
    desc = {get: value, set: opts};
  }
  else 
  { // The value is just a value, so let's assign it.
    desc = {value};
  }

  const cd = (opt, defval) =>
  {
    if (typeof desc[opt] === B) 
    { // Property was set explicitly.
      return;
    }
    else if (isObj(opts) && typeof opts[opt] === B)
    { // Default descriptor option specified in `opts`
      desc[opt] = opts[opt];
    }
    else if (typeof defval === B)
    { // A fallback default. 
      desc[opt] = defval;
    }
  }

  cd('configurable', true);
  cd('enumerable');
  if (desc.get === undefined && desc.set === undefined)
  { // Only look for this one on data descriptors.
    cd('writable');
  }

  // Now after all that, let's actually define the property!
  Object.defineProperty(obj, name, desc);

  return done();

} // def()

module.exports = def;