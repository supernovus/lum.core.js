// Get the extended type list.
const TYPES = require('./typelist');
const {F, S, N, B, isObj, isArray, isTypedArray} = require('./basics');
const def = require('./def');

const TOSTRING_TYPES     = [TYPES.SY];
const TOSTRING_INSTANCES = [RegExp];
const CUSTOM = [];
const DEF = 
{
  MAXD: 1,
  NEWD: 0,
}

/**
 * Stringify a Javascript value.
 * 
 * Creates a new `Stringify` instance, then passes the
 * first argument to it's `stringify()` method.
 * 
 * This is the primary way to use the Stringify class
 * rather than manually creating an instance of it.
 * 
 * @param {*} what - Passed to `instance.stringify()`
 * @param {(object|number)} [opts] Options for Stringify constructor;
 * 
 * If this is a `number` it's the `opts.maxDepth` option value.
 * 
 * @param {(number|boolean)} [addNew] The `opts.newDepth` option value;
 * 
 * For compatibility with old API. Boolean values are shortcuts:
 * - `false` = `0`
 * - `true`  = `1`
 * 
 * @returns {string} The stringified value
 * 
 * @alias module:@lumjs/core/types.stringify
 * @see module:@lumjs/core/types.Stringify
 * @see module:@lumjs/core/types.Stringify#stringify
 */
function stringify (what, opts={}, addNew=null)
{
  if (typeof opts === N)
  {
    opts = {maxDepth: opts}
  }

  if (typeof addNew === N)
  {
    opts.newDepth = addNew;
  }
  else if (typeof addNew === B)
  {
    opts.newDepth = addNew ? 1 : 0;
  }

  const si = new Stringify(opts);
  return si.stringify(what);
}

/**
 * A class to stringify Javascript values for testing and debugging.
 * 
 * This is NOT meant for serializing data, the output is in a format
 * that's meant to be read by a developer, not parsed by a machine.
 * 
 * Currently directly supports:
 * 
 *  - `function`
 *  - `symbol`
 *  - `TypedArray`
 *  - `Map`
 *  - `Set`
 *  - `Error`
 *  - `RegExp`
 *  - `Object`
 * 
 * Any other JS value types (`number`,`boolean`, `string`, etc.) will
 * be serialized using JSON.
 * 
 * @alias module:@lumjs/core/types.Stringify
 */
class Stringify 
{
  /**
   * Create a new Stringify instance
   * @param {object} [opts] Options; saved to `this.options`
   * @param {number} [opts.maxDepth=1] Max depth to recurse?
   * @param {number} [opts.newDepth=0] Depth to prepend 'new' to strings?
   * @param {boolean} [opts.fnString=false] Fully stringify functions?
   * @param {(Array|function)} [opts.setCustom] Set custom stringifiers;
   * used *INSTEAD* of the globally registered ones.
   * @param {(Array|function)} [opts.addCustom] Add custom stringifiers;
   * used *in addition* to the globally registered ones.
   */
  constructor(opts={})
  {
    this.options = opts;
    this.maxDepth = opts.maxDepth ?? DEF.MAXD;
    this.newDepth = opts.newDepth ?? DEF.NEWD;
    this.seenObjects = new Map(); // object => description
    this.seenDescrip = new Map(); // description => count
    this.strClass = TOSTRING_INSTANCES.slice();
    this.strTypes = TOSTRING_TYPES.slice();

    if (opts.fnString)
    {
      this.strTypes.push(F);
    }

    if (opts.errString)
    {
      this.strClass.push(Error);
    }

    if (Array.isArray(opts.setCustom))
    {
      this.customFn = opts.setCustom.slice();
    }
    else if (typeof opts.setCustom === F)
    {
      this.customFn = [];
      opts.setCustom.call(this, this.customFn);
    }
    else
    { // Start out with the global custom tests.
      this.customFn = CUSTOM.slice();
      if (Array.isArray(opts.addCustom))
      {
        this.customFn.push(...opts.addCustom);
      }
      else if (typeof opts.addCustom === F)
      {
        opts.addCustom.call(this, this.customFn);
      }
    }

  }

