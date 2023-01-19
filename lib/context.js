
/**
 * Context sub-module
 * 
 * Used as a static object that has a bunch of properties
 * describing the current JS environment and execution context.
 * 
 * @module @lumjs/core/context
 * @property {boolean} AMD - AMD (*RequireJS*) module loading detected.
 * @property {boolean} CJS - CommonJS environment detected.
 * @property {boolean} hasRequire - A global `require()` function was found.
 * @property {boolean} hasExports - A global `exports` object was found.
 * @property {boolean} hasModule - A global `module` object was found.
 * @property {boolean} isNode - Is likely *Node.js*, *Electron*, etc.
 * @property {boolean} isBrowser - A web-browser environment detected.
 * @property {boolean} isWindow - Is a browser `Window` context.
 * @property {boolean} isWorker - Is a browser `Worker` (sub-types below.)
 * @property {boolean} isServiceWorker - Is a `ServiceWorker` context.
 * @property {boolean} isDedicatedWorker - Is a `DedicatedWorker` context.
 * @property {boolean} isSharedWorker - Is a `SharedWorker` context.
 * @property {object} root - See {@link module:@lumjs/core/types.root}
 */

const {root,B,F,U,O,isComplex,isObj,def} = require('./types');

const ctx = {root};
const rootHas = what => typeof root[what] !== U;
const cd = def(ctx, true);
const CJS = {};
const AMD = {};
const cjs = def(CJS, true);
const amd = def(AMD, true);
const isLumV5 = typeof module.$lib === O && module.$lib.$cached === module;

cd('hasDefine', typeof define === F)
  ('hasRequire', typeof require === F)
  ('hasExports', typeof exports !== U)
  ('hasModule', typeof module === O && module !== null)
  ('hasModuleExports', isComplex(module.exports))
  ;

cjs('standard', ctx.hasModule && ctx.hasRequire)
   ('nodeLike', CJS.standard && ctx.hasExports)
   ('isLumV5', CJS.nodeLike && isLumV5)
   ('isWebpack', CJS.nodeLike && require.resolve === require)
   ('inBrowser', CJS.isLumV5 || CJS.isWebpack)
   ;

amd('isSupported', ctx.hasDefine && isObj(define.amd))
   ('isRequireJS', AMD.isSupported && typeof requirejs === F)

cd('CJS', CJS)
  ('AMD', AMD)
  ('isNode', CJS.nodeLike && !CJS.inBrowser)
  ('isWindow', rootHas('window'))
  ('isWorker', rootHas('WorkerGlobalScope'))
  ('isServiceWorker', rootHas('ServiceWorkerGlobalScope'))
  ('isDedicatedWorker', rootHas('DedicatedWorkerGlobalScope'))
  ('isSharedWorker', rootHas('SharedWorkerGlobalScope'))
  ('isBrowser', !ctx.isNode && (ctx.isWindow || ctx.isWorker))
  ;

/**
 * See if a root-level name is defined.
 * 
 * This adds a `context.has.{name}` boolean property which caches the
 * result so it can be referred to directly.
 * 
 * In any JS environment with the `Proxy` object (which honestly should
 * be all modern ones), you can simple do `context.has.SomeObject` instead
 * of `context.has('SomeObject')` and it will do the Right Thing™.
 * 
 * @param {string} ns - The global function/class/object we're looking for.
 * @returns {boolean} If that global name is defined or not.
 * @alias module:@lumjs/core/context.has
 */
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

if (hasRoot.Proxy)
{ // Make a Proxy-wrapped version of `context.has`
  cd('has', new Proxy(hasRoot, 
  {
    get(t, p) { return (typeof t[p] !== U) ? t[p] : t(p) }
  }));
  // And include the unwrapped version for good measure.
  cd('$has', hasRoot);
}
else
{ // No Proxy support, just directly assign `context.has()`
  cd('has', hasRoot);
}

module.exports = ctx;
