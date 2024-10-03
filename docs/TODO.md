# TODO

## v2.x

I'm thinking it's getting close to time to do a big cleanup of the codebase,
and refactor a few things that have gotten rather crufty. While there may be
a few more releases in the `1.x` series, I think focusing on a clean break
for the future would be a good idea. A few of the things I want to do:

- Remove all currently deprecated code:
  - `obj.{copyAll,duplicateOne,duplicateAll}`
  - `obj.{clone,copyProps,mergeNested,syncNested}`
  - `types.instanceOf` and related options in `types.isa`
  - `<meta>.AbstractClass`
- ~~Replace `observable` with `events/observable` wrapper.~~
  - Added a way to use both implementations until `2.0` is released.
  - Will remove the original implementation entirely for `2.0` release.
- Deprecate `observable` API, but leave compatibility wrapper until `3.x`.
- ~~Implement a new `obj.cp` API function/class~~
  - ~~Will be able to replace `obj.{clone,copyProps,mergeNested}`~~
  - ~~Offer an extended version of the declarative API from `copyProps`~~
  - ~~Cut anything that seems superfluous or rarely used~~
  - ~~Add ability to copy `Symbol` properties~~
- ~~Replace `obj.syncNested` with `obj.sync` using the new `obj.copy` API~~
  - I'm going to drop the sync functionality, it's just bad.
- ~~Move `opt.Opts` into its own separate package~~
- ~~A new `events` library that will eventually replace the `observable` API.~~

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

