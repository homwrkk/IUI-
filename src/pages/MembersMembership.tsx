import React, { useState, useEffect } from 'react';
import { Crown, Heart, Check, Lock, Users, Gift, MessageCircle, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { MemberTier, getTierConfig, getTierPrice, getAllTiers, getTierBenefits, calculateSavings } from '../lib/memberTierPricingConfig';
import MembershipPaymentModalV2 from '../components/MembershipPaymentModalV2';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
  duration?: number;
}

const TIER_COLORS: Record<MemberTier, { color: string; bgColor: string; icon: React.ReactNode }> = {
  basic: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    icon: <Heart className="w-8 h-8 text-blue-400" />,
  },
  premium: {
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    icon: <Sparkles className="w-8 h-8 text-purple-400" />,
  },
  vip: {
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    icon: <Crown className="w-8 h-8 text-rose-400" />,
  },
};

export default function MembersMembership() {
  const { user } = useAuth();
  const [currentMemberTier, setCurrentMemberTier] = useState<MemberTier>('basic');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<MemberTier>('premium');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(true);

  // Load current membership tier
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadMembershipStatus();
  }, [user]);

  const loadMembershipStatus = async () => {
    try {
      setLoading(true);
      // Fetch user's current membership tier
      const { data } = await supabase
        .from('members_membership')
        .select('new_tier')
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()
        .catch(() => ({ data: null }));

      if (data) {
        setCurrentMemberTier(data.new_tier as MemberTier);
      } else {
        setCurrentMemberTier('basic');
      }
    } catch (error) {
      console.error('Error loading membership status:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToast = (message: string, type: 'success' | 'error' = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, type, message, duration };
    setToasts((prev) => [...prev, toast]);

    if (duration) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  };

  const handleSelectTier = (tier: MemberTier) => {
    if (tier === currentMemberTier) {
      addToast('You are already on this tier', 'error');
      return;
    }
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    addToast('Welcome to our membership community! 🎉', 'success');
    await loadMembershipStatus();
  };

  const handlePaymentError = (error: string) => {
    addToast(`Payment failed: ${error}`, 'error');
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto text-center py-20">
          <h1 className="text-4xl font-bold text-white mb-4">Member Subscriptions</h1>
          <p className="text-gray-400 mb-8">Please sign in to view available memberships</p>
        </div>
      </div>
    );
  }

  const allTiers = getAllTiers();

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Join Our Membership Community</h1>
          <p className="text-gray-400 text-lg">Get exclusive access to premium content, early releases, and special community benefits</p>
        </div>

        {/* Current Status */}
        <div className="mb-12 p-6 bg-white/5 border border-white/10 rounded-lg max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Your Current Membership Tier</p>
              <p className="text-2xl font-semibold text-white capitalize">{currentMemberTier}</p>
            </div>
            {currentMemberTier !== 'basic' && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {allTiers.map((tier) => {
            const config = getTierConfig(tier);
            const monthlyPrice = getTierPrice(tier, 'monthly');
            const annualPrice = getTierPrice(tier, 'annual');
            const savings = calculateSavings(tier);
            const tierColors = TIER_COLORS[tier];
            const isCurrentTier = tier === currentMemberTier;

            return (
              <div
                key={tier}
                className={`relative rounded-2xl border-2 transition-all overflow-hidden group ${
                  isCurrentTier
                    ? 'border-rose-500 bg-gradient-to-b from-rose-500/20 to-slate-900'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {/* Badge */}
                {isCurrentTier && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-rose-500 rounded-full">
                    <p className="text-xs font-semibold text-white">Current Tier</p>
                  </div>
                )}

                <div className="p-6 sm:p-8">
                  {/* Icon & Name */}
                  <div className="mb-6">
                    <div className={`w-16 h-16 ${tierColors.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                      {tierColors.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white capitalize mb-2">{config.displayName}</h3>
                    <p className="text-gray-400 text-sm">{config.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <p className="text-4xl font-bold text-white mb-1">${monthlyPrice}</p>
                    <p className="text-sm text-gray-400">/month or ${annualPrice}/year</p>
                    {savings.percentage > 0 && (
                      <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-xs text-green-400 font-medium">
                          Save ${savings.amount.toFixed(2)} ({savings.percentage}%) with annual billing
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Benefits */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-300 mb-4">What's Included:</p>
                    <ul className="space-y-3">
                      {getTierBenefits(tier).map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-300">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleSelectTier(tier)}
                    disabled={isCurrentTier}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      isCurrentTier
                        ? 'bg-white/10 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg hover:shadow-rose-500/50'
                    }`}
                  >
                    {isCurrentTier ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Current Tier
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5" />
                        Subscribe Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-rose-500/20 border border-rose-500 rounded-full flex items-center justify-center">
                  <span className="text-rose-400 font-bold text-sm">1</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Choose Your Tier</h3>
                <p className="text-gray-400">Select from our membership tiers to unlock exclusive content and benefits from your favorite creators.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-rose-500/20 border border-rose-500 rounded-full flex items-center justify-center">
                  <span className="text-rose-400 font-bold text-sm">2</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Secure Payment</h3>
                <p className="text-gray-400">Complete your payment securely through our trusted payment partners with multiple payment options.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-rose-500/20 border border-rose-500 rounded-full flex items-center justify-center">
                  <span className="text-rose-400 font-bold text-sm">3</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Unlock Access</h3>
                <p className="text-gray-400">Instantly gain access to exclusive content, priority support, and special perks from creators.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Highlight */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center">
            <Gift className="w-6 h-6 text-rose-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">Exclusive Content</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center">
            <MessageCircle className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">Direct Support</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center">
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">Community Access</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center">
            <Sparkles className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">Special Perks</p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <MembershipPaymentModalV2
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        membershipType="member"
        currentTier={currentMemberTier}
        targetTier={selectedTier}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        userName={user?.user_metadata?.full_name || 'Member'}
        userEmail={user?.email || ''}
        userId={user?.id || ''}
        phoneNumber={user?.phone || ''}
      />

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 space-y-2 z-40">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg text-white flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
