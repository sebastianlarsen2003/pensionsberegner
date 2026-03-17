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
  Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

type ChartPoint = {
  label: string
  paidIn: number
  returns: number
  total: number
}

type PensionChartProps = {
  points: ChartPoint[]
}

function PensionChart({ points }: PensionChartProps) {
  const data = {
    labels: points.map((point) => point.label),
    datasets: [
      {
        label: "Din indbetaling",
        data: points.map((point) => point.paidIn),
        borderColor: "rgba(236, 72, 153, 0.95)",
        backgroundColor: "rgba(236, 72, 153, 0.18)",
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        stack: "combined",
      },
      {
        label: "Afkast",
        data: points.map((point) => point.returns),
        borderColor: "rgba(20, 184, 166, 0.95)",
        backgroundColor: "rgba(20, 184, 166, 0.22)",
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        stack: "combined",
      },
      {
        label: "Samlet værdi",
        data: points.map((point) => point.total),
        borderColor: "#0f172a",
        backgroundColor: "transparent",
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        order: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          boxWidth: 16,
          color: "#334155",
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${Number(
              context.parsed.y
            ).toLocaleString("da-DK")} kr.`
          },
          footer: function (tooltipItems: any) {
            const index = tooltipItems[0]?.dataIndex ?? 0
            const point = points[index]

            if (!point) return ""

            return `Samlet værdi: ${point.total.toLocaleString("da-DK")} kr.`
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          color: "#64748b",
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.15)",
        },
        ticks: {
          color: "#64748b",
          callback: function (value: any) {
            return `${Number(value).toLocaleString("da-DK")} kr.`
          },
        },
      },
    },
  }

  return (
    <div className="h-[220px] w-full md:h-[240px]">
      <Line data={data} options={options} />
    </div>
  )
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("da-DK")} kr.`
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

    let totalValue = savings
    let totalPaidIn = savings

    const checkpoints =
      yearsToRetirement <= 4
        ? Array.from({ length: yearsToRetirement + 1 }, (_, i) => i)
        : [
            0,
            Math.round(yearsToRetirement * 0.25),
            Math.round(yearsToRetirement * 0.5),
            Math.round(yearsToRetirement * 0.75),
            yearsToRetirement,
          ]

    const uniqueCheckpoints = [...new Set(checkpoints)].sort((a, b) => a - b)

    const pointMap = new Map<number, ChartPoint>()
    pointMap.set(0, {
      label: "I dag",
      paidIn: Math.round(totalPaidIn),
      returns: Math.max(0, Math.round(totalValue - totalPaidIn)),
      total: Math.round(totalValue),
    })

    for (let month = 1; month <= totalMonths; month++) {
      totalValue += monthly
      totalPaidIn += monthly
      totalValue *= 1 + monthlyReturn

      const currentYear = Math.floor(month / 12)

      if (
        month % 12 === 0 &&
        uniqueCheckpoints.includes(currentYear) &&
        !pointMap.has(currentYear)
      ) {
        pointMap.set(currentYear, {
          label:
            currentYear === yearsToRetirement
              ? "Ved pension"
              : `Om ${currentYear} år`,
          paidIn: Math.round(totalPaidIn),
          returns: Math.max(0, Math.round(totalValue - totalPaidIn)),
          total: Math.round(totalValue),
        })
      }
    }

    if (!pointMap.has(yearsToRetirement)) {
      pointMap.set(yearsToRetirement, {
        label: "Ved pension",
        paidIn: Math.round(totalPaidIn),
        returns: Math.max(0, Math.round(totalValue - totalPaidIn)),
        total: Math.round(totalValue),
      })
    }

    const chartPoints = uniqueCheckpoints
      .map((year) => pointMap.get(year))
      .filter(Boolean) as ChartPoint[]

    const futureValue = Math.round(totalValue)
    const totalOwnContributions = Math.round(totalPaidIn)
    const estimatedReturn = Math.max(
      0,
      Math.round(futureValue - totalOwnContributions)
    )
    const estimatedMonthlyPension = Math.round(futureValue / (20 * 12))

    let rating = ""
    let ratingText = ""
    let ratingBadge = ""
    let teaserText = ""

    if (estimatedMonthlyPension < 10000) {
      rating = "Lavt niveau"
      ratingBadge = "Behov for eftersyn"
      ratingText =
        "Din beregning peger på et relativt lavt niveau i forhold til den tid, der er tilbage til pension. Det kan være relevant at se nærmere på indbetalinger, investeringsstrategi og den samlede pensionsstruktur."
      teaserText =
        "Selv mindre justeringer kan over tid gøre en forskel, især når der stadig er nogle år til pension."
    } else if (estimatedMonthlyPension < 20000) {
      rating = "Fornuftigt udgangspunkt"
      ratingBadge = "Muligt optimeringspotentiale"
      ratingText =
        "Du har et fornuftigt udgangspunkt, men der kan stadig være muligheder for at forbedre din samlede pensionssituation afhængigt af dine mål, tidshorisont og risikoprofil."
      teaserText =
        "Det er ofte i denne type situation, at en gennemgang kan vise, om du er godt nok dækket ind i forhold til det pensionsliv, du ønsker."
    } else {
      rating = "Stærkt udgangspunkt"
      ratingBadge = "Ser stærkt ud"
      ratingText =
        "Din beregning ser umiddelbart stærk ud. Det kan stadig være relevant at få vurderet, om sammensætningen af din pension og din fremtidige udbetalingsplan passer til dine ønsker."
      teaserText =
        "Et stærkt niveau er ikke nødvendigvis det samme som en optimal løsning, så det kan stadig være værd at få det vurderet."
    }

    return {
      yearsToRetirement,
      futureValue,
      totalOwnContributions,
      estimatedReturn,
      estimatedMonthlyPension,
      rating,
      ratingText,
      ratingBadge,
      teaserText,
      chartPoints,
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
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
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
              className="h-auto w-[180px] md:w-[230px]"
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

        <div className="relative mx-auto max-w-7xl px-6 py-14 md:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div className="max-w-2xl pt-2 md:pt-6">
              <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-900">
                Klarhed før beslutning
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
                Få et hurtigt overblik over din pension
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                Beregn et vejledende estimat af, hvordan din pensionsopsparing
                kan udvikle sig frem mod pension, og se om der kan være områder,
                der er værd at kigge nærmere på.
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
                    Foreløbig vurdering
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
                    Kun indsigt, ingen binding
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
                  Beregn dit estimat
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Indtast dine oplysninger og få et hurtigt, vejledende overblik
                  over din pension.
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
                    Hvornår regner du med at gå på pension?
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
                    Hvor meget har du opsparet indtil nu? (kr.)
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
                    Hvor meget indbetaler du ca. om måneden? (kr.)
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
                  Se mit estimat
                </button>

                <p className="text-xs leading-5 text-slate-500">
                  Beregningen er vejledende, før skat, og bør ikke stå alene ved
                  større økonomiske beslutninger.
                </p>
              </div>
            </div>
          </div>

          {hasCalculated && (
            <section
              ref={resultRef}
              className="mt-12 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] md:mt-14 md:p-8"
            >
              {!result ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                  <h2 className="text-2xl font-bold text-slate-950">
                    Udfyld felterne korrekt
                  </h2>
                  <p className="mt-2 max-w-2xl text-slate-600">
                    Tjek at alder, pensionsalder, opsparing og månedlig
                    indbetaling er udfyldt korrekt, og at pensionsalderen ligger
                    efter din nuværende alder.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Dit foreløbige overblik
                      </p>
                      <h2 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
                        Her er dit pensionsestimat
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
                        Forventet opsparing ved pension
                      </p>
                      <p className="mt-3 text-4xl font-bold text-slate-950">
                        {formatCurrency(result.futureValue)}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
                      <p className="text-sm text-slate-500">
                        Mulig månedlig udbetaling
                      </p>
                      <p className="mt-3 text-4xl font-bold text-slate-950">
                        {formatCurrency(result.estimatedMonthlyPension)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
                    <div className="mb-5">
                      <h3 className="text-xl font-bold text-slate-900">
                        Udvikling i din opsparing
                      </h3>
                      <p className="mt-2 max-w-3xl text-slate-600">
                        Her kan du se, hvor meget der forventeligt kommer fra
                        dine egne indbetalinger, hvor meget der kan komme fra
                        afkast, og hvordan det tilsammen kan udvikle sig frem
                        mod pension.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 md:p-5">
                      <PensionChart points={result.chartPoints} />
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-5">
                        <p className="text-sm text-slate-500">
                          Samlet indbetalt
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-950">
                          {formatCurrency(result.totalOwnContributions)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-5">
                        <p className="text-sm text-slate-500">
                          Estimeret afkast
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-950">
                          {formatCurrency(result.estimatedReturn)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-5">
                        <p className="text-sm text-slate-500">
                          Samlet værdi ved pension
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-950">
                          {formatCurrency(result.futureValue)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl bg-slate-50 p-6">
                      <h3 className="text-lg font-bold text-slate-900">
                        Kort vurdering
                      </h3>

                      <p className="mt-3 leading-7 text-slate-700">
                        Din beregning viser en mulig månedlig udbetaling på{" "}
                        <strong>
                          {formatCurrency(result.estimatedMonthlyPension)}
                        </strong>{" "}
                        samt en samlet værdi ved pension på{" "}
                        <strong>{formatCurrency(result.futureValue)}</strong>.
                        Med {result.yearsToRetirement} år til pension er der
                        fortsat tid til at påvirke udviklingen, hvis du ønsker
                        at styrke din situation yderligere.
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
                            Selv små løft kan have betydning over tid
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900">
                            Strategi
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Risiko og sammensætning påvirker udviklingen
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900">
                            Planlægning
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Udbetaling og timing kan gøre en forskel
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                        Vil du have en mere personlig vurdering?
                      </p>

                      <h4 className="mt-3 text-2xl font-bold">
                        Få en uddybende vurdering sendt til dig
                      </h4>

                      <p className="mt-3 leading-7 text-slate-300">
                        Få en mere personlig vurdering af dit resultat og input
                        til, hvilke områder det kan være relevant at undersøge
                        nærmere.
                      </p>

                      <ul className="mt-5 space-y-3 text-sm text-slate-200">
                        <li>• Uddybning af dit estimat</li>
                        <li>• Vurdering af dit nuværende niveau</li>
                        <li>• Input til mulige næste skridt</li>
                      </ul>

                      <button
                        onClick={() => setShowLeadModal(true)}
                        className="mt-6 w-full rounded-2xl bg-white px-5 py-4 font-semibold text-slate-950 transition hover:bg-slate-100"
                      >
                        Få min vurdering
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
                      Personlig vurdering
                    </p>
                    <h2 className="mt-2 text-3xl font-bold text-slate-950">
                      Få vurderingen sendt
                    </h2>
                    <p className="mt-3 text-slate-600">
                      Udfyld dine oplysninger, så sender vi din personlige
                      vurdering til dig.
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
                    Send min vurdering
                  </button>

                  <p className="text-xs leading-5 text-slate-500">
                    Vi bruger kun dine oplysninger til at sende din vurdering og
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
                  Din vurdering er registreret
                </h2>
                <p className="mt-4 leading-7 text-slate-600">
                  Næste step er at koble rigtig mailafsendelse på, så brugeren
                  automatisk modtager vurderingen på mail.
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