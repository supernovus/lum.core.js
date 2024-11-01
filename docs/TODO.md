# TODO

**Updated: `2024-10-25`**

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

- Split `events` module into a separate package (`@lumjs/events`).
- Split `traits` module into a separate package (`@lumjs/traits`).
- Split `types.stringify` into a separate package (`@lumjs/describe`).
- Split `obj.cp` into a separate package (`@lumjs/cp`).
  - Yes, _I know_ I just added it, but I seriously over-designed it,
    and it's frankly way too complicated to be a _core_ feature.
  - For simple things `Object.assign()` is just fine.
  - Deep/recursive copying/cloning is where something like the current
    `obj.cp` _may_ be useful, but even then writing model-specific code
    may actually be the better approach.

### v1.39.0 Tasks

- Deprecate `obj.lock()`; it was designed to pair with `obj.clone()`.
  - Just use `Object.seal()` or `Object.freeze()` directly.
  - `obj.addLock()` and `obj.cloneIfLocked()` are also deprecated.
- Mark `core.observable()` as deprecated.
  - List `events.observable()` as the _replaced by_ reference.
- Ensure all deprecated functions are using `meta.deprecated()`.
- Ensure none of the deprecated code is being used by any code
  that will remain in the core package. The core must be standalone!

### v2.0.0 Release Tasks

- Remove all deprecated code:
  - `obj.{copyAll,duplicateOne,duplicateAll}`
  - `obj.{clone,copyProps,mergeNested,syncNested}`
  - `obj.{lock,addLock,addClone,cloneIfLocked}`
  - `types.instanceOf` and related options in `types.isa`
  - `<meta>.AbstractClass`
  - `observable` sub-module
- Drop all dependencies being used for backwards compatibility,
  and any of the wrapper functions/getters calling the new packages.
  - `@lumjs/cp`
  - `@lumjs/describe`
  - `@lumjs/events`
  - `@lumjs/opts` 
  - `@lumjs/traits`

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

