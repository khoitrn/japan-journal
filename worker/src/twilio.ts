export async function sendWhatsApp(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string
): Promise<void> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const creds = btoa(`${accountSid}:${authToken}`)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: `whatsapp:${from}`,
      To:   `whatsapp:${to}`,
      Body: body,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Twilio error ${res.status}: ${err}`)
  }
}

// Parses incoming Twilio webhook form body
export function parseTwilioBody(body: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(body))
}

// Returns TwiML OK response (Twilio expects this to not retry)
export function twimlOk(): Response {
  return new Response('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}
