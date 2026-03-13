import { ChartAdmin } from "@/components/dashboard/tabord/charts/chartAdmin";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

// import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AddAgentModale from "../../agent/createByAdmin/AddAgentModale";
import { CreateAgentWithAccount } from "../../agent/create/compteAgent/createAgentwithCompte";

export default function Charts() {
    return (
        <>
            <div className="flex flex-1 flex-col gap-4 p-5 pl-8 pr-8">
                <div className=" p-8 flex justify-between align-center">
                    <div className="text-2xl font-bold"></div>
                    {/* <div> <AddAgentModale/> </div> */}
                     <div> <CreateAgentWithAccount refetchAgWA={()=> console.log('refresh')}/> </div>
                    </div>
                 <ChartAdmin/>
                {/* <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    
                </div> */}
                {/* <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" /> */}
            </div>
        </>
    )
}
