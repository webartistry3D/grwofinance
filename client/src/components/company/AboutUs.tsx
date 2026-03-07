import { Users, Award, Target, Clock, CheckCircle } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#29A378] to-[#119e6c] dark:from-[#1a3a3a] dark:to-[#0f172a] rounded-2xl flex items-center justify-center mr-4 md:mr-6 shadow-lg">
          <Users className="w-6 h-6 md:w-8 md:h-8 text-white dark:text-gray-200" />
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-bold mb-2 text-foreground dark:text-gray-100">About GrwoFinance</h3>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">Nigeria's Trusted Financial Partner</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-[#29A378]/10 dark:bg-[#1a3a3a]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-[#29A378] dark:text-[#f97316]" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold mb-3 text-foreground dark:text-gray-100">Our Mission</h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                To empower Nigerian businesses with innovative, financial 
                management solutions that drive growth and success in the digital economy.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-[#29A378]/10 dark:bg-[#1a3a3a]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-[#29A378] dark:text-[#f97316]" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold mb-3 text-foreground dark:text-gray-100">Our Vision</h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                Standardization for 
                excellence in digital financial services across Africa.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-[#29A378]/10 dark:bg-[#1a3a3a]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-[#29A378] dark:text-[#f97316]" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold mb-3 text-foreground dark:text-gray-100">Our Values</h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                Innovation, Integrity, Excellence, and Customer Focus guide everything we do.
              </p>
            </div>
          </div>
        </div>
        
        {/*<div className="bg-gradient-to-r from-[#29A378]/5 to-[#119e6c]/5 dark:from-[#1a3a3a]/5 dark:to-[#0f172a]/5 rounded-2xl p-6 border border-[#29A378]/20 dark:border-[#1a3a3a]/20">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#29A378] to-[#119e6c] dark:from-[#1a3a3a] dark:to-[#0f172a] rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-white dark:text-gray-200" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold mb-3 text-foreground dark:text-gray-100">Since 2020</h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                Serving Nigerian businesses with cutting-edge financial technology and 
                unparalleled customer support.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                Innovation, Integrity, Excellence, and Customer Focus guide everything we do.
              </p>
            </div>
          </div>
        </div>*/}
      </div>
    </div>
  );
}
