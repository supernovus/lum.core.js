/**
 * Variable string definition format.
 * 
 * It supports both quoted and unquoted variable value assignment,
 * multiline values, a few escape sequences, variable expansion,
 * variable expansion default values, and more.
 * 
 * As this was designed specifically for use with the `env` libraries,
 * it has several limitations that should be noted up front:
 * 
 * - All keys and values are always strings.
 * - No support for nested namespaces.
 * - The bare minimum for escape sequences.
 * 
 * A few examples:
 * 
 * ```
 * # A line starting with a non-word character is always a comment.
 * ; Inline comments are NOT supported.
 * FOO=hello
 * BAR=${FOO} world
 * ZAP="${FOO} from a quoted string"
 * BLAH = And spaces between key and = sign!
 * BLARG = '  Use quotes to preserve leading/trailing whitespace;  '
 * MORE = ${NAME:default values} can be added to variables.
 * TEST=${TEST:common use of defaults}
 * PRESERVE_LINES = "A multiline variable can be made
 * by using the quoted style. Newlines will be preserved
 * when using this in its \"default\" style. Note the use of \\ as
 * an escape character."
 * WRAP_LINES = "Alternatively if a string is too long \
 *   for one line you can end the line with a \
 *   and the newline and any whitespace following will be stripped."
 * // If your multiline value might have many literal quote characters,
 * // instead of having to escape all of them, you can ''stack'' your
 * // quote characters, as the type and number of closing quotes must 
 * // match the opening quotes exactly. For example:
 * JSON_TEXT="""
 * {
 *   "key": ["value1","value2"]
 * }"""
 * ```
 * 
 * Supported escape sequences:
 * - `\\` (a literal backslash)
 * - `\"` (a literal double-quote)
 * - `\'` (a literal single-quote)
 * - `\n` (line-feed / newline)
 * - `\r` (carriage return)
 * - `\t` (tab)
 * 
 * @module @lumjs/env/varstr
 */
'use strict';

const { isObj } = require('./types');

const ESC_BS = "\0BS\0";
const ESC_DQ = "\0DQ\0";
const ESC_SQ = "\0SQ\0";

const ESC_PRE =
[
  ["\\\\", ESC_BS],
  ["\\\"", ESC_DQ],
  ["\\\'", ESC_SQ],
];

const ESC_POST =
[
  [/\\[\n\r]+\s*/g, ''],
  ["\\n", "\n"],
  ["\\r", "\r"],
  ["\\t", "\t"],
  [ESC_BS, "\\"],
  [ESC_DQ, "\""],
  [ESC_SQ, "'"],
];

const SETLINE = /^\s*(?<key>\w+)\s*=\s*(?:(?<qt>["']+)(?<qval>.*?)\k<qt>|(?<uval>.*?)\s*$)/gsm;
const VARKEY = /\${(\w+)(?::([^}]+))?}/g;

/**
 * Parse a variable definition string.
 * @alias module:@lumjs/core/varstr.parse
 * 
 * @param {string} vstr - A variable definition string.
 * @param {object} [vars] Object to be populated.
 * If not specified a new, empty object will be used.
 * @param {string} [rest] Name of a variable
 * to put the parts of `vstr` that didn't match a supported
 * variable assignment pattern. That would include comments, etc.
 * 
 * @returns {object} The vars after parsing has completed.
 */
function parseVars(vstr, vars={}, rest)
{
  if (typeof vstr !== 'string' || !isObj(vars))
  {
    console.error('parseVars', {vstr, vars});
    throw new TypeError("Invalid arguments");
  }

  for (let esc of ESC_PRE)
  {
    vstr = vstr.replaceAll(...esc);
  }

  vstr = vstr.replaceAll(SETLINE, function(...args)
  {
    let {key, qval, uval} = args[args.length-1];
    let val = qval || uval;

    val = val.replaceAll(VARKEY, (_, vk, dv) => vars[vk] ?? dv ?? '');

    for (let esc of ESC_POST)
    {
      val = val.replaceAll(...esc);
    }

    vars[key] = val;

    return '';
  });

  if (typeof rest === 'string')
  {
    vars[rest] = vstr.trim();
  }

  return vars;
}

module.exports = {parse: parseVars}
