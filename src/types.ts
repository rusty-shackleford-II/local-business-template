export type ColorPalette = {
  primary: string;    // Major color - for primary buttons, key accents, navigation highlights
  secondary: string;  // Minor color - for secondary buttons, icons, breadcrumbs, bullet points
};

export type HeaderColors = { brandText?: string; navText?: string; businessNameColor?: string };
export type Header = { 
  showLogo?: boolean; 
  colors?: HeaderColors;
  logoSize?: number; // Logo size multiplier (0.5 to 3.0, default 1.0)
  expandableHeader?: boolean; // Whether header should expand when logo gets too large
  textSize?: number; // Text size multiplier (0.5 to 2.0, default 1.0)
};

export type Hero = {
  heroLargeImageUrl: string;
  heroImages?: string[]; // Multiple images for slideshow (up to 10)
  slideshowInterval?: number; // Interval in milliseconds (default: 4000)
  headline: string;
  headlineTextSize?: number;
  headlineAlign?: 'left' | 'center' | 'right'; // Text alignment for headline
  subheadline?: string;
  subheadlineTextSize?: number;
  subheadlineBold?: boolean | string; // Make subheadline text bold (stored as string in JSON)
  subheadlineAlign?: 'left' | 'center' | 'right'; // Text alignment for subheadline
  cta?: { 
    label: string;
    labelTextSize?: number;
    href?: string;
    actionType?: 'contact' | 'external' | 'phone';
    phoneNumber?: string;
  };
  ctaAlign?: 'left' | 'center' | 'right'; // CTA button alignment in fullwidth overlay
  phone?: string;
  colors?: { headline?: string; subheadline?: string; ctaText?: string; ctaBackground?: string };
  // Media configuration
  mediaType?: 'photo' | 'video';
  video?: {
    provider: 'youtube' | 'vimeo';
    url: string;
    autoplay?: boolean;
    controls?: boolean;
    loop?: boolean;
    muted?: boolean;
  };
  // Layout configuration
  layoutStyle?: 'standard' | 'fullwidth-overlay'; // Default: 'standard'
  overlayBlur?: boolean; // Enable dark translucent background box for overlay text
  overlayPosition?: { x: number; y: number }; // Position of overlay text (x, y as percentages 0-100)
};

export type AboutStatistic = {
  name: string;
  nameTextSize?: number;
  value: string;
  valueTextSize?: number;
  icon: string;
};

export type AboutImage = {
  imageUrl: string;
  alt: string;
  // Optional thumbnail URL for cropped version (backwards compatible)
  thumbnailUrl?: string;
};

export type About = {
  title: string;
  titleTextSize?: number;
  description?: string;
  descriptionTextSize?: number;
  statistics?: AboutStatistic[];
  features?: string[];
  featuresTextSize?: number;
  images?: AboutImage[];
  thumbnailSize?: number; // Size multiplier for gallery thumbnails (1.0 to 3.0, default 1.0)
  layoutStyle?: 'standard' | 'mosaic'; // Layout style: standard (horizontal carousel) or mosaic (tiled grid)
};

export type ServiceItem = {
  id: string;
  title: string;
  titleTextSize?: number;
  description: string;
  descriptionTextSize?: number;
  imageUrl?: string;
  alt?: string;
  // Optional thumbnail URL for cropped version (backwards compatible)
  thumbnailUrl?: string;
};

export type Services = {
  title: string;
  titleTextSize?: number;
  subtitle: string;
  subtitleTextSize?: number;
  items: ServiceItem[];
};

export type BusinessBenefitItem = {
  title: string;
  titleTextSize?: number;
  description: string;
  descriptionTextSize?: number;
};

export type BusinessBenefits = {
  title: string;
  titleTextSize?: number;
  items: BusinessBenefitItem[];
};



export type TestimonialItem = {
  authorImageUrl?: string;
  authorName: string;
  authorNameTextSize?: number;
  rating: number;
  reviewDate?: string;
  reviewDateTextSize?: number;
  reviewText: string;
  reviewTextTextSize?: number;
};

export type Testimonials = { 
  title: string;
  titleTextSize?: number;
  subtitle: string;
  subtitleTextSize?: number;
  overallRating?: number;
  totalReviews?: number;
  items: TestimonialItem[] 
};

