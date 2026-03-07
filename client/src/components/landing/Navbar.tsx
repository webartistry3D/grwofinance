import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Lock, FileCheck, BookOpen, Home, Shield, Users, CreditCard, Globe, Bot } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import "./Navbar.css";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleCompanyDropdown = () => {
    setIsCompanyDropdownOpen(!isCompanyDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const companySections = [
    { id: "mission-values", title: "Mission", icon: <Shield className="w-4 h-4" /> },
    { id: "about-us", title: "About Us", icon: <Users className="w-4 h-4" /> },
    { id: "pricing", title: "Pricing", icon: <CreditCard className="w-4 h-4" /> },
    { id: "integrations", title: "Integrations", icon: <Globe className="w-4 h-4" /> },
    { id: "security", title: "Security", icon: <Lock className="w-4 h-4" /> },
    { id: "legal", title: "Legal", icon: <FileCheck className="w-4 h-4" /> },
    { id: "blog", title: "Blog", icon: <BookOpen className="w-4 h-4" /> }
  ];

  const scrollToSection = (sectionId: string) => {
    // If we're on the company page, scroll to the section
    if (location === '/company') {
      const element = document.getElementById(sectionId);
      if (element) {
        // Scroll to the very top of the section
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - 80; // Account for fixed navbar height
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    } else {
      // If we're not on the company page, navigate to company page with section hash
      setLocation(`/company#${sectionId}`);
    }
    setIsCompanyDropdownOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-4 py-4 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Bot className="w-10 h-10 text-primary mr-2" />
          <span className="text-2xl font-bold">
            <span style={{color: '#29A378'}}>Grwo</span>
            <span className="text-white">Finance</span>
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Home Button */}
          <Link href="/">
            <Button variant="outline" className="flex items-center">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
          
          {/* Company Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button 
              variant="outline" 
              onClick={toggleCompanyDropdown}
              className="flex items-center"
            >
              Company
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                isCompanyDropdownOpen ? 'rotate-180' : ''
              }`} />
            </Button>
            
            {isCompanyDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50">
                <div className="py-2">
                  {companySections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="w-full flex items-center px-4 py-3 text-left hover:bg-accent transition-colors duration-200"
                    >
                      {section.icon}
                      <span className="ml-3">{section.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Link href="/login">
            <Button variant="outline">Sign in</Button>
          </Link>
          <Link href="/login">
            <Button>Sign up</Button>
          </Link>
        </div>

        {/* Mobile/Tablet Menu Button */}
        <button 
          onClick={toggleMenu}
          className="lg:hidden text-foreground hover:text-primary transition-colors duration-200"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile/Tablet Tray */}
      <div className={`navbar-overlay ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}></div>
      <div className={`navbar-tray ${isMenuOpen ? 'open' : ''}`}>
        <div className="tray-content">
          {/* Tray Header */}
          <div className="tray-header">
            <div className="tray-title">Menu</div>
            <button className="tray-close-btn" onClick={toggleMenu}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sections */}
          <div className="tray-section">
            <Link href="/" onClick={toggleMenu} className="tray-button">
              <Home className="w-4 h-4 mr-3" />
              Home
            </Link>
          </div>

          <div className="tray-section">
            {companySections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  scrollToSection(section.id);
                  setIsMenuOpen(false);
                }}
                className="tray-button"
              >
                {section.icon}
                <span className="ml-3">{section.title}</span>
              </button>
            ))}
          </div>

          <div className="tray-section">
            <Link href="/login" onClick={toggleMenu} className="tray-button">
              Sign in
            </Link>
            <Link href="/login" onClick={toggleMenu} className="tray-button primary">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
