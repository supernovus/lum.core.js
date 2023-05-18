
/**
 * Context sub-module
 * 
 * Used as a static object that has a bunch of properties
 * describing the current JS environment and execution context.
 * 
 * @module @lumjs/core/context
 * @property {boolean} hasDefine - A global `define()` function was found.
 * @property {boolean} hasRequire - A global `require()` function was found.
 * @property {boolean} hasExports - A global `exports` variable was found.
 * @property {boolean} hasModule - A global `module` object was found.
 * @property {boolean} hasModuleExports - A `module.exports` exists.
 * @property {boolean} hasSyncedExports - `exports === module.exports`
 * @property {boolean} isNode - An alias to `Node.ok`.
 * @property {boolean} isBrowser - A web-browser environment detected.
 * @property {boolean} isWindow - Is a browser `Window` context.
 * @property {boolean} isWorker - Is a browser `Worker` (sub-types below.)
 * @property {boolean} isServiceWorker - Is a `ServiceWorker` context.
 * @property {boolean} isDedicatedWorker - Is a `DedicatedWorker` context.
 * @property {boolean} isSharedWorker - Is a `SharedWorker` context.
 * @property {object} AMD - Asynchronous Module Definition detection.
 * @property {boolean} AMD.isSupported - The `define.amd` property is set.
 * @property {boolean} AMD.isRequireJS - A global `requirejs` was found.
 * @property {object} CJS - CommonJS detection.
 * @property {boolean} CJS.standard - `hasDefine && hasRequire`
 * @property {boolean} CJS.nodeLike - `CJS.standard && hasExports`
 * @property {boolean} CJS.isLumV5 - Lum.js browser bundler detected.
 * @property {boolean} CJS.isWebpack - Webpack bundler detected.
 * @property {boolean} CJS.inBrowser - `CJS.isLumV5 || CJS.isWebpack`
 * @property {object} Node - Node.js detection.
 * @property {boolean} Node.isSane - `CJS.nodeLike && !CJS.inBrowser`
 * @property {boolean} Node.hasProcess - A global `process` object exists.
 * @property {boolean} Node.ok - `Node.isSane && Node.hasProcess`
 * @property {?string} Node.ver - `process.versions.node ?? null`
 * @property {?object} Node.versions - `process.versions ?? null`
 * @property {Array} Node.args - Command line arguments.
 * @property {string} Node.script - Command line script name.
 * @property {object} Electron - Electron detection.
 * @property {boolean} ok - Electron environment detected.
 * @property {boolean} isDefault - Is this the default app?
 * @property {boolean} isBundled - Is this a bundled app?
 * @property {boolean} isMain - Is this the main renderer frame?
 * @property {?string} type - `process.type`
 * @property {object} root - See {@link module:@lumjs/core/types.root}
 */

const {root,B,F,U,O,isComplex,isObj,def} = require('./types');

const ctx = {root};
const rootHas = what => typeof root[what] !== U;
const cd = def(ctx, true);
const CJS = {};
const AMD = {};
const Node = {};
const Elec = {};
const cjs = def(CJS, true);
const amd = def(AMD, true);
const node = def(Node, true);
const elec = def(Elec, true);
const isLumV5 = typeof module.$lib === O && module.$lib.$cached === module;

cd('hasDefine', typeof define === F)
  ('hasRequire', typeof require === F)
  ('hasExports', typeof exports !== U && isComplex(exports))
  ('hasModule', typeof module === O && module !== null)
  ('hasModuleExports', ctx.hasModule && isComplex(module.exports))
  ('hasSyncedExports', ctx.hasExports && ctx.hasModuleExports 
    && exports === module.exports)

cjs('standard', ctx.hasModule && ctx.hasRequire)
   ('nodeLike', CJS.standard && ctx.hasExports)
   ('isLumV5', CJS.nodeLike && isLumV5)
   ('isWebpack', CJS.nodeLike && require.resolve === require)
   ('inBrowser', CJS.isLumV5 || CJS.isWebpack)

node('isSane', CJS.nodeLike && !CJS.inBrowser)
    ('hasProcess', typeof process === O && process !== null)
    ('ok', Node.isSane && Node.hasProcess)
    ('versions', Node.hasProcess ? process.versions : null)
    ('ver', Node.hasProcess ? process.versions.node : null)
    ('args', {get: function()
    { // Inspired by yargs hideBin() function.
      if (Node.ok)
      {
        const o = (Elec.isBundled) ? 1 : 2;
        return process.argv.slice(o);
      }
      return [];
    }})
    ('script', {get: function()
    { // Inspired by yargs getProcessArgvBin() function.
      if (Node.ok)
      {
        const i = (Elec.isBundled) ? 0 : 1;
        return process.argv[i];
      }
      return '';
    }})

elec('ok', Node.ok && !!Node.versions.electron)
    ('isDefault', Elec.ok && !!process.defaultApp)
    ('isBundled', Elec.ok && !process.defaultApp)
    ('isMain', Elec.ok && !!process.isMainFrame)
    ('type', Elec.ok && process.type)

amd('isSupported', ctx.hasDefine && isObj(define.amd))
   ('isRequireJS', AMD.isSupported && typeof requirejs === F)

cd('CJS', CJS)
  ('AMD', AMD)
  ('Node', Node)
  ('Electron', Elec)
  ('isNode', Node.ok)
  ('isWindow', typeof Window === F && rootHas(window))
  ('isWorker', rootHas('WorkerGlobalScope'))
  ('isServiceWorker', rootHas('ServiceWorkerGlobalScope'))
  ('isDedicatedWorker', rootHas('DedicatedWorkerGlobalScope'))
  ('isSharedWorker', rootHas('SharedWorkerGlobalScope'))
  ('isBrowser', !ctx.isNode && (ctx.isWindow || ctx.isWorker))

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
