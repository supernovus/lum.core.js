/**
 * Meta-programming helpers.
 * @module @lumjs/core/meta
 */

const {F,S,isArray,isa,console} = require('./types');

/**
 * Get a stacktrace. Differs from browser to browser.
 *
 * Uses the `stack` property of an `Error` object as the source.
 * This is a super simplistic hack. For a more complete solution, try
 * the `stacktrace-js` library, which will be used in the new `@lumjs/debug`
 * library as a dependency.
 *
 * @param {string} [msg] - A message for the Error object.
 *
 * @returns {string[]} An array of stack strings.
 * @alias module:@lumjs/core/meta.stacktrace
 */
function stacktrace(msg)
{
  return (new Error(msg)).stack.split("\n");
}

exports.stacktrace = stacktrace;

/**
 * Abstract classes for Javascript.
 * @alias module:@lumjs/core/meta.AbstractClass
 */
class AbstractClass
{
  /**
   * If you want to mark a method as abstract use this.
   */
  $abstract(name)
  {
    if (name.indexOf('(') === -1)
    { // Add empty method signature.
      name += '()';
    }
    throw new Error(`Abstract method ${name} was not implemented`);
  }

  /**
   * Check for required properties
   * 
   * @param {...(string|Array)} needs - What is needed
   * 
   * If this is a `string` it should be in a format like:
   * 
   * - `methodName(arg1,arg2,arg3)`
   * - `anotherMethod(number, string, object) : boolean`
   * - `yetAnother (className) : resultClass`
   * 
   * The names are case sensitive, and we'll look for the method after 
   * stripping off anything from the first *non-word* character.
   * 
   * If this is an `Array`, the first item must be the name of a property,
   * and each other item should be a type checking value, or array of type 
   * checking values from the [TYPES]{@link module:@lumjs/core/types.TYPES} 
   * object, as used by [isa()]{@link module:@lumjs/core/types.isa}.
   * 
   * If you are calling this in an abstract class constructor, likely only 
   * the method checks will be useful, as the `super()` call must be done 
   * *before* any instance property assignments.
   * 
   */
  $needs(...needs)
  {
    const className = this.constructor.name;

    const getName = fullName => fullName.replace(/\W.*/, '');
    const missing = propName => 
    { 
      throw new Error(`${className} is missing ${propName}`); 
    }

    for (const need of needs)
    {
      if (typeof need === S)
      { // A simple method
        const meth = getName(need);
        if (typeof this[meth] !== F)
        {
          missing(need);
        }
      }
      else if (isArray(need))
      {
        const prop = getName(need[0]);
        const types = need.slice(1);
        if (!isa(this[prop], ...types))
        {
          missing(need);
        }
      }
    }
  }

}

exports.AbstractClass = AbstractClass;

/**
 * Function prototypes for async, generator, and async generator functions.
 * @namespace
 * @alias module:@lumjs/core/meta.Functions
 */
const Functions =
{
  /**
   * Constructor for dynamic generator functions.
   */
  Generator: Object.getPrototypeOf(function*(){}).constructor,

  /**
   * Constructor for dynamic async functions.
   */
  Async: Object.getPrototypeOf(async function(){}).constructor,

  /**
   * Constructor for dynamic async generator functions.
   */
  AsyncGenerator: Object.getPrototypeOf(async function*(){}).constructor,

}

exports.Functions = Functions;

/**
 * A placeholder function for when something is not implemented.
 * 
 * @param {boolean} [fatal=true] If `true` throw Error.
 *   If `false` use `console.error()` instead.
 * @param {string} [prefix=''] A prefix for the error message.
 * 
 * @returns {void}
 * @alias module:@lumjs/core/meta.NYI
 */
function NYI(fatal=true, prefix='') 
{ 
  const msg = prefix+"« NOT YET IMPLEMENTED »";
  if (fatal)
    throw new Error(msg);
  else
    console.error(msg);
}

exports.NYI = NYI;
