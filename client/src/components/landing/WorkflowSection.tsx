import { Button } from "@/components/ui/button";
import { Scan, FileText, ArrowRight, TrendingUp, Receipt, CreditCard, BarChart3, PieChart, FileBarChart, Calendar, CheckCircle, Tags } from "lucide-react";
import { useState } from "react";

interface WorkflowCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  workflowMode: string;
  setWorkflowMode: (mode: string) => void;
}

function WorkflowCard({ icon, title, description, buttonText, workflowMode, setWorkflowMode }: WorkflowCardProps) {
  return (
    <div className="text-center w-full max-w-sm lg:max-w-md mx-auto">
      <div className="w-32 h-32 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
        {icon}
      </div>
      <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2 md:mb-3 lg:mb-4 font-display" style={{color: '#E1E7EF'}}>
        {title}
      </h3>
      <p className="text-sm md:text-base lg:text-lg leading-relaxed mb-6" style={{color: '#959AA0'}}>
        {description}
      </p>
      <Button
        onClick={() => setWorkflowMode(workflowMode)}
        className="bg-white text-[#29A378] hover:bg-white/90 font-semibold"
        size="lg"
      >
        {buttonText}
      </Button>
    </div>
  );
}

// Expense Manager Workflow Component
function ExpenseManagerWorkflow() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 w-full">
      <div className="text-center w-full max-w-sm lg:max-w-md mx-auto">
        <div className="w-32 h-32 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
          <Scan className="w-20 h-20" style={{color: '#29A378'}} />
        </div>
        <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2 md:mb-3 lg:mb-4 font-display" style={{color: '#E1E7EF'}}>
          Scan Receipt
        </h3>
        <p className="text-sm md:text-base lg:text-lg leading-relaxed" style={{color: '#959AA0'}}>
          Take a photo of your receipt and let AI extract the details automatically
        </p>
      </div>

      {/* Arrow 1 */}
      <div className="hidden md:block">
        <ArrowRight className="w-8 h-8 animate-arrow-pulse" style={{color: '#29A378'}} />
      </div>

      {/* Mobile Arrow */}
      <div className="md:hidden flex justify-center">
        <ArrowRight className="w-6 h-6 animate-arrow-pulse rotate-90" style={{color: '#29A378'}} />
      </div>

      <div className="text-center w-full max-w-sm lg:max-w-md mx-auto">
        <div className="w-32 h-32 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
          <Receipt className="w-20 h-20" style={{color: '#29A378'}} />
        </div>
        <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2 md:mb-3 lg:mb-4 font-display" style={{color: '#E1E7EF'}}>
          Review & Edit
        </h3>
        <p className="text-sm md:text-base lg:text-lg leading-relaxed" style={{color: '#959AA0'}}>
          Review extracted information and make any necessary adjustments
        </p>
      </div>

      {/* Arrow 2 */}
      <div className="hidden md:block">
        <ArrowRight className="w-8 h-8 animate-arrow-pulse" style={{color: '#29A378'}} />
      </div>

      {/* Mobile Arrow */}
      <div className="md:hidden flex justify-center">
        <ArrowRight className="w-6 h-6 animate-arrow-pulse rotate-90" style={{color: '#29A378'}} />
      </div>

      <div className="text-center w-full max-w-sm lg:max-w-md mx-auto">
        <div className="w-32 h-32 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
          <CreditCard className="w-20 h-20" style={{color: '#29A378'}} />
        </div>
        <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2 md:mb-3 lg:mb-4 font-display" style={{color: '#E1E7EF'}}>
          Categorize Expense
        </h3>
        <p className="text-sm md:text-base lg:text-lg leading-relaxed" style={{color: '#959AA0'}}>
          Assign categories and tags for better expense tracking and reporting
        </p>
      </div>
    </div>
  );
}

