'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useSubscriptionContext } from '../context/subscription-context';
import { useUpgradeHandler } from '../hooks/use-upgrade-handler';
import { SubscriptionCard } from './subscription-card';

export function PlansManager() {
  const { status, tiers, isLoading, error } = useSubscriptionContext();
  const { handleUpgrade, isUpgrading } = useUpgradeHandler();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Cargando planes disponibles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar los planes: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!status || !tiers.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No se pudo cargar la información de planes.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
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

