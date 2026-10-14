"use client"

import { track } from "@vercel/analytics"
import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
  }
}

const CALENDLY_URL = "https://calendly.com/sebastian-raadgiverxperten/10min"
const ZAPIER_URL = "https://hooks.zapier.com/hooks/catch/27569406/4yf4lpr/"

type Option = { label: string; points: number }
type Step = { key: string; question: string; help?: string; multi?: boolean; options: Option[] }

// Man er et match, hvis pointsummen når mindst så mange point (maks. 23)
const MIN_SCORE = 12

const STEPS: Step[] = [
  {
    key: "alder",
    question: "Hvor gammel er du?",
    options: [
      { label: "Under 30 år", points: 0 },
      { label: "30–39 år", points: 1 },
      { label: "40–49 år", points: 3 },
      { label: "50–59 år", points: 3 },
      { label: "60 år eller derover", points: 2 },
    ],
  },
  {
    key: "job",
    question: "Hvad laver du til daglig?",
    options: [
      { label: "Lønmodtager", points: 2 },
      { label: "Selvstændig", points: 3 },
      { label: "Pensioneret", points: 1 },
      { label: "Ledig eller studerende", points: 0 },
    ],
  },
  {
    key: "indkomst",
    question: "Hvad tjener du om året før skat?",
    help: "Din egen indkomst, ikke husstandens.",
    options: [
      { label: "Under 400.000 kr.", points: 0 },
      { label: "400.000 – 600.000 kr.", points: 1 },
      { label: "600.000 – 900.000 kr.", points: 2 },
      { label: "Over 900.000 kr.", points: 3 },
    ],
  },
  {
    key: "opsparing",
    question: "Hvor meget har du sparet op til pension i alt?",
    help: "Kig evt. på pensionsinfo.dk. Et skøn er fint.",
    options: [
      { label: "Under 500.000 kr.", points: 0 },
      { label: "500.000 – 1,5 mio. kr.", points: 1 },
      { label: "1,5 – 4 mio. kr.", points: 2 },
      { label: "Over 4 mio. kr.", points: 3 },
      { label: "Ved ikke", points: 0 },
    ],
  },
  {
    key: "antal_ordninger",
    question: "Hvor mange pensionsordninger har du?",
    help: "Tæl også dem fra gamle job med.",
    options: [
      { label: "Én", points: 0 },
      { label: "To eller tre", points: 2 },
      { label: "Fire eller flere", points: 3 },
      { label: "Ved ikke", points: 1 },
    ],
  },
  {
    key: "vigtigst",
    question: "Hvad vil du helst have svar på?",
    help: "Vælg gerne flere.",
    multi: true,
    options: [
      { label: "Hvornår kan jeg gå på pension?", points: 2 },
      { label: "Betaler jeg for meget i gebyrer?", points: 2 },
      { label: "Kan jeg samle mine ordninger?", points: 2 },
      { label: "Er min familie sikret?", points: 2 },
    ],
  },
  {
    key: "tidspunkt",
    question: "Hvornår vil du gerne have styr på det?",
    options: [
      { label: "Hurtigst muligt", points: 3 },
      { label: "Inden for 3 måneder", points: 2 },
      { label: "Inden for et år", points: 0 },
      { label: "Jeg er bare nysgerrig", points: 0 },
    ],
  },
  {
    key: "tidligere_raadgivning",
    question: "Har du fået rådgivning om din pension før?",
    options: [
      { label: "Ja, inden for det seneste år", points: 0 },
      { label: "Ja, for mere end et år siden", points: 2 },
      { label: "Nej, aldrig", points: 3 },
    ],
  },
]

type Answers = Record<number, number[]>

const CALL_STEPS = [
  "Vi ringer dig op på det nummer, du giver os",
  "Vi booker en tid hos en rådgiver, der passer til din situation",
  "Du får et gratis og uforpligtende pensionstjek",
]

type OutVariant = "lowscore" | "no" | "maybe"

