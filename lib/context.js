
const {root,B,F,U,O,isObj,isComplex,def} = require('./types');

/**
 * Context object.
 * 
 * @namespace Lum.context
 * 
 * Offers some insight into the current JS context.
 * 
 */

const ctx = {root};

const rootHas = what => typeof root[what] !== U;
const cd = def(ctx, true);

cd('AMD', typeof define === F && define.amd)
  ('hasRequire', typeof require === F)
  ('hasExports', typeof exports !== U)
  ('hasModule', typeof module === O && module !== null)
  ('CJS', ctx.hasRequire && ctx.hasModule && isComplex(module.exports))
  ('isNode', ctx.CJS && ctx.hasExports)
  ('isWindow', !ctx.CJS && rootHas('window'))
  ('isWorker', !ctx.CJS && rootHas('WorkerGlobalScope'))
  ('isServiceWorker', !ctx.CJS && rootHas('ServiceWorkerGlobalScope'))
  ('isDedicatedWorker', !ctx.CJS && rootHas('DedicatedWorkerGlobalScope'))
  ('isSharedWorker', !ctx.CJS && rootHas('SharedWorkerGlobalScope'))
  ('isBrowser', ctx.isWindow || ctx.isWorker);

// Does the global object/property exist?
// Caches the results so we can do `context.has.Thingy` tests.
function hasRoot(ns)
{
  if (typeof hasRoot[ns] === B) return hasRoot[ns];
  const result = rootHas(ns);
  def(hasRoot, ns, {value: result, enumerable: true});
  return result;
}

// Build some common has items.
for (const what of ['Proxy','Promise','Reflect','fetch'])
{
  hasRoot(what);
}

cd('has', hasRoot);

module.exports = ctx;
