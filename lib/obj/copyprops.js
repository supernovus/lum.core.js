/**
 * Copy properties from one object to another.
 * 
 * NOTE: As of v1.38.5 this is an alias of @lumjs/cp/fun.copyProps
 * 
 * @function module:@lumjs/core/obj.copyProps
 *
 * @param {(object|function)} source - The object to copy properties from.
 * @param {(object|function)} target - The target to copy properties to.
 *
 * @param {object} [opts] Options for how to copy properties.
 * @param {boolean} [opts.default=true] Copy only enumerable properties.
 * @param {boolean} [opts.all=false] Copy ALL object properties.
 * @param {Array} [opts.props] A list of specific properties to copy.
 * @param {Array} [opts.exclude] A list of properties NOT to copy.
 * @param {object} [opts.overrides] Descriptor overrides for properties.
 * 
 * The object is considered a map, where each *key* is the name of the
 * property, and the value should be an `object` containing any valid
 * descriptor properties.
 * 
 * If `opts.default` is explicitly set to `false` and `opts.overrides` 
 * is set, then not only will it be used as a list of overrides, 
 * but only the properties specified in it will be copied.
 * 
 * @param {*} [opts.overwrite=false] Overwrite existing properties.
 * 
 * If this is a `boolean` value, it will allow or disallow overwriting
 * of any and all properties in the target object.
 *
 * If this is an `object`, it can be an `Array` of property names to allow
 * to be overwritten, or a *map* of property name to a `boolean` indicating
 * if that property can be overwritten or not.
 * 
 * Finally, if this is a `function` it'll be passed the property name and
 * must return a boolean indicating if overwriting is allowed.
 * 
 * @param {number} [opts.recursive=0] Enable recursive copying of objects.
 * 
 * If it is `0` (also `copyProps.RECURSE_NONE`) then no recursion is done.
 * In this case, the regular assignment rules (including `opts.overwrite`)
 * will be used regardless of the property type. 
 * This is the default value.
 * 
 * If this is *above zero*, it's the recursion depth for `object` properties.
 * 
 * If this is *below zero*, then it should be one of the constant values:
 * 
 * | Contant                  | Value | Description                          |
 * | ------------------------ | ----- | ------------------------------------ |
 * | `copyProps.RECURSE_ALL`  | `-1`  | Recurse to an *unlimited* depth.     |
 * | `copyProps.RECURSE_LIST` | `-2`  | Recurse `opts.recurseOpts` props.    |
 * 
 * @param {object} [opts.recurseOpts] Options for recursive properties.
 * 
 * If `opts.recursive` is not `0` then `opts.recurseOpts` can be a map of
 * property names to further objects, which will be used as the `opts` for
 * that property when calling `copyProps()` recursively.
 * 
 * So you could have nested `opts.recurseOpts` values if required.
 * 
 * The `recursive` property will automatically be added to the individual
 * `recurseOpts`, automatically applying the correct value.
 * 
 * The `opts.recurseOpts` option has an extra-special meaning if `opts.recurse`
 * is set to `RECURSE_LIST`, as then *only* the properties with options defined
 * in `opts.recurseOpts` will be recursed. The rest will simply be copied.
 *
 * @returns {object} The `target` object.
 * @deprecated Moved to @lumjs/cp package.
 */

module.exports = require('@lumjs/cp/fun').copyProps;
