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
 */
function stacktrace(msg)
{
  return (new Error(msg)).stack.split("\n");
}

exports.stacktrace = stacktrace;

/**
 * Abstract classes for Javascript.
 */
class AbstractClass
{
  /**
   * You must override the constructor.
   */
  constructor()
  {
    const name = this.constructor.name;
    throw new Error(`Cannot create instance of abstract class ${name}`);
  }

  /**
   * If you want to mark a method as abstract use this.
   */
  $abstract(name)
  {
    throw new Error(`Abstract method ${name}() was not implemented`);
  }

}

exports.AbstractClass = AbstractClass;

/**
 * Function prototypes for async, generator, and async generator functions.
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
