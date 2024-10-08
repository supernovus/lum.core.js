// Import required bits here.
const 
{
  B, S,
  root, isObj, needObj, def, nonEmptyArray, isNil, notNil,
  doesDescriptorTemplate,
} = require('../types');

/**
 * Need a String or Array
 * @alias module:@lumjs/core/obj.SOA
 */
function SOA(name, err=true)
{
  const msg = (typeof name === S) 
    ? name + ' ' + SOA.message 
    : SOA.message;
  return err ? (new TypeError(msg)) : msg;
}
SOA.message = "must be a string or non-empty array";
def(SOA, 'toString', function() { return this.message; });

exports.SOA = SOA;

/**
 * Get a namespace path string.
 * 
 * If it's already a string, return it as is.
 * If it's an array of strings, join the elements with a `.` character.
 * 
 * @param {(string|string[])} ns - A dotted string, or array of paths.
 * @param {*} name - Name to use in the SOA error 
 * @returns {string} 
 * @alias module:@lumjs/core/obj.nsString
 */
function nsString(ns, name='Namespace')
{
  if (nonEmptyArray(ns))
  {
    return ns.join('.');
  }
  else if (typeof ns !== S)
  {
    throw SOA(name);
  }
  return ns;
}

exports.nsString = nsString;

/**
 * Get a namespace path array.
 * 
 * If it's already an array, return it as is.
 * If it's a string, split it into an array, with the `.` delimiter.
 * 
 * @param {(string|string[])} ns - A dotted string, or array of paths.
 * @param {*} name - Name to use in the SOA error 
 * @returns {string[]} 
 * @alias module:@lumjs/core/obj.nsArray
 */
function nsArray(ns, name='Namespace')
{
  if (typeof ns === S)
  {
    return ns.split('.');
  }
  else if (!nonEmptyArray(ns)) 
  {
    throw SOA(name);
  }
  return ns;
}

exports.nsArray = nsArray;

/**
 * Get a (nested) property from an object with a given path.
 *
 * @param {(object|function)} obj - Object we're looking in.
 * @param {(string|Array)} proppath - Property path we're looking for.
 *   Generally a string of dot (`.`) separated nested property names.
 * @param {(object|boolean)} [opts] Options changing the behaviours.
 *   If this is a `boolean` it's assumed to be the `opts.log` option.
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

  proppath = nsArray(proppath);

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
 * @param {object} [opts] Options changing the behaviours.
 * @param {*} [opts.value] A value to assign to the last property path.
 * @param {boolean} [opts.overwrite=false] Allow overwriting property paths.
 *   Only applicable if `opts.value` was also specified.
 * @param {object} [opts.desc] Descriptor rules for defining the properties.
 *   Must NOT contain `value`, `get`, or `set` properties.
 *   Only, `configurable`, `enumerable`, and `writable` are supported.
 *   Will be ignored if `opts.assign` is `true`.
 * @param {boolean} [opts.assign=false] Use direct assignment instead of `def()`.
 * @param {boolean} [opts.returnThis=false] Return `this` variable.
 * @param {boolean} [opts.returnObj=false] Return the `obj` parameter.
 * @return {*} Generally the last object in the nested property paths.
 *   Unless one of `opts.returnThis` or `opts.returnObj` was `true`.
 * @alias module:@lumjs/core/obj.setObjectPath
 */
function setObjectPath(obj, proppath, opts={})
{
  needObj(obj, true, 'obj parameter must be an object or function');
  needObj(opts, 'opts parameter must be an object');

  proppath = nsArray(proppath);

  let assign;
  if (opts.assign)
  { // Use direct property assignment.
    assign = (o,p,v={}) => o[p] = v;
  }
  else if (doesDescriptorTemplate(opts.desc))
  { // An explicit descriptor.
    assign = (o,p,v={}) => 
    {
      const desc = Object.assign({}, opts.desc);
      desc.value = v;
      def(o,p,desc);
    }
  }
  else
  { // Use def with default descriptor.
    assign = (o,p,v={}) => def(o,p,v);
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
      if (n == lastns && notNil(opts.value))
      { // We're at the end and have a value to assign.
        assign(cns, ns, opts.value);
      }
      else 
      { // Create a new empty object.
        assign(cns, ns);
      }
    }
    else if (opts.overwrite && n == lastns && notNil(opts.value))
    { // We have a value, and overwrite mode is on.
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
 * @param {object} [opts] Options for `getObjectPath()`
 * @returns {*} The value that was removed; or `undefined` if the
 * proppath didn't resolve to a defined value.
 */
function delObjectPath(obj, proppath, opts={})
{
  proppath = nsArray(proppath);
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
 * Get a global namespace path if it exists.
 *
 * This literally just calls `getObjectPath()` on the `root` object.
 * 
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
