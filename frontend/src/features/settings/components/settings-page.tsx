'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  CreditCard, 
  User,
  BarChart3, 
  Clock,
} from 'lucide-react';
import { OverviewSection } from './overview-section';
import { SettingsSection } from './settings-section';
import { UsageSection } from './usage-section';
import { PlansSection } from './plans-section';

type SectionId = 'overview' | 'account' | 'usage' | 'plans';

interface SettingsSection {
  id: SectionId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function SettingsPage() {
  const searchParams = useSearchParams();
  
  // Get section from URL or default
  const urlSection = useMemo(() => {
    const tab = searchParams.get('tab') as SectionId;
    if (tab && ['overview', 'account', 'usage', 'plans'].includes(tab)) {
      return tab;
    }
    return 'overview';
  }, [searchParams]);

  const [activeSection, setActiveSection] = useState<SectionId>(urlSection);

  // Update activeSection when URL changes (but only if different to avoid unnecessary renders)
  React.useEffect(() => {
    if (urlSection !== activeSection) {
      setActiveSection(urlSection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSection]);

  const settingsSections: SettingsSection[] = [
    {
      id: 'overview',
      title: 'Resumen',
      icon: Clock,
    },
    {
      id: 'account',
      title: 'Cuenta',
      icon: User,
    },
    {
      id: 'usage',
      title: 'Uso',
      icon: BarChart3,
    },
    {
      id: 'plans',
      title: 'Planes',
      icon: CreditCard,
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'account':
        return <SettingsSection />;
      case 'usage':
        return <UsageSection />;
      case 'plans':
        return <PlansSection />;
      default:
        return null;
    }
  };

  const getSectionTitle = () => {
    const section = settingsSections.find(s => s.id === activeSection);
    return section?.title || 'Configuración';
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">
      {/* Sidebar */}
      <div className="border-r border-border bg-background flex flex-col shrink-0 w-64">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <h1 className="text-3xl font-bold font-serif">Configuración</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{section.title}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Content Header */}
        <div className="px-8 py-5 border-b border-border bg-background shrink-0">
          <h2 className="text-xl font-semibold">{getSectionTitle()}</h2>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-muted/30">
          <div className="px-8 py-6 ">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

