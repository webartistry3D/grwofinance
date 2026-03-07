import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import Hero3DCanvas from "@/components/Hero3DCanvas";

// Enhanced CSS animations with glassmorphism
const heroAnimationCSS = `
  @keyframes glassShimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  @keyframes slideInFromLeft {
    0% {
      opacity: 0;
      transform: translateX(-50px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes starScaleIn {
    0% {
      opacity: 0;
      transform: translateX(-20px) scale(0);
    }
    50% {
      opacity: 1;
      transform: translateX(0) scale(3);
    }
    100% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }
  
  @keyframes faceCardScaleIn {
    0% {
      opacity: 0;
      transform: translateX(-20px) scale(0);
    }
    50% {
      opacity: 1;
      transform: translateX(0) scale(3);
    }
    100% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }
  
  @keyframes textSlideIn {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .typing-text-container {
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;
    position: relative;
  }
  
  .typing-text-container h1 {
    line-height: 0.9;
    word-wrap: break-word;
    hyphens: auto;
    transform: translateZ(0);
    will-change: contents;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-family: "Montserrat", "Aeonik", system-ui, sans-serif;
    text-rendering: optimizeLegibility;
    font-feature-settings: "liga" 1, "kern" 1;
  }

  /* Mobile and Tablet-specific optimizations */
  @media (max-width: 1023px) {
    .typing-text-container h1 {
      line-height: 1.1;
      letter-spacing: -0.01em;
      text-rendering: optimizeSpeed;
      min-height: 8rem;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      padding-top: 0.5rem;
    }
    
    .typing-text-container {
      min-height: 8rem;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    
    /* Prevent inline-block distortion */
    .typing-text-container h1 span {
      transition: none !important;
      animation: none !important;
      will-change: auto !important;
    }
    
    /* Ensure Financial Assistant stays on one line */
    .typing-text-container h1 br + span {
      white-space: nowrap;
    }
  }

  /* Mobile-specific optimizations */
  @media (max-width: 767px) {
    .typing-text-container h1 {
      line-height: 1.1;
      letter-spacing: -0.02em;
      text-rendering: optimizeSpeed;
      font-size: 1.75rem; /* Reduced base size for mobile */
    }
    
    .typing-text-container h1 span {
      font-size: 1.2em; /* Adjusted scale for mobile */
    }
    
    /* Prevent truncation on mobile */
    .typing-text-container {
      overflow: visible;
      padding-top: 0.25rem;
    }
  }

  /* Roboto Slab heading styling */
  .roboto-slab-heading {
    font-family: "Montserrat", "Aeonik", system-ui, sans-serif;
    font-optical-sizing: auto;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    width: 100%;
    text-align: left;
  }
  
  .roboto-slab-heading span {
    display: inline;
    transition: all 0.2s ease;
  }

  /* Stars and Face Cards Animation */
  .rating-container {
    opacity: 0;
    transform: translateX(-50px);
  }
  
  .rating-container.animate {
    animation: slideInFromLeft 0.8s ease-out forwards;
  }
  
  .rating-container .star {
    opacity: 0;
    transform: translateX(-20px) scale(0);
  }
  
  .rating-container.animate .star {
    animation: starScaleIn 0.8s ease-out forwards;
  }
  
  .rating-container.animate .star:nth-child(1) { animation-delay: 0.1s; }
  .rating-container.animate .star:nth-child(2) { animation-delay: 0.2s; }
  .rating-container.animate .star:nth-child(3) { animation-delay: 0.3s; }
  .rating-container.animate .star:nth-child(4) { animation-delay: 0.4s; }
  .rating-container.animate .star:nth-child(5) { animation-delay: 0.5s; }
  
  .rating-container .face-card {
    opacity: 0;
    transform: translateX(-20px) scale(0);
  }
  
  .rating-container.animate .face-card {
    animation: faceCardScaleIn 0.8s ease-out forwards;
  }
  
  .rating-container.animate .face-card:nth-child(1) { animation-delay: 0.6s; }
  .rating-container.animate .face-card:nth-child(2) { animation-delay: 0.7s; }
  .rating-container.animate .face-card:nth-child(3) { animation-delay: 0.8s; }
  .rating-container.animate .face-card:nth-child(4) { animation-delay: 0.9s; }
  .rating-container.animate .face-card:nth-child(5) { animation-delay: 1.0s; }
  .rating-container.animate .face-card:nth-child(6) { animation-delay: 1.1s; }

  /* Customer count text animation */
  .customer-count-text {
    opacity: 0;
    transform: translateY(20px);
  }
  
  .rating-container.animate .customer-count-text {
    animation: textSlideIn 0.6s ease-out forwards;
    animation-delay: 1.3s;
  }

  /* Scope Roboto Slab to hero headings only so global font stack (Montserrat) applies */
  /* Ensure hero headings use the primary Montserrat stack */
  .typing-text-container h1,
  .roboto-slab-heading {
    font-family: "Montserrat", "Aeonik", system-ui, sans-serif;
  }
`;

