'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Zap } from 'lucide-react';

interface UsageDataPoint {
  date: string;
  tokens_used: number;
  messages_sent: number;
  period_type: string;
}

interface UsageGraphProps {
  dailyUsage: UsageDataPoint[];
  hourlyUsage: UsageDataPoint[];
}

export function UsageGraph({ dailyUsage, hourlyUsage }: UsageGraphProps) {
  // Simple chart component using CSS and basic HTML
  const maxTokens = Math.max(...dailyUsage.map(d => d.tokens_used), 1);
  const maxMessages = Math.max(...dailyUsage.map(d => d.messages_sent), 1);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatHour = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Historial de Uso
        </CardTitle>
        <CardDescription>
          Visualiza tu uso de tokens y mensajes a lo largo del tiempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">Últimos 7 días</TabsTrigger>
            <TabsTrigger value="hourly">Últimas 24 horas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4" />
                <span>Tokens por día</span>
              </div>
              <div className="space-y-2">
                {dailyUsage.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay datos de uso disponibles</p>
                  </div>
                ) : (
                  dailyUsage.map((data, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-16 text-xs text-muted-foreground">
                        {formatDate(data.date)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-muted-foreground">Tokens</span>
                          <span className="text-xs font-medium">{data.tokens_used.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(data.tokens_used / maxTokens) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-muted-foreground">Mensajes</span>
                          <span className="text-xs font-medium">{data.messages_sent}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(data.messages_sent / maxMessages) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="hourly" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span>Uso por hora</span>
              </div>
              <div className="space-y-2">
                {hourlyUsage.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay datos de uso por hora disponibles</p>
                  </div>
                ) : (
                  hourlyUsage.map((data, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-20 text-xs text-muted-foreground">
                        {formatHour(data.date)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-muted-foreground">Tokens</span>
                          <span className="text-xs font-medium">{data.tokens_used.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(data.tokens_used / maxTokens) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-muted-foreground">Mensajes</span>
                          <span className="text-xs font-medium">{data.messages_sent}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(data.messages_sent / maxMessages) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