// Upcoming Events types
export type UpcomingEventItem = {
  id: string;
  title: string;
  titleTextSize?: number;
  description: string;
  descriptionTextSize?: number;
  eventType: string;
  eventTypeTextSize?: number;
  date?: string;
  time?: string;
  capacity?: string;
  capacityTextSize?: number;
  pricePerPerson?: string;
  pricePerPersonTextSize?: number;
  imageUrl?: string;
  alt?: string;
  inquireUrl?: string; // External URL for inquire button instead of contact form
  // Optional thumbnail URL for cropped version (backwards compatible)
  thumbnailUrl?: string;
  // Recurring event fields
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number; // every N days/weeks/months/years
    endDate?: string;
    daysOfWeek?: number[]; // for weekly: 0=Sunday, 1=Monday, etc.
    dayOfMonth?: number; // for monthly: which day of month
  };
  // Detailed modal fields
  longDescription?: string;
  dressCode?: string;
  externalLinks?: Array<{
    label: string;
    url: string;
  }>;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    country: string;
  };
  imageGallery?: Array<{
    url: string;
    alt?: string;
    caption?: string;
  }>;
};

export type UpcomingEvents = {
  title: string;
  titleTextSize?: number;
  subtitle: string;
  subtitleTextSize?: number;
  items: UpcomingEventItem[];
};

// Menu types
export type MenuItem = {
  id: string;
  title: string;
  titleTextSize?: number;
  description?: string;
  descriptionTextSize?: number;
  price?: string;
  priceTextSize?: number;
  imageUrl?: string;
  alt?: string;
  dietary?: string[];
  // Optional thumbnail URL for cropped version (backwards compatible)
  thumbnailUrl?: string;
};

export type MenuBulkImage = {
  id: string;
  imageUrl: string;
  alt?: string;
  caption?: string;
};

export type MenuCategory = {
  id: string;
  name: string;
  nameTextSize?: number;
  description?: string;
  descriptionTextSize?: number;
  items: MenuItem[];
  layoutStyle?: 'carousel' | 'mosaic'; // Layout style: carousel (horizontal swiper) or mosaic (grid)
  cardSize?: number; // Card size multiplier (1.0 to 3.0, default 1.0)
};

export type MenuImage = {
  id: string;
  imageUrl: string;
  alt?: string;
  caption?: string;
};

export type MenuTab = {
  id: string;
  name: string;
  nameTextSize?: number;
  description?: string;
  descriptionTextSize?: number;
  menuImages?: MenuImage[]; // Large menu images that can be swiped through
  bulkImages?: MenuBulkImage[];
  categories?: MenuCategory[];
  items?: MenuItem[]; // Keep for backward compatibility - uncategorized items
  canvaEmbedUrl?: string; // Canva embed iframe URL - when present, shows embed above menu cards
  htmlContent?: string; // HTML content to render instead of menu images (supports full HTML like privacy policy)
};

export type Menu = {
  title: string;
  titleTextSize?: number;
  subtitle?: string;
  subtitleTextSize?: number;
  tabs?: MenuTab[];
  items?: MenuItem[]; // Keep for backward compatibility
};

export type SocialMedia = {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  yelp?: string;
  googleBusinessProfile?: string;
  other?: string;
  doordash?: string;
  ubereats?: string;
  grubhub?: string;
  postmates?: string;
  instacart?: string;
  toast?: string;
};

export type BusinessHours = {
  Monday?: string | { open: string; close: string };
  Tuesday?: string | { open: string; close: string };
  Wednesday?: string | { open: string; close: string };
  Thursday?: string | { open: string; close: string };
  Friday?: string | { open: string; close: string };
  Saturday?: string | { open: string; close: string };
  Sunday?: string | { open: string; close: string };
};

export type FormField = {
  id: string;
  label: string;
  name: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'number' | 'date' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select fields
};

export type License = {
  title: string;
  number: string;
};

export type Contact = {
  title: string;
  titleTextSize?: number;
  subtitle?: string;
  subtitleTextSize?: number;
  address?: string;
  addressTextSize?: number;
  phone?: string;
  phoneTextSize?: number;
  mapEmbedUrl?: string;
  contactRecipients?: string[];
  businessHours?: BusinessHours;
  social?: SocialMedia;
  formFields?: FormField[];
  // Backward compatibility - old single license fields
  licenseNumber?: string;
  licenseNumberTitle?: string;
  // New licenses array
  licenses?: License[];
  // Optional consent field
  showConsent?: boolean; // Toggle visibility of consent field
  consentText?: string; // The text to display (e.g., "By checking this box, you agree to receive marketing emails")
  consentRequiresCheckbox?: boolean; // Whether to show a checkbox
  consentTextSize?: number; // Text size for consent field
};

