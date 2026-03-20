/**
 * Email utility — sends via SMTP (nodemailer) when configured, otherwise logs to console.
 * Configure SMTP in .env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * For Gmail: use an App Password (not your regular password).
 */

let transporter: any = null;

async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env["SMTP_HOST"];
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];

  if (!host || !user || !pass) return null;

  try {
    const nodemailer = await import("nodemailer");
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env["SMTP_PORT"] ?? "587"),
      secure: process.env["SMTP_PORT"] === "465",
      auth: { user, pass },
    });
    return transporter;
  } catch {
    return null;
  }
}

/** Returns true when SMTP is properly configured. */
export function isSmtpConfigured(): boolean {
  return !!(process.env["SMTP_HOST"] && process.env["SMTP_USER"] && process.env["SMTP_PASS"]);
}

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const t = await getTransporter();

  if (!t) {
    // Dev fallback — print code to console
    console.log(`\n╔════════════════════════════════╗`);
    console.log(`║  EMAIL VERIFICATION CODE       ║`);
    console.log(`║  To: ${to.padEnd(26)}║`);
    console.log(`║  Code: ${code.padEnd(24)}║`);
    console.log(`╚════════════════════════════════╝\n`);
    return;
  }

  const from = process.env["SMTP_FROM"] ?? process.env["SMTP_USER"];
  await t.sendMail({
    from: `"Étude+" <${from}>`,
    to,
    subject: "Votre code de vérification Étude+",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#1a1a2e;margin-bottom:8px">Code de vérification</h2>
        <p style="color:#666;margin-bottom:24px">Utilisez ce code pour confirmer votre adresse email.</p>
        <div style="background:#f5f5f5;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a1a2e">${code}</span>
        </div>
        <p style="color:#999;font-size:13px">Ce code expire dans <strong>10 minutes</strong>. Ne le partagez avec personne.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#ccc;font-size:12px">Étude+ — Plateforme de cours particuliers en Tunisie</p>
      </div>
    `,
  });
}
