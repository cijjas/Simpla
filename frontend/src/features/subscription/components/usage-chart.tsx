'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApi } from '@/features/auth/hooks/use-api';
import { TrendingUp, MessageSquare, Activity } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

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
      setIsLoading(false);
    } else if (initialLoading !== undefined) {
      setIsLoading(initialLoading);
    }
  }, [initialUsageHistory, initialLoading]);

  const fetchUsageHistory = async (days: DateRange) => {
    const cached = cacheRef.current.get(days);
    if (cached) {
      setCurrentData(cached);
      return;
    }

    setIsLoading(true);
    try {
      const response = await get<UsageHistoryResponse>(`/api/subscription/usage-history?days=${days}`);
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

  const dailyUsage = currentData?.daily_usage || [];
  
  const processData = (data: UsageDataPoint[]) => {
    return data.map(item => {
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
        fullDate: item.date,
      };
    });
  };

  // Enhanced chart configuration with proper shadcn styling
  const chartConfig = {
    tokens: {
      label: "Tokens",
      color: "var(--chart-1)",
    },
    messages: {
      label: "Mensajes",
      color: "var(--chart-2)",
    },
  };

  const chartData = processData(dailyUsage);
  const hasData = chartData.length > 0;

  const DateRangeSelector = () => (
    <div className="inline-flex items-center rounded-lg bg-muted p-1">
      {([1, 7, 30] as DateRange[]).map((range) => (
        <button
          key={range}
          onClick={() => handleRangeChange(range)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            selectedRange === range
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {range === 1 ? '24h' : `${range}d`}
        </button>
      ))}
    </div>
  );

  const ChartSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  );

  const EmptyState = ({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) => (
    <div className="flex items-center justify-center h-[300px] rounded-lg border-2 border-dashed border-muted">
      <div className="text-center space-y-2">
        <Icon className="w-12 h-12 text-muted-foreground/50 mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">No hay datos disponibles</p>
        <p className="text-xs text-muted-foreground">Los datos de uso aparecerán aquí</p>
      </div>
    </div>
  );

  // Calculate statistics (only when we have data)
  const totalTokens = hasData ? chartData.reduce((sum, item) => sum + item.tokens, 0) : 0;
  const totalMessages = hasData ? chartData.reduce((sum, item) => sum + item.messages, 0) : 0;
  const avgTokens = hasData && chartData.length > 0 ? Math.round(totalTokens / chartData.length) : 0;
  const avgMessages = hasData && chartData.length > 0 ? Math.round(totalMessages / chartData.length) : 0;

  // Calculate trends (compare last vs previous period)
  const midpoint = hasData && chartData.length > 1 ? Math.floor(chartData.length / 2) : 0;
  const recentTokens = hasData && midpoint > 0 ? chartData.slice(midpoint).reduce((sum, item) => sum + item.tokens, 0) : 0;
  const previousTokens = hasData && midpoint > 0 ? chartData.slice(0, midpoint).reduce((sum, item) => sum + item.tokens, 0) : 0;
  const tokenTrend = previousTokens > 0 ? ((recentTokens - previousTokens) / previousTokens) * 100 : 0;

  const recentMessages = hasData && midpoint > 0 ? chartData.slice(midpoint).reduce((sum, item) => sum + item.messages, 0) : 0;
  const previousMessages = hasData && midpoint > 0 ? chartData.slice(0, midpoint).reduce((sum, item) => sum + item.messages, 0) : 0;
  const messageTrend = previousMessages > 0 ? ((recentMessages - previousMessages) / previousMessages) * 100 : 0;

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
      <div className={`flex items-center text-xs font-medium`} style={{ color: isPositive ? 'hsl(var(--chart-3))' : 'hsl(var(--chart-4))' }}>
        <TrendingUp className={`h-3 w-3 mr-1 ${!isPositive && 'rotate-180'}`} />
        {Math.abs(value).toFixed(1)}%
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--chart-1) / 0.1)' }}>
                      <Activity className="h-5 w-5" style={{ color: 'hsl(var(--chart-1))' }} />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Tokens Utilizados</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold tracking-tight">{totalTokens.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      Promedio: {avgTokens.toLocaleString()} / día
                    </p>
                  </div>
                </div>
                <TrendIndicator value={tokenTrend} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--chart-2) / 0.1)' }}>
                      <MessageSquare className="h-5 w-5" style={{ color: 'hsl(var(--chart-2))' }} />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Mensajes Enviados</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold tracking-tight">{totalMessages.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      Promedio: {avgMessages.toLocaleString()} / día
                    </p>
                  </div>
                </div>
                <TrendIndicator value={messageTrend} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Unified Chart Section with Single Date Range Selector */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="text-xl">Análisis de Uso</CardTitle>
              <CardDescription>
                Historial de tokens y mensajes en los últimos {selectedRange} {selectedRange === 1 ? 'día' : 'días'}
              </CardDescription>
            </div>
            <DateRangeSelector />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          ) : !hasData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EmptyState icon={Activity} title="Tokens" />
              <EmptyState icon={MessageSquare} title="Mensajes" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tokens Chart */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Tokens Utilizados</h3>
                </div>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart 
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-tokens)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-tokens)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      className="stroke-muted" 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                      tickFormatter={(value) => {
                        if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                        return value.toString();
                      }}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent indicator="line" />}
                      cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="tokens"
                      stroke="var(--color-tokens)"
                      fill="url(#colorTokens)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ 
                        r: 4, 
                        fill: "var(--color-tokens)",
                        stroke: "hsl(var(--background))",
                        strokeWidth: 2 
                      }}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>

              {/* Messages Chart */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Mensajes Enviados</h3>
                </div>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart 
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      className="stroke-muted" 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                      tickFormatter={(value) => value.toString()}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent indicator="dashed" />}
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                    />
                    <Bar
                      dataKey="messages"
                      fill="var(--color-messages)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}