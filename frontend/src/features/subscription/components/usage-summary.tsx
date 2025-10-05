'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, MessageSquare, TrendingUp, Calendar } from 'lucide-react';

interface UsageDataPoint {
  date: string;
  tokens_used: number;
  messages_sent: number;
  period_type: string;
}

interface UsageHistoryResponse {
  daily_usage: UsageDataPoint[];
  hourly_usage: UsageDataPoint[];
}

interface UsageEvent {
  id: string;
  date: string;
  model: string;
  kind: 'Included' | 'Errored' | 'On-Demand';
  tokens: number;
  cost: number;
  status: 'success' | 'error' | 'pending';
}

interface UsageSummaryProps {
  usageHistory?: UsageHistoryResponse | null;
  usageEvents?: UsageEvent[];
  currentUsage?: {
    tokens_today: number;
    messages_today: number;
    messages_this_hour: number;
  };
  limits?: {
    tokens_per_day: number | null;
    messages_per_day: number | null;
    messages_per_hour: number | null;
  };
  isLoading?: boolean;
}

export function UsageSummary({ usageHistory, usageEvents: _usageEvents, currentUsage, limits, isLoading }: UsageSummaryProps) {
  // Handle loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-none animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Get daily usage data with fallback
  const dailyUsage = usageHistory?.daily_usage || [];
  
  // Calculate totals and averages with safe fallbacks
  const totalTokens = dailyUsage.reduce((sum, day) => sum + (day.tokens_used || 0), 0);
  const totalMessages = dailyUsage.reduce((sum, day) => sum + (day.messages_sent || 0), 0);
  const averageTokensPerDay = dailyUsage.length > 0 ? Math.round(totalTokens / dailyUsage.length) : 0;
  const averageMessagesPerDay = dailyUsage.length > 0 ? Math.round(totalMessages / dailyUsage.length) : 0;

  // Find peak usage day with safe fallback
  const peakDay = dailyUsage.length > 0 
    ? dailyUsage.reduce((peak, day) => 
        (day.tokens_used || 0) > (peak.tokens_used || 0) ? day : peak, 
        dailyUsage[0]
      )
    : { tokens_used: 0, messages_sent: 0, date: '' };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Tokens Used */}
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tokens Totales</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {averageTokensPerDay.toLocaleString()} promedio por día
          </p>
        </CardContent>
      </Card>

      {/* Total Messages */}
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mensajes Totales</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMessages.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {averageMessagesPerDay.toLocaleString()} promedio por día
          </p>
        </CardContent>
      </Card>

      {/* Peak Usage Day */}
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Día Pico</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{peakDay.tokens_used.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {formatDate(peakDay.date)} • {peakDay.messages_sent} mensajes
          </p>
        </CardContent>
      </Card>

      {/* Current Usage vs Limits */}
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Uso Actual</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {currentUsage && limits ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tokens hoy</span>
                <Badge variant={currentUsage.tokens_today > (limits.tokens_per_day || 0) * 0.8 ? "destructive" : "secondary"}>
                  {currentUsage.tokens_today.toLocaleString()} / {limits.tokens_per_day?.toLocaleString() || '∞'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mensajes hoy</span>
                <Badge variant={currentUsage.messages_today > (limits.messages_per_day || 0) * 0.8 ? "destructive" : "secondary"}>
                  {currentUsage.messages_today} / {limits.messages_per_day || '∞'}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-2xl font-bold">-</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

