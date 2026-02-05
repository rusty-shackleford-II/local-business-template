export type ColorPalette = {
  primary: string;    // Major color - for primary buttons, key accents, navigation highlights
  secondary: string;  // Minor color - for secondary buttons, icons, breadcrumbs, bullet points
};

export type HeaderColors = { brandText?: string; navText?: string; businessNameColor?: string; background?: string };
export type Header = { 
  showLogo?: boolean | string; // Toggle logo visibility (default: true when undefined for backwards compatibility, stored as string in editor)
  showBusinessName?: boolean | string; // Toggle header business name visibility (default: true when undefined for backwards compatibility, stored as string in editor)
  brandText?: string; // Custom header business name text (defaults to businessInfo.businessName when undefined for backwards compatibility)
  colors?: HeaderColors;
  logoSize?: number; // Logo size multiplier (0.5 to 3.0, default 1.0)
  expandableHeader?: boolean; // Whether header should expand when logo gets too large
  textSize?: number; // Text size multiplier (0.5 to 2.0, default 1.0)
  textFont?: string; // Business name font family
  navLinkSize?: number; // Nav link text size multiplier (0.75 to 1.5, default 1.0)
  navLinkFont?: string; // Nav link font family
};

// Hero CTA button type for multiple buttons support
export type HeroCtaButton = {
  id: string;
  label: string;
  labelTextSize?: number;
  href?: string;
  actionType?: 'contact' | 'external' | 'phone';
  phoneNumber?: string;
  variant?: 'primary' | 'secondary' | 'outline'; // Button style variant
  backgroundColor?: string; // Override button background color
  textColor?: string; // Override button text color
  showArrow?: boolean; // Whether to show arrow icon (default: true for first button)
};

// Button grid layout for visual drag-and-drop positioning
export type ButtonGridPosition = {
  buttonId: string;  // Reference to the button's id
  row: number;       // Row index (0-based)
  col: number;       // Column index (0-based)
};

export type ButtonGridLayout = {
  positions: ButtonGridPosition[];  // Array of button positions in the grid
};

// Global button styling options for the hero CTA buttons
export type ButtonStyles = {
  paddingX?: number;      // Horizontal padding in px (default: 32)
  paddingY?: number;      // Vertical padding in px (default: 16)
  borderRadius?: number;  // Border radius in px (default: 8)
  fontFamily?: string;    // Font family (default: inherit)
  fontSize?: number;      // Font size in px (default: 16)
  fontWeight?: number;    // Font weight (default: 600)
};

