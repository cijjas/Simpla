'use client';

import * as React from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  Search,
  Folder,
  Bookmark,
  Bell,
  Loader,
  BookOpen,
} from 'lucide-react';
import { TbTopologyRing2 } from 'react-icons/tb';
import SvgEstampa from '@/../public/svgs/estampa.svg';
import { forwardRef } from 'react';

// Create a wrapper to make Estampa compatible with LucideIcon interface
const EstampaIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  (props, ref) => <SvgEstampa {...props} ref={ref} className="text-sidebar" fill="currentColor" />,
);
EstampaIcon.displayName = 'EstampaIcon';

import { NavMain } from '@/components/nav-main';
import { NavProjects } from '@/components/nav-projects';
import { NavCopiloto } from '@/components/nav-copiloto';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

// This is sample data.
const data = {
  user: {
    name: 'Usuario',
    email: 'usuario@example.com',
    avatar: '/avatars/user.jpg',
  },
  teams: [
    {
      name: 'Simpla',
      logo: EstampaIcon,
      plan: 'Pro',
    },
  ],
  navMain: [
    {
      title: 'Inicio',
      url: '/inicio',
      icon: BookOpen,
      isActive: true,
    },
    {
      title: "Búsqueda",
      url: "/normas",
      icon: Search,
      commandId: "search-normas", // Will automatically show ⌘K on Mac, Ctrl+K on Windows
    },
    {
      title: 'Carpetas',
      url: '/carpetas',
      icon: Folder,
    },
    {
      title: 'Relaciones',
      url: '/relaciones',
      icon: TbTopologyRing2,
    },
  ],
  motor: [
    {
      name: 'Themis',
      url: '/conversaciones',
      icon: Loader,
    },
  ],
  control: [
    {
      name: 'Guardados',
      url: '/bookmark',
      icon: Bookmark,
    },
    {
      name: 'Notificaciones',
      url: '/notificaciones',
      icon: Bell,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  // Update user data with auth info
  const userData = {
    ...data.user,
    name: user?.name || data.user.name,
    email: user?.email || data.user.email,
    avatar: user?.avatar_url || data.user.avatar, // Use user's avatar or fallback to default
  };

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavCopiloto copilotoItems={data.motor} sectionLabel="Conversaciones" />
        <NavProjects projects={data.control} sectionLabel="Control" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
