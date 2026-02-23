import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircleIcon } from "lucide-react"

export function AlertCustomer({title, description , variants} : { title:String, description:String , variants:any}) {
  return (
    <Alert variant={variants} className={`max-w-md ${variants === "success" ? "bg-blue-500 text-white" : "bg-red-700 text-white"}`}>
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
       {description}
      </AlertDescription>
    </Alert>
  )
}
