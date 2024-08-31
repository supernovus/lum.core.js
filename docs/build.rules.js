"use strict";

const D =
{
  build: 'docs/build',
  api: 'docs/api/',
  changelogs: 'docs/changelogs',
}

const dirs = 
[
  D.build,
  D.api+D.changelogs,
]

const header = "<html><body>";
const footer = "</body></html>";

const update = (text) => text.replaceAll(/\.md/g, '.html');

const files = 
[
  {
    from: 'README.md', 
    to: D.build+'/README.md',
    update,
  },
  {
    from: 'docs/TODO.md',
    to: D.api+'docs/TODO.html',
  },
  {
    from: D.changelogs+'/index.md',
    to: D.api+D.changelogs+'/index.html',
    update,
  },
  {
    from: D.changelogs+'/1.0-beta.md',
    to: D.api+D.changelogs+'/1.0-beta.html',
    update,
  },
  {
    from: D.changelogs+'/1.x.md',
    to: D.api+D.changelogs+'/1.x.html',
    update,
  },
  {
    from: D.changelogs+'/2.x.md',
    to: D.api+D.changelogs+'/2.x.html',
    update,
  }, 
]

module.exports =
{
  dirs, files, header, footer,
}
