import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

function calcPension(age: number, retAge: number, savings: number, monthly: number, rate: number) {
  const months = (retAge - age) * 12
  const mr = rate / 12
  let val = savings
  for (let m = 1; m <= months; m++) {
    val += monthly
    val *= 1 + mr
  }
  return Math.round(val)
}

function fmt(n: number) {
  return `${Math.round(n).toLocaleString("da-DK")} kr.`
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, answers } = body

    // Kun send mail hvis email er med
    if (!email) {
      return Response.json({ ok: true }, { status: 200 })
    }

    // Byg resultater fra answers
    const age: number = answers?.[0] || 40
    const savings: number = answers?.[1] || 350000
    const savingsMin: number = answers?.[10] || savings * 0.7
    const savingsMax: number = answers?.[11] || savings * 1.3
    const monthly: number = answers?.[2] || 3000
    const retAge = 67

    const base = calcPension(age, retAge, savings, monthly, 0.05)
    const opt  = calcPension(age, retAge, savings, monthly, 0.055)
    const diffMin = Math.max(0, calcPension(age, retAge, savingsMin, monthly, 0.055) - calcPension(age, retAge, savingsMin, monthly, 0.05))
    const diffMax = Math.max(0, calcPension(age, retAge, savingsMax, monthly, 0.055) - calcPension(age, retAge, savingsMax, monthly, 0.05))

    const calendlyUrl = "https://calendly.com/sebastian-raadgiverxperten/10min"

    const response = await resend.emails.send({
      from: "RådgiverXperten <info@raadgiverxperten.dk>",
      to: [email],
      subject: "Dit pensionsestimat er klar",
      html: `
        <div style="margin:0;padding:0;background-color:#F4FAFA;font-family:Arial,Helvetica,sans-serif;color:#253457;">
          <div style="max-width:680px;margin:0 auto;padding:24px 16px;">
            <div style="background:#ffffff;border:1px solid rgba(37,52,87,0.10);border-radius:24px;overflow:hidden;">

              <div style="background:#253457;padding:30px 24px;">
                <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#BFEAFB;font-weight:700;">
                  RådgiverXperten
                </p>
                <h1 style="margin:12px 0 0;font-size:28px;line-height:1.15;color:#ffffff;">
                  Dit pensionsestimat er klar
                </h1>
                <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#D8E2F0;">
                  Hej ${name || ""}. Som lovet får du hermed din foreløbige vurdering sendt.
                </p>
              </div>

              <div style="padding:28px 24px;">

                <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#5F687A;">
                  Estimatet er baseret på dine svar og standardantagelser (5% p.a. afkast, pensionsalder 67, 0,5% lavere omkostninger). Det er et groft overblik — ikke individuel rådgivning.
                </p>

                <!-- Nuværende -->
                <div style="margin-bottom:14px;padding:20px;border-radius:18px;background:#FBFCFD;border:1px solid rgba(37,52,87,0.10);">
                  <p style="margin:0 0 6px;font-size:13px;color:#8D95A6;font-weight:700;">Nuværende estimat</p>
                  <p style="margin:0;font-size:32px;font-weight:800;color:#253457;">${fmt(base)}</p>
                  <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#5F687A;">
                    Forventet pensionsopsparing ved pensionsalder baseret på dine svar.
                  </p>
                </div>

                <!-- Optimeret -->
                <div style="margin-bottom:14px;padding:20px;border-radius:18px;background:#EAF7FD;border:1px solid rgba(79,183,231,0.30);">
                  <p style="margin:0 0 6px;font-size:13px;color:#4FB7E7;font-weight:700;">Med 0,5% lavere omkostninger</p>
                  <p style="margin:0;font-size:32px;font-weight:800;color:#253457;">${fmt(opt)}</p>
                  <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#5F687A;">
                    Forventet opsparing i det alternative scenarie.
                  </p>
                </div>

                <!-- Potentiale -->
                <div style="margin-bottom:24px;padding:22px;border-radius:20px;background:#253457;">
                  <p style="margin:0 0 6px;font-size:13px;color:#BFEAFB;font-weight:700;">Dit mulige optimeringspotentiale</p>
                  <p style="margin:0;font-size:34px;font-weight:800;color:#ffffff;">${fmt(diffMin)} – ${fmt(diffMax)}</p>
                  <p style="margin:10px 0 0;font-size:13px;line-height:1.7;color:#D8E2F0;">
                    Dette interval afspejler usikkerheden i dit valgte opsparingsinterval. Det er et groft estimat og ikke et løfte om en bestemt gevinst.
                  </p>
                </div>

                <!-- Hvad sker der nu -->
                <h2 style="margin:0 0 14px;font-size:20px;color:#253457;">Hvad sker der nu?</h2>

                <div style="margin-bottom:10px;padding:16px;border-radius:16px;background:#FBFCFD;border:1px solid rgba(37,52,87,0.08);">
                  <p style="margin:0;font-size:14px;font-weight:700;color:#253457;">📞 Sebastian ringer dig op</p>
                  <p style="margin:5px 0 0;font-size:13px;line-height:1.6;color:#5F687A;">Et kort, gratis opkald hvor vi tager udgangspunkt i dit resultat.</p>
                </div>

                <div style="margin-bottom:10px;padding:16px;border-radius:16px;background:#FBFCFD;border:1px solid rgba(37,52,87,0.08);">
                  <p style="margin:0;font-size:14px;font-weight:700;color:#253457;">🔍 Vi gennemgår din løsning</p>
                  <p style="margin:5px 0 0;font-size:13px;line-height:1.6;color:#5F687A;">Vi kigger på om din pensionsordning er sat fornuftigt op.</p>
                </div>

                <div style="margin-bottom:24px;padding:16px;border-radius:16px;background:#FBFCFD;border:1px solid rgba(37,52,87,0.08);">
                  <p style="margin:0;font-size:14px;font-weight:700;color:#253457;">👥 Vi matcher dig videre</p>
                  <p style="margin:5px 0 0;font-size:13px;line-height:1.6;color:#5F687A;">Hvis der er noget at optimere, matcher vi dig med den rigtige rådgiver i vores kvalitetssikrede netværk.</p>
                </div>

                <!-- Book -->
                <div style="padding:22px;border-radius:20px;background:#EAF7FD;border:1px solid rgba(79,183,231,0.30);margin-bottom:24px;">
                  <h3 style="margin:0 0 10px;font-size:18px;color:#253457;">Vil du selv vælge tidspunkt?</h3>
                  <p style="margin:0 0 14px;font-size:13px;line-height:1.7;color:#5F687A;">
                    Book et gratis og uforpligtende telefonmøde på 10 minutter direkte i Sebastian's kalender.
                  </p>
                  <a href="${calendlyUrl}" style="display:inline-block;background:#253457;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:14px;font-weight:700;">
                    Book gratis opkald
                  </a>
                </div>

                <p style="margin:0;font-size:11px;line-height:1.7;color:#8D95A6;">
                  Beregningen er vejledende, før skat, og bør ikke stå alene ved større økonomiske beslutninger. RådgiverXperten er et uafhængigt formidlingsled og yder ikke selv finansiel rådgivning.
                </p>

              </div>
            </div>
          </div>
        </div>
      `,
    })

    return Response.json(response, { status: response.error ? 500 : 200 })
  } catch (error) {
    return Response.json({ error: "Noget gik galt ved afsendelse." }, { status: 500 })
  }
}