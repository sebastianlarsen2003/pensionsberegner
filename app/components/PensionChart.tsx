"use client"

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

export default function PensionChart({
  currentSavings,
  futureValue,
}: any) {

  const data = {
    labels: ["I dag", "5 år", "10 år", "Ved pension"],
    datasets: [
      {
        label: "Opsparing",
        data: [
          currentSavings,
          currentSavings * 1.5,
          currentSavings * 2,
          futureValue
        ],
        borderColor: "#1e293b",
        borderWidth: 3,
        tension: 0.35
      }
    ]
  }

  return <Line data={data} />
}