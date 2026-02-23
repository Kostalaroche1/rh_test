"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import AddAgentModale from "../../agent/createByAdmin/AddAgentModale"
import { User } from "@/utilities/type"
import AddUserModale from "../../utilisateurs/userAdmin/addUser"
import { CreateUserAccount } from "../../agent/create/compteAgent/createCompte"
import { CreateAgentWithAccount } from "../../agent/create/compteAgent/createAgentwithCompte"
import { AddAgentWithAccount, deleteAgent } from "@/app/action/agent/action"
import { ModifierAgentCompte } from "../../agent/modifier/ModifAgentCompte"
import { QueryObserverResult } from "@tanstack/react-query"
import { useDelete, useGet, usePost } from "@/hooks/useApi"
import { RoleTabs } from "./roleTabs"
import { GetRole } from "@/app/action/role/action"
import { useAgents } from "@/app/contexts/agents/context"
import { SignalerAbsence } from "@/app/action/agent/presence/signalerAbsence/action"

export const agentSchema = z.object({
  id: z.number(),
  matricule: z.string(),
  nom: z.string(),
  prenom: z.string(),
  email: z.string().email(),
  role: z.enum(["ADMIN", "SUPERVISEUR", "AGENT"]),
  statut: z.enum(["ACTIF", "INACTIF"]),
  hasAccount: z.boolean(),
})
export const agentSchema1 = z.object({
  id: z.number(),
  login: z.string(),
  actif: z.boolean(),
  compteAgent: z.object({
    agentId: z.number(),
    liePar: z.number(),
    utilisateurId: z.number(),
    agent: z.object({
      id: z.number(),
      matricule: z.string(),
      nom: z.string(),
      prenom: z.string(),
      email: z.string().email(),
      role: z.enum(["ADMIN", "SUPERVISEUR", "AGENT"])
    }),
  }),
  role: z.enum(["ADMIN", "SUPERVISEUR", "AGENT"]),
  statut: z.enum(["ACTIF", "INACTIF"]),
  hasAccount: z.boolean(),
})
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7"
    >
      <IconGripVertical className="size-4" />
    </Button>
  )
}
const columns: ColumnDef<z.infer<typeof agentSchema1>>[] = [
  {
    id: "drag",
    header: "",
    cell: ({ row }) => <DragHandle id={row.original.compteAgent?.agent?.id} />,
  },
  {
    accessorKey: "matricule",
    header: "Matricule",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.original.compteAgent?.agent?.matricule}
          
        {/* <TableCellViewer item={row.original} /> */}
        </div>
      </div>
    ),
  },
  {
    id: "identite",
    header: "Identité",
    cell: ({ row }) => (
      <div>
        <div className="font-small">

          {row.original.compteAgent?.agent?.prenom} {row.original.compteAgent?.agent?.nom}
        </div>
        <div className="text-xs text-muted-foreground">
          {row.original.login}
        </div>
      </div>
    ),
  },
  // {
  //   accessorKey: "role",
  //   header: "Rôle",
  //   cell: ({ row }) => (
  //     <Select
  //       defaultValue={row.original.role}
  //       onValueChange={(value) =>
  //         console.log("update role", row.original.id, value)
  //       }
  //     >
  //       <SelectTrigger className="w-[150px]" size="sm">
  //         <SelectValue />
  //       </SelectTrigger>
  //       <SelectContent>
  //         <SelectItem value="ADMIN">Admin</SelectItem>
  //         <SelectItem value="SUPERVISEUR">Superviseur</SelectItem>
  //         <SelectItem value="AGENT">Agent</SelectItem>
  //       </SelectContent>
  //     </Select>
  //   ),
  // },
  {
    accessorKey: "statut",
    header: "Statut",
    cell: ({ row }) => (
      <Badge variant={row.original.actif ? "default" : "secondary"}>
        {row.original.actif ? "actif" : "inactif"}
      </Badge>
    ),
  },
  {
    accessorKey: "hasAccount",
    header: "Compte",
    cell: ({ row }) =>
      row.original.actif ===true ? (
        <Badge variant="default">Actif</Badge>
      ) : (
        <Badge variant="outline">Aucun</Badge>
      ),
  },
  {
    id: "actions",
    header: "Actions",
     cell: ({ row }) => {
  const [activeModal, setActiveModal] =
    React.useState<"CREATE_ACCOUNT" | "EDIT_AGENT" | null>(null)

  const { mutateAsync } = useDelete(deleteAgent)
  const {mutateAsync : SignalerAbsences , isPending : isPendingSignalerAbsence} = usePost(SignalerAbsence)
  const {refresh} = useAgents()

  return (
    <>
      <DropdownMenu >
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <IconDotsVertical />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {!row.original.compteAgent && (
            <DropdownMenuItem
              onClick={() => setActiveModal("CREATE_ACCOUNT")}
            >
              Créer un compte
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => setActiveModal("EDIT_AGENT")}
          >
            Modifier
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-secondary"
            disabled={isPendingSignalerAbsence}
            onClick={async () => {
              try{
                const responses = await SignalerAbsences({ agentId: row.original.compteAgent?.agent?.id  })
                toast.success(responses.status ===200 ? responses.message : responses.message)
              }catch(error : any){
                    toast.error(error)
              }
            }}
          >
            Signaler Absence
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-destructive"
            onClick={async () => {
              try{
                const responses = await mutateAsync({ id: row.original.id, nom: row.original.compteAgent?.agent?.nom ?? "", prenom: row.original.compteAgent?.agent?.prenom ?? "", statut: row.original.statut ?? "", role: row.original.role ?? "", agentId: row.original.compteAgent?.agentId, utilisateurId: row.original.compteAgent?.utilisateurId, email: row.original.login, })
                // console.log(responses , "agent suppressiion")
                
                toast.success("Agent supprimé")
                
              }catch(error : any){
                    toast.error(error)
              }
            }}
          >
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ✅ MODALES EN DEHORS DU MENU */}
{activeModal === "CREATE_ACCOUNT" && (
  <CreateUserAccount
    open
    setOpen={(open:any) => !open && setActiveModal(null)}
    agent={row.original.compteAgent}
    currentUserRole="ADMIN"
  />
)}

{activeModal === "EDIT_AGENT" && (
  <ModifierAgentCompte
    open
    setOpen={(open:any) => !open && setActiveModal(null)}
    currentUserRole="ADMIN"
    data={{ id: row.original.id, nom: row.original.compteAgent?.agent?.nom ?? "", prenom: row.original.compteAgent?.agent?.prenom ?? "", statut: row.original.statut ?? "", role: row.original.role ?? "", agentId: row.original.compteAgent?.agentId, utilisateurId: row.original.compteAgent?.utilisateurId, email: row.original.login, }}
  />
)}


      
    </>
  )
}
,
  },
]

