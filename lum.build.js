module.exports = function(rb)
{
  rb.readme
    .add('docs/TODO.md')
    .chdir('docs/changelogs')
    .add('index.md')
    .add('1.0-beta.md')
    .add('1.x.md')
    .add('2.x.md')
    //.set('debug', true)
}