export type Hero = {
  heroLargeImageUrl: string;
  heroImages?: string[]; // Multiple images for slideshow (up to 10)
  slideshowInterval?: number; // Interval in milliseconds (default: 4000)
  headline: string;
  headlineTextSize?: number;
  headlineAlign?: 'left' | 'center' | 'right'; // Text alignment for headline
  headlineFont?: string; // Font family for headline
  subheadline?: string;
  subheadlineTextSize?: number;
  subheadlineBold?: boolean | string; // Make subheadline text bold (stored as string in JSON)
  subheadlineAlign?: 'left' | 'center' | 'right'; // Text alignment for subheadline
  subheadlineFont?: string; // Font family for subheadline
  // Legacy single CTA (for backwards compatibility)
  cta?: { 
    label: string;
    labelTextSize?: number;
    href?: string;
    actionType?: 'contact' | 'external' | 'phone';
    phoneNumber?: string;
  };
  // Multiple CTA buttons (takes precedence over single cta)
  ctaButtons?: HeroCtaButton[];
  buttonsColumns?: 1 | 2 | 3 | 4; // Number of columns for button grid on desktop (auto-detected if not set)
  // Visual grid layout for buttons - if set, takes precedence over buttonsColumns for positioning
  buttonsGridLayout?: ButtonGridLayout;
  buttonStyles?: ButtonStyles; // Global styling for all CTA buttons
  ctaAlign?: 'left' | 'center' | 'right'; // CTA button alignment in fullwidth overlay
  phone?: string;
  colors?: { headline?: string; subheadline?: string; ctaText?: string; ctaBackground?: string };
  // Media configuration
  mediaType?: 'photo' | 'video';
  video?: {
    provider: 'youtube' | 'vimeo';
    url: string;
    aspectRatio?: string; // e.g., "16:9", "1:1", "9:16" - used for cover behavior
    autoplay?: boolean;
    controls?: boolean;
    loop?: boolean;
    muted?: boolean;
  };
  // Layout configuration
  layoutStyle?: 'standard' | 'fullwidth-overlay'; // Default: 'standard'
  overlayBlur?: boolean; // Enable dark translucent background box for overlay text
  overlayPosition?: { x: number; y: number }; // Position of overlay text (x, y as percentages 0-100)
  overlaySize?: { width: number; height: number; bottomPadding?: number }; // Size of overlay box (percentages 20-100), bottomPadding in pixels for extra space below text
  // Button group positioning for fullwidth overlay (outside blur container)
  buttonsPosition?: { x: number; y: number }; // Position of buttons group (x, y as percentages 0-100)
  // Social links positioning for fullwidth overlay
  socialLinksPosition?: { x: number; y: number }; // Position of social links (x, y as percentages 0-100)
  // Standard layout: position buttons/social anywhere in the hero section
  // Position is stored as pixel offset from top-left of the hero section
  standardButtonsPosition?: { x: number; y: number }; // Pixel position in hero section (LEGACY - deprecated)
  standardSocialLinksPosition?: { x: number; y: number }; // Pixel position in hero section (LEGACY - deprecated)
  // Minimum height for hero section when elements are positioned below content
  standardHeroMinHeight?: number;
  
  // NEW: Relative horizontal positioning for standard layout (0-1 scale)
  // 0 = left button left-aligned with left edge of hero text
  // 0.5 = centered with respect to the hero section
  // 1 = right side of rightmost button/icon aligns with right edge of hero image
  // Note: On mobile, these are ignored and elements are centered
  standardButtonsHorizontalAlign?: number;
  standardSocialLinksHorizontalAlign?: number;
  // Vertical offset in pixels from the default position (positive = down)
  standardButtonsVerticalOffset?: number;
  standardSocialLinksVerticalOffset?: number;
  // Width as percentage of container (0-1) - stored for consistent zone detection
  standardButtonsWidthPercent?: number;
  standardSocialLinksWidthPercent?: number;
};

export type AboutStatistic = {
  name: string;
  nameTextSize?: number;
  nameTextColor?: string;
  nameTextFont?: string;
  value: string;
  valueTextSize?: number;
  valueTextColor?: string;
  valueTextFont?: string;
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
  titleTextColor?: string;
  titleTextFont?: string;
  description?: string;
  descriptionTextSize?: number;
  descriptionTextColor?: string;
  descriptionTextFont?: string;
  statistics?: AboutStatistic[];
  features?: string[];
  featuresTextSize?: number;
  featuresTextColor?: string;
  featuresTextFont?: string;
  images?: AboutImage[];
  thumbnailSize?: number; // Size multiplier for gallery thumbnails (1.0 to 3.0, default 1.0)
  layoutStyle?: 'standard' | 'mosaic'; // Layout style: standard (horizontal carousel) or mosaic (tiled grid)
};

export type ServiceItem = {
  id: string;
  title: string;
  titleTextSize?: number;
  titleTextColor?: string;
  titleTextFont?: string;
  description: string;
  descriptionTextSize?: number;
  descriptionTextColor?: string;
  descriptionTextFont?: string;
  imageUrl?: string;
  alt?: string;
  // Optional thumbnail URL for cropped version (backwards compatible)
  thumbnailUrl?: string;
  // Optional hyperlink that opens in new tab when service image/card is clicked
  linkUrl?: string;
};

export type Services = {
  title: string;
  titleTextSize?: number;
  titleTextColor?: string;
  titleTextFont?: string;
  subtitle: string;
  subtitleTextSize?: number;
  subtitleTextColor?: string;
  subtitleTextFont?: string;
  items: ServiceItem[];
  descriptionTextSize?: number; // Uniform text size for all service descriptions
  descriptionTextColor?: string;
  descriptionTextFont?: string;
  itemTitleTextColor?: string; // Uniform text color for all service item titles
  itemTitleTextFont?: string; // Uniform font for all service item titles
};

export type BusinessBenefitItem = {
  title: string;
  titleTextSize?: number;
  titleTextColor?: string;
  titleTextFont?: string;
  description: string;
  descriptionTextSize?: number;
  descriptionTextColor?: string;
  descriptionTextFont?: string;
};

