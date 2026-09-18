const REQUIRED = ["firstName", "lastName", "email", "company", "jobTitle", "role"];

// Forwards RSVPs to RSVP_WEBHOOK_URL (e.g. a Google Apps Script web app that appends a Sheet row).
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = req.body && typeof req.body === "object" ? req.body : null;
  if (!body) return res.status(400).json({ error: "Invalid request" });
  if (body.website) return res.json({ ok: true }); // honeypot

  const rsvp = {};
  for (const key of REQUIRED) {
    const value = typeof body[key] === "string" ? body[key].trim().slice(0, 200) : "";
    if (!value) return res.status(400).json({ error: `Missing ${key}` });
    rsvp[key] = value;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rsvp.email)) {
    return res.status(400).json({ error: "Invalid email" });
  }
  rsvp.submittedAt = new Date().toISOString();

  const url = process.env.RSVP_WEBHOOK_URL;
  if (!url) {
    console.log("RSVP (no RSVP_WEBHOOK_URL set):", rsvp);
    return res.json({ ok: true });
  }
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rsvp),
    });
    if (!r.ok) throw new Error();
  } catch {
    return res.status(502).json({ error: "Upstream failed" });
  }
  res.json({ ok: true });
};