function DraggableRow({ row }: { row: Row<any> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      ref={setNodeRef}
      data-dragging={isDragging}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}
const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig
export function DataTable({
  data: initialData, isPending, onRefresh 
}: {
  data: z.infer<typeof agentSchema1>[],
  isPending: boolean,
  onRefresh: () => Promise<any>
}) {

  const [data, setData] = React.useState(initialData)
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  console.log(data, 'console dans table users')
  const sortableId = React.useId()

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  )

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id.toString(),
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })



  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id)
        const newIndex = prev.findIndex((i) => i.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

   const [newRoleName, setNewRoleName] = React.useState("");
    const {data:roles , refetch , isPending:loading} = useGet(['RolesTabs'] , GetRole)
     const handleAddRole = async () => {
        if (!newRoleName.trim()) {
          toast.error("Le nom du rôle est requis");
          return;
        }
      };

  return (
    <Tabs defaultValue="agents" className="w-full">

      <div className="flex justify-between items-center px-6 py-4">
        <TabsList>
          <div>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="roles">Rôles</TabsTrigger>
            <TabsTrigger value="comptes">Comptes</TabsTrigger>
          </div>

        </TabsList>
        <div><CreateAgentWithAccount refetchAgWA={onRefresh} currentUserRole="ADMIN" /></div>
      </div>

      {!isPending && data && <TabsContent value="agents">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          id={sortableId}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              <SortableContext
                items={table.getRowModel().rows.map((row) => row.id)}
                strategy={verticalListSortingStrategy}
              >
                {table.getRowModel().rows.map((row) => (
                  <DraggableRow key={row.id} row={row} />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </TabsContent>}
      {!isPending && data && <TabsContent value="roles">
        <div className="flex justify-between items-center mb-4 pl-5 pr-5">
          <Input
            placeholder="Nouveau rôle"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            className="w-1/2"
          />
          <Button onClick={handleAddRole} disabled={loading}>
            {loading ? "Ajout..." : "Ajouter"}
          </Button>
        </div>

      <Table className="w-full border border-border rounded-lg overflow-hidden shadow-sm">
  <TableHeader className="bg-muted text-muted-foreground">
    <TableRow>
      <TableHead className="px-4 py-2 text-left">ID</TableHead>
      <TableHead className="px-4 py-2 text-left">Nom du rôle</TableHead>
      <TableHead className="px-4 py-2 text-left">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {Array.isArray(roles) &&  roles?.data.length > 0 ? (
      roles.data.map((role: any) => (
        <TableRow key={role.id} className="hover:bg-accent/10 transition-colors">
          <td className="px-4 py-2">{role.id}</td>
          <td className="px-4 py-2">{role.nom}</td>
          {/* <td className="px-4 py-2 flex gap-2">
            <Button size="sm" variant="outline">Modifier</Button>
            <Button size="sm" variant="destructive">Supprimer</Button>
          </td> */}
        </TableRow>
      ))
    ) : (
      <TableRow>
        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
          Aucun rôle
        </td>
      </TableRow>
    )}
  </TableBody>
</Table>

      </TabsContent>}
      {isPending && "Loading..."}
      {/* Pagination de la table */}
      {!isPending && data?.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          {/* Page size */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Lignes par page
            </span>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pagination buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-2 text-sm">
              Page {table.getState().pagination.pageIndex + 1} sur{" "}
              {table.getPageCount()}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                table.setPageIndex(table.getPageCount() - 1)
              }
              disabled={!table.getCanNextPage()}
            >
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

    </Tabs>
  )
}
function TableCellViewer({ item }: { item: z.infer<typeof agentSchema1> }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground font-small w-fit px-0 text-left">
          {item.compteAgent?.agent?.matricule || '----'}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.compteAgent?.agent?.nom}</DrawerTitle>
          <DrawerDescription>
            Evolution de ces 6 derniers mois
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Evolution{" "}
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                   Commodi itaque vero repudiandae quo quisquam, e nemo ad iusto quae voluptas a possimus accusamus repellendus?
                </div>
              </div>
              <Separator />
            </>
          )}
         <form className="flex flex-col gap-4">
  {/* Nom & Login */}
  <div className="grid grid-cols-2 gap-4">
    <div className="flex flex-col gap-2">
      <Label>Nom</Label>
      <Input
        disabled
        value={`${item.compteAgent?.agent?.prenom ?? ""} ${item.compteAgent?.agent?.nom ?? ""}`}
      />
    </div>

    <div className="flex flex-col gap-2">
      <Label>Login</Label>
      <Input disabled value={item.login} />
    </div>
  </div>

  {/* Affectation & Évolution */}
  <div className="grid grid-cols-2 gap-4">
    <div className="flex flex-col gap-2">
      <Label htmlFor="affectation">Affectation (Poste)</Label>
      <Select defaultValue={item?.affectation ?? ""}>
        <SelectTrigger id="affectation" className="w-full">
          <SelectValue placeholder="Sélectionner un poste" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="agent">Agent</SelectItem>
          <SelectItem value="caissier">Caissier</SelectItem>
          <SelectItem value="superviseur">Superviseur</SelectItem>
          <SelectItem value="chef_service">Chef de service</SelectItem>
          <SelectItem value="administratif">Administratif</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="flex flex-col gap-2">
      <Label htmlFor="evolution">Type de contrat</Label>
      <Select defaultValue={item?.evolution ?? ""}>
        <SelectTrigger id="evolution" className="w-full">
          <SelectValue placeholder="Situation professionnelle" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="salarie">Stage</SelectItem>
          <SelectItem value="contractuel">CDD 3mois</SelectItem>
          <SelectItem value="contractuel">CDD 6mois</SelectItem>
          <SelectItem value="stagiaire">CDI</SelectItem>
        </SelectContent>
      </Select>
    </div>
    
  </div>
   {/* Service */}
  <div className="flex flex-col gap-2">
    <Label htmlFor="service">grade</Label>
    <Select defaultValue={item.service ?? ""}>
      <SelectTrigger id="service" className="w-full">
        <SelectValue placeholder="Sélectionner un service" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="grade1">grade1</SelectItem>
        <SelectItem value="grade2">grade2</SelectItem>
        <SelectItem value="grade3">grade3</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Service */}
  <div className="flex flex-col gap-2">
    <Label htmlFor="service">Departement</Label>
    <Select defaultValue={item.service ?? ""}>
      <SelectTrigger id="service" className="w-full">
        <SelectValue placeholder="Sélectionner un service" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="rh">Ressources humaines</SelectItem>
        <SelectItem value="finance">Finance</SelectItem>
        <SelectItem value="informatique">Informatique</SelectItem>
        <SelectItem value="commercial">Commercial</SelectItem>
        <SelectItem value="logistique">Logistique</SelectItem>
      </SelectContent>
    </Select>
  </div>
  {/* Service */}
  <div className="flex flex-col gap-2">
    <Label htmlFor="service">Site</Label>
    <Select defaultValue={item.service ?? ""}>
      <SelectTrigger id="service" className="w-full">
        <SelectValue placeholder="Sélectionner un service" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="kin">Kinshasa</SelectItem>
        <SelectItem value="lub">Lubumbashi</SelectItem>
        <SelectItem value="kasai">Kasai</SelectItem>
        <SelectItem value="equa">Equateur</SelectItem>
        <SelectItem value="kol">Kolwezi</SelectItem>
      </SelectContent>
    </Select>
  </div>
  
</form>

        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

