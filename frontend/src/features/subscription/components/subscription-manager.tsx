'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscription } from '../hooks/use-subscription';
import { SubscriptionCard } from './subscription-card';
import { UsageDisplay } from './usage-display';

export function SubscriptionManager() {
  const { status, tiers, isLoading, error, upgrade } = useSubscription();
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

  const handleUpgrade = async (tierName: string) => {
    if (!status || tierName === status.tier.name) return;

    setIsUpgrading(tierName);
    try {
      const success = await upgrade(tierName);
      if (success) {
        toast.success(`¡Plan actualizado a ${tiers.find(t => t.name === tierName)?.display_name}!`);
      } else {
        toast.error('Error al actualizar el plan. Por favor, inténtalo de nuevo.');
      }
    } catch (err) {
      toast.error('Error al actualizar el plan. Por favor, inténtalo de nuevo.');
    } finally {
      setIsUpgrading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Cargando información de suscripción...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar la información de suscripción: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!status || !tiers.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No se pudo cargar la información de suscripción.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
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

      {/* Available Plans */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Planes Disponibles</h3>
          <p className="text-sm text-muted-foreground">
            Cambia tu plan en cualquier momento. Los cambios se aplican inmediatamente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <SubscriptionCard
              key={tier.id}
              tier={tier}
              isCurrentPlan={tier.name === status.tier.name}
              onUpgrade={handleUpgrade}
              isLoading={isUpgrading === tier.name}
            />
          ))}
        </div>
      </div>

      {/* Information Note */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Nota:</strong> Los cambios de plan se aplican inmediatamente. 
          No hay período de facturación adicional. Todos los planes incluyen acceso completo 
          a las funciones básicas de Simpla.
        </AlertDescription>
      </Alert>
    </div>
  );
}

