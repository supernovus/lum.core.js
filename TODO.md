# TODO

## v2.x

I'm thinking it's getting close to time to do a big cleanup of the codebase,
and refactor a few things that have gotten rather crufty. While there may be
a few more releases in the `1.x` series, I think focusing on a clean break
for the future would be a good idea. A few of the things I want to do:

- Remove all deprecated code:
  - `obj.{copyAll,duplicateOne,duplicateAll}`
  - `types.instanceOf` and related options in `types.isa`
  - `<meta>.AbstractClass`
- Implement a new `obj.copy` API function/class
  - Will completely replace `obj.{clone,copyProps,mergeNested}`
  - Offer an extended version of the declarative API from `copyProps`
  - Cut anything that seems superfluous or rarely used
  - Add ability to copy `Symbol` properties
- Replace `obj.syncNested` with `obj.sync` using the new `obj.copy` API
- Move `opt.Opts` into its own separate package
- Give `observable` some TLC

I will likely update this list a bit before I get around to starting the
new branch that will eventually become the `2.0.0` release.

I also want to make a new version of the [@lumjs/compat] package that
will be more helpful for major updates in the future, so it will have
a corresponding `v2.x` release at the same time as this package.

## Tests

Write proper tests using [@lumjs/tests] library.
This list of files is out of date and needs updating.

  - [x] `types/js`
  - [x] `types/basics` 
  - [x] `types/root`
  - [x] `types/isa`
  - [x] `types/needs`
  - [x] `types/def`
  - [x] `types/typelist`
  - [ ] `types/stringify`
  - [x] `types/index`
  - [x] `arrays`
  - [ ] `context`
  - [ ] `strings`
  - [ ] `flags`
  - [ ] `obj/copyall`
  - [ ] `obj/copyprops`
  - [ ] `obj/clone`
  - [ ] `obj/lock`
  - [ ] `obj/merge`
  - [ ] `obj/ns`
  - [ ] `obj/index`
  - [ ] `opt`
  - [ ] `objectid`
  - [ ] `meta`
  - [ ] `enum`
  - [ ] `lazy`
  - [ ] `observable`
  - [ ] `index`

Would be nice to have the tests finished for the planned `2.x` release.

## Documentation

Go through all the DocBlocks and ensure the documentation is up-to-date and
good enough to actually be useful.

This would also be nice to have finished for the planned `2.x` release.

---

[@lumjs/tests]: https://github.com/supernovus/lum.tests.js 
[@lumjs/compat]: https://github.com/supernovus/lum.compat.js