export type BusinessBenefits = {
  title: string;
  titleTextSize?: number; // Main section title size
  titleTextColor?: string;
  titleTextFont?: string;
  items: BusinessBenefitItem[];
  itemTitleTextSize?: number; // Uniform text size for all benefit item titles
  itemTitleTextColor?: string;
  itemTitleTextFont?: string;
  itemDescriptionTextSize?: number; // Uniform text size for all benefit item descriptions
  itemDescriptionTextColor?: string;
  itemDescriptionTextFont?: string;
};



export type TestimonialItem = {
  authorImageUrl?: string;
  authorName: string;
  authorNameTextSize?: number;
  authorNameTextColor?: string;
  authorNameTextFont?: string;
  rating: number;
  reviewDate?: string;
  reviewDateTextSize?: number;
  reviewDateTextColor?: string;
  reviewDateTextFont?: string;
  reviewText: string;
  reviewTextTextSize?: number;
  reviewTextTextColor?: string;
  reviewTextTextFont?: string;
};

export type Testimonials = { 
  title: string;
  titleTextSize?: number;
  titleTextColor?: string;
  titleTextFont?: string;
  subtitle: string;
  subtitleTextSize?: number;
  subtitleTextColor?: string;
  subtitleTextFont?: string;
  overallRating?: number;
  totalReviews?: number;
  showGoogleReviewsBadge?: boolean;
  items: TestimonialItem[];
  // Uniform styles for all testimonial items
  itemAuthorNameTextColor?: string;
  itemAuthorNameTextFont?: string;
  itemReviewTextTextColor?: string;
  itemReviewTextTextFont?: string;
  itemReviewDateTextColor?: string;
  itemReviewDateTextFont?: string;
};

