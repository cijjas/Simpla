import { useState } from 'react';
import { toast } from 'sonner';
import { useSubscriptionContext } from '../context/subscription-context';

export function useUpgradeHandler() {
  const { status, tiers, upgrade } = useSubscriptionContext();
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
    } catch {
      toast.error('Error al actualizar el plan. Por favor, inténtalo de nuevo.');
    } finally {
      setIsUpgrading(null);
    }
  };

  return {
    handleUpgrade,
    isUpgrading,
  };
}