export type Footer = {
  socialLinks?: { platform: string; url: string }[];
  copyrightText?: string;
  copyrightTextSize?: number;
  logoSize?: number; // Logo size multiplier (0.5 to 3.0, default 1.0)
  textSize?: number; // Business name text size multiplier (0.5 to 2.0, default 1.0)
  showPrivacyPolicy?: boolean | string; // Toggle privacy policy link visibility (stored as string in editor)
  privacyPolicyText?: string; // Privacy policy content (supports text/HTML)
  showTermsAndConditions?: boolean | string; // Toggle terms and conditions link visibility (stored as string in editor)
  termsAndConditionsText?: string; // Terms and conditions content (supports text/HTML)
};

export type SEO = {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  primaryService?: string; // e.g., Plumbing, HVAC
  primaryCity?: string; // e.g., San Francisco
  googleAnalyticsId?: string; // Google Analytics Measurement ID (G-XXXXXXXXXX or UA-XXXXXXXX-X)
};

// Video section types
export type VideoItem = {
  title?: string;
  titleTextSize?: number;
  subtitle?: string;
  subtitleTextSize?: number;
  provider: 'youtube' | 'vimeo';
  url: string; // Accepts full iframe embed code or URL; component extracts src as needed
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  volume?: number; // 0-100
  width?: number;  // px; if omitted, responsive width is used
  height?: number; // px; if omitted, maintains 16:9
};

export type Videos = {
  title?: string;
  titleTextSize?: number;
  subtitle?: string;
  subtitleTextSize?: number;
  items: VideoItem[];
};

// Payment section types
export type PaymentProvider = 'link' | 'shopify_embed';

export type PaymentGalleryImage = {
  id: string;
  imageUrl: string;
  alt?: string;
  caption?: string;
};

export type Payment = {
  title?: string;
  titleTextSize?: number;
  description?: string;
  descriptionTextSize?: number;
  buttonLabel?: string;
  buttonLabelTextSize?: number;
  buttonColor?: string; // Button background color
  provider?: PaymentProvider; // Type of payment integration
  paymentLinkUrl?: string; // Payment link URL (Stripe, Shopify, etc.)
  shopifyEmbedCode?: string; // Shopify Buy Button embed code
  galleryImages?: PaymentGalleryImage[]; // Product image gallery
  galleryTitle?: string; // Gallery section title
  thumbnailSize?: number; // Size multiplier for gallery thumbnails (1.0 to 3.0, default 1.0)
  addHeroCta?: boolean; // If enabled, hero CTA scrolls to payment
  heroCtaLabel?: string; // Optional override label for hero CTA
  heroCtaLabelTextSize?: number;
  addHeaderCta?: boolean; // If enabled, show header CTA that scrolls to payment
  headerCtaLabel?: string; // Optional override label for header CTA
  headerCtaLabelTextSize?: number;
};

// Optional layout configuration allowing section ordering and visibility
export type SectionKey = 'hero' | 'about' | 'services' | 'menu' | 'testimonials' | 'upcomingEvents' | 'contact' | 'videos' | 'payment' | 'partners';
export type Layout = {
  sections: Array<SectionKey | { id: SectionKey; enabled?: boolean }>;
};

export type BusinessInfo = {
  businessName: string;
  businessCategory: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  phone: string;
  email: string;
  paymentAccepted: string[];
  areaServed: string;
  availableLanguages: string[];
  priceRange: string;
  businessHours?: BusinessHours;
};

export type SiteData = {
  businessInfo?: BusinessInfo;
  businessName?: string; // Legacy support for top-level businessName
  logoUrl?: string;
  seo?: SEO;
  header?: Header;
  hero: Hero;
  about: About;
  services: Services;
  menu?: Menu;
  businessBenefits: BusinessBenefits;
  testimonials: Testimonials;
  upcomingEvents?: UpcomingEvents;
  contact: Contact;
  footer: Footer;
  videos?: Videos;
  payment?: Payment;
  layout?: Layout;
  colorPalette?: ColorPalette;
};


