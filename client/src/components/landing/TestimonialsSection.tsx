import { Star, Quote } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
}

function TestimonialCard({ name, role, company, content, rating, avatar }: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4 md:p-5 h-full flex flex-col min-h-[220px] sm:min-h-[240px] md:min-h-[260px]">
      <div className="flex items-center mb-2 sm:mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 sm:w-4 sm:h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
      
      <Quote className="w-4 h-4 sm:w-6 sm:h-6 text-[#29A378] mb-1 sm:mb-2 opacity-20" />
      
      <p className="text-gray-700 mb-3 sm:mb-4 flex-grow leading-relaxed text-xs sm:text-sm">
        {content}
      </p>
      
      <div className="flex items-center mt-auto">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full mr-2 sm:mr-3 flex items-center justify-center">
          <span className="text-xs sm:text-sm font-semibold text-gray-600">{avatar}</span>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">{name}</h4>
          <p className="text-xs text-gray-600">{role}, {company}</p>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const testimonials: TestimonialCardProps[] = [
    {
      name: "Sarah Johnson",
      role: "CEO",
      company: "TechStart Nigeria",
      content: "GrwoFinance has transformed how we manage our finances. The receipt scanning feature alone saves us 10 hours per week. Highly recommended!",
      rating: 5,
      avatar: "SJ"
    },
    {
      name: "Michael Okafor",
      role: "Business Owner",
      company: "Okafor Electronics",
      content: "As a small business owner, I needed something simple yet powerful. GrwoFinance is perfect. The invoicing system helps me get paid faster.",
      rating: 5,
      avatar: "MO"
    },
    {
      name: "Amina Bello",
      role: "Freelance Designer",
      company: "Creative Studio",
      content: "The mobile-first design is exactly what I needed. I can manage my finances on the go. The expense categorization is incredibly accurate.",
      rating: 4,
      avatar: "AB"
    },
    {
      name: "David Chen",
      role: "Restaurant Manager",
      company: "Chen's Kitchen",
      content: "We've tried many accounting apps, but GrwoFinance is the best for Nigerian businesses. It understands our local needs perfectly.",
      rating: 5,
      avatar: "DC"
    },
    {
      name: "Funke Adeyemi",
      role: "Fashion Designer",
      company: "Bella Couture",
      content: "The reporting features help me understand my business patterns. I can now make better decisions based on real data.",
      rating: 5,
      avatar: "FA"
    },
    {
      name: "James Nwankwo",
      role: "Consultant",
      company: "Nwankwo & Co",
      content: "Professional, reliable, and easy to use. GrwoFinance has everything I need to manage my consulting business finances.",
      rating: 4,
      avatar: "JN"
    }
  ];

  return (
    <>
      <section
        className="relative w-full overflow-hidden px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-24 bg-fixed bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.25), rgba(248, 250, 252, 0.25)),
                    url("/testimonial1.jpg")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="max-w-12xl w-full">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 font-display text-foreground">
              What Our Users Say
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Join thousands of Nigerian businesses who trust GrwoFinance for their financial management
            </p>
          </div>
          
          {/* Marquee Wrapper - Full width expansion */}
          <div className="relative overflow-hidden mb-12 sm:mb-16">
            {/* Marquee Track - Full width expansion */}
            <div className="testimonials-marquee-track flex w-max gap-3 sm:gap-4 md:gap-6">
              {[1, 2].map((_, i) => (
                <div key={i} className="flex gap-3 sm:gap-4 md:gap-6">
                  {testimonials.map((testimonial, index) => (
                    <div key={`${index}-${i}`} className="w-72 sm:w-80 md:w-96 lg:w-96 xl:w-100 flex-shrink-0">
                      <TestimonialCard {...testimonial} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CSS - Left to right flow */}
      <style>
        {`
          .testimonials-marquee-track {
            display: flex;
            animation: testimonials-marquee-left-to-right 20s linear infinite;
          }

          @keyframes testimonials-marquee-left-to-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0%); }
          }
          
          /* Responsive adjustments */
          @media (max-width: 640px) {
            .testimonials-marquee-track {
              animation-duration: 15s; /* Faster on mobile for better UX */
            }
          }
          
          @media (min-width: 1024px) {
            .testimonials-marquee-track {
              animation-duration: 25s; /* Slower on desktop for better reading */
            }
          }
        `}
      </style>
    </>
  );
}
