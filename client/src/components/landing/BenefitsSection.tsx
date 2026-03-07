import { Shield, FileCheck, TrendingUp, Award, CreditCard, Building, Users, Receipt, FileText, Star } from "lucide-react";

interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

function BenefitCard({ icon, title, description, features }: BenefitCardProps) {
  return (
    <div className="bg-[#22262A]/70 backdrop-blur-md rounded-2xl shadow-lg p-6 md:p-8 h-full flex flex-col border border-[#22262A]/80">
      <div className="w-16 h-16 bg-gradient-to-br from-[#29A378]/10 to-[#119e6c] dark:from-[#1a3a3a] dark:to-[#0f172a] rounded-2xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl md:text-2xl font-bold mb-4 text-foreground">{title}</h3>
      <p className="text-gray-100 mb-6 leading-relaxed">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <FileCheck className="w-5 h-5 text-[#29A378] mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-200 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BenefitsSection() {
  return (
    <section
      className="relative w-full overflow-hidden px-4 py-16 md:py-20 lg:py-24 bg-fixed bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(41, 163, 120, 0.35), rgba(41, 163, 120, 0.35)),
                  url("/benefits.jpg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
      }}
    >
        <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-12 md:mb-2">
          <div className="inline-block">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 font-display text-foreground bg-gradient-to-r from-[#29A378] to-[#119e6c] px-8 py-4 rounded-lg">
              Aligned with Nigerian Financial Excellence
            </h2>
          </div>
          <p className="text-lg md:text-xl text-foreground bg-background max-w-3xl mx-auto">
            Built to support Nigeria's financial ecosystem with compliance, innovation, and growth
          </p>
        </div>

        {/* CBN Image Card */}
        <div className="flex justify-center mb-12">
          <div className="w-full max-w-48 aspect-square bg-[#22262A]/20 backdrop-blur-sm rounded-2xl border border-[#22262A]/30 flex items-center justify-center overflow-hidden">
            <img 
              src="/logos/cbn.png" 
              alt="Central Bank of Nigeria" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          <BenefitCard
            icon={<Shield className="w-8 h-8 text-[#29A378]" />}
            title="Tax Compliance"
            description="Stay compliant with Nigerian tax regulations and filing requirements"
            features={[
              "FIRS compliant tax calculations",
              "Automated VAT & WHT deductions",
              "Tax receipt management",
              "Monthly tax reports",
              "Year-end tax filing support"
            ]}
          />
          
          <BenefitCard
            icon={<Award className="w-8 h-8 text-[#29A378]" />}
            title="Government Grants"
            description="Access and manage government grants and financial assistance programs"
            features={[
              "Grant eligibility tracking",
              "Application document management",
              "Progress monitoring",
              "Compliance reporting",
              "Disbursement tracking"
            ]}
          />
          
          <BenefitCard
            icon={<CreditCard className="w-8 h-8 text-[#29A378]" />}
            title="Credit Facilities"
            description="Connect with Nigerian financial institutions for business financing"
            features={[
              "Loan eligibility assessment",
              "Credit score tracking",
              "Bank integration",
              "Interest rate monitoring",
              "Repayment scheduling"
            ]}
          />
        </div>

        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <BenefitCard
            icon={<Building className="w-8 h-8 text-[#29A378]" />}
            title="Business Support"
            description="Comprehensive tools for Nigerian business growth and management"
            features={[
              "Business registration support",
              "CAC compliance tools",
              "Financial planning templates",
              "Cash flow management",
              "Growth analytics"
            ]}
          />
          
          <BenefitCard
            icon={<TrendingUp className="w-8 h-8 text-[#29A378]" />}
            title="Economic Growth"
            description="Contribute to Nigeria's economic development and financial inclusion"
            features={[
              "GDP contribution tracking",
              "Employment data reporting",
              "Financial inclusion metrics",
              "Sector growth analysis",
              "Economic impact assessment"
            ]}
          />
          
          <BenefitCard
            icon={<FileCheck className="w-8 h-8 text-[#29A378]" />}
            title="Regulatory Alignment"
            description="Full alignment with CBN, SEC, and other regulatory bodies"
            features={[
              "CBN compliance monitoring",
              "SEC reporting standards",
              "AML/KYC requirements",
              "Regulatory updates",
              "Compliance certificates"
            ]}
          />
        </div>

        </div>
    </section>
  );
}
