'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSubscriptionContext } from '@/features/subscription/context/subscription-context';
import { UsageChart } from '@/features/subscription/components/usage-chart';
import { Badge } from '@/components/ui/badge';

export function OverviewSection() {
  const { status: subscriptionStatus, usageHistory, isLoading } = useSubscriptionContext();

  const calculatePercentage = (current: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Plan Features */}
      {subscriptionStatus && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Plan Actual</CardTitle>
            <CardDescription>
              {subscriptionStatus.tier.display_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Límites Diarios</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tokens</span>
                    <span className="font-medium">
                      {subscriptionStatus.limits.tokens_per_day?.toLocaleString() || 'Ilimitados'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mensajes</span>
                    <span className="font-medium">
                      {subscriptionStatus.limits.messages_per_day || 'Ilimitados'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chats simultáneos</span>
                    <span className="font-medium">
                      {subscriptionStatus.limits.concurrent_chats || 'Ilimitados'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Límites Mensuales</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tokens</span>
                    <span className="font-medium">
                      {subscriptionStatus.limits.tokens_per_month?.toLocaleString() || 'Ilimitados'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mensajes por hora</span>
                    <span className="font-medium">
                      {subscriptionStatus.limits.messages_per_hour || 'Ilimitados'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Usage Status */}
      {subscriptionStatus && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Uso Actual</CardTitle>
            <CardDescription>
              Tu uso en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Tokens Hoy</div>
                    <div className="text-xs text-muted-foreground">
                      {subscriptionStatus.current_usage.tokens_today.toLocaleString()} de {subscriptionStatus.limits.tokens_per_day?.toLocaleString() || '∞'}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {subscriptionStatus.limits.tokens_per_day 
                      ? `${calculatePercentage(subscriptionStatus.current_usage.tokens_today, subscriptionStatus.limits.tokens_per_day).toFixed(0)}%`
                      : '0%'}
                  </Badge>
                </div>
                <Progress 
                  value={calculatePercentage(
                    subscriptionStatus.current_usage.tokens_today, 
                    subscriptionStatus.limits.tokens_per_day
                  )} 
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Mensajes Hoy</div>
                    <div className="text-xs text-muted-foreground">
                      {subscriptionStatus.current_usage.messages_today} de {subscriptionStatus.limits.messages_per_day || '∞'}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {subscriptionStatus.limits.messages_per_day 
                      ? `${calculatePercentage(subscriptionStatus.current_usage.messages_today, subscriptionStatus.limits.messages_per_day).toFixed(0)}%`
                      : '0%'}
                  </Badge>
                </div>
                <Progress 
                  value={calculatePercentage(
                    subscriptionStatus.current_usage.messages_today, 
                    subscriptionStatus.limits.messages_per_day
                  )} 
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Mensajes Esta Hora</div>
                    <div className="text-xs text-muted-foreground">
                      {subscriptionStatus.current_usage.messages_this_hour} de {subscriptionStatus.limits.messages_per_hour || '∞'}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {subscriptionStatus.limits.messages_per_hour 
                      ? `${calculatePercentage(subscriptionStatus.current_usage.messages_this_hour, subscriptionStatus.limits.messages_per_hour).toFixed(0)}%`
                      : '0%'}
                  </Badge>
                </div>
                <Progress 
                  value={calculatePercentage(
                    subscriptionStatus.current_usage.messages_this_hour, 
                    subscriptionStatus.limits.messages_per_hour
                  )} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Analytics */}
      <UsageChart 
        usageHistory={usageHistory} 
        isLoading={isLoading} 
      />
    </div>
  );
}
