# TODO

**Updated: `2025-12-03`**

## v2.x

The primary goals of verson 2.x are to remove any old code that shouldn't
be used anymore, and to streamline the package so that it's once again a
a minimalistic _core_ package without a whole bunch of features that belong
in their own packages.

This package should be about working with JS types and objects.

### v1.38.x Tasks

These releases will all be about splitting bigger (sub-)modules into
their own packages, and adding temporary compatibility aliases
using the `meta.wrapDepr()` function (same as `opt.Opts` does).

I think each separate pacakage split will be done as 1.38.x point release.
I want to split the following (not necessarily in this order):

- ~~Split `events` module into a separate package (`@lumjs/events`).~~
- Split `traits` module into a separate package (`@lumjs/traits`).
- Split `types.stringify` into a separate package (`@lumjs/describe`).
- Split `obj.cp` into a separate package (`@lumjs/cp`).
  - Yes, _I know_ I just added it, but I seriously over-designed it,
    and it's frankly way too complicated to be a _core_ feature.
  - For simple things `Object.assign()` is just fine.
  - Deep/recursive copying/cloning is where something like the current
    `obj.cp` _may_ be useful, but even then writing model-specific code
    may actually be the better approach.
- Split `console` into a separate package (`@lumjs/console`).
  - Create a new `ConsoleWrapper` class that can do everything the existing
    singleton can do, but with more flexibility. Unlike the current version,
    it can be sub-classed to make specialized implementations.
  - Create a sub-module that exports a singleton `ConsoleWrapper` instance 
    with the same behaviours and options as the current implementation.
- Split `arrays` module into a separate package (`@lumjs/arrays`).
- Move curent `obj.apply()` function to `@lumjs/cp` package, adding a
  deprecated link for the duration of the v1.x lifecycle.
- ~~Move `types.lazy()` to `obj.lazy()`, add a temporary (deprecated) link.~~
- Major refactoring of `context` module, support node.js using ES modules!
- Move `types.ownCount()` to `obj.ownCount()` as that's where it belongs.
  A deprecated alias will remain for the duration of the 1.x releases.

### v1.39.x Tasks

- Deprecate `types.root`, as `globalThis` is in every supported runtime.
- Deprecate `obj.{copyAll,duplicateOne,duplicateAll}`
- Deprecate `obj.{clone,copyProps,mergeNested,syncNested}`
- Deprecate `obj.lock()`; it was designed to pair with `obj.clone()`.
  - Just use `Object.seal()` or `Object.freeze()` directly.
  - `obj.addLock()` and `obj.cloneIfLocked()` are also deprecated.
- Mark `core.observable()` as deprecated.
  - List `events.observable()` as the _replaced by_ reference.
- Deprecate `types.def()`, listing `obj.df` as a replacement.
- Deprecate exporting properties of `meta` into the default module.
  Use `core.meta` or `require('@lumjs/core/meta')` explicitly.
- Ensure all deprecated functions are using `meta.deprecated()`.
- Ensure none of the deprecated code is being used by any code
  that will remain in the core package. The core must be standalone!
- Add a full test set for the `obj.df*` functions.

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
- Drop the `obj/df` sub-module (including any docs referencing it.)
- Replace all `lazy()` exports with regular ones.
- Migrate from CommonJS to ES Modules?
  I wrote [@lumjs/dotjs] using ES Modules, using the CommonJS compatibility
  offered in Node.js v22 and newer. As v24 is the active LTS release I think
  it's safe to make v22 the minimum supported version at this point.
  I'd like to move all my code to ES Modules (or TypeScript) going forward,
  so I might as well use a major version bump as a time to start that process!
- Add a `@lumjs/core/cjs-compat` 

### v2.x+ Plans

- Deprecate the single-letter type constants (`S,N,F,B`, etc.)
  They make code analysis more difficult, as most editors/tools look for
  statements like: `if (typeof foo === 'string')` and will then know that
  `foo` is as a string when offering method completion, etc. Let compilers
  or bundlers do any code minimisation/optimisation.
- The single-letter properties in the `TYPES` object are fine, as they are
  generally only used for the `isa()` and `needs()` runtime type checks.

## Documentation

Go through all the DocBlocks and ensure the documentation is up-to-date and
good enough to actually be useful.

This would be nice to have finished for the planned `2.x` release.

## Tests

Add tests for all core libraries using [@lumjs/tests] library.
There's a small set of tests already, but plenty to do yet.

---

[@lumjs/tests]: https://github.com/supernovus/lum.tests.js 
[@lumjs/compat]: https://github.com/supernovus/lum.compat.js
[@lumjs/dotjs]: https://github.com/supernovus/lum.dotjs.js
