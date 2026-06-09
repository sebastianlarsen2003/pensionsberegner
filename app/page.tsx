"use client"

import { track } from "@vercel/analytics"
import { useRef, useState, useEffect } from "react"
import {
  Check,
  Clock3,
  Phone,
  ShieldCheck,
  ChevronRight,
  Mail,
  Calendar,
  Search,
  Users,
} from "lucide-react"

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
  }
}

const CALENDLY_URL = "https://calendly.com/sebastian-raadgiverxperten/10min"

function fmt(n: number) {
  return `${Math.round(n).toLocaleString("da-DK")} kr.`
}

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

function AnimatedNumber({ value, duration = 1400 }: { value: number; duration?: number }) {
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => {
    let startTime: number | null = null
    let frame: number
    function step(ts: number) {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(value * eased))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])
  return <>{displayed.toLocaleString("da-DK")} kr.</>
}

const STEPS = [
  {
    eyebrow: "Din situation",
    question: "Hvor gammel er du?",
    options: [
      { label: "Under 35 år", age: 28 },
      { label: "35–44 år", age: 40 },
      { label: "45–54 år", age: 50 },
      { label: "55 år eller derover", age: 60 },
    ],
  },
  {
    eyebrow: "Din opsparing",
    question: "Hvor meget har du opsparet til pension?",
    options: [
      { label: "Under 200.000 kr.", savingsMin: 0, savingsMax: 200000, savings: 100000 },
      { label: "200.000 – 500.000 kr.", savingsMin: 200000, savingsMax: 500000, savings: 350000 },
      { label: "500.000 – 1.000.000 kr.", savingsMin: 500000, savingsMax: 1000000, savings: 750000 },
      { label: "Over 1.000.000 kr.", savingsMin: 1000000, savingsMax: 2000000, savings: 1500000 },
    ],
  },
  {
    eyebrow: "Din indbetaling",
    question: "Hvad indbetaler du månedligt til pension?",
    options: [
      { label: "Under 2.000 kr./md.", monthly: 1500 },
      { label: "2.000 – 4.000 kr./md.", monthly: 3000 },
      { label: "4.000 – 8.000 kr./md.", monthly: 6000 },
      { label: "Over 8.000 kr./md.", monthly: 10000 },
    ],
  },
  {
    eyebrow: "Dit overblik",
    question: "Ved du hvad du betaler i pensionsomkostninger?",
    options: [
      { label: "Ja, jeg kender mine omkostninger" },
      { label: "Nej, jeg er ikke sikker" },
      { label: "Det har jeg aldrig tænkt over" },
    ],
  },
]

// Input style — 16px font prevents iOS auto-zoom
const inputClass = "w-full rounded-[14px] border border-[#253457]/12 bg-[#FBFCFD] px-4 outline-none transition focus:border-[#4FB7E7] focus:ring-2 focus:ring-[#4FB7E7]/10 placeholder:text-[#C8CDD8] text-[#253457] font-semibold"
const inputStyle = { fontSize: "16px", padding: "14px 16px", WebkitAppearance: "none" as const }