interface HeroSectionProps {
  className?: string;
}

export default function HeroSection({ className = "" }: HeroSectionProps) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [shouldAnimateRating, setShouldAnimateRating] = useState(false);

  const animatedWords = [
    "Your", "all-in-one", "Financial", "Assistant"
  ];
  
  // Enhanced word-by-word animation (no loop)
  useEffect(() => {
    let wordTimer: NodeJS.Timeout;
    let wordIndex = 0;
    let isComponentMounted = true;
    
    const addNextWord = () => {
      if (!isComponentMounted || wordIndex >= animatedWords.length) return;
      
      const wordsToDisplay = animatedWords.slice(0, wordIndex + 1);
      // Format text with consistent sizing and proper alignment
      let formattedText = '';
      
      // All words use the same size with proper baseline alignment
      if (wordsToDisplay.length >= 1) {
        formattedText += `<span style="font-weight: 400; font-size: 1.25em; display: inline-block; vertical-align: baseline;">${wordsToDisplay[0]}</span>`;
      }
      if (wordsToDisplay.length >= 2) {
        formattedText += ` <span style="font-style: italic; font-size: 1.25em; font-weight: 400; display: inline-block; vertical-align: baseline;">${wordsToDisplay[1]}</span>`;
      }
      if (wordsToDisplay.length >= 3) {
        formattedText += `<br/><span style="font-weight: 400; font-size: 1.25em; display: inline-block; vertical-align: baseline;">${wordsToDisplay[2]}</span>`;
      }
      if (wordsToDisplay.length >= 4) {
        formattedText += ` <span style="font-weight: 400; font-size: 1.25em; display: inline-block; vertical-align: baseline;">${wordsToDisplay[3]}</span>`;
      }
      
      setDisplayText(formattedText);
      wordIndex++;
      
      if (wordIndex < animatedWords.length) {
        wordTimer = setTimeout(addNextWord, window.innerWidth < 768 ? 500 : 600);
      } else {
        setIsTyping(false);
        // Trigger rating animation after hero text completes
        setTimeout(() => {
          setShouldAnimateRating(true);
        }, 300);
      }
    };
    
    // Start animation
    const startTimer = setTimeout(() => {
      if (isComponentMounted) {
        setIsTyping(true);
        addNextWord();
      }
    }, 800);
    
    return () => {
      isComponentMounted = false;
      clearTimeout(startTimer);
      clearTimeout(wordTimer);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: heroAnimationCSS}} />
      <section
        className={`relative w-full min-h-[60vh] sm:min-h-[55vh] md:min-h-[50vh] overflow-hidden pt-16 ${className}`}
        style={{
          background: "linear-gradient(135deg, #082118 0%, #29A378 100%)",
        }}
      >
        <div className="relative px-4 sm:px-6 pt-1 sm:pt-12 pb-4 sm:pb-6 flex items-center min-h-[50vh] sm:min-h-[45vh] md:min-h-[40vh]">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-[1fr_1fr] gap-6 lg:gap-8 items-center">
              {/* Left Content - Hero Text, Features, Benefits */}
              <div className="space-y-2 sm:space-y-3 order-1 lg:order-1 relative z-20 text-center lg:text-left">
                {/* Animated Heading */}
                <div className="typing-text-container">
                  <div className="h-[8rem] sm:h-[8rem] md:h-[8rem] lg:h-[8rem] xl:h-[10rem] w-full max-w-none flex items-start sm:items-start justify-center lg:justify-start overflow-visible pt-2 sm:pt-0">
                    <h1 className="text-3xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl text-white leading-tight w-full max-w-full roboto-slab-heading break-words text-center lg:text-left">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: displayText,
                        }}
                      />
                    </h1>
                  </div>
                </div>

                {/* Rating Section - mobile optimized */}
                <div className="pt-2 sm:pt-3 pb-2 flex flex-col items-center gap-3">
                  {/* Stars and Customer Cards on same line */}
                  <div className={`flex items-center gap-3 rating-container ${shouldAnimateRating ? 'animate' : ''}`}>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`star w-6 h-6 sm:w-7 sm:h-7 ${star <= 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    
                    {/* Customer Face Cards */}
                    <div className="flex -space-x-3 sm:-space-x-4">
                      {/* Customer 1 */}
                      <div className="face-card w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                        JD
                      </div>
                      {/* Customer 2 */}
                      <div className="face-card w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                        SM
                      </div>
                      {/* Customer 3 */}
                      <div className="face-card w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                        AK
                      </div>
                      {/* Customer 4 */}
                      <div className="face-card w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                        RT
                      </div>
                      {/* Customer 5 */}
                      <div className="face-card w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-white flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                        LM
                      </div>
                      {/* Customer 6 */}
                      <div className="face-card w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 border-2 border-white flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                        KW
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer count text - center aligned */}
                  <div className="text-center">
                    <span className="text-white font-bold text-base sm:text-lg block sm:hidden">4.8 out of 5</span>
                    <span className={`customer-count-text text-white/80 text-xs sm:text-sm ${shouldAnimateRating ? 'animate' : ''}`}>
                      500+ happy customers
                    </span>
                  </div>
                </div>

                {/* Rating text on desktop */}
                <div className="hidden sm:block text-center">
                  <span className="text-white font-bold text-base sm:text-lg">4.8 out of 5</span>
                </div>

                {/* Features & Benefits - mobile optimized */}
                <div className="pt-1 sm:pt-1 max-w-md lg:max-w-lg">
                  <div className="flex flex-col gap-3">
                    {/* Features */}
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="features" className="border-white/20">
                        <AccordionTrigger className="text-xl sm:text-xl md:text-xl lg:text-xl font-semibold text-white hover:text-white/80 text-center lg:text-left py-2">
                          Features
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 text-white/90 italic pt-2 text-base sm:text-base md:text-base lg:text-base">
                            <li>-→ Generate Invoices</li>
                            <li>-→ Upload Receipts</li>
                            <li>-→ Store Income & Expense Records</li>
                            <li>-→ Generate professional Reports</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Benefits */}
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="benefits" className="border-white/20">
                        <AccordionTrigger className="text-xl sm:text-xl md:text-xl lg:text-xl font-semibold text-white hover:text-white/80 text-center lg:text-left py-2">
                          Benefits
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 text-white/90 italic pt-2 text-base sm:text-base md:text-base lg:text-base">
                            <li>-→ Several Hours per week saved</li>
                            <li>-→ Clear Business Financial Insights</li>
                            <li>-→ Improved Business Cashflow</li>
                            <li>-→ Financial Reports that unlock Credit</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>

                {/* Call to Action - mobile optimized */}
                <div className="pt-2 sm:pt-1">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-1 justify-center text-center lg:text-left lg:justify-start">
                    <Link href="/login" className="w-fit sm:w-auto mx-auto lg:mx-0">
                      <Button
                        size="lg"
                        className="w-fit sm:w-auto bg-white text-[#29A378] hover:bg-white/90 font-semibold text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        Get Started Free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Content - 3D Canvas */}
              <div className="order-2 lg:order-2 flex justify-center items-center">
                <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px] rounded-xl overflow-hidden shadow-xs">
                  <Hero3DCanvas />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
