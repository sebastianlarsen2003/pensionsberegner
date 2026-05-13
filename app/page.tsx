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

type SimulationResult = {
  yearsToRetirement: number
  futureValue: number
  totalOwnContributions: number
  estimatedReturn: number
  estimatedMonthlyPension: number
  chartPoints: ChartPoint[]
  rating: string
  ratingText: string
  ratingBadge: string
  teaserText: string
}

const BRAND = {
  navy: "#253457",
  cyan: "#4FB7E7",
  slate: "#8D95A6",
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("da-DK")} kr.`
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
    totalValue += monthlyContribution
    totalPaidIn += monthlyContribution
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
    chartPoints,
    rating,
    ratingText,
    ratingBadge,
    teaserText,
  }
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string | number
  tone?: "default" | "primary" | "accent"
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] border p-4 shadow-[0_10px_24px_rgba(23,32,51,0.05)] md:rounded-[28px] md:p-6",
        tone === "primary" &&
          "border-[#253457]/10 bg-gradient-to-br from-[#253457] to-[#31456F] text-white",
        tone === "accent" &&
          "border-[#4FB7E7]/20 bg-gradient-to-br from-[#EFF8FD] to-white text-[#253457]",
        tone === "default" && "border-[#253457]/10 bg-white text-[#253457]"
      )}
    >
      <p
        className={cn(
          "text-sm",
          tone === "primary" ? "text-white/75" : "text-[#8D95A6]"
        )}
      >
        {label}
      </p>
      <p className="mt-2 text-xl font-bold leading-tight md:mt-3 md:text-4xl">
        {value}
      </p>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#253457]">
        {label}
      </label>
      <input
        type="number"
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#253457]/12 bg-white px-4 py-3 text-[#253457] outline-none transition placeholder:text-[#8D95A6] focus:border-[#4FB7E7] focus:ring-4 focus:ring-[#4FB7E7]/15 md:py-4"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function OptionPill({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-2 text-sm font-medium transition",
        active
          ? "border-[#253457] bg-[#253457] text-white"
          : "border-[#253457]/10 bg-white text-[#5F6D84] hover:border-[#253457]/25"
      )}
    >
      {label}
    </button>
  )
}

function PensionChart({ points }: PensionChartProps) {
  const data = {
    labels: points.map((point) => point.label),
    datasets: [
      {
        label: "Din indbetaling",
        data: points.map((point) => point.paidIn),
        borderColor: "rgba(37, 52, 87, 0.95)",
        backgroundColor: "rgba(37, 52, 87, 0.14)",
        borderWidth: 2,
        tension: 0.38,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        stack: "combined",
      },
      {
        label: "Afkast",
        data: points.map((point) => point.returns),
        borderColor: "rgba(79, 183, 231, 0.95)",
        backgroundColor: "rgba(79, 183, 231, 0.22)",
        borderWidth: 2,
        tension: 0.38,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        stack: "combined",
      },
      {
        label: "Samlet værdi",
        data: points.map((point) => point.total),
        borderColor: BRAND.navy,
        backgroundColor: "transparent",
        borderWidth: 3,
        tension: 0.38,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: BRAND.navy,
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
          boxWidth: 12,
          color: BRAND.navy,
          usePointStyle: true,
          pointStyle: "circle" as const,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(23, 32, 51, 0.96)",
        padding: 12,
        titleColor: "#ffffff",
        bodyColor: "#EAF2F8",
        footerColor: "#EAF2F8",
        displayColors: true,
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
          color: BRAND.slate,
          maxRotation: 0,
          autoSkip: false,
          font: {
            size: 11,
          },
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: "rgba(37, 52, 87, 0.10)",
        },
        ticks: {
          color: BRAND.slate,
          font: {
            size: 11,
          },
          callback: function (value: any) {
            return `${Number(value).toLocaleString("da-DK")} kr.`
          },
        },
      },
    },
  }

  return (
    <div className="h-[190px] w-full md:h-[300px]">
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

  const [costSaving, setCostSaving] = useState<0.5 | 0.75 | 1>(0.5)

  const [showLeadModal, setShowLeadModal] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  const resultRef = useRef<HTMLElement>(null)

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

    const improvedAnnualReturn = baselineReturn + costSaving / 100

    const improved = calculatePensionScenario({
      age: currentAge,
      retirementAge: pensionAge,
      currentSavings: savings,
      monthlyContribution: monthly,
      annualReturn: improvedAnnualReturn,
    })

    if (!improved) return null

    const returnDifference = improved.estimatedReturn - baseline.estimatedReturn

    const comparisonLabel = `Hvis vi kan spare dig for ${String(costSaving).replace(
      ".",
      ","
    )}% i omkostninger`

    return {
      baseline,
      improved,
      returnDifference,
      comparisonLabel,
    }
  }, [age, retirementAge, currentSavings, monthlyContribution, costSaving])

  const handleCalculate = () => {
    setHasCalculated(true)

    setTimeout(() => {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 150)
  }

const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()

  if (!name || !email || !results) return

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

extraValue: `${Math.round(
  results.returnDifference
).toLocaleString("da-DK")} DKK`,

baselineValue: `${Math.round(
  results.baseline.futureValue
).toLocaleString("da-DK")} DKK`,

improvedValue: `${Math.round(
  results.improved.futureValue
).toLocaleString("da-DK")} DKK`,
  }),
})
  if (response.ok) {
    setLeadSubmitted(true)
  } else {
    alert("Fejl ved afsendelse")
  }
}

  return (
    <main className="min-h-screen bg-[#F4F7FB] text-[#253457]">
      <header className="sticky top-0 z-40 border-b border-[#253457]/8 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
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
              className="h-auto w-[160px] md:w-[220px]"
            />
          </a>

          <div className="hidden items-center gap-3 md:flex">
            {["Gratis pensionscheck", "Under 1 minut", "Uforpligtende"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#253457]/10 bg-white px-4 py-2 text-sm font-medium text-[#5F6D84] shadow-sm"
                >
                  {item}
                </span>
              )
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,183,231,0.18),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(37,52,87,0.12),transparent_22%),linear-gradient(to_bottom,#F8FBFE,#F4F7FB)]" />
        <div className="absolute left-[-120px] top-24 h-72 w-72 rounded-full bg-[#4FB7E7]/10 blur-3xl" />
        <div className="absolute right-[-100px] top-14 h-72 w-72 rounded-full bg-[#253457]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 md:px-6 md:pb-20 md:pt-20">
          <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div className="max-w-xl pt-2 md:max-w-2xl md:pt-8">
              <div className="inline-flex items-center rounded-full border border-[#4FB7E7]/25 bg-white/80 px-4 py-2 text-sm font-semibold text-[#253457] shadow-sm backdrop-blur">
                Klarhed før beslutning
              </div>

              <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-[#253457] md:text-5xl lg:text-6xl">
                Få et hurtigt overblik over din pension
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-[#5F6D84] md:text-lg md:leading-8">
                Beregn et vejledende estimat af, hvordan din opsparing kan
                udvikle sig frem mod pension, og se hvad det kan betyde, hvis
                omkostningerne sænkes.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5 md:mt-8 md:gap-3">
                {[
                  "Vejledende estimat",
                  "Første overblik",
                  "Ingen binding",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-full border border-[#253457]/10 bg-white/80 px-3.5 py-2 text-sm text-[#5F6D84] shadow-sm backdrop-blur md:px-4"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-3 rounded-[34px] bg-gradient-to-br from-[#4FB7E7]/18 via-white to-[#253457]/10 blur-2xl" />
              <div className="relative rounded-[22px] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_rgba(23,32,51,0.12)] backdrop-blur md:rounded-[30px] md:p-7">
                <div className="mb-5 md:mb-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8D95A6]">
                    Gratis pensionscheck
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-[#253457] md:text-3xl">
                    Beregn dit estimat
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-[#5F6D84]">
                    Udfyld dine oplysninger og vælg, hvor meget du vil sammenligne
                    på omkostninger.
                  </p>
                </div>

                <div className="grid gap-4 md:gap-5">
                  <InputField
                    label="Din alder"
                    value={age}
                    onChange={setAge}
                    placeholder="Fx 35"
                  />

                  <InputField
                    label="Hvornår regner du med at gå på pension?"
                    value={retirementAge}
                    onChange={setRetirementAge}
                    placeholder="Fx 67"
                  />

                  <InputField
                    label="Hvor meget har du opsparet indtil nu? (kr.)"
                    value={currentSavings}
                    onChange={setCurrentSavings}
                    placeholder="Fx 450000"
                  />

                  <InputField
                    label="Hvor meget indbetaler du ca. om måneden? (kr.)"
                    value={monthlyContribution}
                    onChange={setMonthlyContribution}
                    placeholder="Fx 3500"
                  />

                  <div className="rounded-[18px] border border-[#253457]/10 bg-[#F8FAFD] p-4">
                    <p className="text-sm font-semibold text-[#253457]">
                      Hvad vil det betyde, hvis vi kan spare dig for:
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <OptionPill
                        active={costSaving === 0.5}
                        label="0,5%"
                        onClick={() => setCostSaving(0.5)}
                      />
                      <OptionPill
                        active={costSaving === 0.75}
                        label="0,75%"
                        onClick={() => setCostSaving(0.75)}
                      />
                      <OptionPill
                        active={costSaving === 1}
                        label="1%"
                        onClick={() => setCostSaving(1)}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCalculate}
                    className="mt-1 rounded-2xl bg-[#253457] px-5 py-3 text-base font-semibold text-white shadow-[0_18px_40px_rgba(37,52,87,0.25)] transition hover:-translate-y-0.5 hover:bg-[#1F2C49] md:py-4"
                  >
                    Se mit estimat
                  </button>

                  <div className="rounded-2xl border border-[#253457]/8 bg-[#F8FAFD] px-4 py-3">
                    <p className="text-xs leading-5 text-[#6C7890]">
                      Beregningen er vejledende, før skat, og viser forenklede
                      scenarier baseret på fast afkast.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {hasCalculated && (
            <section ref={resultRef} className="mt-10 md:mt-16">
              {!results ? (
                <div className="rounded-[28px] border border-amber-200 bg-white p-5 shadow-[0_16px_50px_rgba(23,32,51,0.06)] md:rounded-[30px] md:p-8">
                  <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-5 md:rounded-[24px] md:p-6">
                    <h2 className="text-2xl font-bold text-[#253457]">
                      Udfyld felterne korrekt
                    </h2>
                    <p className="mt-2 max-w-2xl leading-7 text-[#5F6D84]">
                      Tjek at alder, pensionsalder, opsparing og månedlig
                      indbetaling er udfyldt korrekt, og at pensionsalderen
                      ligger efter din nuværende alder.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-[24px] border border-[#253457]/10 bg-white p-4 shadow-[0_24px_80px_rgba(23,32,51,0.08)] md:rounded-[34px] md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-5">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8D95A6]">
                          Dit foreløbige overblik
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-[#253457] md:text-4xl lg:text-5xl">
                          Her er dit pensionsestimat
                        </h2>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F6D84] md:text-base md:leading-7">
                          Først ser du din nuværende fremskrivning. Derefter ser
                          du et muligt forbedret scenarie ved lavere omkostninger.
                        </p>
                      </div>

                      <div className="inline-flex w-fit items-center rounded-full border border-[#4FB7E7]/20 bg-[#EFF8FD] px-4 py-2 text-sm font-semibold text-[#253457]">
                        {results.baseline.ratingBadge}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2 md:gap-5">
                      <div className="rounded-[20px] border border-[#253457]/10 bg-white p-4 md:rounded-[28px] md:p-6">
                        <p className="text-sm font-semibold text-[#253457]">
                          Sådan ser det ud nu
                        </p>

                        <div className="mt-4 rounded-[18px] border border-[#253457]/10 bg-gradient-to-br from-[#253457] to-[#31456F] p-4 text-white md:rounded-[28px] md:p-6">
                          <p className="text-sm text-white/75">
                            Forventet opsparing ved pension
                          </p>
                          <p className="mt-2 text-xl font-bold md:mt-3 md:text-4xl">
                            {formatCurrency(results.baseline.futureValue)}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-[#4FB7E7]/20 bg-[#EFF8FD] p-4 md:rounded-[28px] md:p-6">
                        <p className="text-sm font-semibold text-[#253457]">
                          {results.comparisonLabel}
                        </p>

                        <div className="mt-4 rounded-[18px] border border-[#253457]/10 bg-gradient-to-br from-[#253457] to-[#31456F] p-4 text-white md:rounded-[28px] md:p-6">
                          <p className="text-sm text-white/75">
                            Forventet opsparing ved pension
                          </p>
                          <p className="mt-2 text-xl font-bold md:mt-3 md:text-4xl">
                            {formatCurrency(results.improved.futureValue)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 md:mt-8">
                      <StatCard
                        label="Mulig ekstra værdi fra afkast"
                        value={formatCurrency(results.returnDifference)}
                        tone="primary"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-6">
                    <div className="min-w-0 rounded-[22px] border border-[#253457]/10 bg-white p-4 shadow-sm md:rounded-[30px] md:p-6">
                      <div className="mb-4 md:mb-5">
                        <h3 className="text-lg font-bold text-[#253457] md:text-2xl">
                          Udvikling i din opsparing
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#5F6D84] md:text-base">
                          Grafen viser din nuværende fremskrivning. Den bygger på
                          dine egne indbetalinger og et vejledende afkast på 5%.
                        </p>
                      </div>

                      <div className="rounded-[18px] border border-[#253457]/8 bg-[#F8FBFE] p-2.5 md:rounded-[26px] md:p-5">
                        <PensionChart points={results.baseline.chartPoints} />
                      </div>

                      <div className="mt-4 grid gap-3 md:mt-5 md:grid-cols-3 md:gap-4">
                        <div className="rounded-[16px] border border-[#253457]/8 bg-[#F8FAFD] p-3 md:rounded-[22px] md:p-5">
                          <p className="text-sm text-[#8D95A6]">
                            Samlet indbetalt
                          </p>
                          <p className="mt-2 text-lg font-bold text-[#253457] md:text-2xl">
                            {formatCurrency(results.baseline.totalOwnContributions)}
                          </p>
                        </div>

                        <div className="rounded-[16px] border border-[#4FB7E7]/12 bg-[#EFF8FD] p-3 md:rounded-[22px] md:p-5">
                          <p className="text-sm text-[#6D7C92]">
                            Estimeret afkast
                          </p>
                          <p className="mt-2 text-lg font-bold text-[#253457] md:text-2xl">
                            {formatCurrency(results.baseline.estimatedReturn)}
                          </p>
                        </div>

                        <div className="rounded-[16px] border border-[#253457]/8 bg-[#F8FAFD] p-3 md:rounded-[22px] md:p-5">
                          <p className="text-sm text-[#8D95A6]">
                            Samlet værdi ved pension
                          </p>
                          <p className="mt-2 text-lg font-bold text-[#253457] md:text-2xl">
                            {formatCurrency(results.baseline.futureValue)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-[#253457]/10 bg-[#F8FBFE] p-4 md:rounded-[30px] md:p-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8D95A6]">
                        Næste skridt
                      </p>

                      <h4 className="mt-3 text-2xl font-bold text-[#253457]">
                        Få en mere personlig vurdering sendt til dig
                      </h4>

                      <p className="mt-3 text-sm leading-7 text-[#5F6D84] md:text-base">
                        Modtag en kort og mere personlig vurdering af dit
                        resultat samt input til, hvilke områder det kan være
                        relevant at undersøge nærmere.
                      </p>

                      <div className="mt-5 space-y-3">
                        {[
                          "Uddybning af dit estimat",
                          "Vurdering af dit nuværende niveau",
                          "Perspektiv på mulige forbedringer",
                        ].map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 rounded-[16px] border border-[#253457]/8 bg-white px-3 py-2.5 md:rounded-2xl md:px-4 md:py-3"
                          >
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4FB7E7]/15 text-sm font-bold text-[#253457]">
                              ✓
                            </div>
                            <span className="text-sm font-medium text-[#253457]">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setShowLeadModal(true)}
                        className="mt-6 w-full rounded-2xl bg-[#253457] px-5 py-3 font-semibold text-white shadow-[0_18px_40px_rgba(37,52,87,0.20)] transition hover:-translate-y-0.5 hover:bg-[#1F2C49] md:py-4"
                      >
                        Få min vurdering
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </section>

      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172033]/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_24px_80px_rgba(23,32,51,0.22)] md:rounded-[32px] md:p-7">
            {!leadSubmitted ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8D95A6]">
                      Personlig vurdering
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-[#253457] md:text-3xl">
                      Få vurderingen sendt
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[#5F6D84] md:text-base">
                      Udfyld dine oplysninger, så sender vi din personlige
                      vurdering til dig.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowLeadModal(false)}
                    className="text-2xl leading-none text-[#8D95A6] transition hover:text-[#253457]"
                    aria-label="Luk"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleLeadSubmit} className="mt-6 grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#253457]">
                      Dit navn
                    </label>
                    <input
                      type="text"
                      placeholder="Fx Anders"
                      className="w-full rounded-2xl border border-[#253457]/12 bg-white px-4 py-3 text-[#253457] outline-none transition placeholder:text-[#8D95A6] focus:border-[#4FB7E7] focus:ring-4 focus:ring-[#4FB7E7]/15 md:py-4"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#253457]">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="Fx anders@mail.dk"
                      className="w-full rounded-2xl border border-[#253457]/12 bg-white px-4 py-3 text-[#253457] outline-none transition placeholder:text-[#8D95A6] focus:border-[#4FB7E7] focus:ring-4 focus:ring-[#4FB7E7]/15 md:py-4"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-2 rounded-2xl bg-[#253457] px-5 py-3 font-semibold text-white transition hover:bg-[#1F2C49] md:py-4"
                  >
                    Send min vurdering
                  </button>

                  <p className="text-xs leading-5 text-[#6C7890]">
                    Vi bruger kun dine oplysninger til at sende din vurdering og
                    eventuel relevant opfølgning.
                  </p>
                </form>
              </>
            ) : (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8D95A6]">
                  Tak
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#253457] md:text-3xl">
                  Din vurdering er sendt
                </h2>
<p className="mt-4 text-sm leading-7 text-[#5F6D84] md:text-base">
  Din vurdering er sendt til din mail. Tjek gerne din indbakke og eventuelt din spam-mappe.
</p>

                <button
                  onClick={() => {
                    setShowLeadModal(false)
                    setLeadSubmitted(false)
                  }}
                  className="mt-6 rounded-2xl bg-[#253457] px-5 py-3 font-semibold text-white transition hover:bg-[#1F2C49] md:py-4"
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