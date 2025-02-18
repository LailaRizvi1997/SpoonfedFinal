"use client"

import React from "react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface ReviewDistributionChartProps {
  distribution: number[]
}

export function ReviewDistributionChart({ distribution }: ReviewDistributionChartProps) {
  // Expecting distribution to be an array of 5 numbers for ratings 1-5.
  const data = {
    labels: ["1", "2", "3", "4", "5"],
    datasets: [
      {
        label: "Number of Reviews",
        data: distribution,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  }

  const options = {
    indexAxis: "x" as const,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Review Distribution",
      },
    },
  }

  return (
    <div className="my-6">
      <Bar data={data} options={options} />
    </div>
  )
}
