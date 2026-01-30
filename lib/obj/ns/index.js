// Import required bits here.
const 
{
  B, S,
  root, isObj, needObj, def, nonEmptyArray, isNil,
  doesDescriptorTemplate,
} = require('../../types');

const {df} = require('../df');
const cp = Object.assign;

const NS = exports.NS = require('./formats');
const {isFormat} = NS;

// TODO: use the new formats!

/**
 * [INTERNAL] Generate an error message for nsString/nsArray functions.
 * @alias module:@lumjs/core/obj.SOA
 * @param {?string} [name] Name to prefix to error message.
 * @param {boolean} [err=true] Return an error instance?
 * @returns {(TypeError|string)} Depends on `err` argument.
 */
function SOA(name, err=true)
{
  const msg = (typeof name === S) 
    ? name + ' ' + SOA.message 
    : SOA.message;
  return err ? (new TypeError(msg)) : msg;
}
SOA.message = "must be a string or non-empty array";
df(SOA, 'toString', function() { return this.message; });

exports.SOA = SOA;

/**
 * Get a namespace path array.
 * 
 * If it's already an array, return it as is.
 * If it's a string, split it into an array (using one of our formats).
 * 
 * @param {(string|string[])} ns - A dotted string, or array of paths.
 * @param {(object|string)} [opts] Options.
 * 
 * If this is a string it will be used as `opts.name`.
 * 
 * @param {string} [opts.name="Namespace"] Name to use in the SOA error.
 * @param {(module:@lumjs/core/obj.NS~Format|Array)} [opts.format] Format.
 * 
 * You can specify a single format, or an array of formats, in which case
 * the canParse() method will be called on each of them and the first one
 * that returns true will be used. If none return true, the last one listed
 * will be used.
 * 
 * If this is not specified, then we will call the canParse() method on
 * Pointer, JSPath, and Simple (in that order) and use the first one that
 * returns true (or the last one regardless).
 * 
 * @returns {string[]} 
 * @alias module:@lumjs/core/obj.nsArray
 */
function nsArray(ns, opts={})
{
  if (typeof opts === S) opts = {name: opts};

  if (typeof ns === S)
  {
    let format;

    if (isFormat(opts.format) || Array.isArray(opts.format))
    {
      format = opts.format;
    }
    else
    {
      format = NS.Defaults;
    }

    if (Array.isArray(format))
    {
      let formats = format;
      for (format of formats)
      {
        if (isFormat(format) && format.canParse(ns))
        {
          break;
        }
      }
    }

    if (!isFormat(format))
    { // This shouldn't normally happen, but...
      throw new TypeError("No valid format found");
    }

    return format.parse(ns);
  }
  else if (!nonEmptyArray(ns)) 
  {
    throw SOA(opts.name ?? 'Namespace');
  }
  return ns;
}

exports.nsArray = nsArray;

/**
 * Get a namespace path string.
 * 
 * If it's already a string, return it as is.
 * If it's an array of strings, join the elements with a delimiter.
 * 
 * @param {(string|string[])} ns - A dotted string, or array of paths.
 * @param {(object|string)} [opts] Options.
 * 
 * If this is a string, it will be used as `opts.name`.
 *
 * @param {string} [opts.name="Namespace"] Name to use in the SOA error.
 * @param {(module:@lumjs/core/obj.NS~Format|Array)} [opts.format] Format.
 * 
 * You can specify a single format, or an array of formats, in which case
 * the canStringify() method will be called on each of them and the first one
 * that returns true will be used. If none return true, the last one listed
 * will be used.
 * 
 * If this is not specified, then we will check for the legacy `opts.join`
 * and/or `opts.prefix` options. If at least one of them was found an ad-hoc
 * format using NS.Simple as a template will be created, composing the `opts`
 * as overridden format object properties. As making a custom format is
 * quite simple, both of the legacy options are deprecated.
 * 
 * If neither this option nor any of the legacy options were specified,
 * we will call the canStringify() method on Simple, JSPath, and Pointer
 * (in that order), and use the first one that returns true.
 * 
 * @param {string} [opts.join] Custom format delimiter character(s). 
 * 
 * This is **DEPRECATED** and will be removed in v2.x.
 * 
 * @param {string} [opts.prefix] Custom format prefix.
 * 
 * This is **DEPRECATED** and will be removed in v2.x.
 * 
 * @returns {string}
 * @throws {TypeError} If `ns` was not a valid value.
 * @alias module:@lumjs/core/obj.nsString
 */
