import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, ArrowUpRight } from "lucide-react";

interface WhatsAppBusinessProps {
  trigger?: React.ReactNode;
}

export function WhatsAppBusiness({ trigger }: WhatsAppBusinessProps) {
  const [open, setOpen] = useState(false);
  const [inquiryType, setInquiryType] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  // GrwoFinance WhatsApp Business number (replace with actual number)
  const whatsappNumber = "+2348000000000"; // Replace with your WhatsApp Business number

  const inquiryTypes = [
    { value: "support", label: "Technical Support" },
    { value: "billing", label: "Billing & Subscriptions" },
    { value: "feature", label: "Feature Request" },
    { value: "partnership", label: "Business Partnership" },
    { value: "general", label: "General Inquiry" }
  ];

  const handleSendWhatsApp = () => {
    if (!inquiryType || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select an inquiry type and enter your message.",
        variant: "destructive",
      });
      return;
    }

    // Pre-formatted message for WhatsApp
    const formattedMessage = `Hello GrwoFinance Team!

*Inquiry Type:* ${inquiryTypes.find(type => type.value === inquiryType)?.label}

*Message:*
${message.trim()}

Thank you for your assistance!`;

    // Create WhatsApp URL with pre-filled message
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(formattedMessage)}`;

    // Detect device type for optimal experience
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // On mobile, open WhatsApp directly
      window.open(whatsappUrl, '_self');
    } else {
      // On desktop/tablet, use WhatsApp Web
      const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${whatsappNumber.replace('+', '')}&text=${encodeURIComponent(formattedMessage)}`;
      window.open(whatsappWebUrl, '_blank');
    }

    toast({
      title: "Opening WhatsApp",
      description: isMobile 
        ? "Opening WhatsApp app with your message ready to send."
        : "Opening WhatsApp Web with your message ready to send.",
      duration: 3000,
    });

    // Reset form and close modal after a short delay to prevent redirection issues
    setTimeout(() => {
      setInquiryType("");
      setMessage("");
      setOpen(false);
    }, 100);
  };

  const quickMessages = [
    {
      type: "support",
      text: "Hi! I'm having trouble with receipt scanning. Can you help?"
    },
    {
      type: "billing",
      text: "I need help with my subscription plan. Please assist."
    },
    {
      type: "feature",
      text: "I have a suggestion for a new feature that would be helpful."
    }
  ];

  const handleQuickMessage = (quickMsg: typeof quickMessages[0]) => {
    setInquiryType(quickMsg.type);
    setMessage(quickMsg.text);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild data-testid="whatsapp-trigger">
        {trigger || (
          <Button className="gap-2" style={{ backgroundColor: '#25D366' }}>
            <MessageCircle className="w-4 h-4" />
            Chat on WhatsApp
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[85vh] overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 mx-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5" style={{ color: '#25D366' }} />
            Contact via WhatsApp
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Send us a message on WhatsApp. We typically respond within a few hours.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 w-full min-w-0">
          {/* Quick Message Options */}
          <div className="space-y-2 w-full">
            <Label className="text-gray-900 dark:text-white text-sm font-medium">
              Quick Messages
            </Label>
            <div className="grid gap-2 w-full">
              {quickMessages.map((quickMsg, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="text-left justify-start h-auto p-3 text-sm w-full whitespace-normal"
                  onClick={() => handleQuickMessage(quickMsg)}
                  data-testid={`quick-message-${quickMsg.type}`}
                >
                  <div className="flex flex-col items-start w-full min-w-0">
                    <span className="font-medium text-left break-words">{inquiryTypes.find(t => t.value === quickMsg.type)?.label}</span>
                    <span className="text-gray-500 text-xs text-left break-words">{quickMsg.text}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Inquiry Type */}
          <div className="space-y-2 w-full">
            <Label htmlFor="inquiry-type" className="text-gray-900 dark:text-white text-sm">
              Inquiry Type
            </Label>
            <Select value={inquiryType} onValueChange={setInquiryType}>
              <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-sm" data-testid="inquiry-type-select">
                <SelectValue placeholder="Select inquiry type" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {inquiryTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-sm">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2 w-full">
            <Label htmlFor="message" className="text-gray-900 dark:text-white text-sm">
              Your Message
            </Label>
            <Textarea
              id="message"
              placeholder="Describe your inquiry or how we can help you..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full min-h-[100px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm resize-none"
              data-testid="whatsapp-message"
            />
          </div>

          {/* WhatsApp Info */}
          <div className="w-full bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2 w-full">
              <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#25D366' }} />
              <div className="text-sm flex-1 min-w-0">
                <p className="font-medium text-green-800 dark:text-green-200">WhatsApp Business</p>
                <p className="text-green-700 dark:text-green-300 text-xs break-words">
                  Opens WhatsApp app on mobile or WhatsApp Web on desktop with your message pre-filled. 
                  Our team typically responds within 2-4 hours during business hours (9 AM - 6 PM WAT).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 w-full">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="text-sm"
            data-testid="whatsapp-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendWhatsApp}
            disabled={!inquiryType || !message.trim()}
            className="gap-2 text-sm whitespace-nowrap"
            style={{ backgroundColor: '#25D366' }}
            data-testid="whatsapp-send"
          >
            <Send className="w-4 h-4" />
            Open WhatsApp
            <ArrowUpRight className="w-3 h-3" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}