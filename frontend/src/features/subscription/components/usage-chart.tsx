'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApi } from '@/features/auth/hooks/use-api';
import { Loader2 } from 'lucide-react';

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

interface UsageChartProps {
  usageHistory?: UsageHistoryResponse | null;
  isLoading?: boolean;
}

type DateRange = 1 | 7 | 30;

export function UsageChart({ usageHistory: initialUsageHistory, isLoading: initialLoading }: UsageChartProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>(7);
  const [isLoading, setIsLoading] = useState(initialLoading || false);
  const { get } = useApi();
  
  // Cache for different date ranges
  const cacheRef = React.useRef<Map<DateRange, UsageHistoryResponse>>(new Map());
  const [currentData, setCurrentData] = React.useState<UsageHistoryResponse | null>(initialUsageHistory || null);

  // Initialize cache with initial data and handle loading state
  React.useEffect(() => {
    if (initialUsageHistory) {
      if (!cacheRef.current.has(7)) {
        cacheRef.current.set(7, initialUsageHistory);
      }
      setCurrentData(initialUsageHistory);
      setIsLoading(false); // We have data, so not loading
    } else if (initialLoading !== undefined) {
      // Only use initialLoading if we don't have data yet
      setIsLoading(initialLoading);
    }
  }, [initialUsageHistory, initialLoading]);

  const fetchUsageHistory = async (days: DateRange) => {
    // Check cache first
    const cached = cacheRef.current.get(days);
    if (cached) {
      setCurrentData(cached);
      return;
    }

    setIsLoading(true);
    try {
      const response = await get<UsageHistoryResponse>(`/api/subscription/usage-history?days=${days}`);
      // Store in cache
      cacheRef.current.set(days, response);
      setCurrentData(response);
    } catch (err) {
      console.error('Failed to fetch usage history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRangeChange = (range: DateRange) => {
    setSelectedRange(range);
    fetchUsageHistory(range);
  };

  // Get data with fallbacks
  const dailyUsage = currentData?.daily_usage || [];
  
  // Process data for charts
  const processData = (data: UsageDataPoint[]) => {
    return data.map(item => {
      // Parse date string (format: "YYYY-MM-DD")
      const date = new Date(item.date + 'T00:00:00Z');
      
      const formattedDate = !isNaN(date.getTime()) 
        ? date.toLocaleDateString('es-ES', { 
            month: 'short', 
            day: 'numeric' 
          })
        : item.date;
      
      return {
        date: formattedDate,
        tokens: item.tokens_used || 0,
        messages: item.messages_sent || 0,
      };
    });
  };

  const chartData = processData(dailyUsage);
  const hasData = chartData.length > 0;

  const DateRangeSelector = () => (
    <div className="flex gap-1">
      {([1, 7, 30] as DateRange[]).map((range) => (
        <button
          key={range}
          onClick={() => handleRangeChange(range)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            selectedRange === range
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {range}d
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tokens Chart */}
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <CardTitle>Tokens Utilizados</CardTitle>
              <CardDescription>
                Historial de uso de tokens en los últimos {selectedRange} {selectedRange === 1 ? 'día' : 'días'}
              </CardDescription>
            </div>
            <DateRangeSelector />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !hasData ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay datos de uso disponibles</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-sm text-blue-500">
                              Tokens: {payload[0].value?.toLocaleString()}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tokens" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages Chart */}
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <CardTitle>Mensajes Enviados</CardTitle>
              <CardDescription>
                Historial de mensajes enviados en los últimos {selectedRange} {selectedRange === 1 ? 'día' : 'días'}
              </CardDescription>
            </div>
            <DateRangeSelector />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !hasData ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay datos de uso disponibles</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-sm text-green-500">
                              Mensajes: {payload[0].value?.toLocaleString()}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="messages" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

