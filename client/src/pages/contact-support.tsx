import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Send, MessageCircle, Mail, Phone, Clock } from "lucide-react";

const supportSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.string().min(1, "Please select a category"),
  priority: z.string().min(1, "Please select priority level"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

type SupportForm = z.infer<typeof supportSchema>;

const categories = [
  { id: "technical", name: "Technical Issue" },
  { id: "billing", name: "Billing & Payments" },
  { id: "account", name: "Account Management" },
  { id: "feature", name: "Feature Request" },
  { id: "bug", name: "Bug Report" },
  { id: "other", name: "Other" }
];

const priorities = [
  { id: "low", name: "Low - General inquiry" },
  { id: "medium", name: "Medium - Affects usage" },
  { id: "high", name: "High - Blocks functionality" },
  { id: "urgent", name: "Urgent - System down" }
];

export default function ContactSupport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const form = useForm<SupportForm>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      subject: "",
      category: "",
      priority: "",
      message: "",
    },
  });

  const onSubmit = async (data: SupportForm) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Support Ticket Created",
      description: "We've received your request and will respond within 24 hours. Ticket ID: #KS" + Date.now().toString().slice(-6),
    });
    
    form.reset();
    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/help-center")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Button>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground font-display">
              Contact Support
            </h1>
          </div>
        </div>
      </header>
      
      <main className="pb-20 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Support Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-primary" />
                Create Support Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Brief description of your issue"
                            {...field}
                            data-testid="input-subject"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-priority">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {priorities.map((priority) => (
                                <SelectItem key={priority.id} value={priority.id}>
                                  {priority.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your issue in detail. Include steps to reproduce if it's a technical problem."
                            className="min-h-[120px]"
                            {...field}
                            data-testid="textarea-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                    data-testid="button-submit-ticket"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Support Ticket
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">support@kudiscan.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">+234 901 234 5678</p>
                    <p className="text-xs text-muted-foreground">Mon-Fri, 9AM-6PM WAT</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Response Time</p>
                    <p className="text-sm text-muted-foreground">Within 24 hours</p>
                    <p className="text-xs text-muted-foreground">Urgent issues: 4 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Account</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account ID:</span>
                    <span className="font-mono text-xs">{user?.id?.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since:</span>
                    <span>{user?.createdAt ? new Date(user.createdAt).getFullYear() : 'Recently'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}