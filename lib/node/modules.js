/**
 * Module helpers.
 * 
 * `@lumjs/core/modules` is a deprecated alias to this.
 * 
 * @module @lumjs/core/node/modules
 */

const path = require('path');
const {S,isObj} = require('../types');
const replace = require('../strings').replaceItems;

/**
 * Test if a passed value is a CommonJS `module` object.
 * @param {*} mod - Value to test.
 * @returns {boolean}
 * @alias module:@lumjs/core/node/modules.isCJS
 */
const isCJS = (mod) => (isObj(mod) 
  && typeof mod.id === 'string'
  && typeof mod.require === 'function'
);

/**
 * Test if a passed value is an ES Module `import.meta` object.
 * @param {*} mod - Value to test.
 * @returns {boolean}
 * @alias module:@lumjs/core/node/modules.isESM
 */
const isESM = (mod) => (isObj(mod)
  && typeof mod.url === 'string'
  && typeof mod.resolve === 'function'
);

/**
 * Get the name of a module.
 *
 * @param {(object|string)} module - Either a module object, or filename.
 *   If it is an `object`, it should be a CommonJS `module` object.
 *   If it is a `string`, it should be the module filename.
 * @param {object} [opts] Options.
 * 
 * @param {boolean} [opts.useAuto=true] Enable automatic name cleaning.
 *   If *basename* mode was **not** used, then once all other rules have been 
 *   applied, strip any leading `.` and `/` characters, and the file extension.
 * 
 * @param {boolean} [opts.basename=false] Use `path.basename()`
 *   This will strip all parent directories, and the file extension.
 *   If no other rules are specified in the `opts`, then this will
 *   be applied automatically as a fallback method. If it is set to
 *   `true` explicitly, then it will be applied *before* any other options.
 * 
 * @param {object} [opts.replace] Call {@link module:@lumjs/core/strings.replaceItems}
 *   This uses the default `useAll` values based on the `object` format.
 * @param {object} [opts.replaceOne] `replace` but `useAll` set to `false`.
 * @param {object} [opts.replaceAll] `replace` but `useAll` set to `true`.
 * @param {(string|string[])} [opts.strip] Sub-strings to remove entirely.
 * @returns {string} The *name* of a module as per the options set.
 * @alias module:@lumjs/core/modules.name
 */
function name(module, opts={})
{
  let filename;

  if (typeof module === S)
  { // Going to assume a string is the filename.
    filename = module;
  }
  else if (isCJS(module))
  { // It's a CommonJS module context object.
    filename = module.filename ?? module.id;
  }
  else if (isESM(module))
  { // It's an ES Module metadata (import.meta) object.
    filename = module.filename ?? path.basename(module.url);
  }
  else
  { // Sorry, we don't support that.
    throw new TypeError("Unsupported module parameter");
  }

  const ext = path.extname(filename);

  let useFallback = true;
  let useAuto = opts.useAuto ?? true;

  if (opts.basename)
  { // We want to run the basename sequence first.
    filename = path.basename(filename, ext);
    useFallback = false;
    useAuto = false;
  }
  
  if (isObj(opts.replace))
  { // Replacements using replace() or replaceAll() based on parameter format.
    useFallback = false;
    filename = replace(filename, opts.replace);
  }

  if (isObj(opts.replaceOne))
  { // Replacements using replace() regardless of parameter format.
    useFallback = false;
    filename = replace(filename, opts.replaceOne, false);
  }

  if (isObj(opts.replaceAll))
  { // Replacements using replaceAll() regardless of parameter format.
    useFallback = false;
    filename = replace(filename, opts.replaceAll, true);
  }

  if (typeof opts.strip === S)
  { // A prefix. This always uses replace(), never replaceAll(). 
    filename = filename.replace(opts.strip, '');
    useFallback = false;
  }
  else if (Array.isArray(opts.strip))
  { // A list of strings or regexps to strip. Ditto on the use of replace().
    for (const strip of opts.strip)
    {
      filename = filename.replace(strip, '');
    }
    useFallback = false;
  }

  if (useFallback)
  { // We're going to use the basename, either as a fallback
    filename = path.basename(filename, ext);
    useAuto = false;
  }

  if (useAuto)
  { // A few automatic rules that normally apply if the fallback was not used.
    filename = filename
      .replace(/^[./]+/, '')
      .replace(RegExp(ext+'$'), '');
  }

  return filename;
}

module.exports = { name, isCJS, isESM }