function nsString(ns, opts={})
{
  if (typeof opts === S) opts = {name: opts};

  if (nonEmptyArray(ns))
  {
    let format;

    if (isFormat(opts.format) || Array.isArray(opts.format))
    {
      format = opts.format;
    }
    else if (typeof opts.join === S || typeof opts.prefix === S)
    {
      format = cp({}, NS.Simple, opts);
    }
    else
    {
      format = NS.Defaults.slice().reverse();
    }

    if (Array.isArray(format))
    {
      let formats = format;
      for (format of formats)
      {
        if (isFormat(format) && format.canStringify(ns))
        {
          break;
        }
      }
    }

    if (!isFormat(format))
    { // This shouldn't normally happen, but...
      throw new TypeError("No valid format found");
    }

    return format.stringify(ns);
  }
  else if (typeof ns !== S)
  {
    throw SOA(opts.name ?? 'Namespace');
  }
  return ns;
}

exports.nsString = nsString;

/**
 * Get a (nested) property from an object with a given path.
 *
 * @param {(object|function)} obj - Object we're looking in.
 * @param {(string|Array)} proppath - Property path we're looking for.
 * 
 * Generally a string of dot (`.`) separated nested property names.
 * 
 * @param {(object|boolean)} [opts] Options changing the behaviours.
 * 
 * If this is a `boolean` it's assumed to be the `opts.log` option;
 * using a boolean is deprecated and will be removed in v2.x.
 * 
 * Any options supported by nsArray() may also be specified here.
 * 
 * @param {boolean} [opts.log=false] Log errors for missing namespaces?
 * @param {boolean} [opts.allowFun=true] Allow `obj` to be a `function` ?
 * 
 * By default both `object` and `function` are valid `obj` argument values;
 * if this is set to `false`, only `object` values will be allowed.
 * 
 * @param {*} [opts.default] A default value if the namespace is not found.
 * 
 * @return {*} The property if found, or `opts.default` if not.
 * @alias module:@lumjs/core/obj.getObjectPath
 */
function getObjectPath(obj, proppath, opts={})
{
  if (typeof opts === B)
    opts = {log: opts};
  else if (!isObj(opts))
    opts = {};

  needObj(obj, (opts.allowFun ?? true));

  proppath = nsArray(proppath, opts);

  for (let p = 0; p < proppath.length; p++)
  {
    const propname = proppath[p];
    if (obj[propname] === undefined)
    { // End of search, sorry.
      if (opts.log)
      {
        console.error("Object property path not found", 
          propname, p, proppath, obj);
      }
      return opts.default;
    }
    obj = obj[propname];
  }

  return obj;
}

exports.getObjectPath = getObjectPath;

/**
 * Create a nested property path if it does not exist.
 * 
 * @param {(object|function)} obj - Object the property path is for.
 * @param {(string|Array)} proppath - Property path to create.
 * @param {(object|boolean)} [opts] Options changing the behaviours.
 * 
 * If this is a `boolean` it's assumed to be the `opts.overwrite` option;
 * using a boolean is deprecated and will be removed in v2.x.
 * 
 * Any options supported by nsArray() may also be specified here.
 * 
 * @param {*} [opts.value] A value to assign to the last property path.
 * @param {boolean} [opts.overwrite=false] Allow overwriting property paths.
 * 
 * Only applicable if `opts.value` was also specified.
 * 
 * @param {object} [opts.desc] Descriptor rules for defining the properties.
 * 
 * Must NOT contain `value`, `get`, or `set` properties.
 * Only, `configurable`, `enumerable`, and `writable` are supported.
 * Will be ignored if `opts.assign` is `true`.
 * 
 * NOTE: This option will likely be removed in version 2.x, as you can
 * use `opts.df` to set descriptor rules instead.
 * 
 * @param {boolean} [opts.assign=false] Use direct assignment instead of `def()`.
 * @param {(boolean|object)} [opts.df] Use `df()` instead of `def()`?
 * 
 * If this is an object, it will be used as options for the df() function.
 * 
 * NOTE: In version 2.x, the boolean use of this option will be removed, 
 * as df() will replace def() entirely in that release.
 * 
 * @param {boolean} [opts.allowFun=true] See getObjectPath() for details.
 * @param {boolean} [opts.returnThis=false] Return `this` variable.
 * @param {boolean} [opts.returnObj=false] Return the `obj` parameter.
 * @return {*} Generally the last object in the nested property paths.
 *   Unless one of `opts.returnThis` or `opts.returnObj` was `true`.
 * @alias module:@lumjs/core/obj.setObjectPath
 */