// Income Manager Workflow Component
function IncomeManagerWorkflow() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 w-full">
      <div className="text-center w-full max-w-sm lg:max-w-md mx-auto">
        <div className="w-32 h-32 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
          <FileText className="w-20 h-20" style={{color: '#29A378'}} />
        </div>
        <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2 md:mb-3 lg:mb-4 font-display" style={{color: '#E1E7EF'}}>
          Create Invoices
        </h3>
        <p className="text-sm md:text-base lg:text-lg leading-relaxed" style={{color: '#959AA0'}}>
          Generate & send professional invoices to your customers
        </p>
      </div>

      {/* Arrow 1 */}
      <div className="hidden md:block">
        <ArrowRight className="w-8 h-8 animate-arrow-pulse" style={{color: '#29A378'}} />
      </div>

      {/* Mobile Arrow */}
      <div className="md:hidden flex justify-center">
        <ArrowRight className="w-6 h-6 animate-arrow-pulse rotate-90" style={{color: '#29A378'}} />
      </div>

      <div className="text-center w-full max-w-sm lg:max-w-md mx-auto">
        <div className="w-32 h-32 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
          <TrendingUp className="w-20 h-20" style={{color: '#29A378'}} />
        </div>
        <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2 md:mb-3 lg:mb-4 font-display" style={{color: '#E1E7EF'}}>
          Track Payments
        </h3>
        <p className="text-sm md:text-base lg:text-lg leading-relaxed" style={{color: '#959AA0'}}>
          Monitor payment status and send automated reminders
        </p>
      </div>

      {/* Arrow 2 */}
      <div className="hidden md:block">
        <ArrowRight className="w-8 h-8 animate-arrow-pulse" style={{color: '#29A378'}} />
      </div>

      {/* Mobile Arrow */}
      <div className="md:hidden flex justify-center">
        <ArrowRight className="w-6 h-6 animate-arrow-pulse rotate-90" style={{color: '#29A378'}} />
      </div>

      <div className="text-center w-full max-w-sm lg:max-w-md mx-auto">
        <div className="w-32 h-32 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
          <BarChart3 className="w-20 h-20" style={{color: '#29A378'}} />
        </div>
        <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2 md:mb-3 lg:mb-4 font-display" style={{color: '#E1E7EF'}}>
          View Reports
        </h3>
        <p className="text-sm md:text-base lg:text-lg leading-relaxed" style={{color: '#959AA0'}}>
          Analyze income trends and financial performance
        </p>
      </div>
    </div>
  );
}

interface WorkflowSectionProps {
  className?: string;
}

export default function WorkflowSection({ className = "" }: WorkflowSectionProps) {
  const [workflowMode, setWorkflowMode] = useState('none'); // Start with 'none' to show both workflows

  return (
    <section className={`px-4 py-16 md:py-20 lg:py-24 w-full bg-background ${className}`}>
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 md:mb-6 font-display text-foreground">
          How It Works
        </h2>
        
        
        
        {/* Workflow Selection */}
        {workflowMode === 'none' ? (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
            <WorkflowCard
              icon={<FileText className="w-20 h-20" style={{color: '#29A378'}} />}
              title="Income Manager"
              description="Create invoices, track payments, and manage customer accounts"
              buttonText="Hit me"
              workflowMode="income"
              setWorkflowMode={setWorkflowMode}
            />
            
            <WorkflowCard
              icon={<Scan className="w-20 h-20" style={{color: '#29A378'}} />}
              title="Expense Manager"
              description="Scan receipts, track expenses, and categorize spending automatically"
              buttonText="Hit me"
              workflowMode="expense"
              setWorkflowMode={setWorkflowMode}
            />
          </div>
        ) : (
          <div className="mb-8">
            <Button
              onClick={() => setWorkflowMode('none')}
              variant="outline"
              className="mb-8"
            >
              ← Back to Workflows
            </Button>
            
            {workflowMode === 'expense' && <ExpenseManagerWorkflow />}
            {workflowMode === 'income' && <IncomeManagerWorkflow />}
          </div>
        )}
        
        {/* Workflow Features - Always visible */}
        <div className="mt-16">
          <div className="max-w-2xl mx-auto flex justify-center">
            <div className="space-y-6 text-center">
              <div className="flex items-center justify-center space-x-4">
                <CheckCircle className="w-10 h-10 text-[#29A378] flex-shrink-0" />
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground">Intelligent Analytics</h3>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <CheckCircle className="w-10 h-10 text-[#29A378] flex-shrink-0" />
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground">Smart Categories</h3>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <CheckCircle className="w-10 h-10 text-[#29A378] flex-shrink-0" />
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground">Detailed Reports</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS for arrow animation */}
      <style>
        {`
          @keyframes arrow-pulse {
            0%, 100% {
              opacity: 0.5;
              transform: translateX(0);
            }
            50% {
              opacity: 1;
              transform: translateX(4px);
            }
          }
          
          .animate-arrow-pulse {
            animation: arrow-pulse 2s ease-in-out infinite;
          }
        `}
      </style>
    </section>
  );
}
