'use strict';

/**
 * A collection of path formats for the obj.ns* functions.
 * @namespace module:@lumjs/core/obj.NS
 */

const {isObj} = require('../../types');

/**
 * A format object for the obj.ns* functions.
 * @typedef {object} module:@lumjs/core/obj.NS~Format
 * @prop {function} canParse - Can this parse a path string?
 * @prop {function} canStringify - Can this stringify a path array?
 * @prop {function} parse - Parse a path string into a path array.
 * @prop {function} stringify - Stringify a path array into a path string.
 */

/**
 * A test to see if a value is a format object.
 * @param {mixed} v - Value to be tested
 * @returns {boolean}
 */
const isFormat = v => isObj(v) 
  && typeof v.canParse === 'function'
  && typeof v.canStringify === 'function'
  && typeof v.parse === 'function'
  && typeof v.stringify === 'function';

/**
 * The simplest base format for the obj.ns* functions.
 * 
 * This one has NO escapes, and there is no way to include the
 * delimiter character (which is a single `'.'` in this format).
 * 
 * Its methods are designed so that this can be used as a template
 * for other simplistic formats, and indeed the Pointer format
 * is an extension of this one.
 * 
 * Using it as a template is simple:
 * 
 * ```js
 * const MyFormat = {
 *   // Begin by composing Simple properties.
 *   ...Simple,
 * 
 *   // Override any of the syntax properties.
 *   hasEscapes: true,
 *   join: '/',
 *   prefix: '/',
 * 
 *   // Add some filter methods for parse() and stringify().
 *   preParse(pathStr) {
 *     // Do something to process path string and return it.
 *   },
 *   postParse(part, index) {
 *     // Do something to process each path segment after parsing.
 *     // This is used as an array.map() callback.
 *   },
 *   preStringify(part, index) {
 *     // Process path segment before joining (an array.map() callback).
 *   },
 *   postStringify(pathStr) {
 *     // Process path string after joining.
 *   },
 * }
 * ```
 * 
 * NOTE: Due to this format having no prefix its canParse() test
 * always returns true, therefore it must be the last in a list
 * of formats to test for.
 * 
 * @alias module:@lumjs/core/obj.NS.Simple
 */
const Simple =
{
  hasEscapes: false,
  join: '.',
  prefix: '',
  suffix: '',

  /**
   * Test if this format can handle a path string.
   * 
   * This version tests if the path string starts with `this.prefix`.
   * @param {string} pathStr
   * @returns {boolean}
   */
  canParse(pathStr)
  {
    return pathStr.startsWith(this.prefix);
  },

  /**
   * Test if this format can stringify a path array.
   * 
   * This version will return true immediately if `this.hasEscapes` is true.
   * 
   * Assuming `this.hasEscapes` is false, this will look at every part 
   * in the path array and check for the delimiter (`this.join`),
   * and will return false if any part contains the delimiter.
   * It returns true if none of the parts contain the delimiter.
   */
  canStringify(pathArray)
  {
    if (this.hasEscapes)
    { // Joiner can be escaped.
      return true;
    }

    for (let part of pathArray)
    {
      if (typeof part === 'string')
      {
        if (part.includes(this.join))
        {
          return false;
        }
      }
    }
    // No dots found, we're good.
    return true;
  },

  /**
   * Parse a path string into an array of path segments.
   * @param {string} pathStr
   * @returns {Array}
   */
  parse(pathStr)
  {
    if (typeof this.preParse === 'function')
    {
      pathStr = this.preParse(pathStr);
    }

    let array = pathStr.split(this.join);

    return ((typeof this.postParse === 'function')
      ? array.map((p,i,a) => this.postParse(p,i,a))
      : array);
  },

  /**
   * Stringify an array of path segments into a path string.
   * @param {Array} pathArray
   * @returns {string}
   */
  stringify(pathArray)
  {
    if (typeof this.preStringify === 'function')
    {
      pathArray = pathArray.map((p,i,a) => this.preStringify(p,i,a));
    }

    let pathStr = this.prefix + pathArray.join(this.join) + this.suffix;

    return ((typeof this.postStringify === 'function')
      ? this.postStringify(pathStr)
      : pathStr);
  },
}

/**
 * An extension of NS.Simple implementing a subset of JSONPointer.
 * 
 * This supports the two basic escapes (`~0` for `'~'` and `~1` for `'/'`),
 * and will be used by nsArray() if a path string starts with a `/` slash.
 * 
 * @alias module:@lumjs/core/obj.NS.Pointer
 */
const Pointer =
{
  ...Simple,

  escParse: [['~1','/'],['~0','~']],
  escString: [['~','~0'],['/','~1']],
  hasEscapes: true,
  join: '/',
  prefix: '/',

  preParse(pathStr)
  {
    let strip = this.prefix || this.join;
    if (pathStr.startsWith(strip))
    {
      pathStr = pathStr.substring(strip.length);
    }

    strip = this.suffix || this.join;
    if (pathStr.endsWith(strip))
    {
      pathStr = pathStr.substring(0, pathStr.length-strip.length);
    }

    return pathStr;
  },

  postParse(part)
  {
    for (let esc of this.escParse)
    {
      part = part.replaceAll(...esc);
    }
    return part;
  },

  preStringify(part)
  {
    for (let esc of this.escString)
    {
      part = part.replaceAll(...esc);
    }
    return part;    
  },
}

const JP_PRE = /^\$[.\[]/;
const JP_BLOCK = /\.?\[(["'])?(?<spath>.*?)\1\]/g;
const D = '.';
const ESCD = '\b_\b';
const IS_INT = /^\d+$/;
const SAFE_PATH = /^\w+$/;

/**
 * A namespace path format based on a minimal subset of JSONPath.
 * 
 * Obviously given the use-cases, this only supports single paths
 * with no extra query features. Basically the following are valid:
 * 
 * - `$.hello.darkness.my_old_friend` (plain dotted paths).
 * - `$["test.com"].expired` (a key with reserved characters in it).
 * - `$.users[3]` (an array index).
 *
 * Anything more complicated than that isn't going to work.
 *  
 * @alias module:@lumjs/core/obj.NS.JSPath
 */
const JSPath =
{
  canParse: pathStr => pathStr.startsWith('$'),
  
  // TODO: look into JSONPath escapes.
  canStringify(pathArray)
  {
    for (let part of pathArray)
    {
      if (typeof part === 'string')
      {
        if (part.includes('"'))
        {
          return false;
        }
      }
    }
    // No double-quotes found, we're good.
    return true;
  },

  parse(pathStr)
  {
    pathStr = pathStr.replace(JP_PRE, '')
      .replaceAll(JP_BLOCK, function(...args)
      {
        let {spath} = args[args.length-1] ?? '';
        return D+spath.replaceAll(D, ESCD);
      });
    return pathStr.split(D).map((vpath) => vpath.replaceAll(ESCD, D));
  },

  stringify(pathArr)
  {
    let pathStr = '$';
    for (let path of pathArr)
    {
      let isInt = IS_INT.test(path);
      if (!isInt && SAFE_PATH.test(path))
      { // Can use dotted syntax.
        pathStr += '.' + path;
      }
      else
      {
        let blockPath = isInt
          ? `[${path}]` 
          : `["${path}"]`;
        pathStr += blockPath;
      }
    }
    return pathStr;
  },
}

module.exports = 
{
  Defaults: [Pointer, JSPath, Simple],
  isFormat, 
  Simple, 
  Pointer, 
  JSPath,
}
