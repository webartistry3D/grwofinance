import { Shield, Lock, Check, AlertTriangle, Users, Eye, Server, Key } from "lucide-react";

export default function Security() {
  const securityFeatures = [
    {
      icon: <Shield className="w-8 h-8 text-white" />,
      title: "Bank-Level Encryption",
      description: "256-bit SSL encryption for all data transmissions and storage"
    },
    {
      icon: <Lock className="w-8 h-8 text-white" />,
      title: "Two-Factor Authentication",
      description: "Extra security layer with SMS or authenticator app verification"
    },
    {
      icon: <Check className="w-8 h-8 text-white" />,
      title: "Regular Security Audits",
      description: "Third-party security assessments and penetration testing"
    },
    {
      icon: <Users className="w-8 h-8 text-white" />,
      title: "Role-Based Access",
      description: "Granular permissions and access controls for team members"
    },
    {
      icon: <Eye className="w-8 h-8 text-white" />,
      title: "Data Privacy",
      description: "Your data is never shared with third parties without consent"
    },
    {
      icon: <Server className="w-8 h-8 text-white" />,
      title: "Secure Servers",
      description: "Nigerian and international data centers with 99.9% uptime"
    },
    {
      icon: <Key className="w-8 h-8 text-white dark:text-gray-200" />,
      title: "Compliance Standards",
      description: "CBN, SEC, and Nigerian regulatory compliance"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#29A378] to-[#119e6c] dark:from-[#1a3a3a] dark:to-[#0f172a] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-300">
          <Shield className="w-6 h-6 md:w-8 md:h-8 text-white dark:text-gray-200" />
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground dark:text-gray-100">Security & Compliance</h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
            Bank-level security for Nigerian businesses with compliance and trust.
          </p>
        </div>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-sm md:text-base">
        Bank-level security designed for Nigerian businesses and regulatory compliance.
      </p>
      
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
        {securityFeatures.map((feature, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 group-hover:scale-105">
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#29A378]/10 to-[#119e6c] dark:from-[#1a3a3a] dark:to-[#0f172a] rounded-2xl flex items-center justify-center flex-shrink-0">
                {feature.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold mb-2 text-foreground dark:text-gray-100">{feature.title}</h4>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base mb-6">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-gradient-to-r from-[#29A378]/10 to-[#119e6c]/10 rounded-2xl p-6 border border-[#29A378]/20">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-yellow-800 mb-2">24/7 Security Monitoring</h4>
            <p className="text-yellow-700 text-sm md:text-base leading-relaxed">
              Our security team monitors systems around the clock for immediate threat detection and response
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white/50 rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <h5 className="font-semibold text-gray-800 text-sm">SOC 2 Type 2 Certified</h5>
                <p className="text-gray-600 text-xs">Annual security audits</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/50 rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <h5 className="font-semibold text-gray-800 text-sm">GDPR Compliant</h5>
                <p className="text-gray-600 text-xs">Data protection standards</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
