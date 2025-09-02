// DEPRECATED: legacy proxy file for the misspelled CareerOneStoap host.
// Replaced by the canonical careeronestop-proxy.js. Left as a harmless stub.
module.exports = (req, res, next) => {
  // Deprecated: route name contained a misspelling. Use the canonical `/api/careers/careeronestop/*` routes.
  res.status(410).json({ error: 'Deprecated proxy. Use /api/careers/careeronestop/* instead' });
};