  /**
   * Stringify a JS value
   * @param {*} what - Value to stringify
   * @returns {string} A friendly representation of `what`
   */
  stringify(what, curd=0)
  {
    if (this.seenObjects.has(what))
    { // Cached string for this subject already found.
      return this.seenObjects.get(what);
    }

    const recurse = curd < this.maxDepth;
    const addNew  = curd < this.newDepth;
    const whatType = typeof what;
    const strFor = (str) => this._stringFor(what, str);
    
    for (const test of this.customFn)
    { // If there are custom extensions, we check them first.
      const ret = test.call(this, what, curd);
      if (typeof ret === S)
      { // The extension processed the item.
        return strFor(ret);
      }
    }

    // A few types we simply stringify right now.
    if (this.strTypes.includes(whatType)) 
    {
      return strFor(what.toString());
    }

    if (!this.options.fnString && typeof what === F)
    { // Simple format for functions
      return strFor(what.name+'()');
    }
    
    if (isObj(what))
    { // We support a few kinds of objects.

      // Any class instance that we can simply call `toString()` on, let's do that.
      for (const aClass of this.strClass)
      {
        if (what instanceof aClass)
        {
          return strFor(what.toString());
        }
      }

      // A few formatting helpers used below.
      const nameFor = (name=what.constructor.name) => 
        (addNew ? 'new ' : '') + strFor(name);
      
      const container = (content, ps='[', pe=']') =>
      {
        let cstr = nameFor();
        if (recurse)
        {
          cstr += ps;
          if (!Array.isArray(content))
          {
            content = Array.from(content);
          }
          cstr += (content
            .map(item => this.stringify(item, curd+1))
            .join(','));
          cstr += pe;
        }
        return cstr;
      }
      
      if (isTypedArray(what))
      { // This one is pretty simple.
        if (this.options.typedContent)
        {
          return container(what.toString());
        }
        return nameFor();
      }

      if (what instanceof Map)
      {
        return container(what.entries());
      }
      
      if (what instanceof Set)
      {
        return container(what.values());
      }

      if (isArray(what))
      {
        return container(what);
      }

      if (!this.options.errString && what instanceof Error)
      {
        return nameFor(what.name)+'('+JSON.stringify(what.message)+')';
      }

      // If we reached here, it's another kind of object entirely.
      return container(Object.keys(what), '{', '}');

    } // if isObj
    
    // If we reached here, there's no special methods, use JSON.
    return JSON.stringify(what);
  }

  _stringFor(obj, str)
  {
    let count = 0;
    if (this.seenDescrip.has(str))
    {
      count = this.seenDescrip.get(str);
    }
    this.seenDescrip.set(str, ++count);
    str += '#' + count.toString(16).padStart(3, '0');
    this.seenObjects.set(obj, str);
    return str;
  }

  static addCustoms(...testFns)
  {
    for (let fn of testFns)
    {
      if (typeof fn === F)
      {
        CUSTOM.push(fn);
      }
      else
      {
        console.debug({fn, testFns});
        throw new TypeError("Invalid custom stringify function");
      }
    }
  }

  static registerCustoms(registerFn)
  {
    if (typeof registerFn === F)
    {
      registerFn.call(this, this);
    }
    else
    {
      console.debug({registerFn});
      throw new TypeError("Invalid custom registration function");
    }
  }

} // Stringify

// Add some static properties for registerCustoms to use
def(Stringify) 
  ('strClass', {value: TOSTRING_INSTANCES})
  ('strTypes', {value: TOSTRING_TYPES})
  ('customFn', {value: CUSTOM})
  ('DEFAULTS', {value: DEF})

// Export it.
module.exports = {stringify, Stringify};
