'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscriptionContext } from '@/features/subscription/context/subscription-context';
import { UsageChart } from '@/features/subscription/components/usage-chart';

export function OverviewSection() {
  const { status: subscriptionStatus, usageHistory, isLoading } = useSubscriptionContext();

  return (
    <div className="space-y-6">
      {/* Plan Features */}
      {subscriptionStatus && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Características del Plan</CardTitle>
            <CardDescription>
              Funciones incluidas en tu plan actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Límites Diarios</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Tokens: {subscriptionStatus.limits.tokens_per_day?.toLocaleString() || 'Ilimitados'}</li>
                  <li>• Mensajes: {subscriptionStatus.limits.messages_per_day || 'Ilimitados'}</li>
                  <li>• Chats simultáneos: {subscriptionStatus.limits.concurrent_chats || 'Ilimitados'}</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Límites Mensuales</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Tokens: {subscriptionStatus.limits.tokens_per_month?.toLocaleString() || 'Ilimitados'}</li>
                  <li>• Mensajes por hora: {subscriptionStatus.limits.messages_per_hour || 'Ilimitados'}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Usage Status */}
      {subscriptionStatus && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>
              Estado Actual del Uso
            </CardTitle>
            <CardDescription>
              Tu uso actual y límites del plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tokens Hoy</span>
                  <span className="text-sm text-muted-foreground">
                    {subscriptionStatus.current_usage.tokens_today.toLocaleString()} / {subscriptionStatus.limits.tokens_per_day?.toLocaleString() || '∞'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${subscriptionStatus.limits.tokens_per_day ? 
                        Math.min((subscriptionStatus.current_usage.tokens_today / subscriptionStatus.limits.tokens_per_day) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Mensajes Hoy</span>
                  <span className="text-sm text-muted-foreground">
                    {subscriptionStatus.current_usage.messages_today} / {subscriptionStatus.limits.messages_per_day || '∞'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${subscriptionStatus.limits.messages_per_day ? 
                        Math.min((subscriptionStatus.current_usage.messages_today / subscriptionStatus.limits.messages_per_day) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Mensajes Esta Hora</span>
                  <span className="text-sm text-muted-foreground">
                    {subscriptionStatus.current_usage.messages_this_hour} / {subscriptionStatus.limits.messages_per_hour || '∞'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${subscriptionStatus.limits.messages_per_hour ? 
                        Math.min((subscriptionStatus.current_usage.messages_this_hour / subscriptionStatus.limits.messages_per_hour) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
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
