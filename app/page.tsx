"use client"

import { track } from "@vercel/analytics"
import { useRef, useState } from "react"
import {
  Check,
  Clock3,
  Phone,
  ChevronRight,
  Mail,
  Calendar,
  Search,
  Users,
  Download,
} from "lucide-react"

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
  }
}

const CALENDLY_URL = "https://calendly.com/sebastian-raadgiverxperten/10min"
const ZAPIER_URL = "https://hooks.zapier.com/hooks/catch/27569406/4yf4lpr/"

const STEPS = [
  {
    eyebrow: "Din situation",
    question: "Hvor gammel er du?",
    options: ["Under 35 år", "35–44 år", "45–54 år", "55 år eller derover"],
  },
  {
    eyebrow: "Din pension",
    question: "Har du pension via din arbejdsgiver?",
    options: ["Ja", "Nej, jeg er selvstændig", "Ikke sikker"],
  },
  {
    eyebrow: "Din opsparing",
    question: "Har du pension eller opsparing ud over det?",
    options: [
      "Ja, pensionsopsparing",
      "Ja, aktie- eller investeringsdepot",
      "Ja, begge dele",
      "Nej, kun arbejdsgiverpension",
      "Ikke sikker",
    ],
  },
  {
    eyebrow: "Dit overblik",
    question: "Hvad er din samlede pensionsopsparing ca.?",
    options: [
      "Under 100.000 kr.",
      "100.000 – 250.000 kr.",
      "250.000 – 500.000 kr.",
      "500.000 – 1.000.000 kr.",
      "1.000.000 – 1.500.000 kr.",
      "Over 1.500.000 kr.",
    ],
  },
  {
    eyebrow: "Dine begunstigede",
    question: "Ved du hvem der er begunstiget på dine pensionsordninger?",
    options: [
      "Ja, jeg har selv valgt det",
      "Nej, jeg har aldrig taget stilling til det",
      "Jeg vidste ikke det var noget man skulle tage stilling til",
    ],
    note: "Arveloven og begunstigede er to forskellige ting. Har du sikret at din pension går til dem du ønsker?",
  },
  {
    eyebrow: "Dine omkostninger",
    question: "Kender du dine pensionsomkostninger?",
    options: ["Ja, jeg kender mine omkostninger", "Nej, jeg er ikke sikker", "Det har jeg aldrig tænkt over"],
  },
]

const CHECKLIST_ITEMS = [
  {
    title: "Begunstigede",
    desc: "Hvem arver din pension? Arveloven og begunstigede er to forskellige ting. Log ind på din pensionskasses hjemmeside og tjek det.",
  },
  {
    title: "Invaliddækning",
    desc: "Hvad sker der med din økonomi hvis du bliver syg i lang tid? Tjek om din dækning er stor nok.",
  },
  {
    title: "Overflødige forsikringer",
    desc: "Mange betaler for forsikringer de aldrig får brug for. Gennemgå hvad der er inkluderet i din pensionsordning.",
  },
  {
    title: "Risikoprofil",
    desc: "Er din opsparing investeret rigtigt for din alder? Jo tættere du er på pension, jo lavere risiko bør du typisk have.",
  },
  {
    title: "Pensionsinfo.dk",
    desc: "Gå ind og få et samlet overblik over alle dine pensioner på ét sted. Det tager 5 minutter med MitID.",
  },
]

function isQualified(answers: Record<number, number>) {
  // Selvstændig kvalificerer altid
  if (answers[1] === 1) return true
  const under100k = answers[3] === 0
  const kunArbejdsgiverpension = answers[2] === 3
  if (under100k && kunArbejdsgiverpension) return false
  return true
}

// Input style — 16px font prevents iOS auto-zoom
const inputClass = "w-full rounded-[14px] border border-[#E8E4DD] bg-[#F8F6F2] px-4 outline-none transition focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/10 placeholder:text-[#94A3B8] text-[#1B2E4B] font-semibold"
const inputStyle = { fontSize: "16px", padding: "14px 16px", WebkitAppearance: "none" as const }

