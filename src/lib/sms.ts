import "server-only";

/**
 * Twilio SMS sending (server-only). Used for the publish blast and post-publish
 * edit notifications — NOT for login OTP (that's Supabase's phone provider,
 * configured in the Supabase dashboard, which calls Twilio itself).
 *
 * Credentials are plain server env (never NEXT_PUBLIC): they must not reach the
 * client bundle. Until they're set (10DLC/Twilio still being provisioned),
 * sends are skipped with a warning rather than throwing — publishing must keep
 * working before SMS is live (the two-track launch plan).
 */
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
// A Messaging Service (recommended — carries the 10DLC campaign + number pool)
// or a plain From number. Set exactly one.
const MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

export function smsConfigured(): boolean {
  return Boolean(
    ACCOUNT_SID && AUTH_TOKEN && (MESSAGING_SERVICE_SID || FROM_NUMBER),
  );
}

export type SmsResult = { to: string; ok: boolean; error?: string };

/** Send one SMS. Resolves to a result rather than throwing, so a single bad
 *  number never aborts a whole blast. */
async function sendOne(to: string, body: string): Promise<SmsResult> {
  const params = new URLSearchParams({ To: to, Body: body });
  if (MESSAGING_SERVICE_SID) {
    params.set("MessagingServiceSid", MESSAGING_SERVICE_SID);
  } else if (FROM_NUMBER) {
    params.set("From", FROM_NUMBER);
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      },
    );
    if (!res.ok) {
      const detail = await res.text();
      return { to, ok: false, error: `Twilio ${res.status}: ${detail}` };
    }
    return { to, ok: true };
  } catch (err) {
    return { to, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Send the same message to many recipients. No-op (returns []) with a warning
 * when Twilio isn't configured yet. Sends are sequential — volume here is tiny
 * (~26 staff) and it keeps us clear of Twilio's per-second limits without extra
 * machinery.
 */
export async function sendSms(
  recipients: string[],
  body: string,
): Promise<SmsResult[]> {
  if (!smsConfigured()) {
    console.warn(
      `[sms] Twilio not configured — skipping ${recipients.length} message(s). ` +
        `Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_MESSAGING_SERVICE_SID.`,
    );
    return [];
  }

  const results: SmsResult[] = [];
  for (const to of recipients) {
    results.push(await sendOne(to, body));
  }

  const failures = results.filter((r) => !r.ok);
  if (failures.length) {
    // Surface failures in logs, but don't throw — the publish itself succeeded.
    console.error(`[sms] ${failures.length}/${results.length} failed`, failures);
  }
  return results;
}
