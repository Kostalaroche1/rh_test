'use client';

import { cn } from "@/lib/utils"
export function DashLoading({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form >
       
          <div className="flex flex-col items-center gap-2 text-center">
            <img src="/images/logo_auth/logo_rtnc1.png"
              className="relative top-20 w-80 h-80 "
              alt="" />
          </div>
          <div><h3>Acces Non Autorisé</h3></div>
      </form>
    </div>
  )
}
