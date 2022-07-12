# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
## Changed
- `core.modules`: Minor cleanups.
- Updated this *changelog* which I forgot to do last time.

## [1.0.0-beta.3] - 2022-07-11
## Added
- `core.context.hasRequire`: A boolean value indicating `require()`
- `core.context.isNode`: A boolean value guessing the environment is node.js
## Changed
- `core.context.CJS`: Made slightly tighter in definition.
- `core.modules.name()`: Made it more flexible.
- `core.obj`: Changed namespace exports.
## Fixed
- `core.modules.name()`: Actually return the value!

## [1.0.0-beta.2] - 2022-07-08
## Changed
- Renamed `src` to `lib` as we're not compiling/transpiling this code.
- Moved `index.js` into `lib` with the rest of the module files.
- Added `modules.js` with a method for generating a name/id for a module.
- Added `isSearch()`,`isReplacement()`, and `replaceItems()` to `strings.js`.

## [1.0.0-beta.1] - 2022-07-07
### Added
- Initial release.
- Pulled a bunch of the core libraries from the old Lum.js project.
- Refactored and reorganized the libraries a lot.

[Unreleased]: https://github.com/supernovus/lum.core.js/compare/v1.0.0-beta.3...HEAD
[1.0.0-beta.3]: https://github.com/supernovus/lum.core.js/compare/v1.0.0-beta.2...v1.0.0-beta.3
[1.0.0-beta.2]: https://github.com/supernovus/lum.core.js/compare/v1.0.0-beta.1...v1.0.0-beta.2
[1.0.0-beta.1]: https://github.com/supernovus/lum.core.js/releases/tag/v1.0.0-beta.1

