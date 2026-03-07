import { Link } from "wouter";
import { Bot, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Bot className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">
                <span style={{color: '#29A378'}}>Grwo</span>
                <span className="text-foreground">Finance</span>
              </span>
            </div>
            <p className="text-muted-foreground mb-4">
              Your all-in-one finance assistant for Nigerian businesses. Track expenses, manage invoices, and grow your business.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-[#29A378] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-[#29A378] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-[#29A378] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-[#29A378] transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Product */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-[#29A378] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-[#29A378] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-muted-foreground hover:text-[#29A378] transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="text-muted-foreground hover:text-[#29A378] transition-colors">
                  Integrations
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-[#29A378] transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-[#29A378] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Get in Touch</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-muted-foreground">
                <Mail className="w-4 h-4 mr-2" />
                <span>support@grwofinance.com</span>
              </li>
              <li className="flex items-center text-muted-foreground">
                <Phone className="w-4 h-4 mr-2" />
                <span>+234 800 123 4567</span>
              </li>
              <li className="flex items-center text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © 2024 GrwoFinance. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link href="/privacy" className="text-muted-foreground hover:text-[#29A378] text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-[#29A378] text-sm transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-muted-foreground hover:text-[#29A378] text-sm transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