export default function Home() {
  const flowRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [wantsEmail, setWantsEmail] = useState(false)
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startedTracked, setStartedTracked] = useState(false)

  const [resultDiffMin, setResultDiffMin] = useState(0)
  const [resultDiffMax, setResultDiffMax] = useState(0)
  const [baseVal, setBaseVal] = useState(0)

  const totalSteps = STEPS.length + 1
  const progressPct = Math.round(((step + 1) / totalSteps) * 100)

  const canSubmit =
    name.trim() !== "" &&
    phone.trim() !== "" &&
    consent &&
    (!wantsEmail || (email.trim() !== "" && email.includes("@")))

  function scrollToTop() {
    // Scroll flow section into view below sticky header
    flowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function handlePick(stepIdx: number, optionIdx: number) {
    const opt = STEPS[stepIdx].options[optionIdx] as any
    const newAnswers = { ...answers }

    setSelectedIdx(optionIdx)

    if (stepIdx === 0) newAnswers[0] = opt.age
    if (stepIdx === 1) {
      newAnswers[1] = opt.savings
      newAnswers[10] = opt.savingsMin
      newAnswers[11] = opt.savingsMax
    }
    if (stepIdx === 2) newAnswers[2] = opt.monthly

    setAnswers(newAnswers)

    setTimeout(() => {
      setSelectedIdx(null)
      if (stepIdx < STEPS.length - 1) {
        setStep(stepIdx + 1)
        setTimeout(scrollToTop, 80)
      } else {
        setStep(STEPS.length)
        setTimeout(() => {
          contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 80)
      }
    }, 320)
  }

  function computeResults() {
    const age = answers[0] || 40
    const savings = answers[1] || 350000
    const savingsMin = answers[10] || 0
    const savingsMax = answers[11] || 500000
    const monthly = answers[2] || 3000
    const retAge = 67

    const base = calcPension(age, retAge, savings, monthly, 0.05)
    const diffMin = Math.max(0,
      calcPension(age, retAge, savingsMin || savings * 0.7, monthly, 0.055) -
      calcPension(age, retAge, savingsMin || savings * 0.7, monthly, 0.05)
    )
    const diffMax = Math.max(0,
      calcPension(age, retAge, savingsMax || savings * 1.3, monthly, 0.055) -
      calcPension(age, retAge, savingsMax || savings * 1.3, monthly, 0.05)
    )

    setBaseVal(base)
    setResultDiffMin(diffMin)
    setResultDiffMax(diffMax)
  }

  async function handleSubmit() {
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)
    computeResults()

    try {
      await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: wantsEmail ? email : undefined,
          answers,
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
          alder: answers[0] ? `${answers[0]} år` : "—",
          opsparing: fmt(answers[1] || 0),
          maanedlig: fmt(answers[2] || 0),
        }),
      })

      setSubmitted(true)
      track("Submitted Pension Lead")
      window.fbq?.("track", "Lead", { content_name: "Pensionsflow", lead_type: "Pension" })

      setTimeout(() => {
        successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    } catch {
      alert("Der opstod en fejl. Prøv igen.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepLabels = [
    "Spørgsmål 1 af 4",
    "Spørgsmål 2 af 4",
    "Spørgsmål 3 af 4",
    "Spørgsmål 4 af 4",
    "Dine oplysninger",
  ]

  return (
    <main
      className="min-h-screen bg-[#F4FAFA] text-[#253457]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .fade-in { animation: fadeIn 0.28s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .pulse-dot { animation: pulseDot 2s infinite; }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.3)} }
        .slide-down { animation: slideDown 0.22s ease forwards; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        input, button, a { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-[#253457]/10 bg-white/92 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <img src="/logo.svg" alt="RådgiverXperten" className="h-auto w-[120px] object-contain" />
          <a
            href="#flow"
            className="flex items-center gap-1.5 rounded-full bg-[#253457] px-4 py-2.5 text-xs font-bold transition-colors hover:bg-[#1D2948]"
            style={{ color: "#ffffff" }}
          >
            <Clock3 size={12} />
            <span>Gratis tjek</span>
          </a>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="bg-[#253457] px-4 pb-7 pt-7">
        <div className="mx-auto max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#4FB7E7]/40 bg-[#4FB7E7]/20 px-3 py-1.5 text-[11px] font-bold text-[#4FB7E7]">
            <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-[#4FB7E7]" />
            Gratis og uforpligtende
          </div>
          <h1 className="text-[1.7rem] font-black leading-[1.1] tracking-[-0.025em] text-white sm:text-[2rem]">
            Betaler du for meget{" "}
            <span className="text-[#4FB7E7]">i pension?</span>
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-white/60">
            Svar på 4 hurtige spørgsmål og se, hvad du potentielt kan optimere.
          </p>
          <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-5">
            {/* Sebastian photo */}
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-white/20">
              <img
                src="/Seb1.jpg"
                alt="Sebastian"
                className="h-full w-full object-cover object-[center_20%]"
              />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">Sebastian</p>
              <p className="text-[11px] text-white/50">Klient- og Partneransvarlig</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FLOW ── */}
      {!submitted && (
        <section
          id="flow"
          ref={flowRef}
          className="mx-auto max-w-xl px-4 pb-16 pt-4"
          style={{ scrollMarginTop: "60px" }}
        >
          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-1 w-full overflow-hidden rounded-full bg-[#253457]/10">
              <div
                className="h-full rounded-full bg-[#4FB7E7] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[#8D95A6]">{stepLabels[step]}</p>
          </div>

          {/* Question steps */}
          {step < STEPS.length && (
            <div key={step} className="fade-in rounded-[22px] border border-[#253457]/10 bg-white p-5 shadow-[0_4px_20px_rgba(37,52,87,0.07)]">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#4FB7E7]">
                {STEPS[step].eyebrow}
              </p>
              <h2 className="mb-5 text-[1.1rem] font-black tracking-tight text-[#253457]">
                {STEPS[step].question}
              </h2>
              <div className="space-y-2.5">
                {STEPS[step].options.map((opt, i) => {
                  const isSelected = selectedIdx === i
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (!startedTracked) {
                          setStartedTracked(true)
                          track("Started Pension Flow")
                          window.fbq?.("trackCustom", "StartedFlow")
                        }
                        handlePick(step, i)
                      }}
                      style={{ minHeight: "54px" }}
                      className={`flex w-full items-center gap-3 rounded-[14px] border px-4 py-4 text-left transition-all active:scale-[0.98] ${
                        isSelected
                          ? "border-[#4FB7E7] bg-[#EAF7FD]"
                          : "border-[#253457]/12 bg-[#FBFCFD] hover:border-[#4FB7E7]/50 hover:bg-[#EAF7FD]"
                      }`}
                    >
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all ${
                        isSelected ? "border-[#4FB7E7] bg-[#4FB7E7]" : "border-[#253457]/20"
                      }`}>
                        <Check size={11} className={isSelected ? "text-white" : "text-transparent"} />
                      </div>
                      <span className="text-[14px] font-semibold text-[#253457]">{(opt as any).label}</span>
                      <ChevronRight size={14} className="ml-auto shrink-0 text-[#C8CDD8]" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Contact step */}
          {step === STEPS.length && (
            <div
              ref={contactRef}
              key="contact"
              className="fade-in rounded-[22px] border border-[#253457]/10 bg-white p-5 shadow-[0_4px_20px_rgba(37,52,87,0.07)]"
              style={{ scrollMarginTop: "70px" }}
            >
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#4FB7E7]">
                Næste skridt
              </p>
              <h2 className="text-[1.1rem] font-black tracking-tight text-[#253457]">
                Få dit personlige resultat
              </h2>
              <p className="mt-1 mb-5 text-[12px] leading-relaxed text-[#8D95A6]">
                Udfyld navn og telefon — så viser vi dit resultat med det samme.
              </p>

              <div className="space-y-2.5">
                {/* Navn — 16px prevents iOS zoom */}
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dit navn"
                  autoComplete="name"
                  className={inputClass}
                  style={inputStyle}
                />

                {/* Telefon */}
                <div className="relative">
                  <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C8CDD8]" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Telefonnummer"
                    type="tel"
                    autoComplete="tel"
                    className={inputClass}
                    style={{ ...inputStyle, paddingLeft: "40px" }}
                  />
                </div>

                {/* Mail toggle */}
                <div className="rounded-[14px] border border-[#253457]/10 bg-[#F4FAFA]">
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5" style={{ minHeight: "52px" }}>
                    <input
                      type="checkbox"
                      checked={wantsEmail}
                      onChange={(e) => setWantsEmail(e.target.checked)}
                      className="h-4 w-4 shrink-0 accent-[#4FB7E7]"
                    />
                    <span className="text-[13px] font-semibold text-[#253457]">
                      Send mig også resultatet på mail
                    </span>
                    <Mail size={14} className="ml-auto shrink-0 text-[#8D95A6]" />
                  </label>
                  {wantsEmail && (
                    <div className="slide-down border-t border-[#253457]/8 px-4 pb-3">
                      <div className="relative mt-3">
                        <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C8CDD8]" />
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Din e-mailadresse"
                          type="email"
                          autoComplete="email"
                          className={inputClass}
                          style={{ ...inputStyle, paddingLeft: "40px" }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Samtykke */}
                <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-[#253457]/10 bg-[#F4FAFA] p-4" style={{ minHeight: "52px" }}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#4FB7E7]"
                  />
                  <span className="text-[12px] leading-relaxed text-[#667085]">
                    Jeg accepterer, at RådgiverXperten må kontakte mig via telefon
                    {wantsEmail ? " og mail" : ""} vedrørende min pensionsvurdering.
                    Samtykket kan tilbagekaldes til enhver tid.
                  </span>
                </label>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  style={{ minHeight: "54px", fontSize: "15px", WebkitAppearance: "none" as const }}
                  className={`flex w-full items-center justify-center gap-2 rounded-full font-bold transition ${
                    canSubmit && !isSubmitting
                      ? "bg-[#4FB7E7] text-[#253457] hover:bg-[#3DA8D8] active:scale-[0.98]"
                      : "cursor-not-allowed bg-[#D7DEE8] text-white"
                  }`}
                >
                  {isSubmitting ? "Beregner..." : "Se mit resultat"}
                </button>

                <div className="flex items-center justify-center gap-5 pt-0.5">
                  {["Gratis", "Uforpligtende", "10 minutter"].map((t) => (
                    <div key={t} className="flex items-center gap-1 text-[11px] text-[#8D95A6]">
                      <Check size={11} className="text-[#4FB7E7]" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Trust pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { icon: <ShieldCheck size={13} className="text-[#4FB7E7]" />, label: "Kvalitetssikret rådgivernetværk" },
              { icon: <Check size={13} className="text-[#4FB7E7]" />, label: "Ingen binding eller forpligtelse" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 rounded-full border border-[#253457]/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#5F687A] shadow-sm"
              >
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SUCCESS + RESULT ── */}
      {submitted && (
        <section
          ref={successRef}
          className="fade-in mx-auto max-w-xl space-y-4 px-4 pb-16 pt-5"
          style={{ scrollMarginTop: "60px" }}
        >
          {/* Result card */}
          <div className="rounded-[22px] bg-[#253457] p-6 shadow-[0_8px_32px_rgba(37,52,87,0.2)]">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#4FB7E7]">
              Dit mulige optimeringspotentiale
            </p>
            <p className="text-[2.1rem] font-black leading-none tracking-tight text-white">
              <AnimatedNumber value={resultDiffMin} />
            </p>
            <p className="mt-1 text-[14px] font-semibold text-white/60">
              – <AnimatedNumber value={resultDiffMax} />
            </p>
            <p className="mt-3 text-[12px] leading-relaxed text-white/50">
              Mulig ekstra pensionsværdi ved 0,5% lavere omkostninger, baseret på dit valgte opsparingsinterval.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-[14px] bg-white/8 p-3">
                <p className="text-[10px] font-semibold text-white/50">Nuværende estimat</p>
                <p className="mt-1 text-[13px] font-black text-white">{fmt(baseVal)}</p>
              </div>
              <div className="rounded-[14px] bg-[#4FB7E7]/20 p-3">
                <p className="text-[10px] font-semibold text-[#4FB7E7]">Med lavere omkostninger</p>
                <p className="mt-1 text-[13px] font-black text-white">
                  {fmt(baseVal + resultDiffMin)} –<br />{fmt(baseVal + resultDiffMax)}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-[12px] border border-white/10 bg-white/5 px-3 py-2.5">
              <p className="text-[11px] leading-relaxed text-white/40">
                ⚠️ Groft estimat baseret på dine svar og standardantagelser (5% p.a. afkast, pensionsalder 67, 0,5% lavere omkostninger). Før skat. Erstatter ikke individuel rådgivning.
              </p>
            </div>
          </div>

          {/* Hvad sker der nu */}
          <div className="rounded-[22px] border border-[#253457]/10 bg-white p-5 shadow-[0_4px_20px_rgba(37,52,87,0.07)]">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#4FB7E7]">Hvad sker der nu?</p>
            <div className="space-y-4">
              {[
                {
                  icon: <Phone size={16} className="text-[#4FB7E7]" />,
                  title: "Sebastian ringer dig op",
                  desc: "Et kort, uforpligtende opkald hvor vi tager udgangspunkt i dit resultat og din pension.",
                },
                {
                  icon: <Search size={16} className="text-[#4FB7E7]" />,
                  title: "Vi skaber et overblik",
                  desc: "Vi tager en dialog om din pensionsordning og ser om der er noget at optimere.",
                },
                {
                  icon: <Users size={16} className="text-[#4FB7E7]" />,
                  title: "Vi matcher dig videre",
                  desc: "Hvis der er noget at gøre, matcher vi dig med den rigtige rådgiver i vores kvalitetssikrede netværk.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF7FD]">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#253457]">{item.title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[#8D95A6]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Book */}
          <div className="rounded-[22px] bg-[#253457] p-5 shadow-[0_8px_32px_rgba(37,52,87,0.2)]">
            <div className="mb-1 flex items-center gap-2">
              <Calendar size={16} className="shrink-0 text-[#4FB7E7]" />
              <p className="text-[15px] font-black text-white">Vil du selv vælge tidspunkt?</p>
            </div>
            <p className="mb-5 text-[12px] leading-relaxed text-white/50">
              Book direkte i Sebastian's kalender — gratis og uforpligtende.
            </p>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track("Book Meeting Click")
                window.fbq?.("trackCustom", "BookMeetingClick")
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#4FB7E7] font-bold text-[#253457] transition hover:bg-[#3DA8D8] active:scale-[0.98]"
              style={{ minHeight: "54px", fontSize: "15px" }}
            >
              <Calendar size={15} />
              Book et gratis opkald
            </a>
            <p className="mt-3 text-center text-[11px] text-white/30">
              Eller vent — Sebastian ringer dig op hurtigst muligt
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] leading-relaxed text-[#8D95A6]">
            RådgiverXperten er et uafhængigt formidlingsled og yder ikke selv finansiel rådgivning.
            Alle beregninger er vejledende og erstatter ikke individuel pensionsrådgivning fra en autoriseret rådgiver.
          </p>
        </section>
      )}
    </main>
  )
}