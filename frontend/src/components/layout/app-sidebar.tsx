"use client"

import * as React from "react"
import { useAuth } from "@/features/auth/hooks/use-auth"
import {
  Search,
  MessageCircle,
  Compass,
  Folder,
  BookOpen,
  Heart,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
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
      logo: Compass,
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
      title: "Chat",
      url: "/chat",
      icon: MessageCircle,
      items: [
        {
          title: "Nueva Conversación",
          url: "/chat",
        },
        {
          title: "Historial",
          url: "/chat/historial",
        },
      ],
    },
    {
      title: "Carpetas",
      url: "/carpetas",
      icon: Folder,
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
    avatar: data.user.avatar, // We don't have avatar from backend yet
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
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
