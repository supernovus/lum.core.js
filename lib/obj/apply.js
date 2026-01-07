const {F} = require('../types');

/**
 * ApplyInfo objects will have a property with this Symbol
 * as its key and boolean `true` as its value.
 * 
 * The `apply.Info` property is an alias to this.
 * 
 * @type {Symbol}
 * @name module:@lumjs/core/obj.ApplyInfo
 */
const ApplyInfo = Symbol('@lumjs/core/obj.ApplyInfo');

/**
 * ApplyOpts objects will have a property with this Symbol
 * as its key and boolean `true` as its value.
 * 
 * The `apply.Opts` property is an alias to this.
 * 
 * @type {Symbol}
 * @name module:@lumjs/core/obj.ApplyOpts
 */
const ApplyOpts = Symbol('@lumjs/core/obj.ApplyOpts');

/**
 * Options for apply() functions and value handlers.
 * @typedef {object} module:@lumjs/core/obj~ApplyOpts
 * @prop {(object|function)} target - Target object.
 * @prop {(object|function)} obj - DEPRECATED alias of `target`.
 * @prop {(object|function)} ctx - Context (`this`) for functions.
 * Set to `target` when opts are initially created.
 * @prop {Set<module:@lumjs/core/obj~ApplyHandler>} handlers
 * Registered value handlers.
 * @prop {Array} args - Arguments passed to `function` values.
 * 
 * In v1.x this defaults to `[target, opts]`.
 * In v2.x this will default to `[opts]`.
 */

/**
 * Info for apply() value handlers.
 * @typedef {object} module:@lumjs/core/obj~ApplyInfo
 * @prop {mixed} value - The value that needs to be handled.
 * @prop {object} opts - The current apply() options.
 * @prop {boolean} ok - If a handler can handle `value` it must set
 * this to `true` indicating the value has been handled.
 * Otherwise apply() will throw a TypeError if every handler has
 * been called and none can handle the value.
 * @prop {boolean} done - If a handler has handled a value it may
 * set this to `true` to indicate that no further handlers need
 * to be called for that value. If this property is true then
 * the `ok` property will automatically be considered true as well.
 */

/**
 * An apply() value handler.
 * 
 * In order to add a handler it must be added to `opts.handlers` using a
 * registration function. You can make a handler that can register itself
 * by checking the argument(s) for the `ApplyInfo` or `ApplyOpts` properties.
 * 
 * An example for the upcoming v2.x default arguments:
 * 
 * ```js
 * const {apply} = require('@lumjs/core/obj');
 * function myHandler(info)
 * {
 *   if (info[apply.Opts])
 *   { // Registration (info is opts).
 *     info.handlers.add(myHandler);
 *   }
 *   else if (info[apply.Info])
 *   { // Handler call.
 *     if (someTest(info.value))
 *     { // Code to handle the value would be here.
 *       info.ok = true;
 *     }
 *   }
 * }
 * 
 * // Then to use the handler:
 * apply(myObj, myHandler, ...valuesToApply);
 * ```
 * 
 * Support for the v1.x default arguments (or even custom arguments),
 * and dealing with invalid arguments is left up to your imagination.
 * 
 * @callback module:@lumjs/core/obj~ApplyHandler
 * @param {module:@lumjs/core/obj~ApplyHandlerInfo} info 
 * @returns {void} No return value is required or used.
 */

/**
 * Some pre-defined value handlers and registration functions.
 * @type {object}
 * @alias module:@lumjs/core/obj.ApplyWith
 */