// Upcoming Events types
export type UpcomingEventItem = {
  id: string;
  title: string;
  titleTextSize?: number;
  titleTextColor?: string;
  titleTextFont?: string;
  description: string;
  descriptionTextSize?: number;
  descriptionTextColor?: string;
  descriptionTextFont?: string;
  eventType: string;
  eventTypeTextSize?: number;
  date?: string;
  time?: string;
  capacity?: string;
  capacityTextSize?: number;
  capacityTextColor?: string;
  capacityTextFont?: string;
  pricePerPerson?: string;
  pricePerPersonTextSize?: number;
  pricePerPersonTextColor?: string;
  pricePerPersonTextFont?: string;
  imageUrl?: string;
  alt?: string;
  inquireUrl?: string; // External URL for inquire button instead of contact form
  // Button customization (backwards compatible - defaults to hardcoded values when undefined)
  detailsButtonLabel?: string; // Default: "See More Details"
  inquireButtonLabel?: string; // Default: "Inquire About This Event"
  detailsButtonAction?: 'modal' | 'external'; // Default: 'modal' (opens details modal)
  detailsButtonUrl?: string; // URL when detailsButtonAction is 'external'
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

// Global button styling options for the upcoming events buttons
export type EventsButtonStyles = {
  fontSize?: number;      // Font size in px (default: 14 for buttons)
  borderRadius?: number;  // Border radius in px (default: 8)
  fontFamily?: string;    // Font family (default: inherit)
  fontWeight?: number;    // Font weight (default: 500)
  // Colors apply to all buttons in the section
  backgroundColor?: string;     // Primary button background (default: colorPalette.primary or #10B981)
  textColor?: string;           // Primary button text color (default: #ffffff)
  secondaryBackgroundColor?: string;  // Secondary button background (default: #f3f4f6)
  secondaryTextColor?: string;        // Secondary button text color (default: #1f2937)
  // Button visibility (backwards compatible - undefined means enabled)
  primaryButtonEnabled?: boolean;     // Show primary button (default: true)
  secondaryButtonEnabled?: boolean;   // Show secondary button (default: true)
};

export type UpcomingEvents = {
  title: string;
  titleTextSize?: number;
  titleTextColor?: string;
  titleTextFont?: string;
  subtitle: string;
  subtitleTextSize?: number;
  subtitleTextColor?: string;
  subtitleTextFont?: string;
  items: UpcomingEventItem[];
  // Global button styling for all event buttons
  buttonStyles?: EventsButtonStyles;
  // Uniform styles for all event items
  itemTitleTextColor?: string;
  itemTitleTextFont?: string;
  itemDescriptionTextColor?: string;
  itemDescriptionTextFont?: string;
};

// Menu types
export type MenuItem = {
  id: string;
  title: string;
  titleTextSize?: number;
  titleTextColor?: string;
  titleTextFont?: string;
  description?: string;
  descriptionTextSize?: number;
  descriptionTextColor?: string;
  descriptionTextFont?: string;
  price?: string;
  priceTextSize?: number;
  priceTextColor?: string;
  priceTextFont?: string;
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
  nameTextColor?: string;
  nameTextFont?: string;
  description?: string;
  descriptionTextSize?: number;
  descriptionTextColor?: string;
  descriptionTextFont?: string;
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
  nameTextColor?: string;
  nameTextFont?: string;
  description?: string;
  descriptionTextSize?: number;
  descriptionTextColor?: string;
  descriptionTextFont?: string;
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
  titleTextColor?: string;
  titleTextFont?: string;
  subtitle?: string;
  subtitleTextSize?: number;
  subtitleTextColor?: string;
  subtitleTextFont?: string;
  tabs?: MenuTab[];
  items?: MenuItem[]; // Keep for backward compatibility
  // Uniform styles for all menu items
  itemTitleTextColor?: string;
  itemTitleTextFont?: string;
  itemDescriptionTextColor?: string;
  itemDescriptionTextFont?: string;
  itemPriceTextColor?: string;
  itemPriceTextFont?: string;
};

// Custom social link with optional custom icon
export type CustomSocialLink = {
  id: string;
  url: string;
  label: string;
  iconUrl?: string; // Custom uploaded icon image URL
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
  deliveroo?: string;
  // Custom external links with custom icons
  customLinks?: CustomSocialLink[];
};

// Centralized social links configuration
export type SocialLinksConfig = {
  links?: SocialMedia;
  showInHero?: boolean;
  showInContact?: boolean;
  heroSocialIconSize?: number; // Size multiplier for social icons in hero (0.5 to 2.0, default 1.0)
  contactSocialIconSize?: number; // Size multiplier for social icons in contact section (0.5 to 2.0, default 1.0)
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
  titleTextColor?: string;
  titleTextFont?: string;
  subtitle?: string;
  subtitleTextSize?: number;
  subtitleTextColor?: string;
  subtitleTextFont?: string;
  address?: string;
  addressTextSize?: number;
  addressTextColor?: string;
  addressTextFont?: string;
  phone?: string;
  phoneTextSize?: number;
  phoneTextColor?: string;
  phoneTextFont?: string;
  emailTextColor?: string;
  emailTextFont?: string;
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
  consentTextColor?: string;
  consentTextFont?: string;
};

export type Footer = {
  socialLinks?: { platform: string; url: string }[];
  copyrightText?: string;
  copyrightTextSize?: number;
  copyrightTextColor?: string;
  copyrightTextFont?: string;
  logoSize?: number; // Logo size multiplier (0.5 to 3.0, default 1.0)
  textSize?: number; // Business name text size multiplier (0.5 to 2.0, default 1.0)
  textColor?: string; // Business name text color
  textFont?: string; // Business name text font
  navLinkSize?: number; // Nav link text size multiplier (0.75 to 1.5, default 1.0)
  navLinkColor?: string; // Nav link text color
  navLinkFont?: string; // Nav link text font
  hidevLogoSize?: number; // Hi Dev logo size multiplier (0.4 to 1.0, default 1.0 = max size)
  showLogo?: boolean | string; // Toggle footer logo visibility (default: true when undefined for backwards compatibility, stored as string in editor)
  showBusinessName?: boolean | string; // Toggle footer business name visibility (default: true when undefined for backwards compatibility, stored as string in editor)
  brandText?: string; // Custom footer business name text (defaults to businessInfo.businessName when undefined for backwards compatibility)
  showPrivacyPolicy?: boolean | string; // Toggle privacy policy link visibility (stored as string in editor)
  privacyPolicyText?: string; // Privacy policy content (supports text/HTML)
  showTermsAndConditions?: boolean | string; // Toggle terms and conditions link visibility (stored as string in editor)
  termsAndConditionsText?: string; // Terms and conditions content (supports text/HTML)
  colors?: { background?: string; textColor?: string; navText?: string }; // Footer color customization
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
  titleTextColor?: string;
  titleTextFont?: string;
  subtitle?: string;
  subtitleTextSize?: number;
  subtitleTextColor?: string;
  subtitleTextFont?: string;
  provider: 'youtube' | 'vimeo';
  url: string; // Accepts full iframe embed code or URL; component extracts src as needed
  aspectRatio?: string; // e.g., "16:9", "1:1", "9:16" - used for cover behavior
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
  titleTextColor?: string;
  titleTextFont?: string;
  subtitle?: string;
  subtitleTextSize?: number;
  subtitleTextColor?: string;
  subtitleTextFont?: string;
  items: VideoItem[];
  // Uniform styles for all video items
  itemTitleTextColor?: string;
  itemTitleTextFont?: string;
  itemSubtitleTextColor?: string;
  itemSubtitleTextFont?: string;
};

// Payment section types
export type PaymentProvider = 'link' | 'shopify_embed';

export type I18nConfig = {
  enabled?: boolean;
  defaultLanguage?: string;
  availableLanguages?: string[];
  translations?: Record<string, any>;
};

export type PaymentGalleryImage = {
  id: string;
  imageUrl: string;
  alt?: string;
  caption?: string;
};

export type Payment = {
  title?: string;
  titleTextSize?: number;
  titleTextColor?: string;
  titleTextFont?: string;
  description?: string;
  descriptionTextSize?: number;
  descriptionTextColor?: string;
  descriptionTextFont?: string;
  buttonLabel?: string;
  buttonLabelTextSize?: number;
  buttonLabelTextColor?: string;
  buttonLabelTextFont?: string;
  buttonColor?: string; // Button background color
  provider?: PaymentProvider; // Type of payment integration
  paymentLinkUrl?: string; // Payment link URL (Stripe, Shopify, etc.)
  shopifyEmbedCode?: string; // Shopify Buy Button embed code
  galleryImages?: PaymentGalleryImage[]; // Product image gallery
  galleryTitle?: string; // Gallery section title
  galleryTitleTextColor?: string;
  galleryTitleTextFont?: string;
  thumbnailSize?: number; // Size multiplier for gallery thumbnails (1.0 to 3.0, default 1.0)
  addHeroCta?: boolean; // If enabled, hero CTA scrolls to payment
  heroCtaLabel?: string; // Optional override label for hero CTA
  heroCtaLabelTextSize?: number;
  addHeaderCta?: boolean; // If enabled, show header CTA that scrolls to payment
  headerCtaLabel?: string; // Optional override label for header CTA
  headerCtaLabelTextSize?: number;
};

// Optional layout configuration allowing section ordering and visibility
export type SectionKey = 'hero' | 'about' | 'services' | 'benefits' | 'menu' | 'testimonials' | 'upcomingEvents' | 'contact' | 'videos' | 'payment' | 'partners';

// Section reference within a page - sectionId can be a SectionKey or a custom instance ID like "hero_abc123"
export type PageSection = {
  sectionId: string; // e.g., "hero", "about", "services_abc123"
  enabled?: boolean;
  navLabel?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
};

// Page configuration for multipage sites
export type Page = {
  id: string; // Unique page ID
  name: string; // Display name for navigation
  slug: string; // URL slug (empty string for home page)
  heroEnabled?: boolean; // Whether this page shows its hero section (default: true)
  sections: PageSection[];
};

// Legacy section format (for backwards compatibility)
export type LegacySection = SectionKey | { id: SectionKey; enabled?: boolean; navLabel?: string; backgroundColor?: string; textColor?: string; fontFamily?: string };

export type Layout = {
  // Legacy sections array (kept for backwards compatibility)
  sections: Array<LegacySection>;
  // New pages array for multipage mode (if present, takes precedence)
  pages?: Page[];
};

// Additional section instances storage (for sections beyond the original ones)
// Keys are like "hero_abc123", "services_xyz789"
export type SectionInstances = {
  [key: string]: Hero | About | Services | BusinessBenefits | Menu | Testimonials | UpcomingEvents | Contact | Videos | Payment;
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
  version?: string;
  i18n?: I18nConfig;
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
  // Centralized social links configuration
  socialLinks?: SocialLinksConfig;
  // Additional section instances for multipage sites (e.g., "hero_abc123": {...})
  sectionInstances?: SectionInstances;
};


