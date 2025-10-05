'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Settings as SettingsIcon, 
  BarChart3, 
  Edit,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useSubscriptionContext } from '@/features/subscription/context/subscription-context';
import { EditNameDialog } from './edit-name-dialog';
import { OverviewSection } from './overview-section';
import { SettingsSection } from './settings-section';
import { UsageSection } from './usage-section';
import { PlansSection } from './plans-section';

export function SettingsPage() {
  const { user } = useAuth();
  const { status: subscriptionStatus } = useSubscriptionContext();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState('overview');

  // Handle tab query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'settings', 'usage', 'plans'].includes(tab)) {
      setActiveSection(tab);
    }
  }, [searchParams]);

  const handleNameUpdated = (_newName: string) => {
    // The user data will be updated automatically by the auth context
    // when the API call succeeds, so we don't need to do anything here
  };

  const settingsSections = [
    {
      id: 'overview',
      title: 'Resumen',
      description: 'Resumen general de tu cuenta',
      icon: Clock,
    },
    {
      id: 'settings',
      title: 'Configuración',
      description: 'Configuración general',
      icon: SettingsIcon,
    },
    {
      id: 'usage',
      title: 'Uso',
      description: 'Uso y límites',
      icon: BarChart3,
    },
    {
      id: 'plans',
      title: 'Planes',
      description: 'Planes disponibles',
      icon: CreditCard,
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'settings':
        return <SettingsSection />;
      case 'usage':
        return <UsageSection />;
      case 'plans':
        return <PlansSection />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-80 flex flex-col">
          {/* User Info Header */}
          <div className="p-6 border-b border-border">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{user?.name || 'Usuario'}</h2>
                <EditNameDialog 
                  currentName={user?.name || ''} 
                  onNameUpdated={handleNameUpdated}
                >
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </EditNameDialog>
              </div>
              <div className="text-sm text-muted-foreground">
                {subscriptionStatus?.tier.display_name || 'Free'} · {user?.email}
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 p-4">
            <nav className="space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <Button
                    key={section.id}
                    variant={isActive ? "secondary" : "ghost"}
                    onClick={() => setActiveSection(section.id)}
                    className="w-full justify-start gap-3 h-auto py-2 hover:bg-secondary"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{section.title}</span>
                  </Button>
                );
              })}
            </nav>
          </div>

        </div>

        {/* Main Content */}
        <div className="flex-1 pt-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

