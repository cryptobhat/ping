'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Crown, Check, Sparkles, Zap, Shield, Palette, Download,
  Star, BookOpen, Users, MessageCircle, Award, X, Heart, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { subscriptionApi, paymentApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const features = [
  { icon: Zap, label: 'Ad-free reading', desc: 'No interruptions while reading' },
  { icon: Crown, label: 'Premium content', desc: 'Exclusive stories and series' },
  { icon: Download, label: 'Offline downloads', desc: 'Read anywhere, anytime' },
  { icon: Palette, label: 'Custom themes', desc: 'Personalize your reading' },
  { icon: Shield, label: 'Priority support', desc: 'Get help faster' },
  { icon: Star, label: 'Profile badge', desc: 'Stand out in the community' },
];

const comparison = [
  { feature: 'Read free content', free: true, premium: true },
  { feature: 'Write and publish', free: true, premium: true },
  { feature: 'Ad-free experience', free: false, premium: true },
  { feature: 'Premium stories', free: false, premium: true },
  { feature: 'Offline reading', free: false, premium: true },
  { feature: 'Custom themes', free: false, premium: true },
  { feature: 'Priority support', free: false, premium: true },
  { feature: 'Profile badge', free: false, premium: true },
  { feature: 'Early access to new features', free: false, premium: true },
  { feature: 'Bonus coins monthly', free: false, premium: true },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [currentSub, setCurrentSub] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.allSettled([
        subscriptionApi.getPlans(),
        isAuthenticated ? subscriptionApi.getMe() : Promise.reject('not auth'),
      ]);

      if (plansRes.status === 'fulfilled') {
        const planList = plansRes.value.data?.data ?? plansRes.value.data ?? [];
        const normalizedPlans = Array.isArray(planList) ? planList : [];
        setPlans(normalizedPlans);
        // Auto-select the first "popular" plan or the middle one
        const popular = normalizedPlans.find((p: any) => p.popular || p.isPopular);
        if (popular) {
          setSelectedPlan(popular.id);
        } else if (normalizedPlans.length > 1) {
          setSelectedPlan(normalizedPlans[1].id);
        } else if (normalizedPlans.length > 0) {
          setSelectedPlan(normalizedPlans[0].id);
        }
      }

      if (subRes.status === 'fulfilled') {
        const sub = subRes.value.data?.data ?? subRes.value.data;
        setCurrentSub(sub);
      }
    } catch {
      // Plans may still load even if subscription check fails
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push('/login?next=/subscription');
      return;
    }
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }
    setSubscribing(true);
    try {
      const plan = plans.find((p: any) => p.id === selectedPlan);
      if (!plan) { toast.error('Invalid plan'); return; }
      const { data } = await paymentApi.createOrder({
        amount: plan.price,
        type: 'subscription',
        planId: selectedPlan,
      });
      const order = data?.data ?? data;
      // Open Razorpay checkout
      if (order?.id && typeof window !== 'undefined' && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency || 'INR',
          order_id: order.id,
          name: 'Kalaloka',
          description: `Premium - ${plan.name}`,
          handler: async (response: any) => {
            try {
              await paymentApi.verify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                type: 'subscription',
                planId: selectedPlan,
              });
              toast.success('Subscription activated!');
              loadData();
            } catch {
              toast.error('Payment verification failed');
            }
          },
          theme: { color: '#0D8B7E' },
        });
        rzp.open();
      } else {
        toast.error('Payment gateway not available. Please try again.');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Subscription failed. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const selectedPlanObj = plans.find((p: any) => p.id === selectedPlan);
  const isAlreadySubscribed = currentSub?.status === 'active' || currentSub?.status === 'ACTIVE' || user?.isPremium;

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-8 lg:space-y-10">
      {/* Hero */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-2">
          {isAlreadySubscribed ? 'You\'re Premium!' : 'Go Premium'}
        </h1>
        <p className="text-warm-500 max-w-lg mx-auto">
          {isAlreadySubscribed
            ? 'You have full access to all premium features. Thank you for supporting Kalaloka!'
            : 'Unlock the full Kalaloka experience with ad-free reading, exclusive content, offline downloads, and more'}
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {features.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-start gap-3 p-4 bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-warm-800 dark:text-warm-200">{label}</p>
              <p className="text-xs text-warm-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Plans */}
      {!isAlreadySubscribed && (
        <div>
          <h2 className="text-xl font-bold text-warm-900 dark:text-warm-50 text-center mb-6">Choose Your Plan</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-warm-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading plans...</span>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-warm-500 text-sm">
              No plans available right now. Please check back later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
              {plans.map((plan: any) => {
                const isPopular = plan.popular || plan.isPopular;
                const price = plan.price ?? plan.amount ?? 0;
                const originalPrice = plan.originalPrice ?? plan.mrp;
                const duration = plan.duration || plan.interval || plan.name?.toLowerCase() || 'month';
                const savings = plan.savings || plan.discount;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={cn(
                      'relative p-6 rounded-2xl border-2 transition-all text-left',
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                        : 'border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-900 hover:border-warm-300 dark:hover:border-warm-600'
                    )}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="primary" size="md">Most Popular</Badge>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-warm-900 dark:text-warm-100">{plan.name}</h3>
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        selectedPlan === plan.id ? 'border-primary' : 'border-warm-300 dark:border-warm-600'
                      )}>
                        {selectedPlan === plan.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold text-warm-900 dark:text-warm-100">{'\u20B9'}{price}</span>
                        <span className="text-sm text-warm-400">/{duration}</span>
                      </div>
                      {savings && (
                        <div className="flex items-center gap-2 mt-1">
                          {originalPrice && <span className="text-sm text-warm-400 line-through">{'\u20B9'}{originalPrice}</span>}
                          <Badge variant="success" size="sm">{savings}</Badge>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-warm-500">{plan.desc || plan.description || ''}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subscribe Button */}
      {!isAlreadySubscribed && plans.length > 0 && (
        <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubscribe}
            loading={subscribing}
            icon={<Sparkles className="w-4 h-4" />}
          >
            {!isAuthenticated
              ? 'Sign in to Subscribe'
              : `Subscribe Now${selectedPlanObj ? ` - ${'\u20B9'}${selectedPlanObj.price ?? selectedPlanObj.amount ?? 0}/${selectedPlanObj.duration || selectedPlanObj.interval || 'month'}` : ''}`}
          </Button>
          <p className="text-center text-xs text-warm-400">Cancel anytime. Secure payment via Razorpay.</p>
        </div>
      )}

      {/* Current subscription info */}
      {isAlreadySubscribed && currentSub && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/30 p-6 max-w-lg mx-auto text-center">
          <Crown className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <h3 className="font-bold text-warm-900 dark:text-warm-100 mb-1">Active Subscription</h3>
          {currentSub.plan?.name && <p className="text-sm text-warm-600 dark:text-warm-400">Plan: {currentSub.plan.name}</p>}
          {currentSub.expiresAt && (
            <p className="text-xs text-warm-500 mt-1">
              Renews on {new Date(currentSub.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* Comparison Table */}
      <div>
        <h2 className="text-xl font-bold text-warm-900 dark:text-warm-50 text-center mb-6">Free vs Premium</h2>
        <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 overflow-hidden max-w-2xl mx-auto">
          {/* Table header */}
          <div className="grid grid-cols-3 gap-4 px-5 py-4 bg-warm-50 dark:bg-warm-800/50">
            <div className="text-sm font-semibold text-warm-700 dark:text-warm-300">Feature</div>
            <div className="text-sm font-semibold text-warm-700 dark:text-warm-300 text-center">Free</div>
            <div className="text-sm font-semibold text-amber-600 dark:text-amber-400 text-center flex items-center justify-center gap-1.5">
              <Crown className="w-4 h-4" /> Premium
            </div>
          </div>
          <div className="divide-y divide-warm-100 dark:divide-warm-800">
            {comparison.map((row) => (
              <div key={row.feature} className="grid grid-cols-3 gap-4 px-5 py-3.5 items-center">
                <div className="text-sm text-warm-700 dark:text-warm-300">{row.feature}</div>
                <div className="flex justify-center">
                  {row.free ? (
                    <Check className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <X className="w-5 h-5 text-warm-300 dark:text-warm-600" />
                  )}
                </div>
                <div className="flex justify-center">
                  <Check className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
