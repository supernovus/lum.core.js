const def = require('./def');
const {F} = require('./js');

/**
 * A super simple wrapper around the Javascript console.
 * 
 * By default includes `info`, `log`, `warn`, and `error` methods.
 * It may be expanded further using the `addMethod` method.
 * 
 * @exports module:@lumjs/core/types/console
 */
const LC = 
{
  /**
   * A custom handler.
   * 
   * If a `function`, will be passed the console method name as the
   * first parameter, and method arguments as subsequent parameters.
   * 
   * If an `Array`, it will have all log entries added as objects with
   * `time`, `method`, and `arguments` properties.
   * 
   * If the boolean value `false`, all output will be thrown into the void.
   * 
   * Any other value (including the default `null`), passes the method call
   * through to the real console object.
   */
  handler: null, 
  /**
   * Return the message object?
   * 
   * Only applicable if `handler` is an `Array`.
   * If true, return the message object. If false, returns void/undefined.
   */
  returnMsg: false
}

/** 
 * A reference to the real console object.
 * @alias module:@lumjs/core/types/console.real
 */ 
const RC = globalThis.console;
def(LC, 'real', RC);

// Only including a few common ones.
const DEFAULT_METHODS = ['debug','info','log','warn','error'];

/**
 * Add a wrapper method to the console wrapper object.
 * @param {string} method - The console method to wrap.
 * @alias module:@lumjs/core/types/console.addMethod
 */
function addMethod(method)
{
  def(LC, method, function()
  {
    if (typeof LC.handler === F)
    { // A custom handler.
      return LC.handler(method, ...arguments);
    }
    else if (Array.isArray(LC.handler))
    { // Add a message item.
      const time = new Date().toJSON();
      const msg = {time, method, arguments};
      LC.handler.push(msg);
      if (LC.returnMsg) return msg;
    }
    else if (LC.handler !== false) 
    { // Pass through to the real console.
      return RC[method](...arguments);
    }
  });
}
def(LC, 'addMethod', addMethod);

for (const method of DEFAULT_METHODS)
{
  addMethod(method);
}

module.exports = LC;
