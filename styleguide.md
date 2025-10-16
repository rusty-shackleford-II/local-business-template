# Quick Taxes - Style Guide

## Design Philosophy
Professional, trustworthy, and accessible financial services with a modern, clean aesthetic that works seamlessly in both English and Spanish.

## Color Palette

### Primary Colors
- **Primary Green**: `#10B981` (emerald-500) - Main accent color for CTAs, highlights
- **Dark Green**: `#047857` (emerald-700) - Hover states, darker accents
- **Light Green**: `#D1FAE5` (emerald-100) - Background highlights, subtle accents

### Neutral Colors
- **White**: `#FFFFFF` - Primary background
- **Light Gray**: `#F9FAFB` (gray-50) - Section backgrounds
- **Medium Gray**: `#6B7280` (gray-500) - Secondary text
- **Dark Gray**: `#111827` (gray-900) - Primary text
- **Border Gray**: `#E5E7EB` (gray-200) - Borders, dividers

### Semantic Colors
- **Success**: `#10B981` (emerald-500)
- **Warning**: `#F59E0B` (amber-500)
- **Error**: `#EF4444` (red-500)
- **Info**: `#3B82F6` (blue-500)

## Typography

### Font Stack
- **Primary**: 'League Spartan', Arial, Helvetica, sans-serif
- **Headings**: League Spartan with font-weight 600-700
- **Body**: League Spartan with font-weight 400-500

### Type Scale
- **Hero Title**: 3xl-4xl (text-3xl md:text-4xl) - 30px-36px
- **Section Title**: 2xl-3xl (text-2xl md:text-3xl) - 24px-30px
- **Card Title**: xl-2xl (text-xl md:text-2xl) - 20px-24px
- **Body Large**: lg (text-lg) - 18px
- **Body**: base (text-base) - 16px
- **Body Small**: sm (text-sm) - 14px
- **Caption**: xs (text-xs) - 12px

## Layout & Spacing

### Breakpoints
- **Mobile**: 0-766px
- **Tablet**: 767px-1023px
- **Desktop**: 1024px+
- **Critical Breakpoint**: 767px (used for header/body padding consistency)

### Container Sizes
- **Max Width**: 1200px
- **Padding**: 16px mobile, 24px tablet, 32px desktop
- **Section Spacing**: 64px mobile, 80px tablet, 96px desktop

### Header Rules (Critical)
1. Header height and body padding-top MUST be identical
2. Use 767px breakpoint for both header height and body padding
3. Never add extra top spacing to first content section
4. Body padding applies to ALL content
5. Mobile: 64px height/padding, Desktop: 80px height/padding

## Component Design Patterns

### Cards
- **Shadow**: `shadow-sm hover:shadow-md` (subtle elevation)
- **Border Radius**: `rounded-lg` (8px)
- **Padding**: `p-6` (24px)
- **Background**: White with subtle border

### Buttons
- **Primary**: Green background, white text, rounded-lg
- **Secondary**: White background, green border and text
- **Ghost**: Transparent background, green text
- **Sizes**: sm (32px), md (40px), lg (48px)

### Forms
- **Input Height**: 48px minimum
- **Border**: 1px solid gray-300, focus:green-500
- **Border Radius**: 6px
- **Label**: font-medium, gray-700
- **Spacing**: 16px between fields

## Responsive Design

### Mobile-First Approach
1. Design for mobile first (320px-766px)
2. Enhance for tablet (767px-1023px)
3. Optimize for desktop (1024px+)

### Navigation
- **Mobile**: Hamburger menu with slide-out drawer
- **Desktop**: Horizontal navigation with dropdown for language

### Grid Systems
- **Mobile**: Single column layout
- **Tablet**: 2-column grid for cards
- **Desktop**: 3-4 column grid for services, 2-column for content

## Animation Guidelines

### Micro-Interactions
- **Hover Transitions**: 200ms ease-in-out
- **Focus States**: Immediate (0ms) for accessibility
- **Loading States**: Gentle pulse or fade
- **Page Transitions**: 300ms ease-out

### Animation Principles
1. **Purposeful**: Every animation should serve a function
2. **Subtle**: Enhance UX without being distracting
3. **Consistent**: Same timing and easing across components
4. **Accessible**: Respect `prefers-reduced-motion`

### Common Animations
```css
/* Hover elevation */
.hover-lift {
  transition: transform 200ms ease-in-out, box-shadow 200ms ease-in-out;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* Button press */
.button-press:active {
  transform: translateY(1px);
}

/* Fade in */
.fade-in {
  opacity: 0;
  animation: fadeIn 600ms ease-out forwards;
}
```

## Internationalization (i18n)

### Language Support
- **Primary**: English (en-US)
- **Secondary**: Spanish (es-US)
- **Fallback**: English for any missing translations

### Text Guidelines
1. Keep string keys descriptive: `hero.title`, `services.accounting.description`
2. Support RTL-friendly layouts (future-proofing)
3. Account for text expansion (Spanish ~25% longer than English)
4. Use proper localized formatting for numbers, dates, phone numbers

### Flag Icons
- **English**: 🇺🇸 (US flag)
- **Spanish**: 🇪🇸 (Spain flag) or 🇲🇽 (Mexico flag) - use Mexico for US Spanish market

## Accessibility Standards

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 minimum for normal text, 3:1 for large text
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Keyboard Navigation**: All functionality accessible via keyboard
- **Screen Readers**: Proper semantic HTML and ARIA labels

### Implementation
- Use semantic HTML elements
- Provide alt text for all images
- Ensure proper heading hierarchy (h1 → h2 → h3)
- Include skip navigation links
- Test with keyboard-only navigation

## Performance Guidelines

### Image Optimization
- Use WebP format with JPEG fallback
- Implement lazy loading for below-the-fold images
- Responsive images with appropriate sizes
- Compress images (80-85% quality for photos)

### Code Splitting
- Lazy load language bundles
- Split components by route
- Minimize initial bundle size

### Core Web Vitals Targets
- **LCP**: < 2.5 seconds
- **FID**: < 100 milliseconds
- **CLS**: < 0.1

## Brand Voice & Tone

### English
- **Professional yet approachable**
- **Clear and straightforward**
- **Trustworthy and reliable**
- **Helpful and supportive**

### Spanish
- **Profesional pero accesible**
- **Claro y directo**
- **Confiable y seguro**
- **Útil y solidario**

## Component Library Structure

### Atomic Design
1. **Atoms**: Buttons, inputs, icons, typography
2. **Molecules**: Form groups, cards, navigation items
3. **Organisms**: Header, footer, contact form, service grid
4. **Templates**: Page layouts
5. **Pages**: Complete page implementations 