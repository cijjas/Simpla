'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Info, Calendar, Filter } from 'lucide-react';

interface UsageEvent {
  id: string;
  date: string;
  model: string;
  kind: 'Included' | 'Errored' | 'On-Demand';
  tokens: number;
  cost: number;
  status: 'success' | 'error' | 'pending';
}

interface UsageEventsTableProps {
  events: UsageEvent[];
  isLoading?: boolean;
}

export function UsageEventsTable({ events, isLoading = false }: UsageEventsTableProps) {
  const [dateRange, setDateRange] = useState('7d');
  const [filterKind, setFilterKind] = useState('all');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  const formatCost = (cost: number, kind: string) => {
    if (kind === 'Errored') return '-';
    return `$${cost.toFixed(2)} ${kind === 'Included' ? 'Included' : 'Charged'}`;
  };

  const getKindBadgeVariant = (kind: string) => {
    switch (kind) {
      case 'Included':
        return 'default';
      case 'Errored':
        return 'destructive';
      case 'On-Demand':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredEvents = (events || []).filter(event => {
    if (filterKind === 'all') return true;
    return event.kind.toLowerCase() === filterKind.toLowerCase();
  });

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Model', 'Kind', 'Tokens', 'Cost'],
      ...filteredEvents.map(event => [
        formatDate(event.date),
        event.model,
        event.kind,
        event.tokens.toString(),
        formatCost(event.cost, event.kind)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-events-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <CardDescription>Loading usage events...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>All Events</CardTitle>
            <CardDescription>
              Detailed log of all your usage events
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1d</SelectItem>
                <SelectItem value="7d">7d</SelectItem>
                <SelectItem value="30d">30d</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterKind} onValueChange={setFilterKind}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="included">Included</SelectItem>
                <SelectItem value="errored">Errored</SelectItem>
                <SelectItem value="on-demand">On-Demand</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {(events || []).length === 0 ? 
                      "No usage events found. Start using the API to see your usage history here." : 
                      "No events found for the selected filters"
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {formatDate(event.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.model}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getKindBadgeVariant(event.kind)}>
                        {event.kind === 'Errored' ? 'Errored, Not Charged' : event.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {formatTokens(event.tokens)}
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCost(event.cost, event.kind)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        {filteredEvents.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {filteredEvents.reduce((sum, event) => sum + event.tokens, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                ${filteredEvents.reduce((sum, event) => sum + event.cost, 0).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {filteredEvents.filter(event => event.kind === 'Included').length}
              </div>
              <div className="text-sm text-muted-foreground">Successful Events</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