const OUT_COPY: Record<OutVariant, { h1: string; p1: string; p2: string }> = {
  lowscore: {
    h1: "Der er ikke noget akut at hente hos en rådgiver",
    p1: "Ud fra dine svar tror vi ikke, at personlig rådgivning giver dig nok værdi lige nu. Vi vil hellere være ærlige end tage din tid.",
    p2: "Men det betyder ikke at du ikke kan handle på din pension selv. Her er 5 ting du bør tjekke:",
  },
  no: {
    h1: "Helt i orden.",
    p1: "Du kan altid vende tilbage, hvis du ombestemmer dig.",
    p2: "Her er 5 ting, du selv kan tjekke på din pension:",
  },
  maybe: {
    h1: "Tag den tid, du har brug for.",
    p1: "Du er et godt match til et gratis pensionstjek, så tilbuddet står ved magt. Når du er klar, kan vi ringe dig op, eller du kan selv booke en tid.",
    p2: "Her er 5 ting, du kan tjekke i mellemtiden:",
  },
}

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

const MEETING_ITEMS = [
  {
    title: "Dialog omkring din pension",
    desc: "Vi tager en kort dialog omkring din pension og sender dig videre til en rådgiver, hvis det er noget du ønsker og der kan gøres en forskel.",
  },
  {
    title: "Vi matcher dig videre",
    desc: "Hvis der er noget at gøre, matcher vi dig med den rigtige rådgiver i vores kvalitetssikrede netværk.",
  },
  {
    title: "20 minutter, gratis",
    desc: "Et kort, uforpligtende opkald — ingen binding, og du bestemmer selv om du vil gå videre.",
  },
]

function scoreOf(answers: Answers) {
  return STEPS.reduce((sum, step, i) => {
    const selected = answers[i] ?? []
    if (selected.length === 0) return sum
    if (step.multi) return sum + Math.max(...step.options.map((o) => o.points))
    return sum + step.options[selected[0]].points
  }, 0)
}

function isQualified(answers: Answers) {
  return scoreOf(answers) >= MIN_SCORE
}

// Logo i én farve (maske), så det kan bruges på både blå og navy baggrund
function Logo({ color }: { color?: string }) {
  if (!color) {
    return <img src="/logo.svg" alt="RådgiverXperten" className="h-auto w-[150px]" />
  }
  const mask = "url(/logo.svg) no-repeat left center / contain"
  return (
    <span
      role="img"
      aria-label="RådgiverXperten"
      className="block w-[150px]"
      style={{ aspectRatio: "1457.22 / 249.82", backgroundColor: color, WebkitMask: mask, mask }}
    />
  )
}

// 16px+ font prevents iOS auto-zoom
const inputClass =
  "h-[62px] w-full rounded-[18px] border-2 border-transparent bg-[#f0f2f6] px-[22px] text-[18px] font-medium text-[#253457] outline-none transition focus:border-[#4fb7e7] placeholder:text-[#8d95a6]"

const primaryBtn =
  "flex h-16 w-full items-center justify-between rounded-full px-6 text-[18px] font-bold transition active:scale-[0.99]"