const ApplyWith =
{
  /**
   * A value handler for obj.apply() that uses `cp` to handle objects.
   *
   * This is a self-registering handler designed for @lumjs/core v2.x.
   * Just pass it as a function value to apply() and it will add itself to 
   * `opts.handlers`, set `opts.cp` to `copyProps.cache.into(opts.target)`, 
   * and `opts.cp.applyDone` to `true`.
   * 
   * This is automatically registered in v1.x. No need to manually add it.
   * 
   * For any `object` value passed to apply() after registering this handler,
   * it will call: `opts.cp.from(value)` to merge the value's properties into
   * the target object. Finally it will set `info.ok` to `true` (fixed value),
   * and `info.done` to `opts.cp.applyDone`.
   * 
   * It does not handle anything other than `object` values.
   * 
   * NOTE: As of v1.38.5 this is an alias to `@lumjs/cp/apply.Handler`
   * 
   * @function module:@lumjs/obj.ApplyWith.cpHandler
   */

  /**
   * A helper for registration functions that may have the `opts`
   * passed in different argument positions.
   * @param {Iterable} args - Arguments passed to function.
   * @param {mixed} ctx - The value of `this` in the function.
   * In case `opts.ctx` 
   * @returns {?module:@lumjs/core/obj~ApplyOpts}
   * Will be null if no ApplyOpts object could be found in the arguments.
   */
  getOpts(args)
  {
    for (let arg of args)
    {
      if (arg && arg[ApplyOpts]) return arg;
    }
    // No opts found.
    return null;
  },
  
  /**
   * A registration function that sets `opts.args` to `[opts.target, opts]`
   * which is the default arguments for @lumjs/core v1.x.
   */
  v1Args()
  {
    let opts = ApplyInfo.getOpts(arguments);
    if (opts)
    {
      opts.args = [opts.target, opts];
    }
  },

  /**
   * A registration function that sets `opts.args` to `[opts]`
   * which is the default arguments for @lumjs/core v2.x.
   */
  v2Args()
  {
    let opts = ApplyInfo.getOpts(arguments);
    if (opts)
    {
      opts.args = [opts];
    }
  },
}

/**
 * Apply functions (and other values) to an object.
 *  
 * NOTE: For the duration of the v1.x releases, the `ApplyWith.cpHandler` 
 * function will be registered automatically. That will be removed in v2.x,
 * and you'll have to add it manually from the `@lumjs/cp` package.
 * 
 * @param {(object|function)} target - The target we're applying to.
 * @param  {...(function|object)} values - Values we are applying.
 * 
 * For each `value` of the `values`:
 * 
 * - If it's a `function` this will do `value.apply(obj, opts.args)`; 
 * - For any other kind of value:
 *   - Create an {@link module:@lumjs/core/obj~ApplyInfo} object.
 *   - For each handler in `opts.handlers` do `handler.call(obj, info)`;
 *   - If none of the handlers set `info.ok` or `info.done` to true,
 *     then a TypeError will be thrown, indicating an unhandled value.
 * 
 * @returns {object} `obj`
 * @throws {TypeError} If a value could not be handled.
 * @alias module:@lumjs/core/obj.apply
 */
function apply(target, ...values)
{
  const opts = 
  {
    [ApplyOpts]: true, 
    target, 
    obj: target,     // DEPRECATED: use target
    copyProps: true, // Change to false in v2.x
    ctx: target, 
    handlers: new Set(),
  };

  // TODO: change this to `[opts]` in v2.x
  opts.args = [target, opts];

  // TODO: remove this line in v2.x
  ApplyWith.cpHandler(opts);

  for (let value of values)
  {
    if (typeof value === F)
    { 
      value.apply(opts.ctx, opts.args);
    }
    else
    {
      let info = 
      {
        [ApplyInfo]: true,
        value,
        opts, 
        ok: false, 
        done: false
      };

      for (let handler of opts.handlers)
      {
        handler.call(opts.ctx, info);
        if (info.done)
        {
          info.ok = true;
          break;
        }
      }

      if (!info.ok)
      {
        throw new TypeError("invalid parameter value");
      }
    }
  }

  return target;
}

// Make aliases to the symbols.
Object.defineProperties(apply, 
{
  Info: { value: ApplyInfo },
  Opts: { value: ApplyOpts },
});

module.exports = {apply, ApplyInfo, ApplyOpts, ApplyWith};

const cpApply = require('@lumjs/cp/apply');
Object.assign(ApplyWith, 
{
  cpInit: cpApply.init,
  cpHandler: cpApply.Handler,
});
