const {S,def,notNil,isObj,needObj,TYPES} = require('./types');
const {InternalObjectId} = require('./objectid');

// Internal id instances should never be exported.
const ENUM_ID = new InternalObjectId({name: '$Enum'});

/**
 * A function to build magic Enum objects.
 * 
 * Like the built-in `Symbol`, this is called as a function, not a constructor.
 * 
 * @param {(string[]|object)} spec - May be in one of two formats:
 * 
 * - An `Array` of strings. Each string represents the name of an Enum 
 *   property name. The property value will be automatically determined
 *   based on the options. The default is a series of sequential integers 
 *   starting at `0`.
 * 
 * - A plain object used as a map of property names to underlying values.
 *   In most cases the value can be whatever you want and will be directly
 *   mapped as is. However if `opts.symbols` is `true`, and the value is a
 *   string, the string will be used as the name for the symbol rather than
 *   the property name.
 * 
 * @param {object} [opts] Options for creating the Enum
 * 
 * @param {bool} [opts.symbols=false] Use `Symbol` property values.
 * 
 * @param {bool} [opts.globals=false] Use `Symbol.for()` property values.
 * 
 * This option is only used if `opts.symbols` is `true`.
 * 
 * @param {bool} [opts.strings=false] The property name is also the value.
 * 
 * This is only used if `spec` is an `Array`, and `opts.symbols` is `false`.
 * 
 * @param {bool} [opts.flags=false] Use binary flag property values.
 * 
 * This is only used if `spec` is an `Array`, and both `opts.symbols` and
 * `opts.strings` are `false`.
 * 
 * This handles incrementing automatically, so: `[1,2,4,8,16,...]`
 * 
 * @param {number} [opts.counter] The starting value when auto-incrementing.
 * 
 * The default value is `1` if `opts.flags` is `true` or `0` otherwise.
 * 
 * @param {bool} [opts.open=false] If `true` the Enum object won't be locked.
 * If `false`, by default we use `Object.freeze()` to lock the object.
 * 
 * @param {(bool|object|Array)} [opts.lock=null] If this is *not* `null`, 
 * use {@see module:@lumjs/core/obj.lock lock()} instead of `Object.freeze()`.
 * 
 * Only used if `opts.open` is `false`. The supported values are:
 * 
 * - `Array`: The `[cloneable, cloneOpts, useSeal]` parameters for `clone()`.
 * - `object`: The `cloneOpts` parameter for `clone()`.
 * - `bool`: The `cloneable` parameter for `clone()`.
 * 
 * @param {bool} [opts.configurable=false] Enum properties are configurable?
 * 
 * This option is ignored if `opts.open` is `false`.
 * 
 * @param {bool} [opts.enumerable=true] Enum properties are enumerable?
 * 
 * @returns {object} A magic Enum object.
 * @throws {TypeError} If an invalid value was passed.
 * @exports module:@lumjs/core/enum
 */
function Enum (spec, opts={})
{
  needObj(spec, "Enum spec must be an object")
  needObj(opts, "Enum options must be an object")

  const anEnum = ENUM_ID.tag({});

  const configurable = opts.configurable ?? false;
  const enumerable   = opts.enumerable   ?? true;

  function getVal (name, def)
  {
    if (opts.symbols)
    { // We want to use symbols.
      if (opts.globals)
      {
        return Symbol.for(name);
      }
      else
      {
        return Symbol(name);
      }
    }
    else
    { // Use the default.
      return def;
    }
  }

  function addVal(pName, sName, inVal)
  {
    const desc = {configurable, enumerable};
    desc.value = getVal(sName, inVal);
    def(anEnum, pName, desc);
  }

  if (Array.isArray(spec))
  { // An array of strings is expected.
    let counter = opts.counter ?? (opts.flags ? 1 : 0);

    for (const name of spec)
    {
      if (typeof name !== S)
      {
        throw new TypeError("Non-string passed in Enum object");
      }

      const val 
        = opts.strings 
        ? name 
        : counter;

      addVal(name, name, val);

      if (opts.flags)
      { // Increment the binary flag counter.
        counter *= 2;
      }
      else
      { // Increment a regular counter.
        counter++;
      }
    }
  }
  else
  { // An object mapping of property name to value.
    for (const pName in spec)
    {
      const val = spec[pName];
      const sName = (typeof val === S) ? val : pName;
      addVal(pName, sName, val);
    }
  }

  if (!opts.open)
  {
    if (notNil(opts.lock))
    { // Use lock() function.
      let lockOpts;
      if (Array.isArray(opts.lock))
      { // Specified the lock parameters as an array.
        lockOpts = opts.lock;
      }
      else if (isObj(opts.lock))
      { // An object is assumed to be the `cloneOpts` parameter.
        lockOpts = [true, opts.lock, false];
      }
      else if (typeof opts.lock === B)
      { // Boolean is assumed to be the `cloneable` parameter.
        lockOpts = [opts.lock, null, false];
      }
      else 
      { // Anything else is invalid.
        throw new TypeError('opts.lock was not a valid value');
      }
      return lock(anEnum, ...lockOpts);
    }
    else
    { // Use Object.freeze()
      return Object.freeze(anEnum);
    }
  }

  return anEnum;

} // Enum

/**
 * Is a value an *Enum* magic object?
 * @function module:@lumjs/core/enum.is
 * @param {*} obj - The expected object/function to test.
 * @returns {boolean}
 */
const isEnum = ENUM_ID.isFunction()
def(Enum, 'is', isEnum);

/**
 * Is a value an *Enum* magic object?
 * @name module:@lumjs/core/types.isEnum
 * @function
 * @param {*} v - The value to test.
 * @returns {boolean}
 * @see module:@lumjs/core/enum.is
 */

/**
 * Extension type for {@link module:@lumjs/core/enum} magic objeccts.
 * @memberof module:@lumjs/core/types.TYPES
 * @member {string} ENUM - Is an Enum object?
 */
TYPES.add('ENUM', 'enum', isEnum, 'isEnum');

module.exports = Enum;

// Loading this at the end.
const {lock} = require('./obj/lock');
