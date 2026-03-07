import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Scan, Plus, Smartphone, FileText, X } from "lucide-react";
import { useState } from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  isFlipped: boolean;
  onFlip: (title: string) => void;
  onClose: () => void;
}

function FeatureCard({ icon, title, description, isFlipped, onFlip, onClose }: FeatureCardProps) {
  return (
    <div className="relative w-full max-w-sm lg:max-w-md mx-auto h-[180px] md:h-[195px] lg:h-[210px]" style={{ perspective: '1000px' }}>
      <div 
        className={`relative w-full h-full transition-transform duration-700 cursor-pointer ${
          isFlipped ? '' : ''
        }`}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
        onClick={() => isFlipped ? onClose() : onFlip(title)}
      >
        {/* Front of card */}
        <div 
          className="absolute w-full h-full rounded-2xl p-3 md:p-4 lg:p-5 flex flex-col justify-between"
          style={{ 
            backgroundColor: '#082118',
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center mb-2" style={{backgroundColor: '#29A378'}}>
              {icon}
            </div>
            <h3 className="text-sm md:text-lg lg:text-xl font-bold mb-1 md:mb-2 font-display text-white text-center">{title}</h3>
          </div>
          <div className="flex justify-center">
            <Button variant="link" className="text-xs md:text-sm lg:text-base p-0 text-white hover:text-white/80">
              Learn More
            </Button>
          </div>
        </div>
        
        {/* Back of card */}
        <div 
          className="absolute w-full h-full rounded-2xl p-3 md:p-4 lg:p-5"
          style={{ 
            backgroundColor: '#082118',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm md:text-lg lg:text-xl font-bold font-display text-white">{title}</h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:text-white/80 p-1"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <div className="text-white/90 space-y-1 text-xs md:text-sm lg:text-base leading-tight">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  const [flippedCard, setFlippedCard] = useState<string | null>(null);

  const handleCardFlip = (title: string) => {
    setFlippedCard(title);
  };

  const handleCardClose = () => {
    setFlippedCard(null);
  };

  return (
    <section id="features" className="px-4 py-16 md:py-20 lg:py-24 w-full bg-background">
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 md:mb-6 font-display text-foreground">Features</h2>
        
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 mt-12 md:mt-16 lg:mt-20 w-full">
          {/* Global Dashboard */}
          <FeatureCard
            icon={<BarChart3 className="w-20 h-20 text-white" />}
            title="Business Dashboard"
            isFlipped={flippedCard === "Business Dashboard"}
            onFlip={handleCardFlip}
            onClose={handleCardClose}
            description={
              <>
              <p>Track income, expenses, savings, net worth, view simple spend category charts, get alerts for overspending or unusual activity to support better decisions.</p>
                {/*<p>See exactly how your business is doing at any time. Check how much money is coming in versus going out.</p>
                
                <p>Simple charts show your spending by category - like transport, food, or supplies. Track your monthly income patterns and see if you're making profit.</p>
                
                <p>Get automatic alerts when you spend too much or when something unusual happens with your money. This helps you make better decisions for your business.</p>*/}
              </>
            }
          />

          {/* Income Management */}
          <FeatureCard
            icon={<TrendingUp className="w-20 h-20 text-white" />}
            title="Income Manager"
            isFlipped={flippedCard === "Income Manager"}
            onFlip={handleCardFlip}
            onClose={handleCardClose}
            description={
              <>
              <p>Create branded invoices, accept bank and mobile payments, track paid and unpaid customers, identify top income sources, and keep detailed records for taxes and planning.</p>
                {/*<p>Create professional invoices with your business logo. Send automatic reminders to customers who haven't paid yet.</p>
                
                <p>Accept payments through bank transfers and mobile money. Keep track of which customers have paid and which ones still owe you money.</p>
                
                <p>See which customers bring you the most money. Organize your income by different sources to understand your business better.</p>
                
                <p>Keep detailed records for tax purposes and business planning.</p>*/}
              </>
            }
          />

          {/* Expense Management with OCR */}
          <FeatureCard
            icon={<Scan className="w-20 h-20 text-white" />}
            title="Expense Manager"
            isFlipped={flippedCard === "Expense Manager"}
            onFlip={handleCardFlip}
            onClose={handleCardClose}
            description={
              <>
                {/*<p>Just take a photo of any receipt and the app will read it for you. It captures the shop name, amount, date, and items you bought.</p>
                
                <p>Works with Nigerian receipts from shops, banks, and service providers. The app is 95% accurate in reading receipt information.</p>
                
                <p>Automatically sorts your expenses into categories for tax purposes. Prevents you from entering the same receipt twice by mistake.</p>
                
                <p>Can also manually enter expenses when you don't have a receipt, like for cash payments.</p>*/}
                <p>Snap a photo of receipts to automatically capture details, accurately process Nigerian receipts, categorize expenses for tax purposes, prevent duplicates, and allow manual entry for cash expenses.</p>
              </>
            }
          />

          {/* Financial Reports */}
          <FeatureCard
            icon={<FileText className="w-20 h-20 text-white" />}
            title="Financial Reports"
            isFlipped={flippedCard === "Financial Reports"}
            onFlip={handleCardFlip}
            onClose={handleCardClose}
            description={
              <>
                {/*<p>Generate comprehensive financial reports with one click. View profit and loss statements, cash flow analysis, and expense breakdowns by category.</p>
                
                <p>Create custom date ranges for specific reporting periods. Export reports in PDF or Excel format for sharing with your accountant or team.</p>
                
                <p>Visualize your business performance with interactive charts and graphs. Track trends over time to make informed business decisions.</p>
                
                <p>Automated tax summaries help you stay compliant with Nigerian tax regulations. Schedule recurring reports for regular business reviews.</p>*/}
                <p>Generate one-click financial reports with profit & loss, cash flow, expense breakdowns, export to PDF or Excel, visualize trends, and use automated tax summaries and reports for reviews.</p> 
              </>
            }
          />

          {/* Integrated Platform */}
          <FeatureCard
            icon={<Plus className="w-20 h-20 text-white" />}
            title="Unified Platform"
            isFlipped={flippedCard === "Unified Platform"}
            onFlip={handleCardFlip}
            onClose={handleCardClose}
            description={
              <>
                {/*<p>Stop using multiple apps for your business. GrwoFinance has everything you need in one place.</p>
                
                <p>Track income, manage expenses, create invoices, scan receipts, and generate reports - all from one app.</p>
                
                <p>Your information is always up-to-date across all features. No need to enter the same data multiple times.</p>
                
                <p>Your data is safely backed up and can be exported when needed for your accountant or tax filing.</p>*/}
                <p>Manage your entire business in one app—track income, expenses, invoices, receipts, and reports with synced data, secure backups, and easy exports for accounting and tax needs.</p>
              </>
            }
          />

          {/* Mobile-First Design */}
          <FeatureCard
            icon={<Smartphone className="w-20 h-20 text-white" />}
            title="Mobile-First Platform"
            isFlipped={flippedCard === "Mobile-First Platform"}
            onFlip={handleCardFlip}
            onClose={handleCardClose}
            description={
              <>
                {/*<p>Built specifically for mobile phones. Works well whether you have 2G, 3G, or 4G network.</p>
                
                <p>Easy to use with your fingers - no need for a stylus or special training. The app works on both Android and iPhone devices.</p>
                
                <p>All your data syncs automatically across devices. Start on your phone and continue on your computer if needed.</p>
                
                <p>Works offline when you don't have internet. Your data will sync when you're back online.</p>*/}
                <p>Designed for mobile use, the app works on low to high networks, runs on Android and iPhone, syncs across devices, and supports offline use with automatic syncing when online.</p>
              </>
            }
          />
        </div>
      </div>
    </section>
  );
}
