import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Star, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface FeedbackModalProps {
  trigger?: React.ReactNode;
}

export function FeedbackModal({ trigger }: FeedbackModalProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async () => {
    if (!rating || !category || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: category,
          rating: parseInt(rating),
          message: message.trim(),
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      toast({
        title: "Feedback Submitted!",
        description: "Thank you for helping us improve GrwoFinance.",
      });

      // Reset form and close modal
      setRating("");
      setCategory("");
      setMessage("");
      setOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      if (errorMessage.includes("401")) {
        toast({
          title: "Authentication Required",
          description: "Please log in to submit feedback.",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation("/login");
        }, 2000);
      } else {
        toast({
          title: "Submission Failed",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star.toString())}
            className={`p-1 transition-colors ${
              parseInt(value) >= star ? "text-yellow-400" : "text-gray-400 dark:text-gray-600"
            }`}
            data-testid={`star-rating-${star}`}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild data-testid="feedback-trigger">
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Share Your Feedback</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Help us improve GrwoFinance with your thoughts and suggestions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label htmlFor="rating" className="text-gray-900 dark:text-white">
              How would you rate your experience?
            </Label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-gray-900 dark:text-white">
              What type of feedback is this?
            </Label>
            <RadioGroup value={category} onValueChange={setCategory} data-testid="feedback-category">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feature" id="feature" />
                <Label htmlFor="feature" className="text-gray-700 dark:text-gray-300">Feature Request</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bug" id="bug" />
                <Label htmlFor="bug" className="text-gray-700 dark:text-gray-300">Bug Report</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="support" id="support" />
                <Label htmlFor="support" className="text-gray-700 dark:text-gray-300">Support Request</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="general" id="general" />
                <Label htmlFor="general" className="text-gray-700 dark:text-gray-300">General Feedback</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-gray-900 dark:text-white">
              Your message
            </Label>
            <Textarea
              id="message"
              placeholder="Tell us more about your experience or suggestions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              data-testid="feedback-message"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            data-testid="feedback-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !rating || !category || !message.trim()}
            className="gap-2"
            style={{ backgroundColor: '#29A378' }}
            data-testid="feedback-submit"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}