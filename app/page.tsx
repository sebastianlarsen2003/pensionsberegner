"use client"

import { track } from "@vercel/analytics"
import { useMemo, useRef, useState, useEffect } from "react"
import {
  ArrowRight,
  Check,
  Clock3,
  Phone,
  ShieldCheck,
  TrendingUp,
  ChevronDown,
  Mail,
  Calendar,
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
  return `${Math.round(value).toLocaleString("da-DK")} kr.`
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
  if (!age || !retirementAge || currentSavings < 0 || monthlyContribution < 0 || retirementAge <= age) {
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
  return { yearsToRetirement, futureValue, totalOwnContributions, estimatedReturn, estimatedMonthlyPension }
}

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let frame: number
    function step(timestamp: number) {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(value * eased))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return <>{displayed.toLocaleString("da-DK")} kr.</>
}

export default function Home() {
  const resultRef = useRef<HTMLDivElement>(null)

  const [age, setAge] = useState("")
  const [retirementAge, setRetirementAge] = useState("67")
  const [currentSavings, setCurrentSavings] = useState("")
  const [monthlyContribution, setMonthlyContribution] = useState("")
  const [costSaving, setCostSaving] = useState<0.5 | 0.75 | 1>(0.5)

  const [hasCalculated, setHasCalculated] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [startedCalculatorTracked, setStartedCalculatorTracked] = useState(false)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [wantsEmail, setWantsEmail] = useState(false)
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const results = useMemo(() => {
    const currentAge = Number(age)
    const pensionAge = Number(retirementAge)
    const savings = Number(currentSavings)
    const monthly = Number(monthlyContribution)
    const baselineReturn = 0.05
    const baseline = calculatePensionScenario({
      age: currentAge, retirementAge: pensionAge,
      currentSavings: savings, monthlyContribution: monthly,
      annualReturn: baselineReturn,
    })
    if (!baseline) return null
    const improved = calculatePensionScenario({
      age: currentAge, retirementAge: pensionAge,
      currentSavings: savings, monthlyContribution: monthly,
      annualReturn: baselineReturn + costSaving / 100,
    })
    if (!improved) return null
    return { baseline, improved, returnDifference: improved.estimatedReturn - baseline.estimatedReturn }
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
    name.trim() !== "" &&
    phone.trim() !== "" &&
    consent &&
    (!wantsEmail || (email.trim() !== "" && email.includes("@")))

  function handleCalculate() {
    setHasCalculated(true)
    setSubmitted(false)
    track("Calculated Pension Result")
    window.fbq?.("trackCustom", "CalculatedPension", {
      age, retirementAge, currentSavings, monthlyContribution, costSaving,
    })
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 150)
  }

  async function handleLeadSubmit() {
    if (!canSubmit || !results || isSubmitting) return
    setIsSubmitting(true)
    try {
      await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: wantsEmail ? email : undefined,
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
          phone,
          email: wantsEmail ? email : "",
          age,
          retirementAge,
          costSaving: `${String(costSaving).replace(".", ",")}%`,
          extraValue: `${Math.round(results.returnDifference).toLocaleString("da-DK")} kr.`,
          baselineValue: `${Math.round(results.baseline.futureValue).toLocaleString("da-DK")} kr.`,
          improvedValue: `${Math.round(results.improved.futureValue).toLocaleString("da-DK")} kr.`,
        }),
      })
      setSubmitted(true)
      track("Submitted Pension Lead")
      window.fbq?.("track", "Lead", { content_name: "Pensionsberegner", lead_type: "Pension" })
    } catch {
      alert("Der opstod en fejl. Prøv igen.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F4FAFA] text-[#253457]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .fade-in { animation: fadeIn 0.45s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .pulse-dot { animation: pulseDot 2s infinite; }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.4)} }
        .slide-down { animation: slideDown 0.25s ease forwards; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-[#253457]/10 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:h-16 md:px-8">
          <img src="/logo.svg" alt="RådgiverXperten" className="h-auto w-[130px] object-contain md:w-[170px]" />
          <a
            href="#beregner"
            className="flex items-center gap-1.5 rounded-full bg-[#253457] px-4 py-2 text-xs font-bold hover:bg-[#1D2948] transition-colors"
style={{ color: "#ffffff" }}
          >
            <Clock3 size={12} />
            <span>Gratis tjek</span>
          </a>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="mx-auto max-w-5xl px-4 pb-6 pt-10 md:px-8 md:pt-16 md:pb-10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#4FB7E7]/30 bg-[#4FB7E7]/10 px-3 py-1.5 text-[11px] font-bold text-[#253457]">
          <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-[#4FB7E7]" />
          Gratis og uforpligtende pensionstjek
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_220px] md:items-start">
          <div>
            <h1 className="text-[2rem] font-black leading-[1.06] tracking-[-0.03em] text-[#253457] sm:text-[2.6rem] md:text-[3.2rem]">
              Betaler du for meget{" "}
              <span className="text-[#4FB7E7]">i pension?</span>
            </h1>
            <p className="mt-4 max-w-lg text-[0.95rem] leading-relaxed text-[#5F687A] md:text-[1.05rem]">
              De fleste danskere betaler for høje omkostninger på deres pension — og ved det ikke.
              Beregn på 60 sekunder, hvad det potentielt koster dig over tid.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 md:gap-3">
              {[
                { icon: <ShieldCheck size={14} className="text-[#4FB7E7]" />, label: "Kvalitetssikret rådgivernetværk" },
                { icon: <Check size={14} className="text-[#4FB7E7]" />, label: "Ingen binding eller forpligtelse" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 rounded-full border border-[#253457]/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#5F687A] shadow-sm md:px-4 md:py-2 md:text-xs"
                >
                  {item.icon}
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Sebastian card — hidden on mobile, visible on md+ */}
          <div className="hidden md:block rounded-[20px] overflow-hidden border border-[#253457]/10 bg-white shadow-[0_8px_32px_rgba(37,52,87,0.08)]">
            <div className="relative h-[220px] overflow-hidden bg-gradient-to-br from-[#c8d8e8] to-[#9ab8cc]">
              <img
                src="/Seb1.jpg"
                alt="Sebastian – Klient- og Partneransvarlig"
                className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#253457]/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <p className="text-[15px] font-black tracking-tight">Sebastian</p>
                <p className="text-[11px] text-white/75">Klient- og Partneransvarlig</p>
              </div>
            </div>
            <div className="border-t border-[#253457]/8 bg-[#FAFCFC] px-4 py-3">
              <p className="text-[11px] italic leading-relaxed text-[#5F687A]">
                "De fleste ved godt, at pension kan være dyrt i omkostninger.
                De færreste når at gøre noget ved det."
              </p>
              <p className="mt-1.5 text-[10px] font-bold text-[#8D95A6]">— Sebastian, RådgiverXperten</p>
            </div>
          </div>
        </div>

        <div className="mt-8 hidden justify-center md:flex md:mt-10">
          <a href="#beregner" className="flex flex-col items-center gap-1 text-[11px] text-[#8D95A6] hover:text-[#5F687A] transition-colors">
            Beregn din optimering
            <ChevronDown size={16} className="animate-bounce" />
          </a>
        </div>
      </section>

      {/* ── CALCULATOR ── */}
      <section id="beregner" className="mx-auto max-w-5xl px-4 pb-16 md:px-8" style={{ scrollMarginTop: "64px" }}>
        <div className="grid gap-5 md:grid-cols-2 md:items-start">

          {/* Form */}
          <div className="rounded-[24px] border border-[#253457]/10 bg-white p-5 shadow-[0_4px_24px_rgba(37,52,87,0.07)] md:p-7">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#4FB7E7]">Trin 1 — Beregn</p>
            <h2 className="text-xl font-black tracking-tight text-[#253457] md:text-2xl">Hvad mister du i dag?</h2>
            <p className="mt-1 mb-5 text-xs text-[#8D95A6]">Udfyld felterne — beregningen tager under 60 sekunder.</p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-[#5F687A]">Din alder</label>
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  onFocus={() => {
                    if (!startedCalculatorTracked) {
                      setStartedCalculatorTracked(true)
                      track("Started Calculator")
                      window.fbq?.("trackCustom", "StartedCalculator")
                    }
                  }}
                  placeholder="fx 42"
                  type="number"
                  className="w-full rounded-[14px] border border-[#253457]/12 bg-[#FBFCFD] px-4 py-3 text-sm font-semibold text-[#253457] outline-none transition focus:border-[#4FB7E7] focus:ring-2 focus:ring-[#4FB7E7]/10 placeholder:text-[#C8CDD8]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-[#5F687A]">Pensionsalder</label>
                <input
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(e.target.value)}
                  placeholder="fx 67"
                  type="number"
                  className="w-full rounded-[14px] border border-[#253457]/12 bg-[#FBFCFD] px-4 py-3 text-sm font-semibold text-[#253457] outline-none transition focus:border-[#4FB7E7] focus:ring-2 focus:ring-[#4FB7E7]/10 placeholder:text-[#C8CDD8]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-[#5F687A]">Opsparet pension i dag (kr.)</label>
                <input
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)}
                  placeholder="fx 450.000"
                  type="number"
                  className="w-full rounded-[14px] border border-[#253457]/12 bg-[#FBFCFD] px-4 py-3 text-sm font-semibold text-[#253457] outline-none transition focus:border-[#4FB7E7] focus:ring-2 focus:ring-[#4FB7E7]/10 placeholder:text-[#C8CDD8]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-[#5F687A]">Månedlig indbetaling (kr.)</label>
                <input
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  placeholder="fx 3.500"
                  type="number"
                  className="w-full rounded-[14px] border border-[#253457]/12 bg-[#FBFCFD] px-4 py-3 text-sm font-semibold text-[#253457] outline-none transition focus:border-[#4FB7E7] focus:ring-2 focus:ring-[#4FB7E7]/10 placeholder:text-[#C8CDD8]"
                />
              </div>

              <div className="rounded-[16px] border border-[#253457]/10 bg-[#FBFCFD] p-4">
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.15em] text-[#5F687A]">
                  Hvad hvis omkostninger sænkes med:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {([0.5, 0.75, 1] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCostSaving(value)}
                      className={`rounded-full border py-3 text-sm font-black transition ${
                        costSaving === value
                          ? "border-[#4FB7E7] bg-[#EAF7FD] text-[#253457]"
                          : "border-[#253457]/10 bg-white text-[#8D95A6] hover:border-[#253457]/25"
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
                className={`flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold transition ${
                  canCalculate
                    ? "bg-[#253457] text-white hover:bg-[#1D2948] active:scale-[0.98]"
                    : "cursor-not-allowed bg-[#D7DEE8] text-white"
                }`}
              >
                Beregn min mulige besparelse
                <ArrowRight size={16} />
              </button>

              <p className="text-center text-[11px] leading-relaxed text-[#8D95A6]">
                Vejledende estimat, før skat. Erstatter ikke individuel rådgivning.
              </p>
            </div>
          </div>

          {/* Result + lead */}
          <div ref={resultRef} className="space-y-4">
            {!hasCalculated ? (
              /* Teaser */
              <div className="rounded-[24px] border border-[#253457]/10 bg-white p-5 shadow-[0_4px_24px_rgba(37,52,87,0.07)] md:p-7">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F4FAFA]">
                    <TrendingUp size={22} className="text-[#D7DEE8]" />
                  </div>
                  <p className="text-base font-black text-[#D7DEE8]">Dit resultat vises her</p>
                  <p className="mt-1 text-xs italic text-[#C8CDD8]">Udfyld felterne til venstre og se, hvad du potentielt kan spare.</p>
                </div>
                <div className="pointer-events-none select-none blur-[5px] rounded-[18px] bg-[#F4FAFA] p-4">
                  <p className="text-[11px] text-[#8D95A6]">Mulig ekstra pensionsværdi</p>
                  <p className="mt-1 text-4xl font-black text-[#4FB7E7]">xxx.xxx kr.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-[12px] bg-white p-3">
                      <p className="text-[10px] text-[#8D95A6]">I dag</p>
                      <p className="text-sm font-bold text-[#253457]">x.xxx.xxx kr.</p>
                    </div>
                    <div className="rounded-[12px] bg-[#EAF7FD] p-3">
                      <p className="text-[10px] text-[#4FB7E7]">Optimeret</p>
                      <p className="text-sm font-bold text-[#253457]">x.xxx.xxx kr.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : !results ? (
              <div className="rounded-[20px] border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
                Tjek at alle felter er udfyldt korrekt, og at pensionsalderen er højere end din nuværende alder.
              </div>
            ) : submitted ? (

              /* ── SUCCESS ── */
              <div className="fade-in space-y-4">
                <div className="rounded-[24px] border border-[#253457]/10 bg-white p-6 shadow-[0_4px_24px_rgba(37,52,87,0.07)]">
                  <div className="mb-1 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF7FD]">
                      <Check size={20} className="text-[#4FB7E7]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-[#253457]">
                        Tak, {name.split(" ")[0]}!
                      </h2>
                      <p className="text-[12px] text-[#8D95A6]">Sebastian ringer dig op hurtigst muligt.</p>
                    </div>
                  </div>

                  {/* Result summary */}
                  <div className="mt-5 rounded-[18px] bg-[#F4FAFA] p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8D95A6]">Din mulige pensionsoptimering</p>
                    <p className="mt-2 text-[2.4rem] font-black leading-none tracking-tight text-[#253457]">
                      {formatCurrency(results.returnDifference)}
                    </p>
                    <p className="mt-1 text-[11px] text-[#8D95A6]">
                      Ved {String(costSaving).replace(".", ",")}% lavere omkostninger
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-[12px] border border-[#253457]/8 bg-white p-3">
                        <p className="text-[10px] font-semibold text-[#8D95A6]">Nuværende forløb</p>
                        <p className="mt-0.5 text-sm font-black text-[#253457]">{formatCurrency(results.baseline.futureValue)}</p>
                      </div>
                      <div className="rounded-[12px] border border-[#4FB7E7]/20 bg-[#EAF7FD] p-3">
                        <p className="text-[10px] font-semibold text-[#4FB7E7]">Med lavere omkostninger</p>
                        <p className="mt-0.5 text-sm font-black text-[#253457]">{formatCurrency(results.improved.futureValue)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Book CTA */}
                <div className="rounded-[24px] bg-[#253457] p-6 shadow-[0_8px_32px_rgba(37,52,87,0.2)]">
                  <div className="mb-1 flex items-center gap-2">
                    <Calendar size={18} className="text-[#4FB7E7] shrink-0" />
                    <p className="text-[15px] font-black text-white">Vil du selv vælge et tidspunkt?</p>
                  </div>
                  <p className="mb-5 text-[12px] leading-relaxed text-white/55">
                    Book et gratis 10-minutters opkald direkte i Sebastian's kalender — eller vent på at han ringer dig op.
                  </p>
                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      track("Book Meeting Click")
                      window.fbq?.("trackCustom", "BookMeetingClick")
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#4FB7E7] py-4 text-sm font-bold text-[#253457] transition hover:bg-[#3DA8D8] active:scale-[0.98]"
                  >
                    Book et gratis opkald
                    <Calendar size={15} />
                  </a>
                  <p className="mt-3 text-center text-[11px] text-white/35">
                    Eller vent — Sebastian ringer dig op hurtigst muligt
                  </p>
                </div>
              </div>

            ) : (

              /* ── RESULT + LEAD FORM ── */
              <div className="fade-in space-y-4">

                {/* Result card */}
                <div className="rounded-[24px] border border-[#4FB7E7]/25 bg-white p-5 shadow-[0_8px_40px_rgba(79,183,231,0.12)] md:p-6">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#4FB7E7]">Din mulige pensionsoptimering</p>
                  <p className="text-[2.6rem] font-black leading-none tracking-tight text-[#253457] md:text-[3rem]">
                    <AnimatedNumber value={results.returnDifference} />
                  </p>
                  <p className="mt-2 text-xs text-[#5F687A]">
                    Mulig ekstra pensionsværdi ved {String(costSaving).replace(".", ",")}% lavere omkostninger.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-[16px] border border-[#253457]/8 bg-[#FBFCFD] p-4">
                      <p className="text-[11px] font-semibold text-[#8D95A6]">Nuværende forløb</p>
                      <p className="mt-1 text-base font-black tracking-tight text-[#253457]">
                        {formatCurrency(results.baseline.futureValue)}
                      </p>
                    </div>
                    <div className="rounded-[16px] border border-[#4FB7E7]/20 bg-[#EAF7FD] p-4">
                      <p className="text-[11px] font-semibold text-[#4FB7E7]">Med lavere omkostninger</p>
                      <p className="mt-1 text-base font-black tracking-tight text-[#253457]">
                        {formatCurrency(results.improved.futureValue)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-[14px] border border-[#253457]/8 bg-[#F4FAFA] px-4 py-3 text-[11px] leading-relaxed text-[#8D95A6]">
                    Vejledende beregning baseret på 5% p.a. afkast, før skat. Renters rente betyder at selv
                    små forskelle i omkostninger kan vokse markant over tid.
                  </div>
                </div>

                {/* Lead form */}
                <div className="rounded-[24px] bg-[#253457] p-5 shadow-[0_8px_32px_rgba(37,52,87,0.2)] md:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/20">
                      <img src="/Seb1.jpg" alt="Sebastian" className="h-full w-full object-cover object-top" />
                    </div>
                    <div>
                      <p className="text-[15px] font-black text-white">Få en gratis gennemgang</p>
                      <p className="text-[11px] text-white/55">Sebastian ringer dig op — ingen forpligtelse</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {/* Navn */}
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dit navn"
                      className="w-full rounded-[14px] border border-white/12 bg-white/8 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-white/30 placeholder:text-white/30"
                    />

                    {/* Telefon */}
                    <div className="relative">
                      <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Telefonnummer"
                        type="tel"
                        className="w-full rounded-[14px] border border-white/12 bg-white/8 py-3 pl-10 pr-4 text-sm font-semibold text-white outline-none transition focus:border-white/30 placeholder:text-white/30"
                      />
                    </div>

                    {/* Mail opt-in */}
                    <div className="rounded-[14px] border border-white/10 bg-white/5">
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={wantsEmail}
                          onChange={(e) => setWantsEmail(e.target.checked)}
                          className="h-4 w-4 shrink-0 cursor-pointer accent-[#4FB7E7]"
                        />
                        <span className="text-[13px] font-semibold text-white/80">
                          Send mig også resultatet på mail
                        </span>
                        <Mail size={14} className="ml-auto shrink-0 text-white/30" />
                      </label>

                      {wantsEmail && (
                        <div className="slide-down border-t border-white/8 px-4 pb-3">
                          <div className="relative mt-3">
                            <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Din e-mailadresse"
                              type="email"
                              className="w-full rounded-[12px] border border-white/12 bg-white/8 py-3 pl-10 pr-4 text-sm font-semibold text-white outline-none transition focus:border-white/30 placeholder:text-white/30"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Samtykke */}
                    <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-white/10 bg-white/5 p-3.5">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#4FB7E7]"
                      />
                      <span className="text-[11px] leading-relaxed text-white/45">
                        Jeg accepterer, at RådgiverXperten må kontakte mig via telefon
                        {wantsEmail ? " og mail" : ""} vedrørende min pensionsvurdering.
                        Samtykket kan tilbagekaldes til enhver tid.
                      </span>
                    </label>

                    {/* Submit */}
                    <button
                      onClick={handleLeadSubmit}
                      disabled={!canSubmit || isSubmitting}
                      className={`flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold transition ${
                        canSubmit && !isSubmitting
                          ? "bg-[#4FB7E7] text-[#253457] hover:bg-[#3DA8D8] active:scale-[0.98]"
                          : "cursor-not-allowed bg-white/10 text-white/30"
                      }`}
                    >
                      {isSubmitting ? "Sender..." : "Ring mig op — det er gratis"}
                      {!isSubmitting && <Phone size={14} />}
                    </button>

                    <div className="flex items-center justify-center gap-5 pt-0.5">
                      {["Gratis", "Uforpligtende", "10 minutter"].map((t) => (
                        <div key={t} className="flex items-center gap-1 text-[10px] text-white/40">
                          <Check size={11} className="text-[#4FB7E7]" />
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-[#253457]/8 bg-white py-14 px-4 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#4FB7E7]">Sådan virker det</p>
            <h2 className="text-2xl font-black tracking-tight text-[#253457] md:text-3xl">Tre simple trin</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { num: "01", title: "Beregn", desc: "Udfyld din alder, pensionsopsparing og månedlige indbetaling. Under 60 sekunder." },
              { num: "02", title: "Få et overblik", desc: "Se et vejledende estimat på, hvad lavere omkostninger potentielt kan betyde for dig." },
              { num: "03", title: "Tal med Sebastian", desc: "Gratis 10-minutters opkald. Vi skaber overblik og matcher dig med den rigtige rådgiver." },
            ].map((step) => (
              <div key={step.num} className="rounded-[20px] border border-[#253457]/8 bg-[#F4FAFA] p-5">
                <p className="mb-3 text-4xl font-black text-[#D7DEE8]">{step.num}</p>
                <p className="mb-1.5 font-black text-[#253457]">{step.title}</p>
                <p className="text-[13px] leading-relaxed text-[#667085]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#253457]/8 py-8 px-4 text-center md:px-8">
        <div className="mx-auto max-w-5xl">
          <img src="/logo.svg" alt="RådgiverXperten" className="mx-auto mb-4 h-auto w-[110px] object-contain opacity-35" />
          <p className="mx-auto max-w-lg text-[11px] leading-relaxed text-[#8D95A6]">
            RådgiverXperten er et uafhængigt formidlingsled og yder ikke selv finansiel rådgivning.
            Alle beregninger er vejledende og erstatter ikke individuel pensionsrådgivning fra en autoriseret rådgiver.
          </p>
        </div>
      </footer>
    </main>
  )
}