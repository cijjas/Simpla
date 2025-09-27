"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
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
  const { data: session } = useSession()
  
  // Update user data with session info
  const userData = {
    ...data.user,
    name: session?.user?.name || data.user.name,
    email: session?.user?.email || data.user.email,
    avatar: session?.user?.image || data.user.avatar,
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
