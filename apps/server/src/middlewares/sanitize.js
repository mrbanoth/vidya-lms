/** Strips Mongo operator keys ($gt, a.b) from user input to block NoSQL injection. */
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith("$") || k.includes(".")) continue;
      out[k] = clean(v);
    }
    return out;
  }
  return value;
}

export function sanitize(req, _res, next) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) req.body = clean(req.body);
  if (req.params) req.params = clean(req.params);
  // Express 5: req.query is a getter, so redefine it with the cleaned copy.
  const q = clean(req.query);
  Object.defineProperty(req, "query", { value: q, writable: true, configurable: true });
  next();
}
