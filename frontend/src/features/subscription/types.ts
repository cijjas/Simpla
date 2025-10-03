export interface SubscriptionTier {
  id: string;
  name: string;
  display_name: string;
  price_usd: number;
  max_tokens_per_day: number | null;
  max_tokens_per_month: number | null;
  max_messages_per_day: number | null;
  max_messages_per_hour: number | null;
  max_concurrent_chats: number | null;
  features: Record<string, boolean>;
  is_active: boolean;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  current_usage: {
    tokens_today: number;
    messages_today: number;
    messages_this_hour: number;
  };
  limits: {
    tokens_per_day: number | null;
    tokens_per_month: number | null;
    messages_per_day: number | null;
    messages_per_hour: number | null;
    concurrent_chats: number | null;
  };
  features: Record<string, boolean>;
}

export interface UpgradeRequest {
  tier_name: string;
}

export interface UpgradeResponse {
  success: boolean;
  message: string;
  new_tier: SubscriptionTier;
}

