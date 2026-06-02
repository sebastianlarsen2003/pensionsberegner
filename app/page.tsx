"use client"

import { track } from "@vercel/analytics"
import { useMemo, useRef, useState } from "react"
import {
  ArrowRight,
  Check,
  Clock3,
  Mail,
  Phone,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react"

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
  }
}

type SimulationResult = {
  yearsToRetirement: number
  futureValue: number
  totalOwnContributions: number
  estimatedReturn: number
  estimatedMonthlyPension: number
}

const CALENDLY_URL = "https://calendly.com/sebastian-raadgiverxperten/10min"

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString("da-DK")} DKK`
}

function calculatePensionScenario({
  age,
  retirementAge,
  currentSavings,
  monthlyContribution,
  annualReturn,
}: {
  age: number
  retirementAge: number
  currentSavings: number
  monthlyContribution: number
  annualReturn: number
}): SimulationResult | null {
  if (
    !age ||
    !retirementAge ||
    currentSavings < 0 ||
    monthlyContribution < 0 ||
    retirementAge <= age
  ) {
    return null
  }

  const yearsToRetirement = retirementAge - age
  const monthlyReturn = annualReturn / 12
  const totalMonths = yearsToRetirement * 12

  let totalValue = currentSavings
  let totalPaidIn = currentSavings

  for (let month = 1; month <= totalMonths; month++) {
    totalValue += monthlyContribution
    totalPaidIn += monthlyContribution
    totalValue *= 1 + monthlyReturn
  }

  const futureValue = Math.round(totalValue)
  const totalOwnContributions = Math.round(totalPaidIn)
  const estimatedReturn = Math.max(0, Math.round(futureValue - totalOwnContributions))
  const estimatedMonthlyPension = Math.round(futureValue / (20 * 12))

  return {
    yearsToRetirement,
    futureValue,
    totalOwnContributions,
    estimatedReturn,
    estimatedMonthlyPension,
  }
}

export default function Home() {
  const resultRef = useRef<HTMLDivElement>(null)

  const [age, setAge] = useState("")
  const [retirementAge, setRetirementAge] = useState("67")
  const [currentSavings, setCurrentSavings] = useState("")
  const [monthlyContribution, setMonthlyContribution] = useState("")
  const [costSaving, setCostSaving] = useState<0.5 | 0.75 | 1>(0.5)

  const [hasCalculated, setHasCalculated] = useState(false)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [consent, setConsent] = useState(false)

  const results = useMemo(() => {
    const currentAge = Number(age)
    const pensionAge = Number(retirementAge)
    const savings = Number(currentSavings)
    const monthly = Number(monthlyContribution)

    const baselineReturn = 0.05

    const baseline = calculatePensionScenario({
      age: currentAge,
      retirementAge: pensionAge,
      currentSavings: savings,
      monthlyContribution: monthly,
      annualReturn: baselineReturn,
    })

    if (!baseline) return null

    const improved = calculatePensionScenario({
      age: currentAge,
      retirementAge: pensionAge,
      currentSavings: savings,
      monthlyContribution: monthly,
      annualReturn: baselineReturn + costSaving / 100,
    })

    if (!improved) return null

    return {
      baseline,
      improved,
      returnDifference: improved.estimatedReturn - baseline.estimatedReturn,
    }
  }, [age, retirementAge, currentSavings, monthlyContribution, costSaving])

  const canCalculate =
    Number(age) > 0 &&
    Number(retirementAge) > Number(age) &&
    Number(currentSavings) >= 0 &&
    Number(monthlyContribution) >= 0 &&
    currentSavings !== "" &&
    monthlyContribution !== ""

  const canSubmit =
    !!results &&
    name.trim() &&
    email.trim() &&
    email.includes("@") &&
    phone.trim() &&
    consent

  function handleCalculate() {
    setHasCalculated(true)
    setShowLeadForm(false)
    setSubmitted(false)

    track("Calculated Pension Result")
    window.fbq?.("trackCustom", "CalculatedPension")

    setTimeout(() => {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 150)
  }

  async function handleLeadSubmit() {
    if (!canSubmit || !results) return

    const response = await fetch("/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        results,
        costSaving,
      }),
    })

    await fetch("https://hooks.zapier.com/hooks/catch/27569406/4yf4lpr/", {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({
        date: new Date().toISOString(),
        name,
        email,
        phone,
        age,
        retirementAge,
        costSaving: `${String(costSaving).replace(".", ",")}%`,
        extraValue: `${Math.round(results.returnDifference).toLocaleString("da-DK")} DKK`,
        baselineValue: `${Math.round(results.baseline.futureValue).toLocaleString("da-DK")} DKK`,
        improvedValue: `${Math.round(results.improved.futureValue).toLocaleString("da-DK")} DKK`,
      }),
    })

    if (response.ok) {
      setSubmitted(true)
      setShowLeadForm(false)

      track("Submitted Pension Lead")
      window.fbq?.("track", "Lead")
    } else {
      alert("Der opstod en fejl ved afsendelse.")
    }
  }

  function resetFlow() {
    setHasCalculated(false)
    setShowLeadForm(false)
    setSubmitted(false)
    setName("")
    setEmail("")
    setPhone("")
    setConsent(false)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F4FAFA] text-[#253457]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(79,183,231,0.18),transparent_34%),linear-gradient(180deg,#F8FCFC_0%,#EEF8F8_100%)]" />

      <header className="relative z-10 border-b border-[#253457]/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20 md:px-10">
          <img
            src="/logo.svg"
            alt="RådgiverXperten"
            className="block h-auto w-[155px] max-w-[155px] object-contain md:w-[220px] md:max-w-[220px]"
          />

          <div className="hidden items-center gap-2 rounded-full border border-[#253457]/10 bg-white px-4 py-2 text-sm font-bold text-[#667085] sm:flex">
            <Clock3 size={16} className="text-[#4FB7E7]" />
            Under 1 minut
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-8 px-4 py-8 md:min-h-[calc(100vh-80px)] md:grid-cols-[1fr_0.9fr] md:px-10 md:py-14">
        <div>
          <p className="mb-5 text-xs font-black uppercase tracking-[0.3em] text-[#4FB7E7] md:text-sm">
            Gratis pensionscheck
          </p>

          <h1 className="max-w-3xl text-[2.25rem] font-black leading-[1.02] tracking-[-0.045em] text-[#253457] sm:text-[3rem] md:text-[4rem]">
            Hvad kan lavere{" "}
            <span className="text-[#4FB7E7]">omkostninger</span> betyde for din
            pension?
          </h1>

          <p className="mt-5 max-w-2xl text-[1rem] leading-relaxed text-[#5F687A] md:text-[1.15rem]">
            Få et vejledende estimat på under 1 minut. Indtast dine oplysninger
            og se, hvordan små forskelle i omkostninger potentielt kan få stor
            betydning over tid.
          </p>

          <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-[#667085]">
            <div className="flex items-center gap-2 rounded-full border border-[#253457]/10 bg-white/80 px-4 py-2 shadow-sm">
              <ShieldCheck size={17} className="text-[#4FB7E7]" />
              Vejledende
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[#253457]/10 bg-white/80 px-4 py-2 shadow-sm">
              <TrendingUp size={17} className="text-[#4FB7E7]" />
              Personligt estimat
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[#253457]/10 bg-white/80 px-4 py-2 shadow-sm">
              <Check size={17} className="text-[#4FB7E7]" />
              Uforpligtende
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#253457]/10 bg-white/92 p-5 shadow-[0_18px_55px_rgba(37,52,87,0.08)] backdrop-blur md:p-7">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#4FB7E7]">
              Beregn dit estimat
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#253457]">
              Indtast dine oplysninger
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-[#667085]">
              Alle felter udfyldes direkte her. Ingen unødvendige steps.
            </p>
          </div>

          <div className="space-y-3.5">
            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Din alder, fx 35"
              type="number"
              className="w-full rounded-[16px] border border-[#253457]/10 bg-[#FBFCFD] px-4 py-3.5 text-sm font-semibold outline-none transition placeholder:text-[#A0A8B8] focus:border-[#4FB7E7]"
            />

            <input
              value={retirementAge}
              onChange={(e) => setRetirementAge(e.target.value)}
              placeholder="Forventet pensionsalder, fx 67"
              type="number"
              className="w-full rounded-[16px] border border-[#253457]/10 bg-[#FBFCFD] px-4 py-3.5 text-sm font-semibold outline-none transition placeholder:text-[#A0A8B8] focus:border-[#4FB7E7]"
            />

            <input
              value={currentSavings}
              onChange={(e) => setCurrentSavings(e.target.value)}
              placeholder="Opsparet pension i dag, fx 450000"
              type="number"
              className="w-full rounded-[16px] border border-[#253457]/10 bg-[#FBFCFD] px-4 py-3.5 text-sm font-semibold outline-none transition placeholder:text-[#A0A8B8] focus:border-[#4FB7E7]"
            />

            <input
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              placeholder="Månedlig indbetaling, fx 3500"
              type="number"
              className="w-full rounded-[16px] border border-[#253457]/10 bg-[#FBFCFD] px-4 py-3.5 text-sm font-semibold outline-none transition placeholder:text-[#A0A8B8] focus:border-[#4FB7E7]"
            />

            <div className="rounded-[18px] border border-[#253457]/10 bg-[#FBFCFD] p-4">
              <p className="mb-3 text-sm font-black text-[#253457]">
                Hvis dine omkostninger kunne sænkes med:
              </p>

              <div className="grid grid-cols-3 gap-2">
                {([0.5, 0.75, 1] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCostSaving(value)}
                    className={`rounded-full border px-4 py-3 text-sm font-black transition ${
                      costSaving === value
                        ? "border-[#4FB7E7] bg-[#EAF7FD] text-[#253457]"
                        : "border-[#253457]/10 bg-white text-[#667085]"
                    }`}
                  >
                    {String(value).replace(".", ",")}%
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={!canCalculate}
              className={`inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-3.5 text-sm font-bold transition ${
                canCalculate
                  ? "cursor-pointer bg-[#253457] text-white hover:bg-[#1D2948]"
                  : "cursor-not-allowed bg-[#D7DEE8] text-white"
              }`}
            >
              Se mit estimat
              <ArrowRight size={18} />
            </button>

            <p className="text-center text-xs leading-relaxed text-[#8D95A6]">
              Beregningen er vejledende, før skat, og erstatter ikke individuel
              finansiel rådgivning.
            </p>
          </div>
        </div>
      </section>

      {hasCalculated && (
        <section
          ref={resultRef}
          className="relative z-10 mx-auto max-w-4xl px-4 pb-14 md:px-10"
        >
          {!results ? (
            <div className="rounded-[24px] border border-[#FEC84B]/40 bg-[#FFFCF2] p-5 text-[#253457]">
              Tjek at alle felter er udfyldt korrekt, og at pensionsalderen er
              højere end din nuværende alder.
            </div>
          ) : submitted ? (
            <div className="rounded-[30px] border border-[#253457]/10 bg-white/95 p-7 text-center shadow-[0_24px_70px_rgba(37,52,87,0.10)] md:p-10">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF3]">
                <Check size={26} className="text-[#027A48]" />
              </div>

              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#4FB7E7]">
                Din vurdering er sendt
              </p>

              <h2 className="mx-auto mt-3 max-w-xl text-3xl font-black leading-tight tracking-[-0.04em] text-[#253457] md:text-4xl">
                Vil du have gennemgået dit resultat?
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-[1rem] leading-relaxed text-[#5F687A]">
                Vi har sendt dit pensionsestimat til din mail. Hvis du vil have
                en kort gennemgang, kan du booke et gratis og uforpligtende
                telefonmøde med RådgiverXperten.
              </p>

              <div className="mt-6 rounded-[24px] border border-[#4FB7E7]/25 bg-[#EAF7FD] p-5 text-left">
                <h3 className="text-lg font-black text-[#253457]">
                  Hvem er RådgiverXperten?
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-[#5F687A]">
                  RådgiverXperten hjælper dig med at få overblik, før du træffer
                  større økonomiske beslutninger. Vi fungerer som en uafhængig
                  indgang og kan hjælpe med at afklare, om der kan være relevante
                  områder at få gennemgået af en kvalitetssikret rådgiver.
                </p>

                <p className="mt-3 text-sm leading-relaxed text-[#5F687A]">
                  På mødet kan vi kort gennemgå dit resultat, tale om hvad lavere
                  omkostninger potentielt kan betyde, og vurdere om det giver
                  mening at undersøge din pensionsløsning nærmere.
                </p>
              </div>

              <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                <div className="rounded-[20px] border border-[#253457]/10 bg-[#FBFCFD] p-4">
                  <p className="font-black text-[#253457]">Gratis</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#667085]">
                    Ingen binding eller forpligtelse.
                  </p>
                </div>

                <div className="rounded-[20px] border border-[#253457]/10 bg-[#FBFCFD] p-4">
                  <p className="font-black text-[#253457]">10 minutter</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#667085]">
                    Hurtig afklaring af dit resultat.
                  </p>
                </div>

                <div className="rounded-[20px] border border-[#253457]/10 bg-[#FBFCFD] p-4">
                  <p className="font-black text-[#253457]">Uforpligtende</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#667085]">
                    Vi skaber overblik og matcher videre ved behov.
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-[#253457] px-7 py-3.5 text-sm font-bold no-underline transition hover:bg-[#1D2948]"
                >
                  <span style={{ color: "#ffffff", fontWeight: 700 }}>
                    Book gratis 10 minutters telefonmøde
                  </span>
                </a>

                <button
                  onClick={resetFlow}
                  className="inline-flex cursor-pointer items-center justify-center rounded-full border border-[#253457]/10 bg-white px-7 py-3.5 text-sm font-bold text-[#253457] transition hover:bg-[#F8FAFC]"
                >
                  Start forfra
                </button>
              </div>

              <p className="mx-auto mt-5 max-w-lg text-xs leading-relaxed text-[#8D95A6]">
                Mødet er vejledende og har til formål at give dig et bedre
                overblik. Eventuel egentlig pensionsrådgivning sker via relevante
                samarbejdspartnere.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[30px] border border-[#253457]/10 bg-white/95 p-6 shadow-[0_24px_70px_rgba(37,52,87,0.09)] md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#4FB7E7]">
                  Dit pensionsoverblik
                </p>

                <h2 className="mt-4 text-[2.3rem] font-black leading-none tracking-[-0.04em] text-[#253457] md:text-[3.4rem]">
                  {formatCurrency(results.returnDifference)}
                </h2>

                <p className="mt-4 max-w-xl text-[1rem] font-semibold leading-relaxed text-[#253457] md:text-[1.08rem]">
                  Det er den mulige ekstra værdi fra afkast, hvis omkostningerne
                  reduceres med {String(costSaving).replace(".", ",")}% i dit
                  valgte scenarie.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-[#253457]/10 bg-[#FBFCFD] p-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF7FD]">
                      <Wallet size={19} className="text-[#4FB7E7]" />
                    </div>

                    <p className="text-sm font-bold text-[#8D95A6]">
                      Sådan ser det ud nu
                    </p>

                    <p className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#253457]">
                      {formatCurrency(results.baseline.futureValue)}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-[#4FB7E7]/25 bg-[#EAF7FD] p-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white">
                      <TrendingUp size={19} className="text-[#4FB7E7]" />
                    </div>

                    <p className="text-sm font-bold text-[#5F687A]">
                      Hvis omkostninger reduceres
                    </p>

                    <p className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#253457]">
                      {formatCurrency(results.improved.futureValue)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[22px] border border-[#253457]/10 bg-[#FBFCFD] p-5">
                  <h3 className="font-black text-[#253457]">
                    Hvorfor kan det få betydning?
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-[#667085]">
                    Små forskelle i omkostninger kan vokse markant over tid,
                    især når der er mange år til pension. Derfor kan det være
                    relevant at få gennemgået, om din nuværende løsning er sat
                    fornuftigt sammen.
                  </p>
                </div>

                {!showLeadForm && (
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        setShowLeadForm(true)
                        track("Opened Pension Lead Form")
                        window.fbq?.("track", "Contact")
                      }}
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-[#253457] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#1D2948]"
                    >
                      Få min vurdering sendt gratis
                      <ArrowRight size={18} />
                    </button>

                    <p className="mt-3 text-center text-xs leading-relaxed text-[#8D95A6]">
                      Gratis og uforpligtende. Vi bruger kun oplysningerne til at
                      sende din vurdering og kontakte dig om resultatet.
                    </p>
                  </div>
                )}
              </div>

              {showLeadForm && (
                <div className="rounded-[28px] border border-[#253457]/10 bg-white/95 p-6 shadow-[0_18px_55px_rgba(37,52,87,0.07)] md:p-8">
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF7FD]">
                      <Mail size={21} className="text-[#4FB7E7]" />
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-[#4FB7E7]">
                        Næste skridt
                      </p>

                      <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#253457] md:text-3xl">
                        Få din vurdering sendt
                      </h2>

                      <p className="mt-3 text-sm leading-relaxed text-[#667085]">
                        Udfyld dine oplysninger, så sender vi dit estimat og kan
                        kontakte dig om resultatet.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Navn"
                      className="w-full rounded-[16px] border border-[#253457]/10 bg-[#FBFCFD] px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#4FB7E7]"
                    />

                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="E-mail"
                      type="email"
                      className="w-full rounded-[16px] border border-[#253457]/10 bg-[#FBFCFD] px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#4FB7E7]"
                    />

                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Telefonnummer"
                      type="tel"
                      className="w-full rounded-[16px] border border-[#253457]/10 bg-[#FBFCFD] px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#4FB7E7]"
                    />

                    <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-[#253457]/10 bg-[#FBFCFD] p-4">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1 h-4 w-4 cursor-pointer"
                      />

                      <span className="text-xs leading-relaxed text-[#667085]">
                        Jeg accepterer, at RådgiverXperten må behandle mine
                        oplysninger og kontakte mig via mail og telefon vedrørende
                        min pensionsvurdering. Jeg kan til enhver tid trække mit
                        samtykke tilbage.
                      </span>
                    </label>

                    <button
                      onClick={handleLeadSubmit}
                      disabled={!canSubmit}
                      className={`inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-3.5 text-sm font-bold transition ${
                        canSubmit
                          ? "cursor-pointer bg-[#253457] text-white hover:bg-[#1D2948]"
                          : "cursor-not-allowed bg-[#D7DEE8] text-white"
                      }`}
                    >
                      Send min pensionsvurdering
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  )
}