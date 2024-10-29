# TODO

**Updated: `2024-10-25`**

## v2.x

I'm thinking it's getting close to time to do a big cleanup of the codebase,
and refactor a few things that have gotten rather crufty. While there may be
a few more releases in the `1.x` series, I think focusing on a clean break
for the future would be a good idea.

### Pre-2.0 Tasks

Things I want to do _before_ I make a `2.x` release.

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
- Add temporary compatibility aliases for the newly split features
  using the `meta.wrapDepr()` function (same as `opt.Opts` does).
- Deprecate `obj.lock()`; it was designed to pair with `obj.clone()`.
  - Just use `Object.seal()` or `Object.freeze()` directly.
  - `obj.addLock()` and `obj.cloneIfLocked()` are also deprecated.
- Mark `core.observable()` as deprecated.
  - List `events.observable()` as the _replaced by_ reference.
- Ensure all deprecated functions are using `meta.deprecated()`.

### 2.0 Release Tasks

- Remove all deprecated code:
  - `obj.{copyAll,duplicateOne,duplicateAll}`
  - `obj.{clone,copyProps,mergeNested,syncNested}`
  - `obj.{lock,addLock,addClone}`
  - `types.instanceOf` and related options in `types.isa`
  - `<meta>.AbstractClass`
  - `observable` sub-module
- Drop dependencies being used for backwards compatibility:
  - `@lumjs/cp`
  - `@lumjs/describe`
  - `@lumjs/events`
  - `@lumjs/opts` 
  - `@lumjs/traits`

I may look at making an updated version of the [@lumjs/compat] package that 
would be able to analyse code and report anything that would need to be
modified before upgrading to a major release.

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

