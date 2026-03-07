import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Search, ChevronDown, HelpCircle, MessageCircle, Mail, Phone } from "lucide-react";

const faqs = [
  {
    question: "How do I scan a receipt?",
    answer: "Tap the camera button on your dashboard, point your camera at the receipt, and tap the capture button. Our OCR technology will automatically extract the expense details."
  },
  {
    question: "Can I edit scanned expenses?",
    answer: "Yes! After scanning, you can review and edit all details including amount, merchant, category, and date before saving the expense."
  },
  {
    question: "How accurate is the OCR scanning?",
    answer: "Our OCR technology achieves 95%+ accuracy for clear receipts. For best results, ensure good lighting and keep the receipt flat when scanning."
  },
  {
    question: "Can I set budget limits?",
    answer: "Yes! Go to Settings > Budget Settings to set monthly limits for your overall budget and individual categories."
  },
  {
    question: "How do I export my expense data?",
    answer: "Go to Settings > Data & Privacy > Export Your Data to download all your expense data in CSV format."
  },
  {
    question: "Is my data secure?",
    answer: "Yes! We use bank-level encryption to protect your data. You can control your privacy settings in Settings > Privacy Settings."
  },
  {
    question: "Can I use GrwoFinance offline?",
    answer: "You can scan receipts offline, but you'll need an internet connection to save them to your account and sync across devices."
  },
  {
    question: "How do I change my budget categories?",
    answer: "Categories are predefined to match common Nigerian spending patterns. Contact support if you need additional categories for your business needs."
  }
];

export default function HelpCenter() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState<string[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleItem = (question: string) => {
    setOpenItems(prev => 
      prev.includes(question) 
        ? prev.filter(item => item !== question)
        : [...prev, question]
    );
  };

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/settings")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Button>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground font-display">
              Help Center
            </h1>
          </div>
        </div>
      </header>
      
      <main className="pb-20 p-4">
        <div className="max-w-6xl mx-auto">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-help"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            variant="outline"
            className="h-auto p-4 justify-start"
            onClick={() => setLocation("/contact-support")}
            data-testid="button-contact-support"
          >
            <MessageCircle className="w-6 h-6 mr-3 text-primary" />
            <div className="text-left">
              <p className="font-medium">Contact Support</p>
              <p className="text-sm text-muted-foreground">Get direct help from our team</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 justify-start"
            onClick={() => window.open("mailto:support@kudiscan.com", "_blank")}
            data-testid="button-email-support"
          >
            <Mail className="w-6 h-6 mr-3 text-primary" />
            <div className="text-left">
              <p className="font-medium">Email Support</p>
              <p className="text-sm text-muted-foreground">support@kudiscan.com</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 justify-start"
            onClick={() => window.open("tel:+2349012345678", "_blank")}
            data-testid="button-phone-support"
          >
            <Phone className="w-6 h-6 mr-3 text-primary" />
            <div className="text-left">
              <p className="font-medium">Phone Support</p>
              <p className="text-sm text-muted-foreground">+234 901 234 5678</p>
            </div>
          </Button>
        </div>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-primary" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredFaqs.map((faq, index) => (
              <Collapsible key={index}>
                <CollapsibleTrigger
                  className="flex items-center justify-between w-full p-4 text-left hover:bg-muted rounded-lg transition-colors"
                  onClick={() => toggleItem(faq.question)}
                  data-testid={`faq-question-${index}`}
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${
                      openItems.includes(faq.question) ? 'rotate-180' : ''
                    }`} 
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-8">
            <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No matching help articles found.</p>
            <p className="text-sm text-muted-foreground mt-2">Try different search terms or contact support directly.</p>
          </div>
        )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}