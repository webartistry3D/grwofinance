import { Link } from "wouter";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AboutUs from "@/components/company/AboutUs";
import Pricing from "@/components/company/Pricing";
import Integrations from "@/components/company/Integrations";
import Security from "@/components/company/Security";
import Legal from "@/components/company/Legal";
import Blog from "@/components/company/Blog";
import { Shield, CreditCard, FileCheck, Users, Award, Building, TrendingUp, Lock, Globe, BookOpen, FileText, Zap, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

interface CompanyCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

function CompanyCard({ icon, title, description, features }: CompanyCardProps) {
  return (
    <div className="bg-gradient-to-br from-[#29A378] to-[#119e6c] rounded-2xl shadow-lg p-6 md:p-8 h-full flex flex-col text-white">
      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
        {icon}
      </div>
      <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">{title}</h3>
      <p className="text-white/90 mb-6 leading-relaxed">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <FileCheck className="w-5 h-5 text-white mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-white text-sm">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Company() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Handle URL hash scrolling
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          // Scroll to the very top of the section
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - 80; // Account for fixed navbar height
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          setActiveSection(hash);
        }
      }, 100); // Small delay to ensure DOM is ready
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      {/* Spacer for navbar */}
      <div className="h-16"></div>

      {/* Company Values */}
      <section id="mission-values" className="px-4 py-16 md:py-20 lg:py-24 w-full bg-background">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 font-display text-foreground">
              Our Mission & Values
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Empowering Nigerian businesses with innovative financial solutions
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <CompanyCard
              icon={<Shield className="w-8 h-8 text-[#29A378]" />}
              title="Trust & Security"
              description="Bank-level security with Nigerian compliance standards"
              features={[
                "256-bit encryption",
                "Two-factor authentication",
                "CBN compliance",
                "Regular security audits"
              ]}
            />
            
            <CompanyCard
              icon={<Users className="w-8 h-8 text-[#29A378]" />}
              title="Customer Focus"
              description="Dedicated support for Nigerian businesses"
              features={[
                "24/7 customer support",
                "Local Nigerian team",
                "Business training programs",
                "Community engagement"
              ]}
            />
            
            <CompanyCard
              icon={<TrendingUp className="w-8 h-8 text-[#29A378]" />}
              title="Innovation"
              description="Cutting-edge technology for financial management"
              features={[
                "AI-powered insights",
                "Real-time analytics",
                "Mobile-first design",
                "Continuous updates"
              ]}
            />
            
            <CompanyCard
              icon={<Award className="w-8 h-8 text-[#29A378]" />}
              title="Excellence"
              description="Industry-leading financial solutions"
              features={[
                "Award-winning platform",
                "Best-in-class features",
                "Proven track record",
                "Industry recognition"
              ]}
            />
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about-us" className="px-4 py-16 md:py-20 lg:py-24 w-full">
        <AboutUs />
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-4 py-16 md:py-20 lg:py-24 w-full">
        <Pricing />
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="px-4 py-16 md:py-20 lg:py-24 w-full bg-gray-50">
        <Integrations />
      </section>

      {/* Security Section */}
      <section id="security" className="px-4 py-16 md:py-20 lg:py-24 w-full">
        <Security />
      </section>

      {/* Legal Section */}
      <section id="legal" className="px-4 py-16 md:py-20 lg:py-24 w-full">
        <Legal />
      </section>

      {/* Blog Section */}
      <section id="blog" className="px-4 py-16 md:py-20 lg:py-24 w-full bg-gray-50">
        <Blog />
      </section>

      <Footer />
    </div>
  );
}
