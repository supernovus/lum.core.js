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
 * @deprecated replaced by `@lumjs/describe` package
 * @function module:@lumjs/core/types.stringify
 * @see module:@lumjs/core/types.Stringify
 * @see module:@lumjs/core/types.Stringify#stringify
 */
const {stringify, Describe: Stringify} = require('@lumjs/describe');

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
 * @class module:@lumjs/core/types.Stringify
 * @deprecated replaced by `@lumjs/describe` package
 */

module.exports = {stringify, Stringify};
