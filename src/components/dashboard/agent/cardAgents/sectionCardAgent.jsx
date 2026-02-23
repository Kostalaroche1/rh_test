import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SectionCardAgents() {
  return (
      <div className="flex *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid auto-rows-min gap-4 md:grid-cols-2 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 w-full">
      <Card className="@container/card dashboard-stat-card dashboard-stat-tone-soft py-4">
        <CardHeader className="gap-1 px-4 pb-2">
          <CardDescription className="dashboard-stat-title">Anciennété</CardDescription>
          <CardTitle className="dashboard-stat-value text-2xl tabular-nums @[250px]/card:text-3xl">
            10ans
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Contactuelle
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card dashboard-stat-card dashboard-stat-tone-blue py-4">
        <CardHeader className="gap-1 px-4 pb-2">
          <CardDescription className="dashboard-stat-title">Affectations</CardDescription>
          <CardTitle className="dashboard-stat-value text-2xl tabular-nums @[250px]/card:text-3xl">
            Ressources Humaines
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down 20% this period <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Acquisition needs attention
          </div>
        </CardFooter>
      </Card>
      {/* <Card className="@container/card">
        <CardHeader className="gap-1 px-4 pb-2">
          <CardDescription className="dashboard-stat-title">Affectations</CardDescription>
          <CardTitle className="dashboard-stat-value text-2xl tabular-nums @[250px]/card:text-3xl">
            45
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Engagement exceed targets</div>
        </CardFooter>
      </Card> */}
      {/* <Card className="@container/card">
        <CardHeader className="gap-1 px-4 pb-2">
          <CardDescription>Compte crée</CardDescription>
          <CardTitle className="dashboard-stat-value text-2xl tabular-nums @[250px]/card:text-3xl">
            450
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +10
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady performance increase <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Meets growth projections</div>
        </CardFooter>
      </Card> */}
    </div>
   
  )
}


