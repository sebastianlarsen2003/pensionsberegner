import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const CALENDLY_URL = "https://calendly.com/sebastian-raadgiverxperten/10min"

const CHECKLIST_ITEMS = [
  "Tjek om din arbejdsgiverpension dækker dig ved sygdom og dødsfald",
  "Undersøg om du kan indbetale mere via din arbejdsgiver — ofte med en skattefordel",
  "Få overblik over hvad du reelt betaler i omkostninger på din ordning",
  "Tjek for gamle fripolicer eller pensioner fra tidligere jobs",
  "Genbesøg din pension om 1-2 år, eller når din situation ændrer sig",
]

function qualifiedEmailHtml(name: string) {
  return `
    <div style="margin:0;padding:0;background-color:#F4FAFA;font-family:Arial,Helvetica,sans-serif;color:#253457;">
      <div style="max-width:680px;margin:0 auto;padding:24px 16px;">
        <div style="background:#ffffff;border:1px solid rgba(37,52,87,0.10);border-radius:24px;overflow:hidden;">

          <div style="background:#253457;padding:30px 24px;">
            <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#BFEAFB;font-weight:700;">
              RådgiverXperten
            </p>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.15;color:#ffffff;">
              Vi matcher dig med den rigtige rådgiver
            </h1>
            <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#D8E2F0;">
              Hej ${name || ""}. Tak for dine svar. Ud fra dem kan der være noget at hente ved at få et
              professionelt tjek af din pension.
            </p>
          </div>

          <div style="padding:28px 24px;">

            <h2 style="margin:0 0 14px;font-size:20px;color:#253457;">Hvad sker der til mødet?</h2>

            <div style="margin-bottom:10px;padding:16px;border-radius:16px;background:#FBFCFD;border:1px solid rgba(37,52,87,0.08);">
              <p style="margin:0;font-size:14px;font-weight:700;color:#253457;">🔍 Vi gennemgår din pension</p>
              <p style="margin:5px 0 0;font-size:13px;line-height:1.6;color:#5F687A;">Vi kigger på om din pensionsordning er sat fornuftigt op — og om der er noget at optimere.</p>
            </div>

            <div style="margin-bottom:10px;padding:16px;border-radius:16px;background:#FBFCFD;border:1px solid rgba(37,52,87,0.08);">
              <p style="margin:0;font-size:14px;font-weight:700;color:#253457;">👥 Vi matcher dig videre</p>
              <p style="margin:5px 0 0;font-size:13px;line-height:1.6;color:#5F687A;">Hvis der er noget at optimere, matcher vi dig med den rigtige rådgiver i vores kvalitetssikrede netværk.</p>
            </div>

            <div style="margin-bottom:24px;padding:16px;border-radius:16px;background:#FBFCFD;border:1px solid rgba(37,52,87,0.08);">
              <p style="margin:0;font-size:14px;font-weight:700;color:#253457;">⏱️ 20 minutter, gratis</p>
              <p style="margin:5px 0 0;font-size:13px;line-height:1.6;color:#5F687A;">Et kort, uforpligtende opkald — ingen binding, og du bestemmer selv om du vil gå videre.</p>
            </div>

            <div style="padding:22px;border-radius:20px;background:#EAF7FD;border:1px solid rgba(79,183,231,0.30);margin-bottom:24px;">
              <h3 style="margin:0 0 10px;font-size:18px;color:#253457;">Vil du selv vælge tidspunkt?</h3>
              <p style="margin:0 0 14px;font-size:13px;line-height:1.7;color:#5F687A;">
                Book et gratis og uforpligtende telefonmøde direkte i Sebastian's kalender.
              </p>
              <a href="${CALENDLY_URL}" style="display:inline-block;background:#253457;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:14px;font-weight:700;">
                Book gratis opkald
              </a>
            </div>

            <p style="margin:0;font-size:11px;line-height:1.7;color:#8D95A6;">
              RådgiverXperten er et uafhængigt formidlingsled og yder ikke selv finansiel rådgivning.
            </p>

          </div>
        </div>
      </div>
    </div>
  `
}

function checklistEmailHtml(name: string) {
  const items = CHECKLIST_ITEMS.map(
    (item, i) => `
      <div style="margin-bottom:10px;padding:16px;border-radius:16px;background:#FBFCFD;border:1px solid rgba(37,52,87,0.08);display:flex;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:#253457;"><strong>${i + 1}.</strong> ${item}</p>
      </div>`
  ).join("")

  return `
    <div style="margin:0;padding:0;background-color:#F4FAFA;font-family:Arial,Helvetica,sans-serif;color:#253457;">
      <div style="max-width:680px;margin:0 auto;padding:24px 16px;">
        <div style="background:#ffffff;border:1px solid rgba(37,52,87,0.10);border-radius:24px;overflow:hidden;">

          <div style="background:#253457;padding:30px 24px;">
            <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#BFEAFB;font-weight:700;">
              RådgiverXperten
            </p>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.15;color:#ffffff;">
              Din pension ser fornuftig ud
            </h1>
            <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#D8E2F0;">
              Hej ${name || ""}. Ud fra dine svar er der ikke umiddelbart noget akut at gøre — men her er en
              tjekliste, du selv kan holde øje med.
            </p>
          </div>

          <div style="padding:28px 24px;">

            <h2 style="margin:0 0 14px;font-size:20px;color:#253457;">Din tjekliste</h2>
            ${items}

            <div style="padding:22px;border-radius:20px;background:#EAF7FD;border:1px solid rgba(79,183,231,0.30);margin:24px 0;">
              <p style="margin:0;font-size:13px;line-height:1.7;color:#5F687A;">
                Skifter du job eller får en fripolice? Gem os — så finder vi den rigtige rådgiver til dig.
              </p>
            </div>

            <p style="margin:0;font-size:11px;line-height:1.7;color:#8D95A6;">
              RådgiverXperten er et uafhængigt formidlingsled og yder ikke selv finansiel rådgivning.
            </p>

          </div>
        </div>
      </div>
    </div>
  `
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, qualified } = body

    // Kun send mail hvis email er med
    if (!email) {
      return Response.json({ ok: true }, { status: 200 })
    }

    const html = qualified ? qualifiedEmailHtml(name) : checklistEmailHtml(name)
    const subject = qualified
      ? "Vi matcher dig med den rigtige rådgiver"
      : "Din tjekliste til pension"

    const response = await resend.emails.send({
      from: "RådgiverXperten <info@raadgiverxperten.dk>",
      to: [email],
      subject,
      html,
    })

    return Response.json(response, { status: response.error ? 500 : 200 })
  } catch (error) {
    return Response.json({ error: "Noget gik galt ved afsendelse." }, { status: 500 })
  }
}
