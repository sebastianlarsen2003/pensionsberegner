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

function InsightCard({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <div className="rounded-[16px] border border-[#253457]/10 bg-white p-3 shadow-[0_10px_24px_rgba(23,32,51,0.04)] md:rounded-[24px] md:p-5">
      <p className="text-sm font-semibold text-[#253457]">{title}</p>
      <p className="mt-1 text-sm leading-5 text-[#5F6D84] md:mt-2 md:leading-6">
        {text}
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
                udvikle sig frem mod pension, og få en første indikation af, om
                der kan være områder, der er værd at kigge nærmere på.
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

              <div className="mt-8 grid gap-3 sm:grid-cols-3 md:mt-10 md:gap-4">
                <div className="rounded-[16px] border border-[#253457]/10 bg-white/85 p-3 shadow-[0_10px_24px_rgba(23,32,51,0.04)] backdrop-blur md:rounded-[24px] md:p-5">
                  <p className="text-sm font-semibold text-[#253457]">
                    Hurtigt overblik
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[#5F6D84] md:mt-2 md:leading-6">
                    Få et klart første estimat uden en tung proces.
                  </p>
                </div>

                <div className="rounded-[16px] border border-[#253457]/10 bg-white/85 p-3 shadow-[0_10px_24px_rgba(23,32,51,0.04)] backdrop-blur md:rounded-[24px] md:p-5">
                  <p className="text-sm font-semibold text-[#253457]">
                    Foreløbig vurdering
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[#5F6D84] md:mt-2 md:leading-6">
                    Se om der kan være optimeringspotentiale.
                  </p>
                </div>

                <div className="rounded-[16px] border border-[#253457]/10 bg-white/85 p-3 shadow-[0_10px_24px_rgba(23,32,51,0.04)] backdrop-blur md:rounded-[24px] md:p-5">
                  <p className="text-sm font-semibold text-[#253457]">
                    Tryg oplevelse
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[#5F6D84] md:mt-2 md:leading-6">
                    Et enkelt og professionelt værktøj til første afklaring.
                  </p>
                </div>
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
                    Indtast dine oplysninger og få et hurtigt, vejledende
                    overblik over din pension og mulige næste skridt.
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

                  <button
                    onClick={handleCalculate}
                    className="mt-1 rounded-2xl bg-[#253457] px-5 py-3 text-base font-semibold text-white shadow-[0_18px_40px_rgba(37,52,87,0.25)] transition hover:-translate-y-0.5 hover:bg-[#1F2C49] md:py-4"
                  >
                    Se mit estimat
                  </button>

                  <div className="rounded-2xl border border-[#253457]/8 bg-[#F8FAFD] px-4 py-3">
                    <p className="text-xs leading-5 text-[#6C7890]">
                      Beregningen er vejledende, før skat, og bør ikke stå alene
                      ved større økonomiske beslutninger.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {hasCalculated && (
            <section ref={resultRef} className="mt-10 md:mt-16">
              {!result ? (
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
                        Resultatet giver dig en første pejling på, hvordan din
                        opsparing kan udvikle sig, og om der kan være forhold,
                        der er værd at få vurderet nærmere.
                      </p>
                    </div>

                    <div className="inline-flex w-fit items-center rounded-full border border-[#4FB7E7]/20 bg-[#EFF8FD] px-4 py-2 text-sm font-semibold text-[#253457]">
                      {result.ratingBadge}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 md:mt-8 md:grid-cols-3 md:gap-5">
                    <StatCard
                      label="År til pension"
                      value={result.yearsToRetirement}
                      tone="default"
                    />
                    <StatCard
                      label="Forventet opsparing ved pension"
                      value={formatCurrency(result.futureValue)}
                      tone="primary"
                    />
                    <StatCard
                      label="Mulig månedlig udbetaling"
                      value={formatCurrency(result.estimatedMonthlyPension)}
                      tone="accent"
                    />
                  </div>

                  <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:mt-8 md:gap-6">
                    <div className="min-w-0 rounded-[22px] border border-[#253457]/10 bg-white p-4 shadow-sm md:rounded-[30px] md:p-6">
                      <div className="mb-4 md:mb-5">
                        <h3 className="text-lg font-bold text-[#253457] md:text-2xl">
                          Udvikling i din opsparing
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#5F6D84] md:text-base">
                          Her kan du se, hvor meget der forventeligt kommer fra
                          dine egne indbetalinger, hvor meget der kan komme fra
                          afkast, og hvordan det tilsammen kan udvikle sig frem
                          mod pension.
                        </p>
                      </div>

                      <div className="rounded-[18px] border border-[#253457]/8 bg-[#F8FBFE] p-2.5 md:rounded-[26px] md:p-5">
                        <PensionChart points={result.chartPoints} />
                      </div>

                      <div className="mt-4 grid gap-3 md:mt-5 md:grid-cols-3 md:gap-4">
                        <div className="rounded-[16px] border border-[#253457]/8 bg-[#F8FAFD] p-3 md:rounded-[22px] md:p-5">
                          <p className="text-sm text-[#8D95A6]">
                            Samlet indbetalt
                          </p>
                          <p className="mt-2 text-lg font-bold text-[#253457] md:text-2xl">
                            {formatCurrency(result.totalOwnContributions)}
                          </p>
                        </div>

                        <div className="rounded-[16px] border border-[#4FB7E7]/12 bg-[#EFF8FD] p-3 md:rounded-[22px] md:p-5">
                          <p className="text-sm text-[#6D7C92]">
                            Estimeret afkast
                          </p>
                          <p className="mt-2 text-lg font-bold text-[#253457] md:text-2xl">
                            {formatCurrency(result.estimatedReturn)}
                          </p>
                        </div>

                        <div className="rounded-[16px] border border-[#253457]/8 bg-[#F8FAFD] p-3 md:rounded-[22px] md:p-5">
                          <p className="text-sm text-[#8D95A6]">
                            Samlet værdi ved pension
                          </p>
                          <p className="mt-2 text-lg font-bold text-[#253457] md:text-2xl">
                            {formatCurrency(result.futureValue)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 rounded-[20px] bg-gradient-to-br from-[#253457] to-[#31456F] p-4 text-white shadow-[0_18px_40px_rgba(37,52,87,0.20)] md:rounded-[30px] md:p-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/65">
                        Kort vurdering
                      </p>

                      <h3 className="mt-2 text-xl font-bold md:mt-3 md:text-3xl">
                        {result.rating}
                      </h3>

                      <p className="mt-4 text-sm leading-7 text-white/82 md:text-base">
                        {result.ratingText}
                      </p>

                      <div className="mt-5 rounded-[18px] border border-white/12 bg-white/8 p-4 md:mt-6 md:rounded-[22px] md:p-5">
                        <p className="text-sm text-white/70">
                          Mulig månedlig udbetaling
                        </p>
                        <p className="mt-2 text-2xl font-bold md:text-3xl">
                          {formatCurrency(result.estimatedMonthlyPension)}
                        </p>
                      </div>

                      <p className="mt-5 text-sm leading-7 text-white/78 md:mt-6">
                        {result.teaserText}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr] md:mt-6 md:gap-6">
                    <div className="rounded-[22px] border border-[#253457]/10 bg-white p-4 md:rounded-[30px] md:p-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8D95A6]">
                        Hvad kan påvirke resultatet?
                      </p>

                      <h3 className="mt-3 text-2xl font-bold text-[#253457] md:text-3xl">
                        De vigtigste områder at være opmærksom på
                      </h3>

                      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5F6D84] md:text-base">
                        Din beregning viser en mulig månedlig udbetaling på{" "}
                        <strong className="text-[#253457]">
                          {formatCurrency(result.estimatedMonthlyPension)}
                        </strong>{" "}
                        samt en samlet værdi ved pension på{" "}
                        <strong className="text-[#253457]">
                          {formatCurrency(result.futureValue)}
                        </strong>
                        . Med {result.yearsToRetirement} år til pension er der
                        fortsat tid til at påvirke udviklingen, hvis du ønsker
                        at styrke din situation yderligere.
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3 md:mt-6 md:gap-4">
                        <InsightCard
                          title="Indbetalinger"
                          text="Selv mindre løft i månedlige indbetalinger kan få stor betydning over mange år."
                        />
                        <InsightCard
                          title="Strategi"
                          text="Risiko, investeringsprofil og sammensætning kan påvirke både afkast og udsving."
                        />
                        <InsightCard
                          title="Planlægning"
                          text="Tidspunkt for pension og udbetalingsplan kan have stor betydning for helheden."
                        />
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
                          "Input til mulige næste skridt",
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
                  Din vurdering er registreret
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#5F6D84] md:text-base">
                  Næste step er at koble rigtig mailafsendelse på, så brugeren
                  automatisk modtager vurderingen på mail.
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