const def = require('./types/def');
const {F,isObj} = require('./types/basics');

/**
 * A super simple singleton wrapper around the Javascript console.
 * 
 * By default includes `info`, `log`, `warn`, and `error` methods.
 * It may be expanded further using the `addMethod` method.
 * 
 * @exports module:@lumjs/core/console
 */
const LC = 
{
  /**
   * A custom handler.
   * 
   * If a `function`, it will be called to handle all method calls.
   * 
   * If an `Array`, it will have all log entries added as objects with
   * at least `time`, `method`, and `opts` properties.
   * By default and `arguments` property will also be included.
   * See `msgArguments` and `msgArgs` for further details.
   * 
   * If the boolean value `false`, all output will be thrown into the void.
   * 
   * If it is an `object`, then each property name represents a method name,
   * and the values will be treated as a handler for that method only.
   * All handler types are supported (i.e. `function`, `Array`, or `false`.)
   * A special method name of `DEFAULT` may be specified as a default handler
   * for method names not explicitly specified in the object.
   * If no `DEFAULT` is specified and there is no handler value for a method
   * name, calls to it will be passed through to the real console object.
   * 
   * If no handler was set, all methods are passed to the real console object.
   * 
   * Default value: `null`
   */
  handler: null,

  /**
   * Return the message object?
   * 
   * Only applicable if `handler` is an `Array`.
   * 
   * If `true`, return the message `object`. 
   * If `false`, returns `undefined`.
   * 
   * Default value: `false`
   */
  returnMsg: false,

  /**
   * The name to include the `arguments` magic object in the log.
   * 
   * Only applicable if `handler` is an `Array`.
   * 
   * This used to be hard-coded as `"arguments"` but the `shortArgs`
   * option has replaced it as the array is simpler for most purposes.
   * 
   * Default value: `null`
   */
  msgArguments: null,

  /**
   * The name to include the `args` array in the log.
   * 
   * Only applicable if `handler` is an `Array`.
   * 
   * Default value: `"arguments"`
   */
  msgArgs: 'arguments',

  /**
   * Use the method name as the first argument in function calls.
   * 
   * Default value: `true`
   */
  methodArg: true,
}

/** 
 * A reference to the real console object.
 * @alias module:@lumjs/core/console.real
 */ 
const RC = globalThis.console;
def(LC, 'real', RC);

// Only including a few common ones.
const DEFAULT_METHODS = ['debug','info','log','warn','error'];

// Options that can be changed via handler settings.
const HANDLER_OPTIONS = 
[
  'returnMsg', 'methodArg', 'msgArguments', 'msgArgs'
];

/**
 * Add a wrapper method to the console wrapper object.
 * @param {string} method - The console method to wrap.
 * @alias module:@lumjs/core/console.addMethod
 */
function addMethod(method)
{
  def(LC, method, function(...args)
  {
    if (typeof LC.trigger === F)
    { // Support for core.observable(core.console);
      LC.trigger(method, ...args);
    }

    let handler = LC.handler;
    const opts = {}

    function checkHandlerOptions(src)
    {
      for (const opt of HANDLER_OPTIONS)
      {
        if (src[opt] !== undefined)
        { 
          opts[opt] = src[opt];
        }
      }
    }

    // Get the default options.
    checkHandlerOptions(LC);

    // Check for complex handler definitions as a plain object.
    if (isObj(handler) && !Array.isArray(handler))
    { // Look for options in the handler defs.
      checkHandlerOptions(handler);

      if (handler[method] !== undefined)
      { // A handler for that method was found.
        handler = handler[method];
      }
      else if (handler.DEFAULT !== undefined)
      { // A default handler.
        handler = handler.DEFAULT;
      }
    }
    
    if (typeof handler === F)
    { // A custom handler function.
      checkHandlerOptions(handler);
      if (opts.methodArg) 
        args.unshift(method)
      return handler(...args);
    }
    else if (Array.isArray(handler))
    { // Add a message item to a log array.
      checkHandlerOptions(handler);

      const time = new Date().toJSON();
      const msg = {time, method, opts};

      if (typeof opts.msgArguments === S)
        msg[opts.msgArguments] = arguments;
      if (typeof opts.msgArgs === S)
        msg[opts.msgArgs] = args;

      handler.push(msg);

      if (opts.returnMsg) return msg;
    }
    else if (handler !== false) 
    { // Pass through to the real console.
      return RC[method](...args);
    }
  });
}

def(LC, 'addMethod', addMethod);

for (const method of DEFAULT_METHODS)
{
  addMethod(method);
}

/**
 * Export our wrapper to replace the real console
 * in the global namespace.
 * 
 * @param {*} [handler] Set a handler while we're exported.
 * 
 * See the description of `handler` for possible values.
 * Any existing handler value will be saved to the `preHandler`
 * static property.
 * 
 * @function module:@lumjs/core/console.export
 */
def(LC, 'export', function(handler)
{
  if (handler !== undefined)
  { // Save the existing handler as 'preHandler'
    LC.preHandler = LC.handler ?? null; // Prevent `undefined`
    LC.handler = handler;
  }

  globalThis.console = LC;
  return LC;
});

/**
 * Restore the real console.
 * 
 * If a `handler` was passed to `export()`, then
 * it will be removed, and the previous handler value
 * will be restored.
 * 
 * @function module:@lumjs/core/console.restore
 */
def(LC, 'restore', function()
{
  if (LC.preHandler !== undefined)
  {
    LC.handler = LC.preHandler;
    delete LC.preHandler;
  }

  globalThis.console = LC.real;
  return LC;
});

/**
 * A shortcut for `LC.export(false)`
 * @function module:@lumjs/core/console.mute
 */
def(LC, 'mute', function()
{
  return LC.export(false);
});

module.exports = LC;
