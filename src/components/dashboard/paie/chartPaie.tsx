import { chartConfig } from "@/services/chartConfig"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function ChartPaie({ chartData }: { chartData: Array<Record<string, number | string>> }) {
    
const years = Object.keys(chartData[0] || {}).filter(k => k !== "mois")
const colors = ["#60a5fa", "#4ade80", "#facc15", "#f87171", "#a78bfa"]
    return (
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <AreaChart
            data={chartData}
            margin={{ left: 0, right: 10 }}
          >
            <defs>
              {years.map((year, i) => (
                <linearGradient key={year} id={`colorYear${year}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid vertical={false} strokeDasharray="3 3" />

            <XAxis
              dataKey="mois"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />

            <ChartLegend content={<ChartLegendContent />} />

            {years.map((year, i) => (
              <Area
                key={year}
                dataKey={year}
                name={`${year}`}
                type="natural"
                stroke={colors[i % colors.length]}
                fill={`url(#colorYear${year})`}
                stackId="a"
              />
            ))}
          </AreaChart>
        </ChartContainer>
    )
}
