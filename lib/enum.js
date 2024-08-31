const {S,F,def,notNil,isObj,needObj,TYPES} = require('./types');
const {InternalObjectId} = require('./objectid');

/**
 * A pseudo-module describing everything associated with `core.Enum`
 * @module @lumjs/core/enum
 */

// Internal id instances should never be exported.
const EID = '@lumjs/core/enum';
const ENUM_ID = new InternalObjectId({name: EID});
const isEnum = ENUM_ID.isFunction();
const EOPT = Symbol(EID+':opts');

/**
 * A function to build magic Enum objects.
 * 
 * Like the built-in `Symbol`, this is called as a function, not a constructor.
 * 
 * This is the *actual* exported value from the `enum` pseudo-module.
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
 * If the `opts` is an _open_ `Enum` object, then 
 * 
 * @param {(bool|function)} [opts.symbols=false] Use `Symbol` property values.
 * 
 * If this is a `function`, it will be passed the name that would be used as
 * the symbol key, and must return the actual key string to use, or any
 * non-string value to disable the use of symbols for that name.
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
 * @param {bool} [opts.open=false] Should the Enum be open to be extended?
 * 
 * - If `true` the Enum object won't be locked, and the `opts` will be saved.
 * - If `false` (default value) we use `Object.freeze()` to lock the object.
 * 
 * @param {(bool|object|Array)} [opts.lock=null] If this is *not* `null`, 
 * use {@see module:@lumjs/core/obj.lock lock()} instead of `Object.freeze()`.
 * 
 * If `opts.open` is `false`, the supported values are:
 * 
 * - `Array`: The `[cloneable, cloneOpts, useSeal]` parameters for `clone()`.
 * - `object`: The `cloneOpts` parameter for `clone()`.
 * - `bool`: The `cloneable` parameter for `clone()`.
 * 
 * If `opts.open` is `true`, this only supports an `object` which will be
 * used as the `opts` for {@see module:@lumjs/core/obj.addLock addLock()},
 * which will be called on the open Enum object.
 * 
 * @param {bool} [opts.configurable=false] Enum properties are configurable?
 * 
 * This option is ignored if `opts.open` is `false`.
 * 
 * @param {bool} [opts.enumerable=true] Enum properties are enumerable?
 * 
 * @returns {object} A magic Enum object.
 * @throws {TypeError} If an invalid value was passed.
 * @alias module:@lumjs/core/enum.Enum
 */
function Enum (spec, opts={})
{
  needObj(spec, "Enum spec must be an object")
  needObj(opts, "Enum options must be an object")

  const isExisting = isEnum(opts);
  const anEnum = isExisting ? opts : ENUM_ID.tag({});
  if (isExisting)
  {
    opts = anEnum[EOPT];
    if (!isObj(opts))
    {
      throw new Error("existing Enum was not open for changes");
    }
  }

  const configurable = opts.configurable ?? false;
  const enumerable   = opts.enumerable   ?? true;

  const symKey
    = (typeof opts.symbols === F) 
    ? opts.symbols 
    : v => v;

  function getVal (name, def)
  {
    if (opts.symbols)
    { // We want to use symbols.
      const key = symKey(name);
      if (opts.globals)
      {
        return Symbol.for(key);
      }
      else
      {
        return Symbol(key);
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
    if (opts.open)
    { // Save the last counter value into the opts
      opts.counter = counter;
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

  if (opts.open)
  {
    if (!isExisting)
    { // Save the options into a special Symbol property.
      def(anEnum, EOPT, {value: opts});
      if (isObj(opts.lock))
      { // Add lock() method.
        addLock(anEnum, opts.lock);
      }
    }
  }
  else
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
def(Enum, 'is', isEnum);

/**
 * Is a value an *Enum* magic object?
 * @function module:@lumjs/core/types.isEnum
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
const {lock,addLock} = require('./obj/lock');
