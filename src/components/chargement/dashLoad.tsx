'use client';

import { cn } from "@/lib/utils"
import React from "react";
export function DashLoad({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6 absolute w-full h-full", className)} {...props}>
      <form >
       
          <div className="flex flex-col items-center gap-2 text-center">
            <img src="/images/logo_auth/logo_rtnc1.png"
              className="relative top-20 w-80 h-80 "
              alt="" />
              <div><h3 className="text-2xl text-blue-700">Loading...</h3></div>
          </div>
          
      </form>
    </div>
  )
}
