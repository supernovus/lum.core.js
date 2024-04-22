/**
 * This is a 'dumb' copy method.
 *
 * It only copies enumerable properties, does no type checking, 
 * and has no qualms about overwriting properties.
 * 
 * Use `copyProps`, or `mergeNested` for more robust versions.
 * 
 * @alias module:@lumjs/core/obj.copyAll
 * @deprecated Use `Object.assign()` instead.
 */
function copyAll(target, ...sources)
{
  for (const source of sources)
  {
    for (const name in source)
    {
      target[name] = source[name];
    }
  }
  return target;
}
exports.copyAll = copyAll;

/**
 * Make a (shallow) copy of a single object using `copyAll`.
 * 
 * Use `clone` for a more robust version.
 * 
 * Alias: `copyAll.clone`
 * 
 * @alias module:@lumjs/core/obj.duplicateOne
 * @param {object} obj - The object to duplicate.
 * @returns {object} A clone of the object.
 * @deprecated Use `clone()` or `Object.assign()` depending on needs.
 */
exports.duplicateOne = copyAll.clone = obj => copyAll({}, obj);

/**
 * Make a new object containing properties from other objects using `copyAll`.
 * 
 * Use `copyProps.into({}).from(...sources)` for a more robust version.
 * 
 * Alias: `copyAll.duplicate`
 * 
 * @alias module:@lumjs/core/obj.duplicateOne
 * @param {object} obj - The object to duplicate.
 * @returns {object} A clone of the object.
 * @deprecated Use `Object.assign()`
 */
exports.duplicateAll = copyAll.duplicate = () => copyAll({}, ...arguments);
