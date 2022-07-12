// Stuff specific to mostly Node.js, but browser-shims may wrap this.

const path = require('path');
const {S,isObj} = require('./types');
const replace = require('./strings').replaceItems;

/**
 * Get the name of a module.
 *
 * TODO: document this.
 */
function name(module, opts={})
{
  let filename;

  if (typeof module === S)
  { // Going to assume a string is the filename.
    filename = module;
  }
  else if (isObj(module) && typeof module.filename === S)
  { // It's a CommonJS module context object.
    filename = module.filename;
  }
  else
  { // Sorry, we don't support that.
    throw new TypeError("Unsupported module parameter");
  }

  const ext = path.extname(filename);

  let useFallback = true;
  let useAuto = !opts.noAuto;

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

exports.name = name;