export default function Home() {
  const flowRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [qualified, setQualified] = useState(false)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [wantsEmail, setWantsEmail] = useState(false)
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startedTracked, setStartedTracked] = useState(false)

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

  function labelFor(stepIdx: number) {
    const idx = answers[stepIdx]
    return idx !== undefined ? STEPS[stepIdx].options[idx] : "—"
  }

  function handlePick(stepIdx: number, optionIdx: number) {
    setSelectedIdx(optionIdx)
    const newAnswers = { ...answers, [stepIdx]: optionIdx }
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

  async function handleSubmit() {
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)
    const result = isQualified(answers)
    setQualified(result)

    try {
      await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: wantsEmail ? email : undefined,
          answers,
          qualified: result,
        }),
      })
      await fetch(ZAPIER_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          date: new Date().toISOString(),
          name,
          phone,
          email: wantsEmail ? email : "",
          alder: labelFor(0),
          arbejdsgiverpension: labelFor(1),
          ekstra_opsparing: labelFor(2),
          samlet_opsparing: labelFor(3),
          begunstigede: labelFor(4),
          kender_omkostninger: labelFor(5),
          kvalificeret: result ? "Ja" : "Nej",
        }),
      })

      setSubmitted(true)
      track("Submitted Pension Lead")
      window.fbq?.("track", "Lead", {
        content_name: "Pensionsflow",
        lead_type: result ? "Qualified" : "Checklist",
      })

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
    "Spørgsmål 1 af 6",
    "Spørgsmål 2 af 6",
    "Spørgsmål 3 af 6",
    "Spørgsmål 4 af 6",
    "Spørgsmål 5 af 6",
    "Spørgsmål 6 af 6",
    "Dine oplysninger",
  ]

  return (
    <main
      className="min-h-screen bg-[#F8F6F2] text-[#1B2E4B]"
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
      <header className="sticky top-0 z-50 border-b border-[#E8E4DD] bg-white/92 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[430px] items-center justify-between px-4">
          <img src="/logo.svg" alt="RådgiverXperten" className="h-auto w-[120px] object-contain" />
          <a
            href="#flow"
            className="flex items-center gap-1.5 rounded-[10px] bg-[#1B2E4B] px-4 py-2.5 text-xs font-bold transition-colors hover:bg-[#15243D]"
            style={{ color: "#ffffff" }}
          >
            <Clock3 size={12} />
            <span>Gratis tjek</span>
          </a>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="bg-[#1B2E4B] px-4 pb-7 pt-7">
        <div className="mx-auto max-w-[430px]">
          <h1 className="text-[1.7rem] font-black leading-[1.1] tracking-[-0.025em] text-white sm:text-[2rem]">
            Se om du har brug for et{" "}
            <span className="text-[#0EA5E9]">gratis pensionstjek</span>
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-white/60">
            Svar på 6 korte spørgsmål — vi vurderer om vi kan matche dig med en kvalificeret rådgiver.
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
          className="mx-auto max-w-[430px] px-4 pb-16 pt-4"
          style={{ scrollMarginTop: "60px" }}
        >
          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-1 w-full overflow-hidden rounded-[3px] bg-[#E8E4DD]">
              <div
                className="h-full rounded-[3px] bg-[#0EA5E9] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[#64748B]">{stepLabels[step]}</p>
          </div>

          {/* Question steps */}
          {step < STEPS.length && (
            <div key={step} className="fade-in rounded-[22px] border border-[#E8E4DD] bg-white p-5 shadow-[0_4px_20px_rgba(27,46,75,0.07)]">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#0EA5E9]">
                {STEPS[step].eyebrow}
              </p>
              <h2 className="mb-5 text-[1.1rem] font-black tracking-tight text-[#1B2E4B]">
                {STEPS[step].question}
              </h2>
              <div className="space-y-2.5">
                {STEPS[step].options.map((label, i) => {
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
                          ? "border-[#0EA5E9] bg-[#F0F9FF]"
                          : "border-[#E8E4DD] bg-[#F8F6F2] hover:border-[#0EA5E9]/50 hover:bg-[#F0F9FF]"
                      }`}
                    >
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-[1.5px] transition-all ${
                        isSelected ? "border-[#0EA5E9] bg-[#0EA5E9]" : "border-[#CBD5E1]"
                      }`}>
                        <Check size={11} className={isSelected ? "text-white" : "text-transparent"} />
                      </div>
                      <span className="text-[14px] font-semibold text-[#1B2E4B]">{label}</span>
                      <ChevronRight size={14} className="ml-auto shrink-0 text-[#94A3B8]" />
                    </button>
                  )
                })}
              </div>
              {STEPS[step].note && (
                <p className="mt-3 text-[11px] italic leading-relaxed text-[#94A3B8]">
                  {STEPS[step].note}
                </p>
              )}
            </div>
          )}

          {/* Contact step */}
          {step === STEPS.length && (
            <div
              ref={contactRef}
              key="contact"
              className="fade-in rounded-[22px] border border-[#E8E4DD] bg-white p-5 shadow-[0_4px_20px_rgba(27,46,75,0.07)]"
              style={{ scrollMarginTop: "70px" }}
            >
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#0EA5E9]">
                Næste skridt
              </p>
              <h2 className="text-[1.1rem] font-black tracking-tight text-[#1B2E4B]">
                Få dit personlige resultat
              </h2>
              <p className="mt-1 mb-5 text-[12px] leading-relaxed text-[#64748B]">
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
                  <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
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
                <div className="rounded-[14px] border border-[#E8E4DD] bg-[#F8F6F2]">
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5" style={{ minHeight: "52px" }}>
                    <input
                      type="checkbox"
                      checked={wantsEmail}
                      onChange={(e) => setWantsEmail(e.target.checked)}
                      className="h-4 w-4 shrink-0 accent-[#0EA5E9]"
                    />
                    <span className="text-[13px] font-semibold text-[#1B2E4B]">
                      Send mig også resultatet på mail
                    </span>
                    <Mail size={14} className="ml-auto shrink-0 text-[#64748B]" />
                  </label>
                  {wantsEmail && (
                    <div className="slide-down border-t border-[#E8E4DD] px-4 pb-3">
                      <div className="relative mt-3">
                        <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
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
                <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-[#E8E4DD] bg-[#F8F6F2] p-4" style={{ minHeight: "52px" }}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#0EA5E9]"
                  />
                  <span className="text-[11px] leading-relaxed text-[#64748B]">
                    Jeg accepterer, at RådgiverXperten eller deres relevante samarbejdspartner må kontakte mig via telefon
                    {wantsEmail ? " og mail" : ""} vedrørende min pensionsvurdering.
                    Samtykket kan tilbagekaldes til enhver tid. Læs vores{" "}
                    <a href="https://raadgiverxperten.dk/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-[#0EA5E9]" style={{ textDecoration: "underline" }}>privatlivspolitik her</a>.
                  </span>
                </label>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  style={{ minHeight: "54px", fontSize: "15px", WebkitAppearance: "none" as const }}
                  className={`flex w-full items-center justify-center gap-2 rounded-[14px] font-bold transition ${
                    canSubmit && !isSubmitting
                      ? "bg-[#0EA5E9] text-[#1B2E4B] hover:bg-[#0284C7] active:scale-[0.98]"
                      : "cursor-not-allowed bg-[#E2E8F0] text-[#94A3B8]"
                  }`}
                >
                  {isSubmitting ? "Beregner..." : "Se mit resultat"}
                </button>

                <div className="flex items-center justify-center gap-5 pt-0.5">
                  {["Gratis", "Uforpligtende", "10 minutter"].map((t) => (
                    <div key={t} className="flex items-center gap-1 text-[11px] text-[#64748B]">
                      <Check size={11} className="text-[#0EA5E9]" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── RESULT: QUALIFIED ── */}
      {submitted && qualified && (
        <section
          ref={successRef}
          className="fade-in mx-auto max-w-[430px] space-y-4 px-4 pb-16 pt-5"
          style={{ scrollMarginTop: "60px" }}
        >
          {/* Match card */}
          <div className="rounded-[22px] bg-[#1B2E4B] p-6 shadow-[0_8px_32px_rgba(27,46,75,0.2)]">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#0EA5E9]">
              Dit resultat
            </p>
            <h2 className="text-[1.4rem] font-black leading-tight text-white">
              Vi matcher dig med den rigtige rådgiver
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-white/60">
              Ud fra dine svar kan der være noget at hente ved at få et professionelt tjek af din pension. Book et
              gratis og uforpligtende opkald, så finder vi den rådgiver i vores netværk, der passer bedst til din
              situation.
            </p>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track("Book Meeting Click")
                window.fbq?.("trackCustom", "BookMeetingClick")
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#0EA5E9] font-bold text-[#1B2E4B] transition hover:bg-[#0284C7] active:scale-[0.98]"
              style={{ minHeight: "54px", fontSize: "15px" }}
            >
              <Calendar size={15} />
              Book et gratis opkald
            </a>
            <p className="mt-3 text-center text-[11px] text-white/30">
              Ellers ringer Sebastian dig op hurtigst muligt
            </p>
          </div>

          {/* Hvad sker der til mødet */}
          <div className="rounded-[22px] border border-[#E8E4DD] bg-white p-5 shadow-[0_4px_20px_rgba(27,46,75,0.07)]">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#0EA5E9]">Hvad sker der til mødet?</p>
            <div className="space-y-4">
              {[
                {
                  icon: <Search size={16} className="text-[#0EA5E9]" />,
                  title: "Dialog omkring din pension",
                  desc: "Vi tager en kort dialog omkring din pension og sender dig videre til en rådgiver, hvis det er noget du ønsker og der kan gøres en forskel.",
                },
                {
                  icon: <Users size={16} className="text-[#0EA5E9]" />,
                  title: "Vi matcher dig videre",
                  desc: "Hvis der er noget at gøre, matcher vi dig med den rigtige rådgiver i vores kvalitetssikrede netværk.",
                },
                {
                  icon: <Clock3 size={16} className="text-[#0EA5E9]" />,
                  title: "20 minutter, gratis",
                  desc: "Et kort, uforpligtende opkald — ingen binding, og du bestemmer selv om du vil gå videre.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#F0F9FF]">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1B2E4B]">{item.title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[#64748B]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] leading-relaxed text-[#64748B]">
            RådgiverXperten er et uafhængigt formidlingsled og yder ikke selv finansiel rådgivning.
          </p>
        </section>
      )}

      {/* ── RESULT: CHECKLIST ── */}
      {submitted && !qualified && (
        <section
          ref={successRef}
          className="fade-in mx-auto max-w-[430px] space-y-4 px-4 pb-16 pt-5"
          style={{ scrollMarginTop: "60px" }}
        >
          {/* Status card */}
          <div className="rounded-[22px] border border-[#E8E4DD] bg-white p-6 shadow-[0_4px_20px_rgba(27,46,75,0.07)]">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#0EA5E9]">
              Dit resultat
            </p>
            <h2 className="text-[1.3rem] font-black leading-tight text-[#1B2E4B]">
              Vi kan desværre ikke hjælpe dig
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-[#64748B]">
              Fordi din pension udelukkende er via din arbejdsgiver, er den bundet til din overenskomst eller
              ansættelsesaftale — det er ikke muligt for en privat rådgiver at flytte eller optimere den.
            </p>
            <div className="my-4 border-t border-[#E8E4DD]" />
            <p className="text-[13px] leading-relaxed text-[#64748B]">
              Men det betyder ikke at du ikke kan handle på din pension selv. Her er 5 ting du bør tjekke:
            </p>
          </div>

          {/* Checklist */}
          <div className="rounded-[22px] border border-[#E8E4DD] bg-white p-5 shadow-[0_4px_20px_rgba(27,46,75,0.07)]">
            <div className="space-y-4">
              {CHECKLIST_ITEMS.map((item, i) => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-[#F0F9FF] text-[11px] font-black text-[#0EA5E9]">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1B2E4B]">{item.title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[#64748B]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => track("Download Checklist Click")}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#E8E4DD] bg-[#F8F6F2] py-3.5 text-[13px] font-bold text-[#1B2E4B] transition hover:bg-[#F0F9FF] active:scale-[0.98]"
              style={{ minHeight: "50px" }}
            >
              <Download size={14} />
              Download tjekliste som PDF
            </button>
          </div>

          {/* Note */}
          <div className="rounded-[16px] border border-[#E8E4DD] bg-white/60 p-4">
            <p className="text-[11px] leading-relaxed text-[#64748B]">
              Skifter du job eller får en fripolice? Gem os — så finder vi den rigtige rådgiver til dig.
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] leading-relaxed text-[#64748B]">
            RådgiverXperten er et uafhængigt formidlingsled og yder ikke selv finansiel rådgivning.
          </p>
        </section>
      )}
    </main>
  )
}
