# Font Styles Documentation

## Overview
GrwoFinance uses a carefully selected font system that combines modern typography with functional monospace fonts for financial data display.

## Primary Font Stack

### **Exo 2 (Primary)**
- **Source**: Google Fonts
- **Weights**: 300, 400, 500, 600, 700, 800
- **Usage**: Headings, body text, UI elements
- **Import**: `@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700;800&display=swap');`

### **Aeonik (Fallback)**
- **Source**: Local OTF files (`/fonts/aeonik/`)
- **Weights**: Regular (400), Medium (500), Bold (700), ThinItalic (400)
- **Usage**: Fallback font when Exo 2 fails to load
- **Format**: OpenType (.otf)
- **Display**: `font-display: swap`

### **Font Stack Priority**
```css
font-family: "Exo 2", "Aeonik", system-ui, sans-serif;
```

## Specialized Fonts

### **Share Tech Mono (Financial Data)**
- **Usage**: Monetary values, financial figures, amounts
- **Style**: Monospace for consistent number alignment
- **Applied via**: Inline styles `{{ fontFamily: '"Share Tech Mono", monospace' }}`
- **Common Use Cases**:
  - Currency formatting (₦ amounts)
  - Financial totals and summaries
  - Input fields for monetary values
  - Report tables and financial statements

## Font Implementation

### **Global Body Font**
```css
body {
  font-family: "Exo 2", system-ui, sans-serif !important;
  @apply antialiased bg-background text-foreground;
}
```

### **Hero Section Typography**
```css
font-family: "Exo 2", "Aeonik", system-ui, sans-serif;
text-rendering: optimizeLegibility;
font-feature-settings: "liga" 1, "kern" 1;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### **Financial Data Styling**
```css
style={{ fontFamily: '"Share Tech Mono", monospace' }}
```

## Font Loading Strategy

### **Performance Optimizations**
1. **Font Display Swap**: Prevents FOIT (Flash of Invisible Text)
2. **Google Fonts Preconnect**: Optimizes font loading
3. **Local Fallback**: Aeonik OTF files as backup
4. **System Fallback**: `system-ui, sans-serif` as final fallback

### **Font Files Structure**
```
/fonts/aeonik/
├── Aeonik-Regular.otf
├── Aeonik-Medium.otf
├── Aeonik-Bold.otf
└── Aeonik-ThinItalic.otf
```

## Usage Patterns

### **1. Headings & UI Elements**
- **Font**: Exo 2
- **Weights**: 500-700 for headings, 400-500 for body
- **Examples**: Page titles, button text, card headers

### **2. Financial Data Display**
- **Font**: Share Tech Mono
- **Style**: Monospace for consistent number alignment
- **Examples**: Currency amounts, financial totals

### **3. Landing Page Hero**
- **Font**: Exo 2 + Aeonik fallback
- **Features**: Enhanced ligatures, kerning
- **Optimization**: Subpixel rendering, font smoothing

## CSS Font Face Definitions

### **Aeonik Regular**
```css
@font-face {
  font-family: "Aeonik";
  src: url("/fonts/aeonik/Aeonik-Regular.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

### **Aeonik Medium**
```css
@font-face {
  font-family: "Aeonik";
  src: url("/fonts/aeonik/Aeonik-Medium.otf") format("opentype");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
```

### **Aeonik Bold**
```css
@font-face {
  font-family: "Aeonik";
  src: url("/fonts/aeonik/Aeonik-Bold.otf") format("opentype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

### **Aeonik Thin Italic**
```css
@font-face {
  font-family: "Aeonik";
  src: url("/fonts/aeonik/Aeonik-ThinItalic.otf") format("opentype");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
```

## Component-Specific Usage

### **Financial Components Using Share Tech Mono**
- Income Manager (29 instances)
- Expense Manager (10 instances)
- Global Dashboard (10 instances)
- Reports (7 instances)
- Income Reports (5 instances)
- Expense Reports (5 instances)
- Invoice List (4 instances)
- Savings Goals (3 instances)
- Subscription Pricing (3 instances)

### **Hero Section Components**
- Landing page hero text
- Typography animations
- Marketing headings

## Typography Best Practices

### **1. Font Loading Order**
1. System fonts load immediately
2. Google Fonts (Montserrat) load asynchronously
3. Local Aeonik loads as fallback
4. Share Tech Mono for financial data

### **2. Performance Considerations**
- `font-display: swap` prevents layout shifts
- Local OTF files reduce external dependencies
- Monospace font limited to financial data only
- Subsetting could reduce font sizes further

### **3. Accessibility**
- System font fallbacks ensure readability
- High contrast ratios maintained
- Font weights provide visual hierarchy
- Monospace improves number readability

## Future Enhancements

### **Potential Optimizations**
1. **Font Subsetting**: Reduce Exo 2 to used characters only
2. **Variable Fonts**: Single file with multiple weights
3. **Preloading**: Critical fonts above the fold
4. **WOFF2 Format**: Better compression than OTF

### **Alternative Font Options**
- **Inter**: Modern system font alternative
- **SF Mono**: Native monospace for macOS
- **Consolas**: Windows monospace fallback
- **Roboto Mono**: Cross-platform monospace

## Maintenance

### **Font File Management**
- Keep OTF files in `/fonts/aeonik/` directory
- Update Google Fonts import when weights change
- Test fallback chain across different browsers
- Monitor font loading performance

### **Browser Compatibility**
- **Modern Browsers**: Full font stack support
- **Legacy Browsers**: System font fallbacks
- **Mobile Devices**: Optimized font loading
- **Slow Connections**: `font-display: swap` strategy

This font system provides a professional, readable, and performant typography foundation for the GrwoFinance application, with specialized handling for financial data display.
