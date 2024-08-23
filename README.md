# lum.core.js

Some small *core* constants, functions, classes, and objects.
Things that make working with objects in Javascript slightly nicer,
and work in CommonJS/Node.js and modern browsers without any modifications.

Used by all the rest of my *Lum.js* libraries.

## Notes

As of version `1.30.0` the `opt.Opts` class has been split into its the new
[@lumjs/opts] package, which itself depends on a new [@lumjs/errors] package.

Until the next major release (`2.0`), this package will have
a dependency on the split-away pacakages, so that it can have a deprecated
alias to the old class name available. As of `2.0` that alias will be
removed, and the dependencies will also be removed.

## Documentation

### [API Docs](https://supernovus.github.io/docs/js/@lumjs/core/)

The documentation is written in [JSDoc 3](https://jsdoc.app/) format.

You can compile the documentation using `npm run build-docs`
which will put the generated docs into the `./docs/api` folder.

### [Changelog](./docs/changelogs/1.x.md)
### [TODO](TODO.md)
### [Homepage](https://supernovus.github.io/)

## Official URLs

This library can be found in two places:

 * [Github](https://github.com/supernovus/lum.core.js)
 * [NPM](https://www.npmjs.com/package/@lumjs/core)

## Author

Timothy Totten <2010@totten.ca>

## License

[MIT](https://spdx.org/licenses/MIT.html)

---

[@lumjs/opts]: https://github.com/supernovus/lum.opts.js
[@lumjs/errors]: https://github.com/supernovus/lum.errors.js
