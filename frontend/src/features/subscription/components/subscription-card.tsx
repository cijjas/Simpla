'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Star, Crown } from 'lucide-react';
import type { SubscriptionTier } from '../types';

interface SubscriptionCardProps {
  tier: SubscriptionTier;
  isCurrentPlan?: boolean;
  onUpgrade?: (tierName: string) => void;
  isLoading?: boolean;
}

const tierIcons = {
  free: Zap,
  pro: Star,
  enterprise: Crown,
};

const tierColors = {
  free: 'bg-gray-100 text-gray-800 border-gray-200',
  pro: 'bg-blue-100 text-blue-800 border-blue-200',
  enterprise: 'bg-purple-100 text-purple-800 border-purple-200',
};

export function SubscriptionCard({ tier, isCurrentPlan, onUpgrade, isLoading }: SubscriptionCardProps) {
  const Icon = tierIcons[tier.name as keyof typeof tierIcons] || Zap;
  const colorClass = tierColors[tier.name as keyof typeof tierColors] || tierColors.free;

  const formatPrice = (priceDollars: number) => {
    if (priceDollars === 0) return 'Gratis';
    return `$${priceDollars.toFixed(2)}/mes`;
  };

  const formatLimit = (limit: number | null) => {
    if (limit === null) return 'Ilimitado';
    if (limit >= 1000000) return `${(limit / 1000000).toFixed(1)}M`;
    if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K`;
    return limit.toString();
  };

  const getFeatureList = () => {
    const features = [];
    
    if (tier.max_tokens_per_day !== null) {
      features.push(`${formatLimit(tier.max_tokens_per_day)} tokens por día`);
    } else {
      features.push('Tokens ilimitados');
    }
    
    if (tier.max_messages_per_day !== null) {
      features.push(`${formatLimit(tier.max_messages_per_day)} mensajes por día`);
    } else {
      features.push('Mensajes ilimitados');
    }
    
    if (tier.max_messages_per_hour !== null) {
      features.push(`${formatLimit(tier.max_messages_per_hour)} mensajes por hora`);
    } else {
      features.push('Sin límite horario');
    }
    
    // Add feature flags
    if (tier.features.basic_chat) features.push('Chat básico');
    if (tier.features.document_search) features.push('Búsqueda de documentos');
    if (tier.features.priority_support) features.push('Soporte prioritario');
    if (tier.features.advanced_features) features.push('Funciones avanzadas');
    if (tier.features.api_access) features.push('Acceso a API');
    if (tier.features.dedicated_support) features.push('Soporte dedicado');
    
    return features;
  };

  return (
    <Card className={`relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-500 text-white">Plan Actual</Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${colorClass} mb-4`}>
          <Icon className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl">{tier.display_name}</CardTitle>
        <CardDescription className="text-2xl font-bold text-primary">
          {formatPrice(tier.price_usd)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {getFeatureList().map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        {!isCurrentPlan && onUpgrade && (
          <Button 
            onClick={() => onUpgrade(tier.name)}
            disabled={isLoading}
            className="w-full"
            variant={tier.name === 'enterprise' ? 'default' : 'outline'}
          >
            {isLoading ? 'Procesando...' : 'Seleccionar Plan'}
          </Button>
        )}
        
        {isCurrentPlan && (
          <Button 
            disabled 
            className="w-full" 
            variant="outline"
          >
            Plan Actual
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
