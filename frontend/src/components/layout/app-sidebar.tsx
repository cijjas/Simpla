'use client';

import { usePathname } from 'next/navigation';
import { Search, MessageCircle, Compass, Folder } from 'lucide-react'; // Add Compass for variety

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarRail,
} from '@/components/ui/sidebar';

const links = [
  { href: '/inicio', label: 'Inicio', icon: Compass },
  // { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/busqueda', label: 'Búsqueda', icon: Search },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/carpetas', label: 'Carpetas', icon: Folder },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent className='bg-card'>
        <SidebarGroup>
          <SidebarGroupLabel>Simpla</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(href)}
                  >
                    <a href={href} className='flex items-center gap-2'>
                      <Icon className='h-4 w-4' />
                      <span>{label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
