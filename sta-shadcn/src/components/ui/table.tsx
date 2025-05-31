"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    // <div
    //   data-slot="table-container"
    //   className="relative w-full overflow-x-auto"
    // >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    // </div>
  )
}

// function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
//   return (
//     <thead
//       data-slot="table-header"
//       className={cn("bg-blue-300 [&_tr]:border-b [&_tr]:mb-4", className)}
//       {...props}
//     />
//   )
// }

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-blue-400", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "text-center data-[state=selected]:bg-muted border-b transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-center p-2 text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

type TableCellVariant = "default" | "selected" | "cancelled" | "confirmed" | "finished" | "needToChange" | "foreignOrder"
interface TableCellProps extends React.ComponentProps<"td"> {
  variant?: TableCellVariant;
}

// function TableCell({ className, ...props }: React.ComponentProps<"td">) {
function TableCell({ className, variant = "default", ...props }: TableCellProps) {
  const variantClass = {
    // default: "bg-white",
    default: "bg-white max-w-[250px] truncate whitespace-nowrap overflow-hidden",
    selected: "bg-blue-600 selected-row-swim font-bold text-white max-w-[250px] truncate whitespace-nowrap overflow-hidden",
    cancelled: "bg-red-500 !font-bold text-white max-w-[250px] truncate whitespace-nowrap overflow-hidden",
    confirmed: "bg-purple-500 rounded-full font-bold text-white max-w-[250px] truncate whitespace-nowrap overflow-hidden",
    finished: "bg-green-500 rounded-full font-bold text-white max-w-[250px] truncate whitespace-nowrap overflow-hidden",
    needToChange: "bg-yellow-400 p-2 rounded-full text-white font-bold max-w-[250px] truncate whitespace-nowrap overflow-hidden",
    foreignOrder: "bg-green-500 rounded-full text-white font-bold max-w-[250px] truncate whitespace-nowrap overflow-hidden"
  };
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        variantClass[variant],
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
