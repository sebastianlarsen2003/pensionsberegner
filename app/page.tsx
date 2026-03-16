"use client"

import Image from "next/image"
import { useMemo, useRef, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
)

type PensionChartProps = {
  currentSavings: number
  futureValue: number
  yearsToRetirement: number
}

function PensionChart({
  currentSavings,
  futureValue,
  yearsToRetirement,
}: PensionChartProps) {
  const step1 = Math.max(1, Math.round(yearsToRetirement / 3))
  const step2 = Math.max(2, Math.round((yearsToRetirement / 3) * 2))

  const estimateAtPoint = (year: number) => {
    if (yearsToRetirement <= 0) return currentSavings
    const ratio = year / yearsToRetirement
    return Math.round(currentSavings + (futureValue - currentSavings) * ratio)
  }

  const data = {
    labels: ["I dag", `Om ${step1} år`, `Om ${step2} år`, "Ved pension"],
    datasets: [
      {
        label: "Opsparing",
        data: [
          currentSavings,
          estimateAtPoint(step1),
          estimateAtPoint(step2),
          futureValue,
        ],
        borderColor: "#0f172a",
        backgroundColor: "rgba(15, 23, 42, 0.08)",
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 5,
        fill: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${Number(
              context.parsed.y
            ).toLocaleString("da-DK")} kr.`
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: function (value: any) {
            return `${Number(value).toLocaleString("da-DK")} kr.`
          },
        },
      },
    },
  }

  return (
    <div className="h-[320px] w-full">
      <Line data={data} options={options} />
    </div>
  )
}

export default function Home() {
  const [age, setAge] = useState("")
  const [retirementAge, setRetirementAge] = useState("67")
  const [currentSavings, setCurrentSavings] = useState("")
  const [monthlyContribution, setMonthlyContribution] = useState("")
  const [hasCalculated, setHasCalculated] = useState(false)

  const [showLeadModal, setShowLeadModal] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  const resultRef = useRef<HTMLElement>(null)

  const result = useMemo(() => {
    const currentAge = Number(age)
    const pensionAge = Number(retirementAge)
    const savings = Number(currentSavings)
    const monthly = Number(monthlyContribution)

    if (
      !currentAge ||
      !pensionAge ||
      savings < 0 ||
      monthly < 0 ||
      pensionAge <= currentAge
    ) {
      return null
    }

    const yearsToRetirement = pensionAge - currentAge
    const annualReturn = 0.05
    const monthlyReturn = annualReturn / 12
    const totalMonths = yearsToRetirement * 12

    let futureValue = savings * Math.pow(1 + annualReturn, yearsToRetirement)

    for (let i = 0; i < totalMonths; i++) {
      futureValue += monthly
      futureValue *= 1 + monthlyReturn
    }

    const estimatedMonthlyPension = futureValue / (20 * 12)

    let rating = ""
    let ratingText = ""
    let ratingBadge = ""

    if (estimatedMonthlyPension < 10000) {
      rating = "Lavt niveau"
      ratingText =
        "Din opsparing ser ud til at give et relativt lavt månedligt beløb. Det kan være relevant at undersøge, om der er mulighed for at optimere indbetaling, strategi eller tidshorisont."
      ratingBadge = "Behov for eftersyn"
    } else if (estimatedMonthlyPension < 20000) {
      rating = "Fornuftigt udgangspunkt"
      ratingText =
        "Du har et fornuftigt udgangspunkt, men der kan stadig være potentiale for forbedringer afhængigt af dine mål, ønsket pensionsliv og den samlede økonomi."
      ratingBadge = "Muligt optimeringspotentiale"
    } else {
      rating = "Stærkt udgangspunkt"
      ratingText =
        "Din opsparing ser umiddelbart stærk ud. Det kan stadig være relevant at få vurderet, om sammensætning, risiko og udbetalingsplan matcher dine ønsker."
      ratingBadge = "Ser stærkt ud"
    }

    let teaserText = ""

    if (rating === "Lavt niveau") {
      teaserText =
        "Din beregning tyder umiddelbart på, at din pensionsopsparing kan være i den lave ende i forhold til den tid, der er tilbage til pension. Der kan være muligheder for at styrke dit fremtidige niveau afhængigt af din samlede økonomi."
    } else if (rating === "Fornuftigt udgangspunkt") {
      teaserText =
        "Din beregning viser et fornuftigt udgangspunkt. Samtidig kan der stadig være optimeringsmuligheder afhængigt af indbetalinger, investeringsprofil og den samlede pensionsstruktur."
    } else {
      teaserText =
        "Din opsparing ser umiddelbart stærk ud i forhold til tidshorisonten. Selv i en god situation kan det dog være relevant at få vurderet, om sammensætningen af din pension matcher dine ønsker til fremtiden."
    }

    return {
      yearsToRetirement,
      futureValue: Math.round(futureValue),
      estimatedMonthlyPension: Math.round(estimatedMonthlyPension),
      rating,
      ratingText,
      ratingBadge,
      teaserText,
    }
  }, [age, retirementAge, currentSavings, monthlyContribution])

  const handleCalculate = () => {
    setHasCalculated(true)

    setTimeout(() => {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 150)
  }

  const handleLeadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!name || !email || !result) return

    console.log("Lead captured:", {
      name,
      email,
      age,
      retirementAge,
      currentSavings,
      monthlyContribution,
      result,
    })

    setLeadSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a
            href="https://raadgiverxperten.dk"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3"
          >
            <Image
              src="/logo.svg"
              alt="RådgiverXperten"
              width={230}
              height={60}
              priority
              className="h-auto w-[180px] cursor-pointer md:w-[230px]"
            />
          </a>

          <div className="hidden items-center gap-3 md:flex">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 shadow-sm">
              Gratis pensionscheck
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 shadow-sm">
              Under 1 minut
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 shadow-sm">
              Uforpligtende
            </span>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-2xl pt-4">
              <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-900">
                Klarhed før beslutning.
              </div>

              <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-slate-950 md:text-6xl">
                Få en hurtig indikation af din pension
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                Se, hvordan din pensionsopsparing kan udvikle sig frem mod
                pension, og få en foreløbig vurdering af din situation på under
                ét minut.
              </p>

              <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    Hurtigt overblik
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Få et estimat på få sekunder
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    Personlig vurdering
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Se om der kan være optimeringspotentiale
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    Uforpligtende
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Ingen binding, kun indsigt
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] md:p-8">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Gratis pensionscheck
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Beregn din pension
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Indtast dine oplysninger og få en foreløbig indikation af,
                  hvordan din opsparing kan udvikle sig.
                </p>
              </div>

              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Din alder
                  </label>
                  <input
                    type="number"
                    placeholder="Fx 35"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Forventet pensionsalder
                  </label>
                  <input
                    type="number"
                    placeholder="Fx 67"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Nuværende pensionsopsparing (kr.)
                  </label>
                  <input
                    type="number"
                    placeholder="Fx 450000"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    value={currentSavings}
                    onChange={(e) => setCurrentSavings(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Månedlig indbetaling (kr.)
                  </label>
                  <input
                    type="number"
                    placeholder="Fx 3500"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleCalculate}
                  className="mt-2 rounded-2xl bg-slate-950 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Beregn min pension
                </button>

                <p className="text-xs leading-5 text-slate-500">
                  Dette er et vejledende estimat før skat og bør ikke stå alene
                  ved større økonomiske beslutninger.
                </p>
              </div>
            </div>
          </div>

          {hasCalculated && (
            <section
              ref={resultRef}
              className="mt-14 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] md:p-8"
            >
              {!result ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                  <h2 className="text-2xl font-bold text-slate-950">
                    Udfyld felterne korrekt
                  </h2>
                  <p className="mt-2 max-w-2xl text-slate-600">
                    Tjek at alder, pensionsalder, opsparing og indbetaling er
                    udfyldt korrekt, og at pensionsalderen ligger efter din
                    nuværende alder.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Dit foreløbige resultat
                      </p>
                      <h2 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
                        Her er din estimerede pensionsprofil
                      </h2>
                    </div>

                    <div className="inline-flex w-fit items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-900">
                      {result.ratingBadge}
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
                      <p className="text-sm text-slate-500">År til pension</p>
                      <p className="mt-3 text-4xl font-bold text-slate-950">
                        {result.yearsToRetirement}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
                      <p className="text-sm text-slate-500">
                        Estimeret opsparing ved pension
                      </p>
                      <p className="mt-3 text-4xl font-bold text-slate-950">
                        {result.futureValue.toLocaleString("da-DK")} kr.
                      </p>
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
                      <p className="text-sm text-slate-500">
                        Estimeret månedlig udbetaling fra opsparing
                      </p>
                      <p className="mt-3 text-4xl font-bold text-slate-950">
                        {result.estimatedMonthlyPension.toLocaleString("da-DK")}{" "}
                        kr.
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
                    <h3 className="mb-4 text-xl font-bold text-slate-900">
                      Udvikling i din opsparing
                    </h3>

                    <p className="mb-6 text-slate-600">
                      Grafen viser et vejledende estimat af hvordan din
                      pensionsopsparing kan udvikle sig frem mod pension.
                    </p>

                    <PensionChart
                      currentSavings={Number(currentSavings)}
                      futureValue={result.futureValue}
                      yearsToRetirement={result.yearsToRetirement}
                    />

                    <div className="mt-8 rounded-2xl bg-slate-50 p-6">
                      <h3 className="mb-2 text-lg font-bold text-slate-900">
                        Kort vurdering
                      </h3>

                      <p className="leading-7 text-slate-700">
                        Din beregning viser en estimeret månedlig udbetaling fra
                        opsparing på{" "}
                        <strong>
                          {result.estimatedMonthlyPension.toLocaleString("da-DK")}{" "}
                          kr.
                        </strong>
                        . Med {result.yearsToRetirement} år til pension har du
                        stadig tid til at påvirke udviklingen i din opsparing.
                        Små ændringer i indbetaling eller investeringsprofil kan
                        over tid have betydning.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-3xl border border-slate-200 p-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Foreløbig vurdering
                      </p>
                      <h3 className="mt-3 text-3xl font-bold text-slate-950">
                        {result.rating}
                      </h3>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                        {result.ratingText}
                      </p>

                      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                        {result.teaserText}
                      </p>

                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900">
                            Indbetalinger
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Kan ofte justeres og forbedres
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900">
                            Strategi
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Risiko og sammensætning betyder noget
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900">
                            Udbetaling
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Planlægning kan påvirke fleksibiliteten
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                        Få den fulde analyse
                      </p>
                      <h4 className="mt-3 text-2xl font-bold">
                        Få din personlige vurdering sendt på mail
                      </h4>
                      <p className="mt-3 leading-7 text-slate-300">
                        Få en mere personlig vurdering af din situation samt
                        input til, hvad der kan være relevant at undersøge
                        nærmere.
                      </p>

                      <ul className="mt-5 space-y-3 text-sm text-slate-200">
                        <li>• Uddybning af dit resultat</li>
                        <li>• Vurdering af dit nuværende niveau</li>
                        <li>• Input til mulige næste skridt</li>
                      </ul>

                      <button
                        onClick={() => setShowLeadModal(true)}
                        className="mt-6 w-full rounded-2xl bg-white px-5 py-4 font-semibold text-slate-950 transition hover:bg-slate-100"
                      >
                        Få min analyse
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </section>

      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-2xl">
            {!leadSubmitted ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Personlig analyse
                    </p>
                    <h2 className="mt-2 text-3xl font-bold text-slate-950">
                      Få analysen sendt
                    </h2>
                    <p className="mt-3 text-slate-600">
                      Udfyld dine oplysninger, så sender vi din personlige
                      analyse til dig.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowLeadModal(false)}
                    className="text-2xl leading-none text-slate-400 transition hover:text-slate-700"
                    aria-label="Luk"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleLeadSubmit} className="mt-6 grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-800">
                      Dit navn
                    </label>
                    <input
                      type="text"
                      placeholder="Fx Anders"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-4 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-800">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="Fx anders@mail.dk"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-4 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-2 rounded-2xl bg-slate-950 px-5 py-4 font-semibold text-white transition hover:bg-slate-800"
                  >
                    Send min analyse
                  </button>

                  <p className="text-xs leading-5 text-slate-500">
                    Vi bruger kun dine oplysninger til at sende din analyse og
                    eventuel relevant opfølgning.
                  </p>
                </form>
              </>
            ) : (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Tak
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">
                  Din analyse er registreret
                </h2>
                <p className="mt-4 leading-7 text-slate-600">
                  Næste step er at koble rigtig mailafsendelse på, så brugeren
                  automatisk modtager analysen på mail.
                </p>

                <button
                  onClick={() => setShowLeadModal(false)}
                  className="mt-6 rounded-2xl bg-slate-950 px-5 py-4 font-semibold text-white transition hover:bg-slate-800"
                >
                  Luk
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}