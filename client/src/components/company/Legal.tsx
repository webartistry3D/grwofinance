import { FileCheck, Scale, Shield, Users, BookOpen, AlertCircle, Check } from "lucide-react";

export default function Legal() {
  const legalDocuments = [
    {
      icon: <FileCheck className="w-8 h-8 text-white" />,
      title: "Terms of Service",
      description: "Comprehensive terms governing your use of GrwoFinance services"
    },
    {
      icon: <Scale className="w-8 h-8 text-white" />,
      title: "Privacy Policy",
      description: "How we collect, use, and protect your personal and business data"
    },
    {
      icon: <Shield className="w-8 h-8 text-white" />,
      title: "Data Protection",
      description: "Compliance with Nigerian Data Protection Regulation (NDPR)"
    },
    {
      icon: <Users className="w-8 h-8 text-white" />,
      title: "User Rights",
      description: "Your rights and responsibilities as a GrwoFinance user"
    },
    {
      icon: <BookOpen className="w-8 h-8 text-white dark:text-gray-200" />,
      title: "Compliance Framework",
      description: "Alignment with CBN, SEC, and other Nigerian regulatory bodies"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#29A378] to-[#119e6c] dark:from-[#1a3a3a] dark:to-[#0f172a] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-300">
          <FileCheck className="w-6 h-6 md:w-8 md:h-8 text-white dark:text-gray-200" />
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground dark:text-gray-100">Legal & Compliance</h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
            Full compliance with Nigerian financial regulations and data protection laws.
          </p>
        </div>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-sm md:text-base">
        Full compliance with Nigerian financial regulations and data protection laws.
      </p>
      
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
        {legalDocuments.map((doc, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 group-hover:scale-105">
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#29A378]/10 to-[#119e6c] dark:from-[#1a3a3a] dark:to-[#0f172a] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-300">
                {doc.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold mb-2 text-foreground dark:text-gray-100">{doc.title}</h4>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base mb-6">{doc.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-gradient-to-r from-[#29A378]/10 to-[#119e6c]/10 rounded-2xl p-6 border border-[#29A378]/20">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-blue-800 mb-2">Important Notice</h4>
            <p className="text-blue-700 text-sm md:text-base leading-relaxed">
              By using GrwoFinance, you agree to comply with all applicable Nigerian 
              financial regulations and data protection laws.
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
                <h5 className="font-semibold text-gray-800 text-sm">Last Updated</h5>
                <p className="text-gray-600 text-xs">November 2024</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/50 rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <h5 className="font-semibold text-gray-800 text-sm">Regulatory License</h5>
                <p className="text-gray-600 text-xs">FIRS 2023 Certified</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
