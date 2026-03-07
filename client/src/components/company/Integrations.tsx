import { Link, Plus, Check, Globe, Zap, Database, Cloud, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IntegrationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: "Available" | "Coming Soon";
  buttonText?: string;
  buttonLink?: string;
}

function IntegrationCard({ icon, title, description, status, buttonText, buttonLink }: IntegrationCardProps) {
  return (
    <div className="bg-background dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 group-hover:scale-105">
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-[#29A378]/10 to-[#119e6c] dark:from-[#1a3a3a] dark:to-[#0f172a] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-300">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold mb-2 text-foreground dark:text-gray-100">{title}</h4>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base mb-6">{description}</p>
          <div className="mt-auto">
            {status === "Available" ? (
              buttonLink ? (
                <Link href={buttonLink}>
                  <Button className="w-full bg-gradient-to-r from-[#29A378] to-[#119e6c] text-white hover:from-[#29A378]/90 hover:to-[#119e6c]/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    {buttonText || "Connect"}
                  </Button>
                </Link>
              ) : (
                <Button className="w-full bg-gradient-to-r from-[#29A378] to-[#119e6c] text-white shadow-lg" disabled>
                  {buttonText || "Connect"}
                </Button>
              )
            ) : (
              <div className="text-center">
                <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 text-sm font-medium rounded-full border border-yellow-200">
                  <Zap className="w-4 h-4 mr-2" />
                  Coming Soon
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Integrations() {
  const integrations = [
    {
      icon: <Database className="w-8 h-8 text-[#29A378]" />,
      title: "QuickBooks",
      description: "Seamless integration with QuickBooks for automated accounting and bookkeeping",
      status: "Available" as const,
      buttonText: "Connect",
      buttonLink: "/integrations/quickbooks"
    },
    {
      icon: <Cloud className="w-8 h-8 text-[#29A378]" />,
      title: "Paystack",
      description: "Nigerian payment gateway integration for easy customer payments",
      status: "Available" as const,
      buttonText: "Connect",
      buttonLink: "/integrations/paystack"
    },
    {
      icon: <Globe className="w-8 h-8 text-[#29A378]" />,
      title: "Flutterwave",
      description: "Payment processing and financial services integration",
      status: "Available" as const,
      buttonText: "Connect",
      buttonLink: "/integrations/flutterwave"
    },
    {
      icon: <Shield className="w-8 h-8 text-[#29A378]" />,
      title: "Bank Transfers",
      description: "Direct integration with Nigerian banks for seamless transfers",
      status: "Coming Soon" as const
    },
    {
      icon: <Zap className="w-8 h-8 text-[#29A378]" />,
      title: "Xero",
      description: "Cloud accounting integration for advanced financial management",
      status: "Coming Soon" as const
    }
  ];

  return (
    <div className="bg-gradient-to-br from-background to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#29A378] to-[#119e6c] rounded-2xl flex items-center justify-center mr-4 md:mr-6 shadow-lg">
          <Plus className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Integrations</h3>
          <p className="text-sm md:text-base text-gray-600">Connect with your favorite financial tools</p>
        </div>
      </div>
      
      <p className="text-gray-600 mb-8 leading-relaxed text-sm md:text-base">
        Connect GrwoFinance with your favorite Nigerian and international financial tools 
        for seamless workflow automation and data synchronization.
      </p>
      
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
        {integrations.map((integration, index) => (
          <IntegrationCard 
            key={index} 
            icon={integration.icon}
            title={integration.title}
            description={integration.description}
            status={integration.status}
            buttonText={integration.buttonText}
            buttonLink={integration.buttonLink}
          />
        ))}
      </div>
      
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-[#29A378]/5 to-[#119e6c]/5 rounded-2xl p-6 border border-[#29A378]/20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#29A378] to-[#119e6c] rounded-xl flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">API Available</h4>
              <p className="text-sm text-gray-600">Complete API access for developers</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-[#29A378]/5 to-[#119e6c]/5 rounded-2xl p-6 border border-[#29A378]/20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#29A378] to-[#119e6c] rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Secure Connections</h4>
              <p className="text-sm text-gray-600">Bank-level security for all integrations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
