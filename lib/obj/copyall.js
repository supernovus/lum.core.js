/**
 * This is a 'dumb' copy method.
 *
 * It only copies enumerable properties, does no type checking, 
 * and has no qualms about overwriting properties.
 * 
 * Use `copyProps`, or `mergeNested` for more robust versions.
 * 
 * NOTE: As of v1.38.5 this is an alias of @lumjs/cp/fun.copyAll
 * 
 * @name module:@lumjs/core/obj.copyAll
 * @deprecated Moved to @lumjs/cp package.
 */

/**
 * Make a (shallow) copy of a single object using `copyAll`.
 * 
 * Use `clone` for a more robust version.
 * 
 * Alias: `copyAll.clone`
 * 
 * NOTE: As of v1.38.5 this is an alias of @lumjs/cp/fun.duplicateOne
 * 
 * @name module:@lumjs/core/obj.duplicateOne
 * @param {object} obj - The object to duplicate.
 * @returns {object} A clone of the object.
 * @deprecated Moved to @lumjs/cp package.
 */

/**
 * Make a new object containing properties from other objects using `copyAll`.
 * 
 * Use `copyProps.into({}).from(...sources)` for a more robust version.
 * 
 * Alias: `copyAll.duplicate`
 * 
 * NOTE: As of v1.38.5 this is an alias of @lumjs/cp/fun.duplicateAll
 * 
 * @name module:@lumjs/core/obj.duplicateAll
 * @param {object} obj - The object to duplicate.
 * @returns {object} A clone of the object.
 * @deprecated Moved to @lumjs/cp package.
 */

module.exports = require('@lumjs/cp/fun');
