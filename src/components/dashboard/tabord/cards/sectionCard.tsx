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
import { Skeleton } from "@/components/ui/skeleton"

export function SectionCards(
  { agent = {}, loading = false }: { agent?: any; loading?: boolean } = {}
) {
  return (
     <div className="flex flex-1 flex-col gap-4 p-4">
      { loading && 
        <div className="flex *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid auto-rows-min gap-4 md:grid-cols-2 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 w-full">
      <Skeleton className="h-[200px] w-[100%] " /><Skeleton className="h-[200px] w-[100%] " />
      <Skeleton className="h-[200px] w-[100%] " /><Skeleton className="h-[200px] w-[100%] " />
      </div>}
    
      { !loading && 
       <div className="flex *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid auto-rows-min gap-4 md:grid-cols-2 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 w-full">
      
      <Card className="@container/card dashboard-stat-card dashboard-stat-tone-blue py-4">
        <CardHeader className="gap-1 px-4 pb-2">
          <CardDescription className="dashboard-stat-title">Total Users</CardDescription>
          <CardTitle className="dashboard-stat-value text-2xl tabular-nums @[250px]/card:text-3xl">
            {agent.nbreUsers || 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              50% salarié
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
      <Card className="@container/card dashboard-stat-card dashboard-stat-tone-sky py-4">
        <CardHeader className="gap-1 px-4 pb-2">
          <CardDescription className="dashboard-stat-title">Agents</CardDescription>
          <CardTitle className="dashboard-stat-value text-2xl tabular-nums @[250px]/card:text-3xl">
              {agent.nbreAgent || 0}
          </CardTitle>
          {/* <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction> */}
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
      <Card className="@container/card dashboard-stat-card dashboard-stat-tone-soft py-4">
        <CardHeader className="gap-1 px-4 pb-2">
          <CardDescription className="dashboard-stat-title">affectations</CardDescription>
          <CardTitle className="dashboard-stat-value text-2xl tabular-nums @[250px]/card:text-3xl">
            0
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
      </Card>
      <Card className="@container/card dashboard-stat-card dashboard-stat-tone-red py-4">
        <CardHeader className="gap-1 px-4 pb-2">
          <CardDescription className="dashboard-stat-title">Compte crée</CardDescription>
          <CardTitle className="dashboard-stat-value text-2xl tabular-nums @[250px]/card:text-3xl">
             {agent.nbreCompte || 0}
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
      </Card>
    </div>}
      
     </div>
   
  )
}

