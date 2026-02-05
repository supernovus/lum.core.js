# TODO

**Updated: `2025-12-18`**

## v2.x

The primary goals of verson 2.x are to remove any old code that shouldn't
be used anymore, and to streamline the package so that it's once again a
a minimalistic _core_ package without a whole bunch of features that belong
in their own packages.

This package should be about working with JS types and objects.

I think breaking the usual semantic versioning for the `1.38` and `1.39`
releases is justified due to them being special, transitional releases
working toward `1.40` which will be the last planned 1.x release series.

### v1.38.x Tasks

These releases will all be about splitting bigger (sub-)modules into
their own packages, and adding temporary compatibility aliases
using the `meta.wrapDepr()` function (same as `opt.Opts` does).

Each separate pacakage split will be done as 1.38.x point release.
I want to split the following (not necessarily in this order):

- ~~Split most of `arrays` module into a separate package (`@lumjs/lists`).~~
- ~~Split `events` module into a separate package (`@lumjs/events`).~~
- ~~Split `traits` module into a separate package (`@lumjs/traits`).~~
- ~~Split `types.stringify` into a separate package (`@lumjs/describe`).~~
- ~~Split `obj.cp` into a separate package (`@lumjs/cp`).~~
- ~~Move curent `obj.cpHandler` function to `@lumjs/cp` package.~~
- ~~Move `types.lazy()` to `obj.lazy()`, add a temporary (deprecated) link.~~
- ~~Refactor `context` module to support node.js using ES modules.~~
- ~~Move `types.ownCount()` to `obj.ownCount()` as that's where it belongs.~~
  ~~A deprecated alias will remain for the duration of the 1.x releases.~~
- ~~Make a new `node` module that is **NOT** included in the default exports.~~
- ~~Move `modules` module to `node`, leaving an alias in the 1.x releases.~~
- ~~The `node/modules` module should support ES Modules as well!~~

**Unless I find bugs, `1.38.8` should be the final in the 1.38.x releases.**

### v1.39.x Tasks

This is the finalization of the cleanup tasks from 1.38.x. 
It will consist of a bunch of point releases, each one implementing one
or more items from the below list.

- Deprecate `types.root`, as `globalThis` is in every supported runtime.
- Deprecate `obj.{copyAll,duplicateOne,duplicateAll}`
- Deprecate `obj.{clone,copyProps,mergeNested,syncNested}`
- Deprecate `obj.lock()`; it was designed to pair with `obj.clone()`.
  - Just use `Object.seal()` or `Object.freeze()` directly.
  - `obj.addLock()` and `obj.cloneIfLocked()` are also deprecated.
- Mark both `events` and `observable` sub-modules as deprecated.
  - Use `@lumjs/events` for the former.
  - Use `@lumjs/events-observable` for the latter.
- Deprecate `types.def()`, listing `obj.df` as a replacement.
- Deprecate exporting properties of `meta` into the default module.
  Use `core.meta` or `require('@lumjs/core/meta')` explicitly.
  (This is done in the documentation, but no wrapDepre() calls yet).
- Ensure all deprecated functions are using `meta.deprecated()`.
- Ensure none of the deprecated code is being used by any code
  that will remain in the core package. The core must be standalone!
- Add tests using [@lumjs/tests] for any modules left in the core package.
- Ensure DocBlocks for everything in the core package is complete.

### v1.40.x Release(s)

When I'm satisfied with the state of the 1.39.x releases,
I will release 1.40.0 as the _final_ release of the 1.x series.
A new `v1.x` branch will be created at this point, and the `main`
branch will be shifted to `2.x` development.

This release series will go back to proper semantic versioning,
with point releases being used only for bug fixes.

### v2.0.0 Release Tasks

- Remove all deprecated code:
  - `obj.{copyAll,duplicateOne,duplicateAll}`
  - `obj.{clone,copyProps,mergeNested,syncNested}`
  - `obj.{lock,addLock,addClone,cloneIfLocked}`
  - `types.instanceOf` and related options in `types.isa`
  - `types.unbound.{add,remove}`
  - `types.def` and `types.lazy`
  - `types/unbound/objects` internal list go bye bye
  - `<meta>.AbstractClass`
  - `observable` sub-module
  - Anything else listed as deprecated in the `1.38/1.39` tasks.
- Drop all dependencies being used for backwards compatibility,
  and any of the wrapper functions/getters calling the new packages.
  - `@lumjs/cp`
  - `@lumjs/describe`
  - `@lumjs/events`
  - `@lumjs/opts` 
  - `@lumjs/traits`
- Drop the `types/basics` sub-module and change all documentation using it
  to reference the `types` module directly.
- Replace all `lazy()` exports with regular ones.
- Migrate from CommonJS to ES Modules?
  I wrote [@lumjs/dotjs] using ES Modules, using the CommonJS compatibility
  offered in Node.js v22 and newer. As v24 is the active LTS release I think
  it's safe to make v22 the minimum supported version at this point.
  I'd like to move all my code to ES Modules (or TypeScript) going forward,
  so I might as well use a major version bump as a time to start that process!

### Future (v2.x+) Plans

- Deprecate the single-letter type constants (`S,N,F,B`, etc.)
  They make code analysis more difficult, as most editors/tools look for
  statements like: `if (typeof foo === 'string')` and will then know that
  `foo` is as a string when offering method completion, etc. Let compilers
  or bundlers do any code minimisation/optimisation.
- The single-letter properties in the `TYPES` object are fine, as they are
  generally only used for the `isa()` and `needs()` runtime type checks.
  Even those functions may be phased out or replaced by something less
  convoluted eventually, but I'm not too worried about them at this point.
- Possible overhaul of the `console` module:
  - Create a new `ConsoleWrapper` class that can do everything the existing
    singleton can do, but with more flexibility. Unlike the current version,
    it can be sub-classed to make specialized implementations.
  - Create a sub-module that exports a singleton `ConsoleWrapper` instance 
    with the same behaviours and options as the current implementation.

---

[@lumjs/tests]: https://github.com/supernovus/lum.tests.js
[@lumjs/dotjs]: https://github.com/supernovus/lum.dotjs.js
