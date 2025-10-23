"use client"

import { type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavCopiloto({
  copilotoItems,
  sectionLabel = "Copiloto",
}: {
  copilotoItems: {
    name: string
    url: string
    icon: LucideIcon
  }[]
  sectionLabel?: string
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{sectionLabel}</SidebarGroupLabel>
      <SidebarMenu>
        {copilotoItems.map((item) => {
          const isActive = pathname.startsWith(item.url)
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild tooltip={item.name} isActive={isActive}>
                <Link href={item.url}>
                  <item.icon />
                  <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
