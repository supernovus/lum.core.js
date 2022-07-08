// Import required bits here.
const 
{
  B, root, isObj, needObj, def, nonEmptyArray, notNil
} = require('../types');

/**
 * Internal: need a String or Array
 */
function SOA(name, err=true)
{
  const msg = (typeof name === S) 
    ? name + ' ' + this.message 
    : this.message;
  return err ? (new TypeError(msg)) : msg;
}
SOA.message = "must be a string or non-empty array";
def(SOA, 'toString', function() { return this.message; });

exports.SOA = SOA;

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
 * @param {object} obj - Object we're looking in.
 * @param {(string|Array)} proppath - Property path we're looking for.
 *   Generally a string of dot (`.`) separated nested property names.
 * @param {object} [opts] TBD.
 * @return {*} The property if found, or `opts.default` if not.
 */
function getObjectPath(obj, proppath, opts={})
{
  needObj(obj);

  if (typeof opts === B)
    opts = {log: opts};
  else if (!isObj(opts))
    opts = {};

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
 * @param {object} obj - Object the property path is for.
 * @param {(string|Array)} proppath - Property path to create.
 * @param {object} [opts] TBD.
 * @return {*} Generally the last object in the nested path.
 *   However the output may vary depending on the options.
 */
function setObjectPath(obj, proppath, opts={})
{
  needObj(obj); needObj(opts);
  proppath = nsArray(proppath);

  let assign;
  if (isObj(opts.desc))
  { // An explicit descriptor.
    assign = (o,p,v={}) => 
    {
      const desc = clone(opts.desc);
      desc.value = v;
      def(o,p,desc);
    }
  }
  else if (opts.assign)
  { // Use direct property assignment.
    assign = (o,p,v={}) => o[p] = v;
  }
  else 
  { // Use def with default descriptor.
    assign = (o,p,v={}) => def(o,p,v);
  }

  let cns = obj;
  const nsc = proppath.length;
  const lastns = nsc - 1;

  console.debug("setObjectPath", obj, proppath, opts, nsc, arguments);

  for (let n = 0; n < nsc; n++)
  {
    const ns = proppath[n];

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
 * Get a global namespace path if it exists.
 * 
 * - TODO: document this.
 * - TODO: rewrite `ns.get` to use this behind the scenes.
 */
function getNamespace(namespaces, opts={})
{
  return getObjectPath(root, namespaces, opts);
}

exports.getNamespace = getNamespace;

/**
 * Create a global namespace path if it does not exist.
 * 
 * - TODO: document this.
 * - TODO: rewrite `ns.add` to use this behind the scenes.
 */
function setNamespace(namespaces, opts={})
{
  return setObjectPath(root, namespaces, opts);
}

exports.setNamespace = setNamespace;