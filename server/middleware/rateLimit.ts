// TODO: Per-key rate limiting via Redis; enforce tier limits (free 500/mo, Pro 50k, Business unlimited),
// increment counter on each request and return 429 when monthly limit is exceeded.
export default defineEventHandler(async (event) => {
  // finish later
  return;
});
