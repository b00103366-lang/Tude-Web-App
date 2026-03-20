/**
 * Email service — uses Resend when RESEND_API_KEY is set,
 * otherwise logs to console (dev mode). All functions are fire-and-forget.
 */

import { Resend } from "resend";

const APP_URL = process.env["APP_URL"] ?? "http://localhost:5173";
const FROM = process.env["RESEND_FROM"] ?? "Étude+ <noreply@etude.tn>";

function getResend(): Resend | null {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return null;
  return new Resend(key);
}

function devLog(to: string, subject: string, body: string) {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  [EMAIL DEV MODE]`);
  console.log(`║  To:      ${to}`);
  console.log(`║  Subject: ${subject}`);
  console.log(`║  Body:    ${body.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").slice(0, 200)}`);
  console.log(`╚══════════════════════════════════════════╝\n`);
}

// ─── 1. Email verification link ───────────────────────────────────────────────

export function sendAccountVerificationEmail(
  user: { email: string; fullName: string; merchantId?: string | null },
  token: string
): void {
  const link = `${APP_URL}/verify-email?token=${token}`;
  const subject = "Confirmez votre adresse email — Étude+";
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff">
      <div style="text-align:center;margin-bottom:32px">
        <h1 style="color:#1a1a2e;font-size:28px;margin:0">Étude+</h1>
        <p style="color:#6b7280;margin:4px 0 0">Plateforme de cours particuliers en Tunisie</p>
      </div>
      <h2 style="color:#1a1a2e;margin-bottom:8px">Bonjour ${user.fullName},</h2>
      <p style="color:#374151;line-height:1.6">
        Bienvenue sur Étude+ ! Veuillez confirmer votre adresse email pour activer votre compte.
      </p>
      <div style="text-align:center;margin:32px 0">
        <a href="${link}"
           style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;
                  padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px">
          Confirmer mon email
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px">
        Ce lien expire dans <strong>24 heures</strong>. Si vous n'avez pas créé de compte, ignorez cet email.
      </p>
      <p style="color:#9ca3af;font-size:12px;word-break:break-all">
        Ou copiez ce lien dans votre navigateur :<br>${link}
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#d1d5db;font-size:12px;text-align:center">Étude+ — Tunisie</p>
    </div>
  `;

  const resend = getResend();
  if (!resend) { devLog(user.email, subject, html); return; }

  resend.emails.send({ from: FROM, to: user.email, subject, html })
    .catch(err => console.error("[emailService] sendAccountVerificationEmail failed:", err));
}

// ─── 2. KYC submitted confirmation ───────────────────────────────────────────

export function sendKycSubmittedEmail(
  teacher: { email: string; fullName: string; merchantId?: string | null },
  declaredSubjects: Array<{ niveauKey: string; sectionKey: string | null; subjects: string[] }>
): void {
  const subjectList = declaredSubjects
    .flatMap(e => e.subjects.map(s =>
      e.sectionKey ? `${s} — ${e.niveauKey} / ${e.sectionKey}` : `${s} — ${e.niveauKey}`
    ))
    .map(s => `<li style="margin:4px 0;color:#374151">${s}</li>`)
    .join("");

  const subject = "📋 Dossier reçu — en cours d'examen";
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff">
      <div style="text-align:center;margin-bottom:32px">
        <h1 style="color:#1a1a2e;font-size:28px;margin:0">Étude+</h1>
      </div>
      <h2 style="color:#1a1a2e;margin-bottom:8px">Bonjour ${teacher.fullName},</h2>
      <p style="color:#374151;line-height:1.6">
        Nous avons bien reçu votre dossier de vérification. Voici un récapitulatif de ce qui a été soumis :
      </p>
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:24px 0">
        <p style="margin:0 0 12px;font-weight:600;color:#1a1a2e">Documents reçus :</p>
        <p style="margin:6px 0;color:#374151">✅ CIN (recto + verso)</p>
        <p style="margin:6px 0;color:#374151">✅ Diplôme universitaire</p>
        <p style="margin:6px 0;color:#374151">✅ Certificat d'enseignement</p>
        <p style="margin:6px 0;color:#374151">✅ Vidéo de présentation</p>
        <p style="margin:6px 0 12px;font-weight:600;color:#1a1a2e">✅ Matières déclarées :</p>
        <ul style="margin:0;padding-left:20px">${subjectList}</ul>
      </div>
      ${teacher.merchantId ? `
      <div style="background:#eff6ff;border-radius:8px;padding:12px 16px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:#1d4ed8">
          Votre Merchant ID : <strong style="font-family:monospace">${teacher.merchantId}</strong>
        </p>
      </div>` : ""}
      <p style="color:#374151;line-height:1.6">
        Notre équipe examinera votre dossier et vous contactera dans les <strong>48 heures</strong>.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#d1d5db;font-size:12px;text-align:center">Étude+ — Tunisie</p>
    </div>
  `;

  const resend = getResend();
  if (!resend) { devLog(teacher.email, subject, html); return; }

  resend.emails.send({ from: FROM, to: teacher.email, subject, html })
    .catch(err => console.error("[emailService] sendKycSubmittedEmail failed:", err));
}

// ─── 3. KYC approved ─────────────────────────────────────────────────────────

export function sendKycApprovedEmail(
  teacher: { email: string; fullName: string; merchantId?: string | null },
  approvedSubjects: Array<{ niveauKey: string; sectionKey: string | null; subject: string }>
): void {
  const subjectList = approvedSubjects
    .map(s =>
      s.sectionKey
        ? `${s.subject} — ${s.niveauKey} / ${s.sectionKey}`
        : `${s.subject} — ${s.niveauKey}`
    )
    .map(s => `<li style="margin:4px 0;color:#374151">${s}</li>`)
    .join("");

  const subject = "✅ Compte vérifié — Bienvenue sur Étude+ !";
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff">
      <div style="text-align:center;margin-bottom:32px">
        <h1 style="color:#1a1a2e;font-size:28px;margin:0">Étude+</h1>
      </div>
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;background:#dcfce7;border-radius:50%;width:64px;height:64px;
                    line-height:64px;font-size:32px;text-align:center">✅</div>
      </div>
      <h2 style="color:#1a1a2e;text-align:center;margin-bottom:8px">Félicitations, ${teacher.fullName} !</h2>
      <p style="color:#374151;line-height:1.6;text-align:center">
        Votre compte a été <strong>vérifié avec succès</strong>. Vous pouvez maintenant publier vos cours sur Étude+.
      </p>
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:24px 0">
        <p style="margin:0 0 12px;font-weight:600;color:#1a1a2e">Matières approuvées :</p>
        <ul style="margin:0;padding-left:20px">${subjectList}</ul>
      </div>
      ${teacher.merchantId ? `
      <div style="background:#eff6ff;border-radius:8px;padding:12px 16px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:#1d4ed8">
          Votre Merchant ID : <strong style="font-family:monospace">${teacher.merchantId}</strong>
        </p>
      </div>` : ""}
      <div style="text-align:center;margin:32px 0">
        <a href="${APP_URL}/professor/classes/new"
           style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;
                  padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px">
          Créer mon premier cours
        </a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#d1d5db;font-size:12px;text-align:center">Étude+ — Tunisie</p>
    </div>
  `;

  const resend = getResend();
  if (!resend) { devLog(teacher.email, subject, html); return; }

  resend.emails.send({ from: FROM, to: teacher.email, subject, html })
    .catch(err => console.error("[emailService] sendKycApprovedEmail failed:", err));
}
