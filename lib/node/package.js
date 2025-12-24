'use strict';

const semver = require('semver');
const PKGJSON = '/package.json';

function validate(pkgid, autoAppend)
{
  if (typeof pkgid !== 'string')
  {
    throw new TypeError("package id must be a string");
  }

  if (autoAppend && !pkgid.endsWith(PKGJSON))
  {
    pkgid += PKGJSON;
  }

  return pkgid;
}

/**
 * A wrapper class around package.json data that provides some version
 * related helper methods.
 * @exports @lumjs/core/node.Package
 */
class Package
{
  /**
   * Build a Package instance.
   * 
   * This requires that you've already loaded and parsed a package.json file.
   * See the require() and import() static methods which take a package name,
   * and expect that the package has a `/package.json` export defined.
   * 
   * @param {object} pkginfo - Data parsed from a package.json file.
   */
  constructor(pkginfo)
  { 
    /**
     * The package.json data.
     * @type {object}
     */
    this.info = pkginfo;

    /**
     * A `SemVer` instance (from the `semver` package) parsed from
     * the `version` property of the package.json data.
     * @type {object}
     */
    this.version = semver.parse(this.info.version);
  }

  /**
   * See if the package version satisfies a range statement.
   * @param {string} range - A semver range statement.
   * @param {object} [options] Options; see semver documentation.
   */
  satisfies(range, options)
  {
    return semver.satisfies(this.version, range, options);
  }

  /**
   * Build a Package instance using require() to load a package.json file.
   * 
   * @param {string} pkgid - Package id.
   * 
   * Assuming the package exports it's package.json as `/package.json` you
   * can simply pass the plain package name here (e.g. `@lumjs/core`).
   * 
   * @param {boolean} [autoAppend=true] Auto-append `/package.json` to pkgid?
   * 
   * If this is true (it is by default) and `pkgid` does NOT end in 
   * `/package.json`, it will be automatically appended before passing 
   * to require(). If for whatever reason the actual sub-module breaks the
   * expected naming convention, you'll need to pass the full sub-module
   * path as the `pkgid` and set this argument to false.
   * 
   * @returns {module:@lumjs/core/node.Package}
   * @throws {TypeError} If `pkgid` is not a string.
   * @throws {Error} If the package.json can not be loaded.
   */
  static require(pkgid, autoAppend=true)
  {
    let pkginfo = require(validate(pkgid, autoAppend));
    return new this(pkginfo);
  }

  /**
   * Build a Package instance using import() to load a package.json file.
   * 
   * All arguments are handled exactly the same as the require() method.
   * The only difference is import() is asynchronous, so this will return
   * a Promise that will resolve to the new Package instance.
   * 
   * @param {string} pkgid
   * @param {boolean} [autoAppend=true]
   * @returns {Promise<module:@lumjs/core/node.Package>}
   */
  static async import(pkgid, autoAppend=true)
  {
    let pkginfo = await import(validate(pkgid, autoAppend));
    return new this(pkginfo);
  }
}

module.exports = Package;
