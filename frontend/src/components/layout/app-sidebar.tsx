"use client"

import * as React from "react"
import { useAuth } from "@/features/auth/hooks/use-auth"
import {
  Search,
  Folder,
  BookOpen,
  Heart,
  Compass,
  Scale,
} from "lucide-react"
import SvgEstampa from "@/components/icons/Estampa"
import { forwardRef } from "react"

// Create a wrapper to make Estampa compatible with LucideIcon interface
const EstampaIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
  <SvgEstampa {...props} ref={ref} />
))
EstampaIcon.displayName = "EstampaIcon"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavCopiloto } from "@/components/nav-copiloto"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Usuario",
    email: "usuario@example.com",
    avatar: "/avatars/user.jpg",
  },
  teams: [
    {
      name: "Simpla",
      logo: EstampaIcon,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      title: "Inicio",
      url: "/inicio",
      icon: Compass,
      isActive: true,
    },
    {
      title: "Búsqueda",
      url: "/busqueda",
      icon: Search,
    },
    {
      title: "Carpetas",
      url: "/carpetas",
      icon: Folder,
    },
  ],
  copiloto: [
    {
      name: "Normativa Nacional",
      url: "/chat",
      icon: Scale,
    },
    {
      name: "Constituciones",
      url: "/chat/constituciones",
      icon: BookOpen,
    },
  ],
  projects: [
    {
      name: "Favoritos",
      url: "/favoritos",
      icon: Heart,
    },
    {
      name: "Recent",
      url: "/recent",
      icon: BookOpen,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  
  // Update user data with auth info
  const userData = {
    ...data.user,
    name: user?.name || data.user.name,
    email: user?.email || data.user.email,
    avatar: user?.avatar_url || data.user.avatar, // Use user's avatar or fallback to default
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavCopiloto copilotoItems={data.copiloto} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
