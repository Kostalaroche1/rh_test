"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const chartData = [
  { date: "2024-04-01", matadi: 222, kinshasa: 150 },
  { date: "2024-04-02", matadi: 97, kinshasa: 180 },
  { date: "2024-04-03", matadi: 167, kinshasa: 120 },
  { date: "2024-04-04", matadi: 242, kinshasa: 260 },
  { date: "2024-04-05", matadi: 373, kinshasa: 290 },
  { date: "2024-04-06", matadi: 301, kinshasa: 340 },
  { date: "2024-04-07", matadi: 245, kinshasa: 180 },
  { date: "2024-04-08", matadi: 409, kinshasa: 320 },
  { date: "2024-04-09", matadi: 59, kinshasa: 110 },
  { date: "2024-04-10", matadi: 261, kinshasa: 190 },
  { date: "2024-04-11", matadi: 327, kinshasa: 350 },
  { date: "2024-04-12", matadi: 292, kinshasa: 210 },
  { date: "2024-04-13", matadi: 342, kinshasa: 380 },
  { date: "2024-04-14", matadi: 137, kinshasa: 220 },
  { date: "2024-04-15", matadi: 120, kinshasa: 170 },
  { date: "2024-04-16", matadi: 138, kinshasa: 190 },
  { date: "2024-04-17", matadi: 446, kinshasa: 360 },
  { date: "2024-04-18", matadi: 364, kinshasa: 410 },
  { date: "2024-04-19", matadi: 243, kinshasa: 180 },
  { date: "2024-04-20", matadi: 89, kinshasa: 150 },
  { date: "2024-04-21", matadi: 137, kinshasa: 200 },
  { date: "2024-04-22", matadi: 224, kinshasa: 170 },
  { date: "2024-04-23", matadi: 138, kinshasa: 230 },
  { date: "2024-04-24", matadi: 387, kinshasa: 290 },
  { date: "2024-04-25", matadi: 215, kinshasa: 250 },
  { date: "2024-04-26", matadi: 75, kinshasa: 130 },
  { date: "2024-04-27", matadi: 383, kinshasa: 420 },
  { date: "2024-04-28", matadi: 122, kinshasa: 180 },
  { date: "2024-04-29", matadi: 315, kinshasa: 240 },
  { date: "2024-04-30", matadi: 454, kinshasa: 380 },
  { date: "2024-05-01", matadi: 165, kinshasa: 220 },
  { date: "2024-05-02", matadi: 293, kinshasa: 310 },
  { date: "2024-05-03", matadi: 247, kinshasa: 190 },
  { date: "2024-05-04", matadi: 385, kinshasa: 420 },
  { date: "2024-05-05", matadi: 481, kinshasa: 390 },
  { date: "2024-05-06", matadi: 498, kinshasa: 520 },
  { date: "2024-05-07", matadi: 388, kinshasa: 300 },
  { date: "2024-05-08", matadi: 149, kinshasa: 210 },
  { date: "2024-05-09", matadi: 227, kinshasa: 180 },
  { date: "2024-05-10", matadi: 293, kinshasa: 330 },
  { date: "2024-05-11", matadi: 335, kinshasa: 270 },
  { date: "2024-05-12", matadi: 197, kinshasa: 240 },
  { date: "2024-05-13", matadi: 197, kinshasa: 160 },
  { date: "2024-05-14", matadi: 448, kinshasa: 490 },
  { date: "2024-05-15", matadi: 473, kinshasa: 380 },
  { date: "2024-05-16", matadi: 338, kinshasa: 400 },
  { date: "2024-05-17", matadi: 499, kinshasa: 420 },
  { date: "2024-05-18", matadi: 315, kinshasa: 350 },
  { date: "2024-05-19", matadi: 235, kinshasa: 180 },
  { date: "2024-05-20", matadi: 177, kinshasa: 230 },
  { date: "2024-05-21", matadi: 82, kinshasa: 140 },
  { date: "2024-05-22", matadi: 81, kinshasa: 120 },
  { date: "2024-05-23", matadi: 252, kinshasa: 290 },
  { date: "2024-05-24", matadi: 294, kinshasa: 220 },
  { date: "2024-05-25", matadi: 201, kinshasa: 250 },
  { date: "2024-05-26", matadi: 213, kinshasa: 170 },
  { date: "2024-05-27", matadi: 420, kinshasa: 460 },
  { date: "2024-05-28", matadi: 233, kinshasa: 190 },
  { date: "2024-05-29", matadi: 78, kinshasa: 130 },
  { date: "2024-05-30", matadi: 340, kinshasa: 280 },
  { date: "2024-05-31", matadi: 178, kinshasa: 230 },
  { date: "2024-06-01", matadi: 178, kinshasa: 200 },
  { date: "2024-06-02", matadi: 470, kinshasa: 410 },
  { date: "2024-06-03", matadi: 103, kinshasa: 160 },
  { date: "2024-06-04", matadi: 439, kinshasa: 380 },
  { date: "2024-06-05", matadi: 88, kinshasa: 140 },
  { date: "2024-06-06", matadi: 294, kinshasa: 250 },
  { date: "2024-06-07", matadi: 323, kinshasa: 370 },
  { date: "2024-06-08", matadi: 385, kinshasa: 320 },
  { date: "2024-06-09", matadi: 438, kinshasa: 480 },
  { date: "2024-06-10", matadi: 155, kinshasa: 200 },
  { date: "2024-06-11", matadi: 92, kinshasa: 150 },
  { date: "2024-06-12", matadi: 492, kinshasa: 420 },
  { date: "2024-06-13", matadi: 81, kinshasa: 130 },
  { date: "2024-06-14", matadi: 426, kinshasa: 380 },
  { date: "2024-06-15", matadi: 307, kinshasa: 350 },
  { date: "2024-06-16", matadi: 371, kinshasa: 310 },
  { date: "2024-06-17", matadi: 475, kinshasa: 520 },
  { date: "2024-06-18", matadi: 107, kinshasa: 170 },
  { date: "2024-06-19", matadi: 341, kinshasa: 290 },
  { date: "2024-06-20", matadi: 408, kinshasa: 450 },
  { date: "2024-06-21", matadi: 169, kinshasa: 210 },
  { date: "2024-06-22", matadi: 317, kinshasa: 270 },
  { date: "2024-06-23", matadi: 480, kinshasa: 530 },
  { date: "2024-06-24", matadi: 132, kinshasa: 180 },
  { date: "2024-06-25", matadi: 141, kinshasa: 190 },
  { date: "2024-06-26", matadi: 434, kinshasa: 380 },
  { date: "2024-06-27", matadi: 448, kinshasa: 490 },
  { date: "2024-06-28", matadi: 149, kinshasa: 200 },
  { date: "2024-06-29", matadi: 103, kinshasa: 160 },
  { date: "2024-06-30", matadi: 446, kinshasa: 400 },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  matadi: {
    label: "matadi",
    color: "var(--primary)",
  },
  kinshasa: {
    label: "kinshasa",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAdmin() {
  const iskinshasa = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (iskinshasa) {
      setTimeRange("7d")
    }
  }, [iskinshasa])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total utilisateurs</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total utilisateurs 
          </span>
          <span className="@[540px]/card:hidden">3 derniers mois</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">3 derniers mois</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 derniers jours</ToggleGroupItem>
            <ToggleGroupItem value="7d">3 dernieres années</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillmatadi" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-matadi)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-matadi)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillkinshasa" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-kinshasa)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-kinshasa)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="kinshasa"
              type="monotoneY"
              fill="url(#fillkinshasa)"
              stroke="var(--color-kinshasa)"
              stackId="a"
            />
            <Area
              dataKey="matadi"
              type="monotoneY"
              fill="url(#fillmatadi)"
              stroke="var(--color-matadi)"
              stackId="a"
            />
            
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
