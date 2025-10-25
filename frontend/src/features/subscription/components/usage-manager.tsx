'use client';

import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useSubscriptionContext } from '../context/subscription-context';
import { useUsageEvents } from '../hooks/use-usage-events';
import { UsageDisplay } from './usage-display';
import { UsageEventsTable } from './usage-events-table';
import { UsageChart } from './usage-chart';
import { UsageSummary } from './usage-summary';

export function UsageManager() {
  const { status, usageHistory, isLoading, error } = useSubscriptionContext();
  const { events: usageEvents, isLoading: eventsLoading } = useUsageEvents();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Cargando información de uso...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar la información de uso: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!status) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No se pudo cargar la información de uso.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Plan Actual: {status.tier.display_name}
          </CardTitle>
          <CardDescription>
            Tu plan actual te permite {status.tier.max_tokens_per_day ? 
              `${status.tier.max_tokens_per_day.toLocaleString()} tokens por día` : 
              'tokens ilimitados'
            } y {status.tier.max_messages_per_day ? 
              `${status.tier.max_messages_per_day} mensajes por día` : 
              'mensajes ilimitados'
            }.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Usage Display */}
      <UsageDisplay status={status} />

      {/* Usage Summary */}
      <UsageSummary 
        usageHistory={usageHistory} 
        usageEvents={usageEvents}
        currentUsage={status.current_usage}
        limits={status.limits}
        isLoading={eventsLoading}
      />

      {/* Usage Chart */}
      <UsageChart 
        usageHistory={usageHistory}
        isLoading={isLoading}
      />

      {/* Usage Events Table */}
      <UsageEventsTable 
        events={usageEvents} 
        isLoading={eventsLoading} 
      />
    </div>
  );
}
