'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, MessageSquare, Zap } from 'lucide-react';
import type { SubscriptionStatus } from '../types';

interface UsageDisplayProps {
  status: SubscriptionStatus;
}

export function UsageDisplay({ status }: UsageDisplayProps) {
  const { current_usage, limits } = status;

  const getUsagePercentage = (current: number, limit: number | null) => {
    if (limit === null) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const formatLimit = (limit: number | null) => {
    if (limit === null) return 'Ilimitado';
    return formatNumber(limit);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Uso Actual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Tokens */}
        {limits.tokens_per_day !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Tokens Hoy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {formatNumber(current_usage.tokens_today)} / {formatLimit(limits.tokens_per_day)}
                </span>
                {getUsagePercentage(current_usage.tokens_today, limits.tokens_per_day) > 75 && (
                  <Badge variant={getUsagePercentage(current_usage.tokens_today, limits.tokens_per_day) >= 90 ? 'destructive' : 'secondary'}>
                    {getUsagePercentage(current_usage.tokens_today, limits.tokens_per_day) >= 90 ? 'Crítico' : 'Alto'}
                  </Badge>
                )}
              </div>
            </div>
            <Progress 
              value={getUsagePercentage(current_usage.tokens_today, limits.tokens_per_day)} 
              className="h-2"
            />
          </div>
        )}

        {/* Daily Messages */}
        {limits.messages_per_day !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Mensajes Hoy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {formatNumber(current_usage.messages_today)} / {formatLimit(limits.messages_per_day)}
                </span>
                {getUsagePercentage(current_usage.messages_today, limits.messages_per_day) > 75 && (
                  <Badge variant={getUsagePercentage(current_usage.messages_today, limits.messages_per_day) >= 90 ? 'destructive' : 'secondary'}>
                    {getUsagePercentage(current_usage.messages_today, limits.messages_per_day) >= 90 ? 'Crítico' : 'Alto'}
                  </Badge>
                )}
              </div>
            </div>
            <Progress 
              value={getUsagePercentage(current_usage.messages_today, limits.messages_per_day)} 
              className="h-2"
            />
          </div>
        )}

        {/* Hourly Messages */}
        {limits.messages_per_hour !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Mensajes Esta Hora</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {formatNumber(current_usage.messages_this_hour)} / {formatLimit(limits.messages_per_hour)}
                </span>
                {getUsagePercentage(current_usage.messages_this_hour, limits.messages_per_hour) > 75 && (
                  <Badge variant={getUsagePercentage(current_usage.messages_this_hour, limits.messages_per_hour) >= 90 ? 'destructive' : 'secondary'}>
                    {getUsagePercentage(current_usage.messages_this_hour, limits.messages_per_hour) >= 90 ? 'Crítico' : 'Alto'}
                  </Badge>
                )}
              </div>
            </div>
            <Progress 
              value={getUsagePercentage(current_usage.messages_this_hour, limits.messages_per_hour)} 
              className="h-2"
            />
          </div>
        )}

        {/* Monthly Tokens */}
        {limits.tokens_per_month !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Tokens Este Mes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {formatLimit(limits.tokens_per_month)} disponibles
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              El uso mensual se resetea cada mes
            </div>
          </div>
        )}

        {/* Reset Times */}
        <div className="pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <p>• Los límites diarios se resetean a medianoche</p>
            <p>• Los límites horarios se resetean cada hora</p>
            <p>• Los límites mensuales se resetean cada mes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

