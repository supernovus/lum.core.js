
// Get some constants
const {B,isObj,isComplex,isArray,def: defProp} = require('../types');

/**
 * Copy properties from one object to another.
 *
 * @param {(object|function)} source - The object to copy properties from.
 * @param {(object|function)} target - The target to copy properties to.
 *
 * @param {object} [propOpts] Options for how to copy properties.
 * @param {boolean} [propOpts.default=true] Copy only enumerable properties.
 * @param {boolean} [propOpts.all=false] Copy ALL object properties.
 * @param {Array} [propOpts.props] A list of specific properties to copy.
 * @param {object} [propOpts.overrides] Descriptor overrides for properties.
 * @param {Array} [propOpts.exclude] A list of properties NOT to copy.
 * @param {*} [propOpts.overwrite=false] Overwrite existing properties.
 *   If this is a `boolean` value, it will allow or disallow overwriting
 *   of any and all properties in the target object.
 *
 *   If this is an object, it can be an Array of property names to allow
 *   to be overwritten, or a map of property name to a boolean indicating
 *   if that property can be overwritten or not.
 *
 * @returns {object} The `target` object.
 * @alias module:@lumjs/core/obj.copyProps
 */
function copyProps(source, target, propOpts)
{
  //console.debug("copyProps", source, target, propOpts);
  if (!isComplex(source) || !isComplex(target))
  {
    throw new TypeError("source and target both need to be objects");
  }

  if (!isObj(propOpts))
    propOpts = {default: true};

  const defOverrides = propOpts.overrides ?? {};
  const defOverwrite = propOpts.overwrite ?? false;

  const exclude = isArray(propOpts.exclude) ? propOpts.exclude : null;

  let propDefs;

  if (propOpts.props && isArray(propOpts.props))
  {
    propDefs = propOpts.props;
  }
  else if (propOpts.all)
  {
    propDefs = Object.getOwnPropertyNames(source); 
  }
  else if (propOpts.default)
  {
    propDefs = Object.keys(source);
  }
  else if (propOpts.overrides)
  {
    propDefs = Object.keys(propOpts.overrides);
  }

  if (!propDefs)
  {
    console.error("Could not determine properties to copy", propOpts);
    return;
  }

  // For each propDef found, add it to the target.
  for (const prop of propDefs)
  {
    //console.debug(" @prop:", prop);
    if (exclude && exclude.indexOf(prop) !== -1)
      continue; // Excluded property.

    let overwrite = false;  
    if (typeof defOverwrite === B)
    {
      overwrite = defOverwrite;
    }
    else if (isObj(defOverwrite) && typeof defOverwrite[prop] === B)
    {
      overwrite = defOverwrite[prop];
    }

    const def = Object.getOwnPropertyDescriptor(source, prop);
    //console.debug(" @desc:", def);
    if (def === undefined) continue; // Invalid property.

    if (isObj(defOverrides[prop]))
    {
      for (const key in defOverrides[prop])
      {
        const val = defOverrides[prop][key];
        def[key] = val;
      }
    }

    if (overwrite || target[prop] === undefined)
    { // Property doesn't already exist, let's add it.
      defProp(target, prop, def);
    }
  }

  //console.debug("copyProps:done", target);

  return target;
} // copyProps()

module.exports = copyProps;
