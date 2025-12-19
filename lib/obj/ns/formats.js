'use strict';

/**
 * A collection of path formats for the obj.ns* functions.
 * @namespace module:@lumjs/core/obj.NS
 */

const {isObj} = require('../../types');

const isFormat = v => isObj(v) 
  && typeof v.handles === 'function'
  && typeof v.parse === 'function'
  && typeof v.stringify === 'function';

/**
 * The simplest base format for the obj.ns* functions.
 * 
 * This one has no escapes, and there is no way to include the
 * delimiter character (which is a single `'.'` in this format).
 * 
 * @alias module:@lumjs/core/obj.NS.Simple
 */
const Simple =
{
  delimiter: '.',
  prefix: '',

  // This must be the last format tested as it always returns true!
  handles: pathStr => true,

  /**
   * @param {string} pathStr
   * @returns {Array}
   */
  parse(pathStr)
  {
    let array = this.preParse(pathStr).split(this.delimiter);
    if (typeof this.postParse === 'function')
    { // Call the postParse for every path part.
      return array.map((p,i,a) => this.postParse(p,i,a));
    }
    return array;
  },

  /**
   * Strips the delimiter from the start and end of a path string.
   * This is used as the preParse() hook for the Simple format.
   * @param {string} pathStr
   * @returns {string}
   */
  stripDelimiter(pathStr)
  {
    if (pathStr.startsWith(this.delimiter))
    {
      pathStr = pathStr.substring(1);
    }

    if (pathStr.endsWith(this.delimiter))
    {
      pathStr = pathStr.substring(0, pathStr.length-1);
    }

    return pathStr;
  },

  /**
   * @param {Array} pathArray
   * @returns {string}
   */
  stringify(pathArray)
  {
    return this.prefix + pathArray.join(this.delimiter);
  },
}

Simple.preParse = Simple.stripDelimiter;

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
  delimiter: '/',
  escParse: [['~1','/'],['~0','~']],
  escString: [['~','~0'],['/','~1']],
  prefix: '/',

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
      part = part.replaceAll(...escString);
    }
    return part;    
  },
}

const JSP_PRE = /^\$[.\[]/;
const JSBLOCK = /\.?\[(["'])?(?<spath>.*?)\1\]/g;
const ESCD = '\b_\b';
const D = '.';
const IS_INT = /^\d+$/;
const SAFE_PATH = /^\w+$/;

/**
 * A namespace path format based on a minimal subset of JSONPath.
 * 
 * Obviously given the use-cases, this only supports single paths
 * with no extra query features.
 * 
 * @alias module:@lumjs/core/obj.NS.JSPath
 */
const JSPath =
{
  handles: pathStr => pathStr.startsWith('$'),

  parse(pathStr)
  {
    pathStr = pathStr.replace(JSP_PRE, '')
      .replaceAll(JSBLOCK, function(...args)
      {
        let {spath} = args[args.length-1] ?? '';
        return D+spath.replaceAll('.', ESCD);
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

module.exports = {isFormat, Simple, Pointer, JSPath}
