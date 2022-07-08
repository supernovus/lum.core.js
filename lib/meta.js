

/**
 * Get a stacktrace. Differs from browser to browser.
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
