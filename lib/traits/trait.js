"use strict";

const {isObj} = require('../types');
const {getComposed,decompose,compose,composeFully} = require('./funcs');

/**
 * An abstract class for Traits.
 * 
 * Simply offers a couple static methods and APIs that
 * wrap the `compose()` and `composeFully()` functions,
 * and makes it fairly simple to create Trait classes.
 * 
 * @alias module:@lumjs/core/traits.Trait
 */
class CoreTrait
{
  /**
   * Extend another class or object instance with the methods and
   * getter/setter properties from a Trait.
   * 
   * The sub-class of Trait this static method is called on will always 
   * be the `source` argument.
   * 
   * @param {(function|object)} target - Target class or instance.
   * 
   * @param {object} [protoOpts] Options for `compose()` function.
   * 
   * If this is not specified, or is any value other than an `object`,
   * we will look for defaults in a `composeOptions` static property:
   * 
   * ```js
   * static get composeOptions() { return {your: default, options: here}; }
   * ```
   * 
   * @param {(object|true)} [staticOpts] Static options.
   * 
   * If this is set we'll use `composeFully()` instead of using `compose()`.
   * 
   * If this value is an `object` it will be used as the `staticOpts`.
   * 
   * If this is the special value `true`, then we will look for the options
   * in a `staticOptions` static property:
   * 
   * ```js
   * static get staticOptions() { return {your: static, options: here}; }
   * ```
   * 
   * If this any value other than an `object` or `true`, it will be ignored
   * entirely, and the regular `compose()` call will be used.
   * 
   * @returns {object} Return value from the `setupTrait()` static method.
   * 
   */
  static composeInto(target, protoOpts, staticOpts)
  {
    if (!isObj(protoOpts))
    {
      protoOpts = this.composeOptions ?? {};
    }

    if (staticOpts === true)
    {
      staticOpts = this.staticOptions ?? {};
    }

    let composed;

    if (isObj(staticOpts))
    {
      composed = composeFully(target, this, protoOpts, staticOpts);
    }
    else
    {
      composed = compose(target, this, protoOpts);
    }

    return this.setupTrait({target, protoOpts, staticOpts, composed});
  }

  /**
   * A static method called by `composeInto()`
   * _after_ composing the trait properties into the target.
   * 
   * @param {object} info - Metadata from `composeInto()`
   * @param {(function|object)} info.target - The `target` argument
   * @param {object} info.protoOpts - The `protoOpts` used
   * @param {object} [info.staticOpts] The `staticOpts` if used
   * @param {module:@lumjs/core/traits~Composed} info.composed 
   * The return value from `compose()` or `composeFully()`.
   * 
   * @returns {object} The `info` object, with any changes made
   * by an overridden `setupTrait()` method in the sub-class.
   * 
   * The default implementation is a placeholder that returns the
   * `info` object without making any changes.
   * 
   */
  static setupTrait(info)
  {
    if (this.debug)
    {
      console.debug(this.name, "setupTrait()", info, this);
    }
    return info;
  }

  /**
   * A method wrapping {@link module:@lumjs/core/traits.decompose}
   * where the `source` is always the Trait sub-class constructor.
   * 
   * See the `decompose()` docs for descriptions of the other arguments.
   * 
   * @param {(function|object)} target 
   * @param {object} [opts] 
   * @returns {object} Return value from the `removedTrait()` static method.
   */
  static decomposeFrom(target, opts)
  {
    const info = {target, ok:true};
    info.composed = this.getComposed(target);
    this.removeTrait(info);

    if (info.ok)
    {
      info.count = decompose(target, this, opts);
    }

    return this.removedTrait(info);
  }

  /**
   * A static method called by `decomposeFrom()`
   * _before_ decomposing the trait properties from the target.
   * 
   * @param {object} info - Metadata from `decomposeFrom()`
   * @param {(function|object)} info.target - The `target` argument
   * @param {module:@lumjs/core/traits~Composed} info.composed 
   * The property map that was previously composed.
   * @param {boolean} info.ok - Will always be `true` initially.
   * 
   * If an overridden `removeTrait()` method sets this to `false`,
   * then the decomposeFrom() operation will skip the step of
   * actually decomposing the trait.
   * 
   * @returns {*} Return value is not used. 
   */
  static removeTrait(info)
  {
    if (this.debug)
    {
      console.debug(this.name, "removeTrait()", info, this);
    }
    return info;
  }

  /**
   * A static method called by `decomposeFrom()`
   * _after_ decomposing the trait properties from the target.
   * 
   * @param {object} info - The same as `removeTrait()`, plus:
   * @param {number} info.count - The number of properties decomposed;
   * 
   * @returns {object} The `info` object, with any changes made
   * by `removeTrait()` and `removedTrait()` methods in the 
   * sub-class.
   * 
   * The default implementation is a placeholder that returns the
   * `info` object without making any changes.
   * 
   */
  static removedTrait(info)
  {
    if (this.debug)
    {
      console.debug(this.name, "removedTrait()", info, this);
    }
    return info;
  }

  /**
   * A method wrapping {@link module:@lumjs/core/traits.getComposed}
   * where the `source` is always the Trait sub-class constructor.
   * 
   * @param {(function|object)} target
   * @returns {mixed} Return value from `getComposed()`
   */
  static getComposed(target)
  {
    return getComposed(target, this);
  }

} // CoreTrait class

module.exports = CoreTrait;