export default function Home() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [submitted, setSubmitted] = useState(false)
  const [qualified, setQualified] = useState(false)
  const [showOut, setShowOut] = useState(false)
  const [outVariant, setOutVariant] = useState<OutVariant>("lowscore")
  const [intent, setIntent] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [wantsEmail, setWantsEmail] = useState(false)
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startedTracked, setStartedTracked] = useState(false)

  const isQuestion = step < STEPS.length
  const isOffer = step === STEPS.length
  const isContact = step === STEPS.length + 1

  const canSubmit =
    name.trim() !== "" &&
    phone.trim() !== "" &&
    consent &&
    (!wantsEmail || (email.trim() !== "" && email.includes("@")))

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [started, step, submitted, showOut])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function labelFor(stepIdx: number) {
    const selected = answers[stepIdx] ?? []
    return selected.length ? selected.map((i) => STEPS[stepIdx].options[i].label).join(", ") : "—"
  }

  function handlePick(stepIdx: number, optionIdx: number) {
    if (STEPS[stepIdx].multi) {
      setAnswers((prev) => {
        const current = prev[stepIdx] ?? []
        const next = current.includes(optionIdx) ? current.filter((x) => x !== optionIdx) : [...current, optionIdx]
        return { ...prev, [stepIdx]: next }
      })
      return
    }
    const next = { ...answers, [stepIdx]: [optionIdx] }
    setAnswers(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => advanceFrom(stepIdx, next), 320)
  }

  // Efter sidste spørgsmål: match → tilbuddet om opkald, ellers tjeklisten
  function advanceFrom(stepIdx: number, current: Answers) {
    if (stepIdx < STEPS.length - 1) {
      setStep(stepIdx + 1)
      return
    }
    const match = isQualified(current)
    setQualified(match)
    if (match) {
      setStep(STEPS.length)
    } else {
      setOutVariant("lowscore")
      setShowOut(true)
    }
  }

  // Ja → kontaktoplysninger. Ved ikke / Nej → ingen opkald, men man kan altid ombestemme sig
  function handleIntent(choice: "Ja" | "Ved ikke" | "Nej") {
    setIntent(choice)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (choice === "Ja") {
        setStep(STEPS.length + 1)
      } else {
        setOutVariant(choice === "Nej" ? "no" : "maybe")
        setShowOut(true)
      }
    }, 250)
  }

  function handleBack() {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (isContact && !qualified) setShowOut(true)
    else if (step === 0) setStarted(false)
    else setStep(step - 1)
  }

  function editAnswers() {
    setShowOut(false)
    setStep(outVariant === "lowscore" ? STEPS.length - 1 : STEPS.length)
  }

  function requestCallAnyway() {
    setShowOut(false)
    if (outVariant === "lowscore") setIntent("Ja, alligevel")
    setStep(STEPS.length + 1)
  }

  async function handleSubmit() {
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)
    const result = qualified

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
          ...Object.fromEntries(STEPS.map((st, i) => [st.key, labelFor(i)])),
          leadscore: scoreOf(answers),
          kvalificeret: result ? "Ja" : "Nej",
          oensker_pensionstjek: intent ?? "—",
          prioritet: !result ? "Lav (bad om opkald alligevel)" : intent === "Ja" ? "Høj" : "Mellem (var i tvivl)",
        }),
      })

      setSubmitted(true)
      track("Submitted Pension Lead")
      window.fbq?.("track", "Lead", {
        content_name: "Pensionsflow",
        lead_type: result ? "Qualified" : "CallbackAnyway",
      })
    } catch {
      alert("Der opstod en fejl. Prøv igen.")
    } finally {
      setIsSubmitting(false)
    }
  }


  const firstName = name.trim().split(/\s+/)[0]
  const showOutPage = showOut || (submitted && !qualified)
  const safeBottom = "pb-[max(24px,env(safe-area-inset-bottom))]"

  return (
    <main className="min-h-screen bg-[#e6e9ef] text-[#253457]" style={{ fontFamily: "var(--font-figtree), system-ui, sans-serif" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        input, button, a { -webkit-tap-highlight-color: transparent; }
        @media (max-height: 640px) { .short-hide { display: none; } }
      `}</style>

      <div className="mx-auto flex min-h-[100dvh] max-w-[480px] flex-col shadow-[0_0_40px_rgba(37,52,87,0.08)]">
        {/* ── INTRO ── */}
        {!started && !submitted && (
          <div className={`flex flex-1 flex-col bg-[#4fb7e7] px-[22px] pt-4 ${safeBottom}`}>
            <div className="flex min-h-[44px] items-center">
              <Logo color="#253457" />
            </div>
            <div className="flex flex-1 flex-col justify-center py-10">
              <h1 className="m-0 text-[clamp(42px,12.5vw,58px)] font-extrabold leading-[0.98] tracking-[-0.035em] [text-wrap:balance]">
                Se om du har brug for et gratis pensionstjek
              </h1>
              <p className="mt-[22px] max-w-[22em] text-[18px] font-medium leading-[1.45] [text-wrap:pretty]">
                Svar på {STEPS.length} korte spørgsmål — vi vurderer om vi kan matche dig med en kvalificeret rådgiver.
              </p>
            </div>
            <div className="flex flex-col gap-3.5">
              <button
                type="button"
                onClick={() => setStarted(true)}
                className={`${primaryBtn} bg-[#253457] text-white`}
              >
                <span>Start tjekket</span>
                <span className="text-[22px]">→</span>
              </button>
              <div className="short-hide flex flex-wrap justify-center gap-x-3.5 gap-y-1 text-[14px] font-semibold">
                <span>Gratis</span>
                <span>·</span>
                <span>Uforpligtende</span>
                <span>·</span>
                <span>Ca. 2 minutter</span>
              </div>
            </div>
          </div>
        )}

        {/* ── QUIZ ── */}
        {started && !submitted && !showOut && (
          <div className="flex flex-1 flex-col bg-white">
            <div className="flex min-h-[56px] items-center justify-between pb-0 pl-1.5 pr-[22px] pt-2">
              <button
                type="button"
                onClick={handleBack}
                aria-label="Tilbage"
                className="flex h-11 w-11 items-center justify-center rounded-full text-[22px] active:bg-[#f0f2f6]"
              >
                ←
              </button>
              <span className="text-[15px] font-bold tabular-nums">
                {isContact ? (
                  "Dine oplysninger"
                ) : isOffer ? (
                  "Sidste skridt"
                ) : (
                  <>
                    <span>{step + 1}</span>
                    <span className="text-[#8d95a6]"> / {STEPS.length}</span>
                  </>
                )}
              </span>
            </div>
            <div className="mx-[22px] h-[3px] bg-[#eef0f4]">
              <div className="h-[3px] bg-[#4fb7e7] transition-[width] duration-300" style={{ width: `${((step + 1) / (STEPS.length + 2)) * 100}%` }} />
            </div>

            <div className="px-[22px] pt-[30px]">
              <h2 className="m-0 text-[clamp(30px,8.6vw,38px)] font-extrabold leading-[1.06] tracking-[-0.03em] [text-wrap:balance]">
                {isOffer
                  ? "Vil du have et gratis pensionstjek?"
                  : isContact
                    ? qualified
                      ? "Hvor kan vi ringe dig op?"
                      : "Skal vi ringe dig op alligevel?"
                    : STEPS[step].question}
              </h2>
              {isOffer && (
                <>
                  <p className="mt-2.5 text-[16px] leading-[1.45] text-[#5d6780] [text-wrap:pretty]">
                    Du er et godt match. Pensionstjekket er gratis og uforpligtende.
                  </p>
                  <ol className="m-0 mt-6 flex list-none flex-col gap-3.5 p-0">
                    {CALL_STEPS.map((text, i) => (
                      <li key={text} className="flex gap-3.5 text-[17px] font-semibold leading-[1.35]">
                        <span className="w-5 shrink-0 font-extrabold text-[#4fb7e7]">{i + 1}</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-5 text-[14px] leading-[1.45] text-[#5d6780]">
                    Vi ringer kun til dem, der svarer ja — så vi har tid til at give dem en ordentlig samtale.
                  </p>
                </>
              )}
              {isContact && (
                <p className="mt-2.5 text-[16px] leading-[1.45] text-[#5d6780] [text-wrap:pretty]">
                  {qualified
                    ? "Skriv dit navn og telefonnummer, så booker vi en tid til dit pensionstjek hos en rådgiver."
                    : "Vi ringer, når en rådgiver har tid."}
                </p>
              )}
              {isQuestion && STEPS[step].help && (
                <p className="mt-2.5 text-[16px] leading-[1.45] text-[#5d6780] [text-wrap:pretty]">{STEPS[step].help}</p>
              )}
            </div>

            <div className="min-h-6 flex-1" />

            {isQuestion && (
              <div className={`flex flex-col gap-2.5 px-4 ${safeBottom}`}>
                {STEPS[step].options.map((opt, i) => {
                  const isSelected = (answers[step] ?? []).includes(i)
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
                      className={`flex min-h-[62px] items-center justify-between gap-3 rounded-[18px] px-[22px] py-3 text-left text-[18px] font-semibold leading-[1.25] transition-colors active:bg-[#253457] active:text-white ${
                        isSelected ? "bg-[#253457] text-white" : "bg-[#f0f2f6] text-[#253457]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className={`text-[18px] ${isSelected ? "opacity-100" : "opacity-0"}`}>✓</span>
                    </button>
                  )
                })}
                {STEPS[step].multi && (
                  <button
                    type="button"
                    onClick={() => advanceFrom(step, answers)}
                    disabled={(answers[step] ?? []).length === 0}
                    className={`${primaryBtn} mt-1.5 text-white ${
                      (answers[step] ?? []).length > 0 ? "bg-[#253457]" : "cursor-not-allowed bg-[#c3c8d3]"
                    }`}
                  >
                    <span>Videre</span>
                    <span className="text-[22px]">→</span>
                  </button>
                )}
              </div>
            )}

            {isOffer && (
              <div className={`flex flex-col gap-2.5 px-4 ${safeBottom}`}>
                <button type="button" onClick={() => handleIntent("Ja")} className={`${primaryBtn} bg-[#253457] text-white`}>
                  <span>Ja, ring mig op</span>
                  <span className="text-[22px]">→</span>
                </button>
                {(["Ved ikke", "Nej"] as const).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleIntent(choice)}
                    className="flex min-h-[62px] items-center rounded-[18px] bg-[#f0f2f6] px-[22px] py-3 text-left text-[18px] font-semibold transition-colors active:bg-[#253457] active:text-white"
                  >
                    {choice === "Ved ikke" ? "Ved ikke endnu" : "Nej tak"}
                  </button>
                ))}
              </div>
            )}

            {isContact && (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSubmit()
                }}
                className={`flex flex-col gap-2.5 px-4 ${safeBottom}`}
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dit navn"
                  autoComplete="name"
                  aria-label="Navn"
                  className={inputClass}
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Telefonnummer"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-label="Telefon"
                  className={inputClass}
                />

                <div className="rounded-[18px] bg-[#f0f2f6]">
                  <label className="flex min-h-[62px] cursor-pointer items-center gap-3 px-[22px] py-3">
                    <input
                      type="checkbox"
                      checked={wantsEmail}
                      onChange={(e) => setWantsEmail(e.target.checked)}
                      className="h-5 w-5 shrink-0 accent-[#253457]"
                    />
                    <span className="text-[16px] font-semibold">Send mig også resultatet på mail</span>
                  </label>
                  {wantsEmail && (
                    <div className="px-2 pb-2">
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Din e-mailadresse"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        aria-label="E-mail"
                        className={`${inputClass} bg-white`}
                      />
                    </div>
                  )}
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-[18px] bg-[#f0f2f6] px-[22px] py-4">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[#253457]"
                  />
                  <span className="text-[13px] leading-[1.45] text-[#5d6780]">
                    Jeg accepterer, at RådgiverXperten eller deres relevante samarbejdspartner må kontakte mig via telefon
                    {wantsEmail ? " og mail" : ""} vedrørende min pensionsvurdering. Samtykket kan tilbagekaldes til
                    enhver tid. Læs vores{" "}
                    <a
                      href="https://raadgiverxperten.dk/privacy-policy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}
                    >
                      privatlivspolitik her
                    </a>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className={`${primaryBtn} mt-1.5 text-white ${
                    canSubmit && !isSubmitting ? "bg-[#253457]" : "cursor-not-allowed bg-[#c3c8d3]"
                  }`}
                >
                  <span>{isSubmitting ? "Sender..." : "Ring mig op"}</span>
                  <span className="text-[22px]">→</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── RESULT: QUALIFIED ── */}
        {submitted && qualified && (
          <div className={`flex flex-1 flex-col bg-[#253457] px-[22px] pt-4 text-white ${safeBottom}`}>
            <div className="flex min-h-[44px] items-center">
              <Logo color="#ffffff" />
            </div>
            <div className="flex flex-1 flex-col justify-center py-8">
              <h1 className="m-0 text-[clamp(38px,10.5vw,50px)] font-extrabold leading-[1] tracking-[-0.035em] [text-wrap:balance]">
                {firstName ? `Tak, ${firstName}. Vi ringer dig op.` : "Tak. Vi ringer dig op."}
              </h1>
              <p className="mt-4 text-[18px] leading-[1.45] text-[#d2d7e1] [text-wrap:pretty]">
                Vi ringer dig op og booker en tid til dit pensionstjek hos en rådgiver. Du behøver ikke gøre mere.
              </p>

              <p className="mt-8 text-[14px] font-bold text-[#4fb7e7]">Hvad sker der nu?</p>
              <div className="mt-2.5 flex flex-col border-t border-[#3b4a6e]">
                {MEETING_ITEMS.map((item) => (
                  <div key={item.title} className="border-b border-[#3b4a6e] py-3.5">
                    <p className="text-[16px] font-bold">{item.title}</p>
                    <p className="mt-1 text-[15px] leading-[1.45] text-[#b9c0cd]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  track("Book Meeting Click")
                  window.fbq?.("trackCustom", "BookMeetingClick")
                }}
                className={`${primaryBtn} bg-[#4fb7e7]`}
                style={{ color: "#253457" }}
              >
                <span>Book tid i kalenderen</span>
                <span className="text-[22px]">→</span>
              </a>
              <p className="text-center text-[14px] text-[#b9c0cd]">Vil du hellere vælge tidspunktet selv?</p>
              <p className="mt-2 text-center text-[12px] leading-[1.45] text-[#8d95a6]">
                RådgiverXperten er et uafhængigt formidlingsled og yder ikke selv finansiel rådgivning.
              </p>
            </div>
          </div>
        )}

        {/* ── RESULT: CHECKLIST ── */}
        {showOutPage && (
          <div className={`flex flex-1 flex-col bg-[#f0f2f6] px-[22px] pt-4 ${safeBottom}`}>
            <div className="flex min-h-[44px] items-center">
              <Logo />
            </div>
            <div className="flex flex-1 flex-col py-8">
              {submitted && (
                <div className="mb-6 rounded-[18px] bg-[#253457] px-5 py-4 text-white">
                  <p className="text-[17px] font-extrabold">
                    {firstName ? `Tak, ${firstName}.` : "Tak."} Vi ringer dig op, når en rådgiver har tid.
                  </p>
                </div>
              )}
              <h1 className="m-0 text-[clamp(34px,9.5vw,44px)] font-extrabold leading-[1.02] tracking-[-0.03em] [text-wrap:balance]">
                {OUT_COPY[outVariant].h1}
              </h1>
              <p className="mt-4 text-[18px] leading-[1.45] text-[#3d4a6a] [text-wrap:pretty]">{OUT_COPY[outVariant].p1}</p>
              <p className="mt-4 text-[18px] leading-[1.45] text-[#3d4a6a] [text-wrap:pretty]">{OUT_COPY[outVariant].p2}</p>

              <div className="mt-[22px] rounded-[18px] bg-white px-5">
                {CHECKLIST_ITEMS.map((item, i) => (
                  <div key={item.title} className={`flex gap-3.5 py-[18px] ${i > 0 ? "border-t border-[#eef0f4]" : ""}`}>
                    <span className="w-5 shrink-0 text-[16px] font-extrabold text-[#4fb7e7]">{i + 1}</span>
                    <div>
                      <p className="text-[16px] font-bold">{item.title}</p>
                      <p className="mt-1 text-[15px] leading-[1.5] text-[#3d4a6a] [text-wrap:pretty]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-[22px] rounded-[18px] bg-white px-5 py-[18px]">
                <p className="text-[18px] font-extrabold">Sidder du med spørgsmål?</p>
                <p className="mt-1.5 text-[15px] leading-[1.5] text-[#3d4a6a] [text-wrap:pretty]">
                  Måske fangede vores spørgsmål ikke hele din situation, eller du er i tvivl om noget konkret. Book et
                  kort opkald med Sebastian, og skriv med det samme hvad du har brug for hjælp til.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  track("Book Meeting Click")
                  window.fbq?.("trackCustom", "BookMeetingClick")
                }}
                className={`${primaryBtn} bg-[#253457]`}
                style={{ color: "#ffffff" }}
              >
                <span>Book en samtale</span>
                <span className="text-[22px]">→</span>
              </a>
              <p className="text-center text-[14px] text-[#3d4a6a]">Gratis og uforpligtende</p>
              {!submitted && (
                <>
                  {outVariant !== "no" && (
                  <button
                    type="button"
                    onClick={requestCallAnyway}
                    className="flex h-16 w-full items-center justify-between rounded-full border-2 border-[#253457] px-6 text-[18px] font-bold transition active:scale-[0.99]"
                  >
                    <span>{outVariant === "lowscore" ? "Ring mig op alligevel" : "Ring mig op"}</span>
                    <span className="text-[22px]">→</span>
                  </button>
                  )}
                  <button
                    type="button"
                    onClick={editAnswers}
                    className="min-h-[44px] text-center text-[15px] font-semibold"
                    style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}
                  >
                    {outVariant === "lowscore" ? "Ret mine svar" : "Ret mit svar"}
                  </button>
                </>
              )}
              <p className="mt-2 text-center text-[13px] leading-[1.45] text-[#5d6780]">
                Skifter du job eller får en fripolice? Gem os — så finder vi den rigtige rådgiver til dig.
              </p>
              <p className="text-center text-[12px] leading-[1.45] text-[#8d95a6]">
                RådgiverXperten er et uafhængigt formidlingsled og yder ikke selv finansiel rådgivning.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
