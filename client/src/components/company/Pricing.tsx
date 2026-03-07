import { Check, Star, Users, Zap, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
}

function PricingCard({ plan, index }: { plan: PricingPlan; index: number }) {
  return (
    <div className={`relative bg-gradient-to-br from-background to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 md:p-8 h-full border border-gray-100 dark:border-gray-700 group ${plan.highlighted ? 'ring-2 ring-[#29A378] ring-offset-2 scale-105' : 'hover:scale-105'}`}>
      {plan.highlighted && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#29A378] to-[#119e6c] dark:from-[#1a3a3a] dark:to-[#0f172a] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
          MOST POPULAR
        </div>
      )}
      
      <div className="mb-6">
        <h3 className={`text-2xl font-bold mb-2 text-foreground group-hover:text-[#29A378] transition-colors duration-300`}>{plan.name}</h3>
        <div className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-[#29A378] to-[#119e6c] dark:from-[#1a3a3a] dark:to-[#0f172a] bg-clip-text text-transparent">
          {plan.price}
        </div>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base mb-6">{plan.description}</p>
        
        <ul className="space-y-3 mb-6">
          {plan.features.map((feature, featureIndex) => (
            <li key={featureIndex} className="flex items-start">
              <div className="w-8 h-8 bg-[#29A378]/10 dark:bg-[#1a3a3a]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-[#29A378] dark:text-[#f97316]" />
              </div>
              <span className="text-gray-700 dark:text-gray-200 text-sm md:text-base">{feature}</span>
            </li>
          ))}
        </ul>
        
        <div className="mt-auto">
          <Button 
            className={`w-full font-medium transition-all duration-300 hover:scale-105 ${
              plan.highlighted 
                ? 'bg-gradient-to-r from-[#29A378] to-[#119e6c] text-white hover:from-[#29A378]/90 hover:to-[#119e6c]/90 shadow-lg hover:shadow-xl' 
                : 'bg-background text-[#29A378] hover:bg-[#29A378]/10 border border-[#29A378] dark:border-[#29A378]'
            }`}
          >
            {plan.buttonText || "Get Started"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Pricing() {
  const plans: PricingPlan[] = [
    {
      name: "Starter",
      price: "₦5,000",
      description: "Perfect for small businesses and startups just getting started with digital finance",
      features: [
        "Up to 50 transactions per month",
        "Basic expense tracking",
        "Email support",
        "Mobile app access"
      ],
      buttonText: "Get Started"
    },
    {
      name: "Professional",
      price: "₦15,000",
      description: "Ideal for growing businesses needing advanced features and support",
      features: [
        "Unlimited transactions",
        "Advanced analytics",
        "Priority support",
        "API access",
        "Team collaboration"
      ],
      buttonText: "Get Started",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Tailored solutions for large organizations with specific requirements",
      features: [
        "Custom features",
        "Dedicated account manager",
        "Advanced security",
        "Custom integrations",
        "SLA guarantee"
      ],
      buttonText: "Contact Sales"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-background to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#29A378] to-[#119e6c] rounded-2xl flex items-center justify-center mr-4 md:mr-6 shadow-lg">
          <Star className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Transparent Pricing</h3>
          <p className="text-sm md:text-base text-gray-600">Simple pricing designed for Nigerian businesses</p>
        </div>
      </div>
      
      <p className="text-gray-600 mb-8 leading-relaxed text-sm md:text-base">
        Simple, transparent pricing designed for Nigerian businesses of all sizes. 
        No hidden fees or surprise charges.
      </p>
      
      <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
        {plans.map((plan, index) => (
          <PricingCard key={index} plan={plan} index={index} />
        ))}
      </div>
      
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-[#29A378]/5 to-[#119e6c]/5 rounded-2xl p-4 border border-[#29A378]/20 text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-[#29A378] to-[#119e6c] rounded-xl flex items-center justify-center mx-auto mb-2">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h4 className="font-semibold text-foreground mb-1">30-Day Guarantee</h4>
          <p className="text-sm text-gray-600">Money-back guarantee</p>
        </div>
        
        <div className="bg-gradient-to-r from-[#29A378]/5 to-[#119e6c]/5 rounded-2xl p-4 border border-[#29A378]/20 text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-[#29A378] to-[#119e6c] rounded-xl flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h4 className="font-semibold text-foreground mb-1">No Setup Fees</h4>
          <p className="text-sm text-gray-600">Start instantly</p>
        </div>
        
        <div className="bg-gradient-to-r from-[#29A378]/5 to-[#119e6c]/5 rounded-2xl p-4 border border-[#29A378]/20 text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-[#29A378] to-[#119e6c] rounded-xl flex items-center justify-center mx-auto mb-2">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h4 className="font-semibold text-foreground mb-1">Cancel Anytime</h4>
          <p className="text-sm text-gray-600">No long-term contracts</p>
        </div>
      </div>
    </div>
  );
}
