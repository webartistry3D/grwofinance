import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Star, Shield, Zap } from "lucide-react";

export default function CTASection() {
  return (
    <section className="px-4 py-16 md:py-20 lg:py-24 w-full bg-gradient-to-l from-[#082118] to-[#29A378]">
      <div className="max-w-4xl mx-auto w-full text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 font-display text-white">
          Ready to Transform Your Business Finances?
        </h2>
        
        <p className="text-lg md:text-xl text-white/90 mb-8 md:mb-12 max-w-3xl mx-auto">
          Join thousands of Nigerian businesses using GrwoFinance to save time, reduce errors, and make smarter financial decisions.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-[#29A378] hover:bg-white/90 font-semibold text-base sm:text-lg px-8 py-4"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-[#29A378] font-semibold text-base sm:text-lg px-8 py-4"
          >
            Schedule Demo
          </Button>
        </div>
        
        {/* Trust Indicators */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-1">No Credit Card</h3>
            <p className="text-white/70 text-sm">Start free, no hidden fees</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-1">Quick Setup</h3>
            <p className="text-white/70 text-sm">Running in 5 minutes</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-1">Secure & Private</h3>
            <p className="text-white/70 text-sm">Bank-level security</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-1">24/7 Support</h3>
            <p className="text-white/70 text-sm">Always here to help</p>
          </div>
        </div>
      </div>
    </section>
  );
}