function setObjectPath(obj, proppath, opts={})
{
  if (typeof opts === B)
    opts = {overwrite: opts};
  else if (!isObj(opts))
    opts = {};

  needObj(obj, (opts.allowFun ?? true));

  const setprop = opts.df ? df : def;
  const propopts = cp({}, opts.def, opts.df);

  proppath = nsArray(proppath, opts);

  let assign;
  if (opts.assign)
  { // Use direct property assignment.
    assign = (t,p,v) => t[p] = v;
  }
  else if (doesDescriptorTemplate(opts.desc))
  { // An explicit descriptor.
    assign = (t,p,v) => 
    {
      const desc = cp({}, opts.desc);
      desc.value = v;
      setprop(t,p,desc,propopts);
    }
  }
  else
  { // Use def with default descriptor.
    assign = (t,p,v) => setprop(t,p,v,propopts);
  }

  let cns = obj;
  const nsc = proppath.length;
  const lastns = nsc - 1;

  //console.debug("setObjectPath", {obj, proppath, opts, nsc, arguments});

  for (let n = 0; n < nsc; n++)
  {
    const ns = proppath[n];
    //console.debug("setObjectPath:loop", {n, ns, cns});

    if (cns[ns] === undefined)
    { // Nothing currently here. Let's fix that.
      if (n == lastns && opts.value !== undefined)
      { // It's the end of the world as we know it.
        assign(cns, ns, opts.value);
      }
      else 
      { // Create a new empty object.
        assign(cns, ns, {});
      }
    }
    else if (opts.overwrite && n == lastns && opts.value !== undefined)
    { // We have a defined value, and overwrite mode is on.
      assign(cns, ns, opts.value);
    }

    cns = cns[ns];
  }

  if (opts.returnThis)
  {
    return this;
  }
  else if (opts.returnObj)
  {
    return obj;
  }
  else
  { // Default is to return the last namespace object.
    return cns;
  }
}

exports.setObjectPath = setObjectPath;

/**
 * Delete a nested property from an object.
 * 
 * @param {(object|function)} obj - Object we're operating on.
 * @param {(string|Array)} proppath - Property path we want to remove.
 * 
 * Generally a string of dot (`.`) separated nested property names.
 * 
 * The last property name in the path will be the one that is deleted 
 * from its parent object.
 * 
 * @param {object} [opts] Options for getObjectPath() and nsArray().
 * @returns {*} The value that was removed; or `undefined` if the
 * proppath didn't resolve to a defined value.
 */
function delObjectPath(obj, proppath, opts={})
{
  proppath = nsArray(proppath, opts);
  const rmProp = proppath.pop();
  const rmFrom = proppath.length
    ? getObjectPath(obj, proppath, opts)
    : obj;

  if (isNil(rmFrom))
  { // Nothing to remove from
    return undefined;
  }

  const removed = rmFrom[rmProp];
  delete rmFrom[rmProp];
  return removed;
}

exports.delObjectPath = delObjectPath;

/**
 * Build a simple factory object for working with property paths.
 * 
 * @param {(object|function)} value - The target object.
 * @param {object} [opts] Default options for the *ObjectPath() functions.
 * @returns {object} A frozen factory object.
 * 
 * Has `get(path,opts)`, `set(path,opts)`, and `del(path,opts)` methods, 
 * which are wrappers for getObjectPath(), setObjectPath(), 
 * and delObjectPath() respectively.
 * 
 * Also has `value` and `opts` properties for the arguments.
 */
function nsFactory(value, opts={})
{
  const getOpts = (po) => cp({}, opts, po);

  const factory = 
  {
    value,
    opts,
    get(pp,po) 
    { 
      return getObjectPath(value, pp, getOpts(po));
    },
    set(pp,po)
    { 
      setObjectPath(value, pp, getOpts(po));
      return this;
    },
    del(pp,po)
    { 
      delObjectPath(value, pp, getOpts(po));
      return this;
    },
  }

  return Object.freeze(factory);
}

exports.nsFactory = nsFactory;

/**
 * Get a global namespace path if it exists.
 *
 * This literally just calls `getObjectPath()` on the `root` object.
 * 
 * @deprecated
 * @param {(string|Array)} proppath - Property path we're looking for.
 *   Generally a string of dot (`.`) separated nested property names.
 * @param {object} [opts] See `getObjectPath()` for details.
 * @return {*} The property if found, or `opts.default` if not.
 * @alias module:@lumjs/core/obj.getNamespace
 * @see module:@lumjs/core/obj.getObjectPath
 */
function getNamespace(namespaces, opts={})
{
  return getObjectPath(root, namespaces, opts);
}

exports.getNamespace = getNamespace;

/**
 * Create a global namespace path if it does not exist.
 * 
 * This literally just calls `setObjectPath()` on the `root` object.
 * 
 * @deprecated
 * @param {(string|Array)} proppath - Property path to create.
 * @param {object} [opts] See `setObjectPath()` for details.
 * @return {*} See `setObjectPath()` for details.
 * @alias module:@lumjs/core/obj.setNamespace
 * @see module:@lumjs/core/obj.setObjectPath
 */
function setNamespace(namespaces, opts={})
{
  return setObjectPath(root, namespaces, opts);
}

exports.setNamespace = setNamespace;
