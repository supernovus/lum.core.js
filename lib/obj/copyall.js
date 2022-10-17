/**
 * This is a 'dumb' copy method.
 *
 * It only copies enumerable properties, does no type checking, 
 * and has no qualms about overwriting properties.
 * 
 * Use `copyProps`, or `mergeNested` for more robust versions.
 * 
 * @alias module:@lumjs/core/obj.copyAll
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
 * Make a copy of a single object using `copyAll`.
 * 
 * Use `clone` for a more robust version.
 * 
 * Alias: `copyAll.clone`
 * 
 * @alias module:@lumjs/core/obj.duplicateOne
 * @param {object} obj - The object to duplicate.
 * @returns {object} A clone of the object.
 */
exports.duplicateOne = copyAll.clone = obj => copyAll({}, obj);

/**
 * Make a new object containing properties from other objects using `copyAll`.
 * 
 * Use `copyProps.into({}).from(...sources)` for a more robust version.
 * 
 * Alias: `copyAll.clone`
 * 
 * @alias module:@lumjs/core/obj.duplicateOne
 * @param {object} obj - The object to duplicate.
 * @returns {object} A clone of the object.
 */
exports.duplicateAll = copyAll.duplicate = () => copyAll({}, ...arguments);
