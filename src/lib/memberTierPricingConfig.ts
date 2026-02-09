/**
 * Member Subscription Tier Configuration
 * Pricing and benefits for fans/followers subscribing to creators
 * Different from Creator membership tiers
 */

export type MemberTier = 'basic' | 'premium' | 'vip';
export type BillingCycle = 'monthly' | 'annual';

interface TierPricing {
  monthly: number;
  annual: number;
}

interface TierConfig {
  name: string;
  displayName: string;
  description: string;
  pricing: TierPricing;
  benefits: string[];
  color: string; // For UI styling
}

const TIER_CONFIGS: Record<MemberTier, TierConfig> = {
  basic: {
    name: 'basic',
    displayName: 'Basic Member',
    description: 'Support your favorite creator',
    pricing: {
      monthly: 4.99,
      annual: 49.99,
    },
    benefits: [
      'Access to member-only content',
      'Early access to new posts',
      'Member badge on creator posts',
      'Monthly creator Q&A access',
      'Exclusive member community',
    ],
    color: 'blue',
  },
  premium: {
    name: 'premium',
    displayName: 'Premium Member',
    description: 'Premium support & exclusive access',
    pricing: {
      monthly: 9.99,
      annual: 99.99,
    },
    benefits: [
      'Everything in Basic',
      'Priority support from creator',
      'Exclusive behind-the-scenes content',
      'Monthly one-on-one calls (30 min)',
      'Custom shoutout on creator post',
      'Ad-free experience',
      'Access to member Discord channel',
    ],
    color: 'purple',
  },
  vip: {
    name: 'vip',
    displayName: 'VIP Member',
    description: 'Ultimate fan experience',
    pricing: {
      monthly: 24.99,
      annual: 249.99,
    },
    benefits: [
      'Everything in Premium',
      'Dedicated VIP support (direct messaging)',
      'Monthly one-on-one calls (1 hour)',
      'Custom content request (monthly)',
      'VIP badge on all interactions',
      'Name featured on creator\'s members page',
      'Exclusive VIP-only livestreams',
      'Early access to creator products',
      'Annual birthday gift from creator',
      'Lifetime discounts on creator merch',
    ],
    color: 'rose',
  },
};

export function getTierConfig(tier: MemberTier): TierConfig {
  return TIER_CONFIGS[tier];
}

export function getTierPrice(tier: MemberTier, cycle: BillingCycle): number {
  return TIER_CONFIGS[tier].pricing[cycle];
}

export function getBillingPeriodMonths(cycle: BillingCycle): number {
  return cycle === 'annual' ? 12 : 1;
}

export function getEffectiveMonthlyRate(
  tier: MemberTier,
  cycle: BillingCycle
): number {
  const price = getTierPrice(tier, cycle);
  const months = getBillingPeriodMonths(cycle);
  return price / months;
}

export function getAllTiers(): MemberTier[] {
  return ['basic', 'premium', 'vip'];
}

export function getTierDisplayName(tier: MemberTier): string {
  return TIER_CONFIGS[tier].displayName;
}

export function getTierDescription(tier: MemberTier): string {
  return TIER_CONFIGS[tier].description;
}

export function getTierBenefits(tier: MemberTier): string[] {
  return TIER_CONFIGS[tier].benefits;
}

export function isValidTierUpgrade(
  currentTier: MemberTier,
  targetTier: MemberTier
): boolean {
  const tierOrder: Record<MemberTier, number> = {
    basic: 1,
    premium: 2,
    vip: 3,
  };
  return tierOrder[targetTier] > tierOrder[currentTier];
}

export function getNextTier(tier: MemberTier): MemberTier | null {
  const tiers: MemberTier[] = ['basic', 'premium', 'vip'];
  const currentIndex = tiers.indexOf(tier);
  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return null;
  }
  return tiers[currentIndex + 1];
}

export function calculateSavings(
  tier: MemberTier
): { amount: number; percentage: number } {
  const monthlyPrice = getTierPrice(tier, 'monthly');
  const annualPrice = getTierPrice(tier, 'annual');
  const annualMonthlyEquivalent = monthlyPrice * 12;
  const savings = annualMonthlyEquivalent - annualPrice;
  const percentage = Math.round((savings / annualMonthlyEquivalent) * 100);

  return {
    amount: savings,
    percentage,
  };
}

export default TIER_CONFIGS;
