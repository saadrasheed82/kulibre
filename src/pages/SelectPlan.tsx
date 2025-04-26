
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { 
  Check, 
  X, 
  DollarSign 
} from 'lucide-react';

export default function SelectPlan() {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'basic' | 'premium'>('free');
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .single();

      if (subscriptionData?.tier !== 'free') {
        navigate('/dashboard');
      }
    };

    checkUserSubscription();
  }, [navigate]);

  const handlePlanSelection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('subscriptions')
        .update({ tier: selectedPlan })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`Welcome to the ${selectedPlan} plan!`);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Plan selection failed');
    }
  };

  const PlanCard = ({ 
    title, 
    price, 
    features, 
    unavailable = [],
    value 
  }: { 
    title: string, 
    price: string, 
    features: string[], 
    unavailable?: string[],
    value: 'free' | 'basic' | 'premium'
  }) => (
    <Card 
      className={`w-full max-w-sm cursor-pointer ${
        selectedPlan === value 
          ? 'border-2 border-creatively-purple' 
          : 'border-gray-200'
      }`}
      onClick={() => setSelectedPlan(value)}
    >
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {title}
          <DollarSign className="h-5 w-5" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold">{price}</div>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              {feature}
            </li>
          ))}
          {unavailable.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-muted-foreground">
              <X className="h-4 w-4 text-red-500" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h1>
        <div className="flex justify-center gap-6 mb-8">
          <PlanCard 
            title="Free" 
            price="$0" 
            value="free"
            features={[
              "Up to 5 Projects",
              "Basic Task Management",
              "Collaborative Workspace"
            ]}
            unavailable={[
              "Advanced Analytics", 
              "Priority Support",
              "Unlimited Projects"
            ]} 
          />
          <PlanCard 
            title="Basic" 
            price="$9.99/mo" 
            value="basic"
            features={[
              "Up to 20 Projects",
              "Advanced Task Management",
              "Team Collaboration",
              "Basic Analytics"
            ]}
            unavailable={[
              "Enterprise Features",
              "Priority Support"
            ]} 
          />
          <PlanCard 
            title="Premium" 
            price="$24.99/mo" 
            value="premium"
            features={[
              "Unlimited Projects",
              "Advanced Analytics",
              "Priority Support",
              "Custom Integrations",
              "Advanced Team Management"
            ]} 
          />
        </div>
        <div className="text-center">
          <Button 
            className="px-12 py-3 text-lg"
            onClick={handlePlanSelection}
          >
            Continue with {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
