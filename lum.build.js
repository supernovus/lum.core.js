"use strict";

const D =
{
  build: 'docs/build',
  api: 'docs/api/',
  changelogs: 'docs/changelogs',
  ad(from)
  {
    const to = D.api+from.replace(/\.md/, '.html');
    return {from,to}
  },
}

const dirs = 
[
  D.build,
  D.api+D.changelogs,
]

const header = "<html><body>";
const footer = "</body></html>";

const files = 
[
  {
    from: 'README.md', 
    to: D.build+'/README.md',
  },
  D.ad('docs/TODO.md'),
  D.ad(D.changelogs+'/index.md'),
  D.ad(D.changelogs+'/1.0-beta.md'),
  D.ad(D.changelogs+'/1.x.md'),
  D.ad(D.changelogs+'/2.x.md'),
]

module.exports =
{
  dirs, files, header, footer,
}
