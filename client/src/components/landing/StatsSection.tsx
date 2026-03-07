import { Users, Receipt, FileText, Star } from "lucide-react";
import { useState, useEffect } from "react";

function AnimatedNumber({ value, suffix = "", duration }: { value: string; suffix?: string; duration: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isAnimating) {
          setIsAnimating(true);
          const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
          const increment = numericValue / (duration / 16); // 60fps
          let current = 0;
          
          const timer = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
              current = numericValue;
              clearInterval(timer);
            }
            setDisplayValue(Math.floor(current));
          }, 16);
          
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`stat-${value}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [value, duration, isAnimating]);

  return (
    <span id={`stat-${value}`} className="inline-block">
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="px-4 py-8 md:py-10 lg:py-12 w-full bg-gradient-to-r from-[#29A378] to-[#119e6c] relative">
      {/* Vertical dotted lines for demarcation - absolute top to bottom */}
      <div className="hidden md:block absolute top-0 left-1/4 transform -translate-x-1/2 w-px h-full border-l-4 border-dotted border-white/60"></div>
      <div className="hidden md:block absolute top-0 left-1/2 transform -translate-x-1/2 w-px h-full border-l-4 border-dotted border-white/60"></div>
      <div className="hidden md:block absolute top-0 left-3/4 transform -translate-x-1/2 w-px h-full border-l-4 border-dotted border-white/60"></div>
      
      {/* Mobile vertical dotted line - absolute top to bottom */}
      <div className="md:hidden absolute top-0 left-1/2 transform -translate-x-1/2 w-px h-full border-l-4 border-dotted border-white/60"></div>
      
      <div className="max-w-6xl mx-auto w-full relative">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
          {/* First stat - centered in first quarter */}
          <div className="text-white flex flex-col items-center justify-center min-h-[120px]">
            <div className="text-4xl md:text-5xl lg:text-6xl font-bold mb-1 flex items-center justify-center">
              <Users className="w-8 h-8 mr-2" />
              <AnimatedNumber value="500" suffix="+" duration={150000} />
            </div>
            <div className="text-white/90 text-base">Active Users</div>
          </div>
          
          {/* Second stat - centered in second quarter */}
          <div className="text-white flex flex-col items-center justify-center min-h-[120px]">
            <div className="text-4xl md:text-5xl lg:text-6xl font-bold mb-1 flex items-center justify-center">
              <Receipt className="w-8 h-8 mr-2" />
              <AnimatedNumber value="5000" suffix="+" duration={750000} />
            </div>
            <div className="text-white/90 text-base">Receipts Scanned</div>
          </div>
          
          {/* Third stat - centered in third quarter */}
          <div className="text-white flex flex-col items-center justify-center min-h-[120px]">
            <div className="text-4xl md:text-5xl lg:text-6xl font-bold mb-1 flex items-center justify-center">
              <FileText className="w-8 h-8 mr-2" />
              <AnimatedNumber value="2000" suffix="+" duration={270000} />
            </div>
            <div className="text-white/90 text-base">Invoices Generated</div>
          </div>
          
          {/* Fourth stat - centered in fourth quarter */}
          <div className="text-white flex flex-col items-center justify-center min-h-[120px]">
            <div className="text-4xl md:text-5xl lg:text-6xl font-bold mb-1 flex items-center justify-center">
              <Star className="w-8 h-8 mr-2" />
              <AnimatedNumber value="4" suffix="/5" duration={600} />
            </div>
            <div className="text-white/90 text-base">User Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
}
