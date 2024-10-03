// Tests of observable API (original implementation)

const {plan,run} = require('./inc/observable');
const origObs = require('../lib/old/observable')
const t = require('@lumjs/tests').new({module, plan});
const testOpts = {appendEvent: false}
run(t, origObs, testOpts);

// All done.
t.done();
