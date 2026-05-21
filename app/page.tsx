"use client"

import { track } from "@vercel/analytics"
import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Clock3,
  ShieldCheck,
  TrendingUp,
  Wallet,
  PiggyBank,
  Mail,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react"

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
  }
}

type StepId = "age" | "retirementAge" | "currentSavings" | "monthlyContribution"

type Step = {
  id: StepId
  question: string
  subtitle: string
  placeholder: string
  suffix?: string
}

type SimulationResult = {
  yearsToRetirement: number
  futureValue: number
  totalOwnContributions: number
  estimatedReturn: number
  estimatedMonthlyPension: number
}

const steps: Step[] = [
  {
    id: "age",
    question: "Hvor gammel er du i dag?",
    subtitle: "Din alder har stor betydning for, hvor længe renters rente kan arbejde for dig.",
    placeholder: "Fx 35",
  },
  {
    id: "retirementAge",
    question: "Hvornår forventer du at gå på pension?",
    subtitle: "Vi bruger pensionsalderen til at beregne, hvor mange år din opsparing kan vokse.",
    placeholder: "Fx 67",
  },
  {
    id: "currentSavings",
    question: "Hvor meget har du ca. opsparet i pension i dag?",
    subtitle: "Indtast dit bedste estimat. Beregningen er vejledende og før skat.",
    placeholder: "Fx 450000",
    suffix: "DKK",
  },
  {
    id: "monthlyContribution",
    question: "Hvor meget indbetaler du ca. om måneden?",
    subtitle: "Månedlige indbetalinger kan få stor betydning over tid.",
    placeholder: "Fx 3500",
    suffix: "DKK",
  },
]

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
  const [started, setStarted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasResult, setHasResult] = useState(false)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [age, setAge] = useState("")
  const [retirementAge, setRetirementAge] = useState("67")
  const [currentSavings, setCurrentSavings] = useState("")
  const [monthlyContribution, setMonthlyContribution] = useState("")
  const [costSaving, setCostSaving] = useState<0.5 | 0.75 | 1>(0.5)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)

  const step = steps[currentStep]
  const progress = Math.round(((currentStep + 1) / steps.length) * 100)

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

  const canGoNext = step ? Number(getValue(step.id)) > 0 : false
  const canSubmit = name.trim() && email.trim() && email.includes("@") && consent && results

  function getValue(id: StepId) {
    const values = {
      age,
      retirementAge,
      currentSavings,
      monthlyContribution,
    }

    return values[id]
  }

  function setValue(id: StepId, value: string) {
    const setters = {
      age: setAge,
      retirementAge: setRetirementAge,
      currentSavings: setCurrentSavings,
      monthlyContribution: setMonthlyContribution,
    }

    setters[id](value)
  }

  function nextStep() {
    if (!canGoNext) return

    if (currentStep >= steps.length - 1) {
      setHasResult(true)
      track("Calculated Pension Result")
      window.fbq?.("trackCustom", "CalculatedPension")
      return
    }

    setCurrentStep((prev) => prev + 1)
  }

  function goBack() {
    if (hasResult) {
      setHasResult(false)
      setCurrentStep(steps.length - 1)
      return
    }

    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    } else {
      setStarted(false)
    }
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
        results,
        costSaving,
      }),
    })

    await fetch("https://hooks.zapier.com/hooks/catch/27569406/4yf4lpr/", {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({
        date: new Date().toISOString(),
        name: name,
        email: email,
        age: age,
        retirementAge: retirementAge,
        costSaving: `${costSaving}%`,
        extraValue: `${Math.round(results.returnDifference).toLocaleString("da-DK")} DKK`,
        baselineValue: `${Math.round(results.baseline.futureValue).toLocaleString("da-DK")} DKK`,
        improvedValue: `${Math.round(results.improved.futureValue).toLocaleString("da-DK")} DKK`,
      }),
    })

    if (response.ok) {
      setSubmitted(true)
      track("Submitted Pension Lead")
      window.fbq?.("track", "Lead")
    } else {
      alert("Der opstod en fejl ved afsendelse.")
    }
  }

  function resetFlow() {
    setStarted(false)
    setCurrentStep(0)
    setHasResult(false)
    setShowLeadForm(false)
    setSubmitted(false)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F4FAFA] text-[#253457]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(79,183,231,0.16),transparent_32%),linear-gradient(180deg,#F8FCFC_0%,#EEF8F8_100%)]" />

      <header className="relative z-10 border-b border-[#253457]/10 bg-white/85 backdrop-blur-xl">
  <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20 md:px-10">
    <img
      src="/logo.svg"
      alt="RådgiverXperten"
      className="block h-auto w-[155px] max-w-[155px] object-contain md:w-[220px] md:max-w-[220px]"
    />

    <button
      onClick={() => {
        track("Started Pension Check Header")
        window.fbq?.("trackCustom", "StartedPensionCheck")
        setStarted(true)
      }}
      className="hidden cursor-pointer rounded-full bg-[#253457] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D2948] sm:inline-flex"
    >
      Start gratis pensionscheck
    </button>
  </div>
</header>

      <AnimatePresence mode="wait">
        {!started ? (
          <motion.section
            key="landing"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.42 }}
            className="relative z-10 flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 md:min-h-[calc(100vh-80px)] md:px-6 md:py-16"
          >
            <div className="mx-auto max-w-5xl text-center">
              <p className="mb-8 text-sm font-black uppercase tracking-[0.32em] text-[#4FB7E7] md:text-base">
                Gratis pensionscheck
              </p>

              <h1 className="mx-auto max-w-4xl text-[2.25rem] font-black leading-[1.02] tracking-[-0.045em] text-[#253457] sm:text-[3rem] md:text-[4rem] lg:text-[4.4rem]">
                Hvad kan lavere{" "}
                <span className="text-[#4FB7E7]">omkostninger</span> betyde for
                din pension?
              </h1>

              <p className="mx-auto mt-7 max-w-3xl text-[1.05rem] leading-relaxed text-[#5F687A] md:text-[1.25rem]">
                Få et vejledende estimat på din pensionsopsparing og se, hvordan
                selv små forskelle i omkostninger potentielt kan få stor betydning
                over tid.
              </p>

              <div className="mt-11 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  onClick={() => {
                    track("Started Pension Check Hero")
                    window.fbq?.("trackCustom", "StartedPensionCheck")
                    setStarted(true)
                  }}
                  className="group inline-flex cursor-pointer items-center justify-center gap-3 rounded-full bg-[#253457] px-8 py-4 text-base font-bold text-white shadow-xl shadow-[#253457]/15 transition hover:bg-[#1D2948]"
                >
                  Start gratis pensionscheck
                  <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </button>

                <div className="inline-flex items-center gap-3 rounded-full border border-[#253457]/10 bg-white/80 px-6 py-4 text-sm font-semibold text-[#4B5563] shadow-sm">
                  <Clock3 size={18} className="text-[#4FB7E7]" />
                  Under 1 minut
                </div>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-[#667085]">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#4FB7E7]" />
                  Vejledende overblik
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#4FB7E7]" />
                  Personligt estimat
                </div>
                <div className="flex items-center gap-2">
                  <Check size={18} className="text-[#4FB7E7]" />
                  Uforpligtende
                </div>
              </div>
            </div>
          </motion.section>
        ) : submitted ? (
          <motion.section
            key="submitted"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-10"
          >
            <div className="w-full max-w-xl rounded-[28px] border border-[#253457]/10 bg-white/92 p-8 text-center shadow-[0_18px_55px_rgba(37,52,87,0.07)]">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF3]">
                <Check size={26} className="text-[#027A48]" />
              </div>

              <h2 className="text-3xl font-black tracking-[-0.03em] text-[#253457]">
                Din vurdering er sendt
              </h2>

              <p className="mx-auto mt-4 max-w-md leading-relaxed text-[#667085]">
                Vi har sendt dit pensionsestimat til din mail. Tjek gerne din
                indbakke og eventuelt spam-mappen.
              </p>

              <button
                onClick={resetFlow}
                className="mt-7 inline-flex cursor-pointer items-center justify-center rounded-full border border-[#253457]/10 bg-white px-6 py-3 text-sm font-bold text-[#253457] transition hover:bg-[#F8FAFC]"
              >
                Start forfra
              </button>
            </div>
          </motion.section>
        ) : showLeadForm ? (
          <motion.section
            key="lead-form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-10"
          >
            <div className="w-full max-w-xl">
              <button
                onClick={() => setShowLeadForm(false)}
                className="mb-7 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[#8D95A6] transition hover:text-[#253457]"
              >
                <ChevronLeft size={18} />
                Tilbage til resultat
              </button>

              <div className="rounded-[28px] border border-[#253457]/10 bg-white/92 p-6 shadow-[0_18px_55px_rgba(37,52,87,0.07)] md:p-8">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF7FD]">
                    <Mail size={21} className="text-[#4FB7E7]" />
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[#4FB7E7]">
                      Næste skridt
                    </p>

                    <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#253457]">
                      Få din vurdering sendt
                    </h2>

                    <p className="mt-3 text-sm leading-relaxed text-[#667085]">
                      Vi sender dig en kort og mere personlig opsummering af dit
                      resultat og hvad omkostningsforskellen kan betyde.
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

                  <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-[#253457]/10 bg-[#FBFCFD] p-4">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 cursor-pointer"
                    />

                    <span className="text-xs leading-relaxed text-[#667085]">
                      Jeg accepterer, at RådgiverXperten må behandle mine
                      oplysninger og kontakte mig via mail vedrørende min
                      pensionsvurdering. Jeg kan til enhver tid trække mit samtykke
                      tilbage.
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
            </div>
          </motion.section>
        ) : hasResult && results ? (
          <motion.section
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-10"
          >
            <div className="w-full max-w-3xl">
              <button
                onClick={goBack}
                className="mb-7 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[#8D95A6] transition hover:text-[#253457]"
              >
                <ChevronLeft size={18} />
                Tilbage
              </button>

              <div className="rounded-[28px] border border-[#253457]/10 bg-white/92 p-6 shadow-[0_18px_55px_rgba(37,52,87,0.07)] md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#4FB7E7]">
                  Dit pensionsoverblik
                </p>

                <h2 className="mt-4 text-[2.15rem] font-black leading-none tracking-[-0.04em] text-[#253457] md:text-[3.1rem]">
                  {formatCurrency(results.returnDifference)}
                </h2>

                <p className="mt-4 max-w-xl text-[1rem] font-semibold leading-relaxed text-[#253457] md:text-[1.08rem]">
                  Det er den mulige ekstra værdi fra afkast, hvis omkostningerne
                  reduceres med {String(costSaving).replace(".", ",")}% i dit
                  valgte scenarie.
                </p>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[22px] border border-[#253457]/10 bg-[#FBFCFD] p-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF7FD]">
                      <Wallet size={19} className="text-[#4FB7E7]" />
                    </div>
                    <p className="text-sm font-bold text-[#8D95A6]">Sådan ser det ud nu</p>
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

                <div className="mt-6 rounded-[22px] border border-[#FEC84B]/40 bg-[#FFFCF2] p-5">
                  <div className="flex gap-3">
                    <AlertTriangle size={20} className="mt-1 shrink-0 text-[#F79009]" />

                    <div>
                      <h3 className="text-[1.05rem] font-black text-[#B54708]">
                        Hvorfor kan det få betydning?
                      </h3>

                      <p className="mt-2 text-[0.95rem] leading-relaxed text-[#253457]/80">
                        Små forskelle i omkostninger kan vokse markant over tid,
                        især når der er mange år til pension. Derfor kan det være
                        relevant at få gennemgået, om din nuværende løsning er sat
                        fornuftigt sammen.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 divide-y divide-[#253457]/10 rounded-[22px] border border-[#253457]/10 bg-[#FBFCFD]">
                  {[
                    {
                      title: "Tid gør en stor forskel",
                      text: `Du har ${results.baseline.yearsToRetirement} år til pension i beregningen. Jo længere tidshorisont, desto større effekt kan små forbedringer få.`,
                    },
                    {
                      title: "Omkostninger påvirker nettoafkastet",
                      text: "Lavere omkostninger kan i praksis fungere som et højere effektivt afkast over tid.",
                    },
                    {
                      title: "Beregningen er vejledende",
                      text: "Den tager ikke højde for skat, inflation, markedsudsving eller individuelle pensionsvilkår.",
                    },
                  ].map((item, index) => (
                    <div key={index} className="p-4">
                      <div className="flex gap-3">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#4FB7E7]" />
                        <div>
                          <h4 className="text-[0.98rem] font-black text-[#253457]">
                            {item.title}
                          </h4>
                          <p className="mt-1.5 text-[0.92rem] leading-relaxed text-[#667085]">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => {
                      track("Opened Pension Lead Form")
                      window.fbq?.("track", "Contact")
                      setShowLeadForm(true)
                    }}
                    className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-full bg-[#253457] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#1D2948]"
                  >
                    Få min vurdering sendt
                    <ArrowRight size={18} />
                  </button>

                  <button
                    onClick={resetFlow}
                    className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-full border border-[#253457]/10 bg-white px-6 py-3.5 text-sm font-bold text-[#253457] transition hover:bg-[#F8FAFC]"
                  >
                    Start forfra
                    <RefreshCcw size={16} />
                  </button>
                </div>

                <p className="mt-5 text-xs leading-relaxed text-[#8D95A6]">
                  Resultatet er vejledende, før skat, og udgør ikke finansiel,
                  juridisk eller investeringsmæssig rådgivning.
                </p>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-12"
          >
            <div className="w-full max-w-2xl">
              <button
                onClick={goBack}
                className="mb-7 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[#8D95A6] transition hover:text-[#253457]"
              >
                <ChevronLeft size={18} />
                Tilbage
              </button>

              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[#8D95A6]">
                  <span>
                    Spørgsmål {currentStep + 1} / {steps.length}
                  </span>
                  <span>{progress}%</span>
                </div>

                <div className="h-[3px] overflow-hidden rounded-full bg-[#DCE8ED]">
                  <motion.div
                    className="h-full rounded-full bg-[#4FB7E7]"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-[#253457]/10 bg-white/88 p-6 shadow-[0_18px_55px_rgba(37,52,87,0.07)] backdrop-blur md:p-8">
                <h2 className="text-[1.85rem] font-black leading-[1.08] tracking-[-0.03em] text-[#253457] md:text-[2.35rem]">
                  {step.question}
                </h2>

                <p className="mt-3 max-w-xl text-[0.98rem] leading-relaxed text-[#667085] md:text-base">
                  {step.subtitle}
                </p>

                <div className="mt-7">
                  <div className="relative">
                    <input
                      value={getValue(step.id)}
                      onChange={(e) => setValue(step.id, e.target.value)}
                      placeholder={step.placeholder}
                      type="number"
                      className="w-full rounded-[20px] border border-[#253457]/10 bg-[#FBFCFD] px-5 py-4 pr-20 text-lg font-black text-[#253457] outline-none transition placeholder:text-[#A0A8B8] focus:border-[#4FB7E7]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") nextStep()
                      }}
                    />

                    {step.suffix && (
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-[#8D95A6]">
                        {step.suffix}
                      </span>
                    )}
                  </div>
                </div>

                {currentStep === steps.length - 1 && (
                  <div className="mt-6 rounded-[20px] border border-[#253457]/10 bg-[#FBFCFD] p-4">
                    <p className="mb-3 text-sm font-black text-[#253457]">
                      Hvis dine omkostninger kunne sænkes med:
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {[0.5, 0.75, 1].map((value) => (
                        <button
                          key={value}
                          onClick={() => setCostSaving(value as 0.5 | 0.75 | 1)}
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
                )}

                <button
                  onClick={nextStep}
                  disabled={!canGoNext}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-3.5 text-sm font-bold transition ${
                    canGoNext
                      ? "cursor-pointer bg-[#253457] text-white hover:bg-[#1D2948]"
                      : "cursor-not-allowed bg-[#D7DEE8] text-white"
                  }`}
                >
                  {currentStep >= steps.length - 1 ? "Se mit estimat" : "Videre"}
                  <ArrowRight size={18} />
                </button>
              </div>

              <p className="mt-5 text-center text-xs leading-relaxed text-[#8D95A6]">
                Pensionschecket er vejledende og erstatter ikke individuel
                finansiel rådgivning.
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  )
}