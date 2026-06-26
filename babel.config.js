// Re-use the mobile Babel config so EAS builds (run from repo root) apply
// the same transforms as local dev builds (run from mobile/).
module.exports = require('./mobile/babel.config.js');
