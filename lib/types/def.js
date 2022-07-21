// Thanks to CJS `require()` rules, recursive dependencies are possible.
const unbound = require('./root').unbound;
const {F, B, S} = require('./js');
const {isObj, isNil, isProperty, doesDescriptor} = require('./basics');
const copy = require('../obj/copyall');

// Shortcut string options.
const SHORTCUTS =
{
  e: {enumerable: true},
  c: {configurable: true},
  w: {writable: true},
  E: {enumerable: false},
  C: {configurable: false},
  W: {writable: false},
}

/**
 * A wrapper around `Object.defineProperty()`.
 * 
 * This has a few features that makes adding properties a lot nicer.
 * It replaces the `prop()` method from the old Lum.js v4.
 * 
 * @param {(object|function)} obj - The object to add a property to.
 * @param {?(string|boolean|object)} name - If a `string`, the property name.
 * 
 *   If this is `null` or `undefined` then the `value` is ignored entirely,
 *   and instead a bound version of this function is created with the
 *   `obj` already passed as the first parameter. Can be useful if you
 *   need to add a lot of properties to the same object.
 * 
 *   If this is a `boolean`, then the same logic as if it was `null` or 
 *   `undefined` will apply, except that an `enumerable` property with this 
 *   value will also be added to the descriptors.
 * 
 * @param {*} value - Used to determine the value of the property.
 * 
 *   If it is an a valid descriptor object (as per `doesDescriptor()`),
 *   it will be used as the descriptor. If it has no `configurable`
 *   property defined, one will be added, and will be set to `true`.
 *   This behaviour may be overridden by the `opts` parameter.
 * 
 *   If this is a `function` and `opts` is a `boolean` or `function`,
 *   then this will be used as a getter or setter (see `opts` for details.)
 * 
 *   Any other value passed here will be used as the `value` in a
 *   pre-canned descriptor, also with `configurable` set to `true`.
 * 
 * @param {*} [opts] - A multi-purpose option.
 * 
 *   If this is an `object` then it is reserved for named options.
 *   The named options `configurable`, `enumerable`, and `writable`
 *   can be used to define default values to the descriptor properties
 *   of the same name.
 * 
 *   If this is a `string` then it is considered a list of single-character
 *   options where the character is the first letter of one of the descriptor
 *   property options. If the character is lowercase then the option value
 *   will be `true`, if it is uppercase then the option value will be `false`.
 *   So for example: `eCW` is the same as:
 *   `{enumerable: true, configurable: false, writable: false}`;
 * 
 *   If `value` and this are both `function` values, then `value` will
 *   be used as a *getter* and this will be used as a *setter*.
 * 
 *   If `value` is a `function` and this is `true`, then `value` will
 *   be used as a *getter* and no *setter* will be assigned.
 * 
 *   If `value` is a `function` and this is `false`, then `value` will
 *   be used as a *setter* and no *getter* will be assigned.
 * 
 *   If `value` is a valid descriptor object, then setting this to `false`
 *   will disable the assumption that it is the descriptor to set.
 *   Setting this to `true` on will instruct the function to make a clone 
 *   of the descriptor object before modifying any properties in it.
 * 
 * @returns {*} Normally the `obj` argument with new property added.
 * 
 *   The exception is if this is a bound copy of the function created
 *   using the syntax described in the `name` parameter documentation.
 *   In that case the return value is the bound copy itself.
 *   While that might seem strange, it allows for chaining in a way
 *   that otherwise would not be possible, take this example:
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

  if (typeof opts === S)
  { // A string of shortcut options.
    const strOpts = opts;
    opts = {};
    for (const tag in SHORTCUTS)
    {
      if (strOpts.includes(tag))
      { // Tag was found, add the rules associated with it.
        copy(opts, SHORTCUTS[tag]);
      }
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

  let desc;

  if (opts !== false && doesDescriptor(value))
  { // The value is a descriptor, let's use it.
    desc = (opts === true) ? copy(value) : value;
  }
  else if (typeof value === F && typeof opts === F)
  { // A getter and setter were both specified.
    desc = {get: value, set: opts};
  }
  else if (typeof value === F && typeof opts === B)
  { // A function value with a boolean opts is a getter or setter.
    const prop = opts ? 'get' : 'set';
    desc = {[prop]: value};
  }
  else 
  { // The value is just a value, so let's assign it.
    desc = {value};
  }

  if (isObj(opts))
  { // If opts is an object, let's look for some supported defaults.
    const cd = (opt, defval) =>
    {
      if (typeof opts[opt] === B && typeof desc[opt] !== B)
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
  } // if isObj(opts)

  // Now after all that, let's actually define the property!
  Object.defineProperty(obj, name, desc);

  return done();

} // def()

module.exports = def;