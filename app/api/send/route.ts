import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, preferredTime, results, costSaving } = body

    const baselineValue = Number(results.baseline.futureValue).toLocaleString("da-DK")
    const improvedValue = Number(results.improved.futureValue).toLocaleString("da-DK")
    const extraValue = Number(results.returnDifference).toLocaleString("da-DK")
    const costSavingLabel = String(costSaving).replace(".", ",")

    const differenceNumber = Number(results.returnDifference)

    let perspectiveText = ""
    if (differenceNumber < 100000) {
      perspectiveText =
        "Det viser, at selv mindre forskelle i omkostningsniveau kan have en mærkbar betydning over tid."
    } else if (differenceNumber < 500000) {
      perspectiveText =
        "Det illustrerer et tydeligt potentiale, hvor forskelle i omkostningsniveau kan få stor betydning frem mod pension."
    } else {
      perspectiveText =
        "Det illustrerer en væsentlig potentiel forskel og viser, hvorfor omkostninger og pensionsstruktur kan være værd at få gennemgået."
    }

    const calendlyUrl =
      "https://calendly.com/sebastian-raadgiverxperten/10min"

    const response = await resend.emails.send({
      from: "RådgiverXperten <info@raadgiverxperten.dk>",
      to: [email],
      subject: "Dit pensionsestimat er klar",
      html: `
        <div style="margin:0;padding:0;background-color:#F4FAFA;font-family:Arial,Helvetica,sans-serif;color:#253457;">
          <div style="max-width:680px;margin:0 auto;padding:24px 16px;">
            <div style="background:#ffffff;border:1px solid rgba(37,52,87,0.10);border-radius:24px;overflow:hidden;box-shadow:0 18px 55px rgba(37,52,87,0.07);">
              
              <div style="background:#253457;padding:30px 24px;color:#ffffff;">
                <p style="margin:0;font-size:12px;line-height:1.4;letter-spacing:2px;text-transform:uppercase;color:#BFEAFB;font-weight:700;">
                  RådgiverXperten
                </p>

                <h1 style="margin:12px 0 0 0;font-size:30px;line-height:1.15;color:#ffffff;">
                  Dit pensionsestimat er klar
                </h1>

                <p style="margin:14px 0 0 0;font-size:15px;line-height:1.7;color:#D8E2F0;">
                  Hej ${name}. Som lovet får du hermed din foreløbige vurdering sendt.
                </p>
              </div>

              <div style="padding:28px 24px;">
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.8;color:#5F687A;">
                  Formålet med beregningen er at give dig et første overblik over, hvordan din pensionsopsparing kan udvikle sig frem mod pension, og illustrere hvilken betydning forskellige omkostningsniveauer potentielt kan have over tid.
                </p>

                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.8;color:#5F687A;">
                  Beregningen er vejledende og bør ses som et oplæg til dialog — ikke som individuel pensionsrådgivning.
                </p>

                <div style="margin-bottom:18px;padding:20px;border-radius:18px;background:#FBFCFD;border:1px solid rgba(37,52,87,0.10);">
                  <p style="margin:0 0 8px 0;font-size:14px;color:#8D95A6;font-weight:700;">
                    Sådan ser det ud nu
                  </p>

                  <p style="margin:0;font-size:34px;line-height:1.2;font-weight:800;color:#253457;">
                    ${baselineValue} DKK
                  </p>

                  <p style="margin:10px 0 0 0;font-size:14px;line-height:1.7;color:#5F687A;">
                    Forventet opsparing ved pension med den nuværende beregning.
                  </p>
                </div>

                <div style="margin-bottom:18px;padding:20px;border-radius:18px;background:#EAF7FD;border:1px solid rgba(79,183,231,0.30);">
                  <p style="margin:0 0 8px 0;font-size:14px;color:#5F687A;font-weight:700;">
                    Scenarie med ${costSavingLabel}% lavere omkostninger
                  </p>

                  <p style="margin:0;font-size:34px;line-height:1.2;font-weight:800;color:#253457;">
                    ${improvedValue} DKK
                  </p>

                  <p style="margin:10px 0 0 0;font-size:14px;line-height:1.7;color:#5F687A;">
                    Forventet opsparing ved pension i det alternative scenarie.
                  </p>
                </div>

                <div style="margin-bottom:26px;padding:22px;border-radius:20px;background:#253457;">
                  <p style="margin:0 0 8px 0;font-size:14px;color:#BFEAFB;font-weight:700;">
                    Mulig ekstra værdi fra afkast
                  </p>

                  <p style="margin:0;font-size:36px;line-height:1.15;font-weight:800;color:#ffffff;">
                    ${extraValue} DKK
                  </p>

                  <p style="margin:12px 0 0 0;font-size:14px;line-height:1.8;color:#D8E2F0;">
                    ${perspectiveText}
                  </p>
                </div>

                <h2 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:#253457;">
                  Hvad er værd at være opmærksom på?
                </h2>

                <p style="margin:0 0 18px 0;font-size:15px;line-height:1.8;color:#5F687A;">
                  Tallene viser ikke, om din nuværende pensionsløsning er god eller dårlig. De viser alene, at omkostninger, investeringsprofil og pensionsstruktur kan have stor betydning over tid.
                </p>

                <div style="margin-bottom:12px;padding:16px;border-radius:16px;background:#FBFCFD;border:1px solid rgba(37,52,87,0.08);">
                  <p style="margin:0;font-size:15px;font-weight:800;color:#253457;">
                    1. Omkostningsniveau
                  </p>

                  <p style="margin:5px 0 0 0;font-size:14px;line-height:1.7;color:#5F687A;">
                    Selv mindre forskelle i årlige omkostninger kan få betydning, når de får lov at virke over mange år.
                  </p>
                </div>

                <div style="margin-bottom:12px;padding:16px;border-radius:16px;background:#FBFCFD;border:1px solid rgba(37,52,87,0.08);">
                  <p style="margin:0;font-size:15px;font-weight:800;color:#253457;">
                    2. Investeringsprofil
                  </p>

                  <p style="margin:5px 0 0 0;font-size:14px;line-height:1.7;color:#5F687A;">
                    Det kan være relevant at få vurderet, om risiko og sammensætning passer til tidshorisont, mål og livssituation.
                  </p>
                </div>

                <div style="margin-bottom:24px;padding:16px;border-radius:16px;background:#FBFCFD;border:1px solid rgba(37,52,87,0.08);">
                  <p style="margin:0;font-size:15px;font-weight:800;color:#253457;">
                    3. Samlet pensionsstruktur
                  </p>

                  <p style="margin:5px 0 0 0;font-size:14px;line-height:1.7;color:#5F687A;">
                    Det handler ikke kun om ét produkt, men om hvordan pensioner, omkostninger, risiko og fremtidige udbetalinger spiller sammen.
                  </p>
                </div>

                <div style="padding:22px;border-radius:20px;background:#EAF7FD;border:1px solid rgba(79,183,231,0.30);margin-bottom:24px;">
                  <h3 style="margin:0 0 10px 0;font-size:19px;line-height:1.35;color:#253457;">
                    Vil du have gennemgået resultatet?
                  </h3>

                  <p style="margin:0 0 14px 0;font-size:14px;line-height:1.8;color:#5F687A;">
                    Book et gratis og uforpligtende telefonmøde på 10 minutter. Vi gennemgår dit estimat og hjælper med at afklare, om det giver mening at få undersøgt din pensionsløsning nærmere hos en relevant rådgiver.
                  </p>

                  <a
                    href="${calendlyUrl}"
                    style="display:inline-block;background:#253457;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:14px;font-weight:800;"
                  >
                    Book gratis 10 minutters telefonmøde
                  </a>
                </div>

                <div style="padding:18px;border-radius:18px;background:#FBFCFD;border:1px solid rgba(37,52,87,0.08);margin-bottom:20px;">
                  <h3 style="margin:0 0 8px 0;font-size:17px;line-height:1.35;color:#253457;">
                    Hvem er RådgiverXperten?
                  </h3>

                  <p style="margin:0;font-size:14px;line-height:1.8;color:#5F687A;">
                    RådgiverXperten fungerer som en uafhængig indgang, der hjælper med at skabe overblik og matche relevante personer med kvalitetssikrede rådgivere. Vi yder ikke individuel pensionsrådgivning i denne beregning.
                  </p>
                </div>

                <p style="margin:0;font-size:12px;line-height:1.7;color:#8D95A6;">
                  Beregningen er vejledende, før skat, og bør ikke stå alene ved større økonomiske beslutninger. Eventuel egentlig pensionsrådgivning sker via relevante samarbejdspartnere.
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
    return Response.json(
      { error: "Noget gik galt ved afsendelse." },
      { status: 500 }
    )
  }
}