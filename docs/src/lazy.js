
/**
 * Metadata for the property definition.
 * 
 * @typedef module:@lumjs/core/types~LazyDef
 * @property {string} name - The `name` passed to `lazy()`
 * @property {(object|function)} target - The `target` passed to `lazy()`
 * @property {object} opts - The `opts` passed to `lazy()`
 * @property {object} arguments - The full `arguments` passed to `lazy()`
 * 
 * @property {boolean} [assign] Override default assignment rules?
 * 
 * This property may be added by the `LazyGetter` or `LazySetter` 
 * functions to override the default assignment rules. 
 * 
 * If this is `true` the return value will be assigned, replacing the 
 * lazy accessor property, even if the value is `undefined`.
 * 
 * If this is `false`, the value will be returned, but will **not** be 
 * *assigned*, so the lazy accessor property will remain.
 * 
 * Leave it `undefined` to use the default assignment behaviour.
 * 
 * @property {object} [df] Special options for `df()`
 * 
 * The [df()]{@link module:@lumjs/core/obj.df} function has an
 * optional fourth parameter called `opts` which is used for a few
 * specialized purposes. If this property is set, it will be used as
 * the value for `opts` when assigning the return value to the property.
 * 
 * @property {object} [def] An alias to the `df` property.
 * 
 * As this used to use the older `types.def()` function, this alias
 * is the original name of the property.
 * 
 */

/**
 * A function to generate the property value.
 * 
 * @callback module:@lumjs/core/types~LazyGetter 
 * @param {module:@lumjs/core/types~LazyDef} info - A metadata object.
 * @returns {*} The generated *value* of the property.
 * 
 * By default if this is `undefined` the value will **not** be
 * assigned, and instead the accessor property will remain in
 * place to be used on subsequent calls until a value other than
 * `undefined` is returned.
 * 
 * This assignment behaviour can be overridden by the function
 * if it sets `this.assign` to an explicit boolean value.
 * 
 * As we are using [df()]{@link module:@lumjs/core/obj.df} 
 * to assign the value, by default if the return value appears 
 * to be a valid *Descriptor* object, it will be used as the 
 * property descriptor. See `def()` for further details on how
 * it handles the various arguments.
 * 
 * Regardless of the value of `this.assign`, this value will
 * be *returned* as the property value.
 * 
 * @this {module:@lumjs/core/types~LazyDef} The `info` metadata object
 */

/**
 * A function to handle attempts at assignment.
 * 
 * Very similar to [LazyGetter]{@link module:@lumjs/core/types~LazyGetter}
 * but called when property assignment is attempted on the
 * lazy accessor property.
 * 
 * If you explicitly want to forbid assignment, you can throw
 * an `Error` from this function.
 * 
 * @callback module:@lumjs/core/types~LazySetter
 * @param {*} value - The value attempting to be assigned.
 * @param {module:@lumjs/core/types~LazyDef} info - A metadata object.
 * @returns {*} The *actual* assignment value.
 * 
 * The same assignment rules apply as in the
 * [LazyGetter]{@link module:@lumjs/core/types~LazyGetter}
 * callback (in regards to undefined values, etc.)
 * 
 * @this {module:@lumjs/core/types~LazyDef} The `info` metadata object
 */
