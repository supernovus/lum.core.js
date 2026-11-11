const { df } = require('./obj/df');
const { isObj } = require('./types/basics');

const PREHAND = Symbol('@lumjs/core/console~handlers');

const isArgName = (key, obj) => (typeof key === 'string'
  && key.trim() !== ''
  && obj[key] === undefined
);

/**
 * A super simple singleton wrapper around the Javascript console.
 * 
 * By default includes `debug`, `info`, `log`, `warn`, and `error` methods.
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
   * By default an `arguments` property will also be included.
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
   * If this is null, all methods are passed to the real console object.
   * 
   * Default value: `null`
   * @type {(function|Array|object|false|null)}
   */
  handler: null,

  /**
   * Use the method name as the first argument in function calls.
   * 
   * Default value: `true`
   * @type {boolean}
   */
  methodArg: true,

  /**
   * The name to include the `args` capture array in the log.
   * 
   * Only applicable if `handler` is an `Array`.
   * If this is null, then the `args` won't be included at all.
   * 
   * Default value: `"args"`
   * @type {?string}
   */
  msgArgs: 'args',

  /**
   * The name to include the `arguments` magic object in the log.
   * 
   * Only applicable if `handler` is an `Array`.
   * If this is null, then the `arguments` won't be included at all.
   * 
   * Default value: `null`
   * @type {?string}
   */
  msgArguments: null,

  /**
   * Return the message object?
   * 
   * Only applicable if `handler` is an `Array`.
   * 
   * If `true`, return the message `object`. 
   * If `false`, returns `undefined`.
   * 
   * Default value: `false`
   * @type {boolean}
   */
  returnMsg: false,

  /**
   * An array of specs representing supported event dispatch methods.
   * 
   * The default will first look for `emit()` with a modern payload, 
   * then fall back on `trigger()` with positional arguments.
   * @type {module:@lumjs/core/console~EventSpec[]}
   */
  useEvents: [
    {
      name: 'emit',
      data: true,
    },
    {
      name: 'trigger',
      data: false,
    },
  ],
}

df(LC, PREHAND, { value: [] });
df(LC, '$', { PREHAND });

/** 
 * A reference to the real console object.
 * @alias module:@lumjs/core/console.real
 */
const RC = globalThis.console;
df(LC, 'real', RC);

// Only including a few common ones.
const DEFAULT_METHODS = ['debug', 'info', 'log', 'warn', 'error'];

// Options that can be changed via handler settings.
const HANDLER_OPTIONS = [
  'methodArg', 'msgArgs', 'msgArguments', 'returnMsg',
];

// Options for event dispatching.
const EVENT_OPTIONS = [
  'methodArg', 'methodName', 'msgArgs', 'msgArguments',
];

function findOpts(list, opts, src) {
  for (let opt of list) {
    if (src[opt] !== undefined) {
      opts[opt] = src[opt];
    }
  }
  return opts;
}

function useOpts(list, opts = {}) {
  opts.use = findOpts.bind(null, list, opts);
  return opts.use(LC);
}

/**
 * Add a wrapper method to the console wrapper object.
 * @param {string} method - The console method to wrap.
 * @alias module:@lumjs/core/console.addMethod
 */
function addMethod(method) {
  df(LC, method, function (...args) {

    let opts = useOpts(EVENT_OPTIONS);
    for (let evs of LC.useEvents) {
      let evn = evs.name;
      if (typeof evn === 'string' && typeof LC[evn] === 'function') {
        let eargs;
        opts.use(evs);
        if (evs.data) {
          let data = {};
          data[opts.methodName ?? 'method'] = method;
          if (isArgName(opts.msgArguments, data)) {
            data[opts.msgArguments] = arguments;
          }
          if (isArgName(opts.msgArgs, data)) {
            data[opts.msgArgs] = args;
          }
          eargs = [data];
        }
        else {
          eargs = [];
          if (opts.methodArg) {
            eargs.push(method);
          }
          eargs.push(...args);
        }
        LC[evn](...eargs);
        break;
      }
    }

    let handler = LC.handler;
    opts = useOpts(HANDLER_OPTIONS);

    // Check for complex handler definitions as a plain object.
    if (isObj(handler) && !Array.isArray(handler)) { // Look for options in the handler defs.
      opts.use(handler);

      if (handler[method] !== undefined) { // A handler for that method was found.
        handler = handler[method];
      }
      else if (handler.DEFAULT !== undefined) { // A default handler.
        handler = handler.DEFAULT;
      }
    }

    if (typeof handler === 'function') { // A custom handler function.
      opts.use(handler);
      if (opts.methodArg)
        args.unshift(method)
      return handler(...args);
    }
    else if (Array.isArray(handler)) { // Add a message item to a log array.
      opts.use(handler);

      const time = new Date().toJSON();
      const msg = { time, method, opts };

      if (isArgName(opts.msgArguments, msg)) {
        msg[opts.msgArguments] = arguments;
      }
      if (isArgName(opts.msgArgs, msg)) {
        msg[opts.msgArgs] = args;
      }

      handler.push(msg);

      if (opts.returnMsg) return msg;
    }
    else if (handler !== false) { // Pass through to the real console.
      return RC[method](...args);
    }
  });
}

df(LC, 'addMethod', addMethod);

for (const method of DEFAULT_METHODS) {
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
df(LC, 'export', function (handler) {
  LC[PREHAND].push(LC.handler);
  if (handler !== undefined) {
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
df(LC, 'restore', function () {
  LC.handler = LC[PREHAND].pop() ?? null;
  globalThis.console = LC.real;
  return LC;
});

/**
 * A shortcut for `LC.export(false)`
 * @function module:@lumjs/core/console.mute
 */
df(LC, 'mute', function () {
  return LC.export(false);
});

/**
 * Call a closure function with the console muted.
 *
 * Literally just calls `LC.mute()`, runs the function,
 * then calls `LC.restore()` when finished.
 *
 * @param {function} fn - The function to call.
 * @param {mixed} [ctx] Used as `this` in the function.
 * @param {...mixed} [args] Arguments to pass to the function.
 * @returns {mixed} The return value from the function.
 * @throws {TypeError} if `fn` is not a function.
 */
df(LC, 'muted', function (fn, ctx, ...args) {
  if (typeof fn !== 'function') {
    console.error('@lumjs/core/console.muted', { fn, ctx, args });
    throw new TypeError('first argument must be a function');
  }

  let retVal;
  LC.mute();
  retVal = fn.apply(ctx, args);
  LC.restore();
  return retVal;
});

module.exports = LC;

/**
 * Event dispatch specification object.
 * 
 * In addition to the properties specific to event dispatching,
 * this also supports the `methodArg`, `methodName`, `msgArgs`, 
 * and `msgArguments` options, which if set here will override
 * any of the same-named options set in the LC object.
 * 
 * @typedef {object} module:@lumjs/core/console~EventSpec
 * @prop {string} name - Name of the dispatch method to look for.
 * @prop {boolean} data - How arguments are handled.
 * 
 * If this is true, then a single context object with `method` and `args`
 * properties will be sent as the event payload.
 * 
 * If this is false, then the method name, followed by all arguments
 * will be passed as positional event arguments.
 *
 */
