import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, results, costSaving } = body

    const baselineValue = Number(results.baseline.futureValue).toLocaleString("da-DK")
    const improvedValue = Number(results.improved.futureValue).toLocaleString("da-DK")
    const extraValue = Number(results.returnDifference).toLocaleString("da-DK")
    const costSavingLabel = String(costSaving).replace(".", ",")

    const differenceNumber = Number(results.returnDifference)

    let perspectiveText = ""
    if (differenceNumber < 100000) {
      perspectiveText =
        "Det er en mærkbar forskel og et godt eksempel på, at selv mindre justeringer kan have betydning over tid."
    } else if (differenceNumber < 500000) {
      perspectiveText =
        "Det peger på et tydeligt optimeringspotentiale, hvor selv relativt små ændringer i omkostninger kan få stor betydning frem mod pension."
    } else {
      perspectiveText =
        "Det er en væsentlig potentiel forskel, som understreger hvor meget omkostninger og struktur kan betyde over en længere årrække."
    }

    const calendlyUrl = "https://calendly.com/DIT-LINK-HER"

    const response = await resend.emails.send({
      from: "RådgiverXperten <onboarding@resend.dev>",
      to: [email],
      subject: "Din vurdering fra RådgiverXperten",
      html: `
        <div style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#253457;">
          <div style="max-width:680px;margin:0 auto;padding:24px 16px;">
            
            <div style="background:#ffffff;border:1px solid #e6ebf2;border-radius:20px;overflow:hidden;">
              
              <div style="background:#253457;padding:28px 24px;">
                <p style="margin:0;font-size:12px;line-height:1.4;letter-spacing:1.6px;text-transform:uppercase;color:#d8e2f0;">
                  RådgiverXperten
                </p>
                <h1 style="margin:10px 0 0 0;font-size:28px;line-height:1.2;color:#ffffff;">
                  Din foreløbige vurdering
                </h1>
              </div>

              <div style="padding:28px 24px;">
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.8;color:#253457;">
                  Hej ${name}
                </p>

                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.8;color:#5F6D84;">
                  Som lovet får du hermed din foreløbige vurdering sendt.
                </p>

                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.8;color:#5F6D84;">
                  Formålet med beregningen er at give dig et første overblik over, hvordan din pensionsopsparing kan udvikle sig frem mod pension, og hvad det potentielt kan betyde, hvis omkostningerne i din løsning kan sænkes.
                </p>

                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.8;color:#5F6D84;">
                  Nedenfor kan du se både din nuværende fremskrivning og et muligt forbedret scenarie.
                </p>

                <div style="margin-bottom:20px;padding:20px;border-radius:18px;background:#f8fafd;border:1px solid #e6ebf2;">
                  <p style="margin:0 0 8px 0;font-size:14px;color:#8D95A6;">
                    Sådan ser det ud nu
                  </p>
                  <p style="margin:0;font-size:34px;line-height:1.2;font-weight:700;color:#253457;">
                    ${baselineValue} kr.
                  </p>
                  <p style="margin:10px 0 0 0;font-size:14px;line-height:1.7;color:#5F6D84;">
                    Forventet opsparing ved pension med den nuværende beregning.
                  </p>
                </div>

                <div style="margin-bottom:20px;padding:20px;border-radius:18px;background:#eff8fd;border:1px solid #c9e9f7;">
                  <p style="margin:0 0 8px 0;font-size:14px;color:#5F6D84;">
                    Hvis vi kan spare dig for ${costSavingLabel}% i omkostninger
                  </p>
                  <p style="margin:0;font-size:34px;line-height:1.2;font-weight:700;color:#253457;">
                    ${improvedValue} kr.
                  </p>
                  <p style="margin:10px 0 0 0;font-size:14px;line-height:1.7;color:#5F6D84;">
                    Forventet opsparing ved pension i det forbedrede scenarie.
                  </p>
                </div>

                <div style="margin-bottom:24px;padding:20px;border-radius:18px;background:#253457;">
                  <p style="margin:0 0 8px 0;font-size:14px;color:#d8e2f0;">
                    Mulig ekstra værdi fra afkast
                  </p>
                  <p style="margin:0;font-size:34px;line-height:1.2;font-weight:700;color:#ffffff;">
                    ${extraValue} kr.
                  </p>
                  <p style="margin:10px 0 0 0;font-size:14px;line-height:1.7;color:#d8e2f0;">
                    ${perspectiveText}
                  </p>
                </div>

                <h2 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:#253457;">
                  Hvad er værd at være opmærksom på?
                </h2>

                <p style="margin:0 0 14px 0;font-size:15px;line-height:1.8;color:#5F6D84;">
                  Beregningen er vejledende, men den viser tydeligt, at omkostninger over tid kan have stor betydning for det samlede resultat.
                </p>

                <div style="margin:0 0 10px 0;">
                  <p style="margin:0;font-size:15px;font-weight:700;color:#253457;">1. Omkostninger</p>
                  <p style="margin:4px 0 0 0;font-size:14px;line-height:1.7;color:#5F6D84;">
                    Selv mindre forskelle i årlige omkostninger kan få stor betydning over mange år.
                  </p>
                </div>

                <div style="margin:0 0 10px 0;">
                  <p style="margin:0;font-size:15px;font-weight:700;color:#253457;">2. Investeringsstrategi</p>
                  <p style="margin:4px 0 0 0;font-size:14px;line-height:1.7;color:#5F6D84;">
                    Det er vigtigt, at risiko og sammensætning passer til din tidshorisont og dine mål.
                  </p>
                </div>

                <div style="margin:0 0 24px 0;">
                  <p style="margin:0;font-size:15px;font-weight:700;color:#253457;">3. Samlet pensionsstruktur</p>
                  <p style="margin:4px 0 0 0;font-size:14px;line-height:1.7;color:#5F6D84;">
                    Det handler ikke kun om ét produkt, men om hvordan hele løsningen spiller sammen.
                  </p>
                </div>

                <div style="padding:20px;border-radius:18px;background:#f8fafd;border:1px solid #e6ebf2;margin-bottom:24px;">
                  <h3 style="margin:0 0 10px 0;font-size:18px;line-height:1.4;color:#253457;">
                    Vil du have en kort gennemgang?
                  </h3>
                  <p style="margin:0 0 14px 0;font-size:14px;line-height:1.8;color:#5F6D84;">
                    Hvis du vil, kan vi tage en kort og uforpligtende dialog om din nuværende løsning og vurdere, om der er områder, der med fordel kan undersøges nærmere.
                  </p>
                  <a
                    href="${calendlyUrl}"
                    style="display:inline-block;background:#253457;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:12px;font-size:14px;font-weight:700;"
                  >
                    Book en kort gennemgang
                  </a>
                </div>

                <p style="margin:0;font-size:12px;line-height:1.7;color:#8D95A6;">
                  Beregningen er vejledende, før skat, og bør ikke stå alene ved større økonomiske beslutninger.
                </p>
              </div>
            </div>
          </div>
        </div>
      `,
    })

    return Response.json(response, {
      status: response.error ? 500 : 200,
    })
  } catch (error) {
    return Response.json({ error: "Noget gik galt ved afsendelse." }, { status: 500 })
  }
}