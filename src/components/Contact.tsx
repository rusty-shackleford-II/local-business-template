import React, { useState, useMemo, useRef, useEffect } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import EditableText from './EditableText';
import BusinessHoursEditor from './BusinessHoursEditor';
import SocialLinksEditorPopup from './SocialLinksEditorPopup';
import { useI18nContext } from './I18nProvider';
import { 
  FaInstagram, 
  FaFacebookF, 
  FaPinterest, 
  FaLinkedinIn, 
  FaTiktok,
  FaYelp,
  FaStar,
  FaGoogle,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { 
  SiDoordash, 
  SiUbereats, 
  SiGrubhub,
  SiPostmates, 
  SiInstacart 
} from 'react-icons/si';
import axios from 'axios';
import { stripPhoneNumber } from '../lib/phoneUtils';
import type { Contact as ContactCfg, BusinessInfo, ColorPalette, License, SocialLinksConfig } from '../types';

const FORMSPARK_ACTION_URL = 'https://submit-form.com/n1Wkyb8df';

// hCaptcha sitekey
const HCAPTCHA_SITEKEY = '6d52d016-4fce-411e-83ba-04ea97fe2e3c';

type Props = { 
  contact?: ContactCfg; 
  businessInfo?: BusinessInfo; 
  backgroundClass?: string;
  editable?: boolean;
  onEdit?: (path: string, value: any) => void;
  colorPalette?: ColorPalette;
  siteUrl?: string;
  sectionId?: string;
  socialLinks?: SocialLinksConfig;
};

const formatBusinessHours = (businessHours?: ContactCfg['businessHours'] | BusinessInfo['businessHours'], t?: (key: string, defaultValue?: string) => string) => {
  if (!businessHours) return null;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
  const abbreviations: Record<typeof days[number], string> = {
    Monday: t?.('contact.days.mon', 'Mon') || 'Mon',
    Tuesday: t?.('contact.days.tue', 'Tue') || 'Tue',
    Wednesday: t?.('contact.days.wed', 'Wed') || 'Wed',
    Thursday: t?.('contact.days.thu', 'Thu') || 'Thu',
    Friday: t?.('contact.days.fri', 'Fri') || 'Fri',
    Saturday: t?.('contact.days.sat', 'Sat') || 'Sat',
    Sunday: t?.('contact.days.sun', 'Sun') || 'Sun',
  };
  const formattedHours: { day: string; hours: string }[] = [];

  days.forEach(day => {
    const hours = businessHours[day];
    if (hours) {
      if (typeof hours === 'string') {
        formattedHours.push({ day: abbreviations[day], hours: hours === 'closed' ? (t?.('contact.closed', 'Closed') || 'Closed') : hours });
      } else {
        // Check if it's a 24-hour business (multiple formats for backwards compatibility)
        const is24Hours = 
          (hours.open === 'Open 24 hours' && hours.close === 'Open 24 hours') ||
          (hours.open === '12:00 AM' && hours.close === '11:59 PM') ||
          (hours.open === '00:00' && hours.close === '23:59');
        
        if (is24Hours) {
          formattedHours.push({ day: abbreviations[day], hours: t?.('contact.open24Hours', 'Open 24 hours') || 'Open 24 hours' });
        } else {
          formattedHours.push({ day: abbreviations[day], hours: `${hours.open} - ${hours.close}` });
        }
      }
    }
  });

  return formattedHours;
};

const generateGoogleMapsUrl = (address?: BusinessInfo['address']) => {
  if (!address) return null;
  
  const addressParts = [
    address.streetAddress,
    address.addressLocality,
    address.addressRegion,
    address.postalCode
  ].filter(Boolean);
  
  if (addressParts.length === 0) return null;
  
  const fullAddress = addressParts.join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
};

const generateMapEmbedUrl = (address: string): string => {
  if (!address.trim()) return "";
  
  const encodedAddress = encodeURIComponent(address.trim());
  
  // Use a simpler Google Maps embed URL that actually centers on the address
  // This format works without API key and properly centers on the location
  return `https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${encodedAddress}&t=&z=14&ie=UTF8&iwloc=B&output=embed`;
};

const Contact: React.FC<Props> = ({ contact, businessInfo, backgroundClass = 'bg-gray-50', editable, onEdit, colorPalette, siteUrl, sectionId = 'contact', socialLinks }) => {
  const i18n = useI18nContext();
  const t = i18n?.t || ((key: string, defaultValue?: string) => defaultValue || key);
  
  // Use custom form fields if provided, otherwise use defaults with translations
  const defaultFormFields = [
    { id: 'name', label: t('contact.form.fullName', 'Full Name'), name: 'name', type: 'text' as const, placeholder: t('contact.form.fullName', 'Full Name'), required: true },
    { id: 'email', label: t('contact.form.emailAddress', 'Email Address'), name: 'email', type: 'email' as const, placeholder: 'your.email@example.com', required: true },
    { id: 'phone', label: t('contact.form.phoneNumber', 'Phone Number'), name: 'phone', type: 'phone' as const, placeholder: '(555) 123-4567', required: false },
    { id: 'message', label: t('contact.form.message', 'Message'), name: 'message', type: 'textarea' as const, placeholder: t('contact.form.messagePlaceholder', 'Tell us how we can help...'), required: true },
  ];
  
  const formFields = contact?.formFields && contact.formFields.length > 0 ? contact.formFields : defaultFormFields;
  
  // Initialize form data dynamically based on form fields
  const initialFormData = formFields.reduce((acc, field) => {
    acc[field.name] = '';
    return acc;
  }, {} as Record<string, string>);
  
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  
  // hCaptcha state
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const [isHcaptchaMounted, setIsHcaptchaMounted] = useState(false);
  const hcaptchaRef = useRef<HCaptcha>(null);
  
  // Mount hCaptcha only on client side to avoid SSR hydration mismatch
  useEffect(() => {
    setIsHcaptchaMounted(true);
  }, []);
  
  // Social links editor popup state
  const [showSocialLinksPopup, setShowSocialLinksPopup] = useState(false);
  const socialLinksTargetRef = useRef<HTMLDivElement>(null);

  // Backward compatibility: migrate old single license to array format
  const licenses = useMemo(() => {
    // If new licenses array exists, use it
    if (contact?.licenses && contact.licenses.length > 0) {
      return contact.licenses;
    }
    // Otherwise, check for old single license format
    if (contact?.licenseNumber || contact?.licenseNumberTitle) {
      return [{
        title: contact.licenseNumberTitle || 'License #',
        number: contact.licenseNumber || ''
      }];
    }
    return [];
  }, [contact?.licenses, contact?.licenseNumber, contact?.licenseNumberTitle]);

  // Filter out empty licenses (where both title and number are blank)
  const validLicenses = licenses.filter(license => 
    license.title?.trim() || license.number?.trim()
  );

  // Handle adding a new license
  const handleAddLicense = () => {
    if (!onEdit) return;
    // Use the current licenses array (which includes migrated old data if needed)
    const newLicenses = [...licenses, { title: 'License #', number: '' }];
    onEdit('contact.licenses', JSON.stringify(newLicenses));
  };

  // Handle deleting a license
  const handleDeleteLicense = (index: number) => {
    if (!onEdit) return;
    const newLicenses = licenses.filter((_, i) => i !== index);
    onEdit('contact.licenses', JSON.stringify(newLicenses));
  };

  // Function to update map URL based on current address
  const updateMapFromAddress = () => {
    if (contact?.address && onEdit) {
      const mapUrl = generateMapEmbedUrl(contact.address);
      if (mapUrl) {
        onEdit("contact.mapEmbedUrl", mapUrl);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    
    try {
      // Get hCaptcha response token
      if (!hcaptchaToken) {
        alert('Please complete the captcha verification.');
        setIsSubmitting(false);
        return;
      }
      
      // Build recipients list from contactRecipients (deduplicated)
      const recipients = contact?.contactRecipients?.length 
        ? Array.from(new Set(contact.contactRecipients)) // Deduplicate emails
        : (businessInfo?.email ? [businessInfo?.email] : []); // Fallback to business email if no recipients configured
      
      // Build form submission data
      const submissionData: any = {
        ...formData,
        recipients: `<<<${recipients.join(',')}>>>`,
        'h-captcha-response': hcaptchaToken,
      };
      
      // Include site URL/domain if available
      if (siteUrl) {
        submissionData.website = siteUrl;
      }
      
      // Include consent checkbox value if checkbox is enabled
      if (contact?.showConsent && contact?.consentRequiresCheckbox) {
        submissionData.consent = consentChecked ? 'Yes' : 'No';
        submissionData.consentText = contact?.consentText || '';
      }
      
      await axios.post(FORMSPARK_ACTION_URL, submissionData);
      setIsSubmitted(true);
      // Reset form data dynamically
      const resetData = formFields.reduce((acc, field) => {
        acc[field.name] = '';
        return acc;
      }, {} as Record<string, string>);
      setFormData(resetData);
      setConsentChecked(false);
      // Reset hCaptcha
      setHcaptchaToken(null);
      hcaptchaRef.current?.resetCaptcha();
    } catch (error) {
      console.error(error);
      alert('There was an error submitting your form. Please try again.');
      // Reset hCaptcha on error
      setHcaptchaToken(null);
      hcaptchaRef.current?.resetCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <section id={sectionId} className={`pt-8 lg:pt-12 pb-16 lg:pb-24 ${backgroundClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mobile-left mb-16">
          <EditableText
            as="h2"
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            value={contact?.title || "Contact Us"}
            path="contact.title"
            editable={editable}
            onEdit={onEdit}
            placeholder="Contact section title"
            textSize={contact?.titleTextSize || 2.25} // Default to sister site section title size (desktop)
            onTextSizeChange={onEdit ? (size: number) => onEdit('contact.titleTextSize', size.toString()) : undefined}
            textSizeLabel="Contact Title Size"
            textSizePresets={[1.875, 2.25, 2.75, 3.25]} // Section title presets
            textSizeNormal={2.25} // 36px - sister site section title size (desktop)
            textSizeMin={1.5}
            textSizeMax={4.0}
          />
          <EditableText
            as="p"
            className="text-lg text-gray-600 max-w-3xl mx-auto"
            value={contact?.subtitle || "Ready to get started? Reach out to us today."}
            path="contact.subtitle"
            editable={editable}
            onEdit={onEdit}
            placeholder="Contact section subtitle"
            multiline
            textSize={contact?.subtitleTextSize || 1.125} // Default to sister site body text size
            onTextSizeChange={onEdit ? (size: number) => onEdit('contact.subtitleTextSize', size.toString()) : undefined}
            textSizeLabel="Contact Subtitle Size"
            textSizePresets={[1.0, 1.125, 1.25, 1.5]} // Body text presets
            textSizeNormal={1.125} // 18px - sister site body text size
            textSizeMin={0.875}
            textSizeMax={2.0}
          />
        </div>

        {/* Airbnb-style Contact Card */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Contact Form - Left Side */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                {isSubmitted ? (
                  <div className="text-center mobile-left">
                    <svg
                      className="w-16 h-16 text-green-500 mx-auto mb-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                      {t('contact.form.thankYou', 'Thank You!')}
                    </h3>
                    <p className="text-lg text-gray-600 max-w-md mx-auto">
                      {t('contact.form.successMessage', 'Your message has been sent. We will get back to you soon.')}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Hidden destination field */}
                    <input
                      type="hidden"
                      name="destination"
                      value={businessInfo?.email || (contact?.contactRecipients?.length ? contact.contactRecipients[0] : '')}
                    />
                    {/* Dynamically render form fields */}
                    {formFields.map((field) => (
                      <div key={field.id}>
                        <label htmlFor={field.id} className="block text-sm font-semibold text-gray-700 mb-2">
                          {field.label}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            id={field.id}
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleInputChange}
                            required={field.required}
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 resize-none"
                            placeholder={field.placeholder}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            id={field.id}
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleInputChange(e as any)}
                            required={field.required}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                          >
                            <option value="">Select {field.label}</option>
                            {field.options?.map((option, idx) => (
                              <option key={idx} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : field.type === 'phone' ? (
                          <input
                            type="tel"
                            id={field.id}
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleInputChange}
                            required={field.required}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                            placeholder={field.placeholder}
                          />
                        ) : (
                          <input
                            type={field.type}
                            id={field.id}
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleInputChange}
                            required={field.required}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                            placeholder={field.placeholder}
                          />
                        )}
                      </div>
                    ))}

                    {/* Optional Consent Field */}
                    {contact?.showConsent && (
                      <div className={`flex items-start space-x-3 ${contact?.consentRequiresCheckbox ? '' : 'justify-center'}`}>
                        {contact?.consentRequiresCheckbox && (
                          <input
                            type="checkbox"
                            id="consent-checkbox"
                            checked={consentChecked}
                            onChange={(e) => setConsentChecked(e.target.checked)}
                            required={contact?.consentRequiresCheckbox}
                            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer flex-shrink-0"
                            style={{
                              accentColor: colorPalette?.primary || '#10B981',
                            }}
                          />
                        )}
                        <label 
                          htmlFor={contact?.consentRequiresCheckbox ? "consent-checkbox" : undefined}
                          className={`flex-1 ${contact?.consentRequiresCheckbox ? '' : 'text-center'} ${contact?.consentRequiresCheckbox ? 'cursor-pointer' : ''}`}
                        >
                          <EditableText
                            as="span"
                            className="text-sm text-gray-600"
                            value={contact?.consentText || "By checking this box, you agree to receive communications from us."}
                            path="contact.consentText"
                            editable={editable}
                            onEdit={onEdit}
                            placeholder="Enter consent text (e.g., By checking this box, you agree to...)"
                            multiline
                            textSize={contact?.consentTextSize || 0.875} // text-sm = 0.875rem
                            onTextSizeChange={onEdit ? (size: number) => onEdit('contact.consentTextSize', size.toString()) : undefined}
                            textSizeLabel="Consent Text Size"
                            textSizePresets={[0.75, 0.875, 1.0, 1.125]}
                            textSizeNormal={0.875}
                            textSizeMin={0.625}
                            textSizeMax={1.5}
                          />
                        </label>
                      </div>
                    )}

                    {/* hCaptcha Widget - only render on client side to avoid SSR hydration mismatch */}
                    {isHcaptchaMounted && (
                      <HCaptcha
                        ref={hcaptchaRef}
                        sitekey={HCAPTCHA_SITEKEY}
                        onVerify={(token) => setHcaptchaToken(token)}
                        onExpire={() => setHcaptchaToken(null)}
                      />
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full text-white font-semibold py-4 px-6 rounded-lg transform transition-all duration-200 shadow-lg button-press ${
                        isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl'
                      }`}
                      style={{
                        backgroundColor: colorPalette?.primary || '#10B981',
                      }}
                      onMouseEnter={(e) => {
                        if (isSubmitting) return;
                        const target = e.target as HTMLButtonElement;
                        const color = colorPalette?.primary || '#10B981';
                        // Darken the color on hover by reducing brightness
                        const darkerColor = color.replace('#', '');
                        const r = parseInt(darkerColor.substr(0, 2), 16);
                        const g = parseInt(darkerColor.substr(2, 2), 16);
                        const b = parseInt(darkerColor.substr(4, 2), 16);
                        const darkerR = Math.max(0, Math.floor(r * 0.8));
                        const darkerG = Math.max(0, Math.floor(g * 0.8));
                        const darkerB = Math.max(0, Math.floor(b * 0.8));
                        target.style.backgroundColor = `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
                      }}
                      onMouseLeave={(e) => {
                        const target = e.target as HTMLButtonElement;
                        target.style.backgroundColor = colorPalette?.primary || '#10B981';
                      }}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('contact.form.sending', 'Sending...')}
                        </span>
                      ) : (
                        t('contact.form.sendMessage', 'Send Message')
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Map and Contact Info - Right Side */}
              <div className="bg-gray-50 p-0 sm:p-4 lg:p-12 flex flex-col pb-8 sm:pb-4 lg:pb-12 min-h-full">
                {/* Map */}
                <div className="mb-4 sm:mb-8 sm:mx-4 lg:mx-0">
                  <div className="w-full h-64 sm:h-48 lg:h-64 bg-gray-200 rounded-none sm:rounded-lg overflow-hidden">
                    <iframe
                      key={contact?.mapEmbedUrl} // Force re-render when URL changes
                      src={contact?.mapEmbedUrl || 'https://www.google.com/maps?q=San+Jose&output=embed'}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={contact?.title || 'Location'}
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4 mb-6 px-4 sm:px-0 flex-grow">
                  <div className="flex items-center space-x-3">
                    <MapPinIcon 
                      className="h-5 w-5 flex-shrink-0" 
                      style={{ color: colorPalette?.secondary || '#6B7280' }}
                    />
                    {(contact?.address || businessInfo?.address) ? (
                      <EditableText
                        as="a"
                        href={generateGoogleMapsUrl(businessInfo?.address) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:text-primary-600 transition-colors duration-200 hover:underline"
                        value={contact?.address || (businessInfo?.address ? `${businessInfo.address.streetAddress}, ${businessInfo.address.addressLocality}, ${businessInfo.address.addressRegion} ${businessInfo.address.postalCode}` : '')}
                        path="contact.address"
                        editable={editable}
                        onEdit={onEdit}
                        onBlur={updateMapFromAddress}
                        placeholder="Street address"
                        textSize={contact?.addressTextSize || 0.875} // text-sm = 0.875rem - smaller for contact details
                        onTextSizeChange={onEdit ? (size: number) => onEdit('contact.addressTextSize', size.toString()) : undefined}
                        textSizeLabel="Address Text Size"
                      />
                    ) : (
                      <span className="text-gray-700">Address</span>
                    )}
                  </div>
                  {businessInfo?.phone && (
                    <div className="flex items-center space-x-3">
                      <PhoneIcon 
                        className="h-5 w-5 flex-shrink-0" 
                        style={{ color: colorPalette?.secondary || '#6B7280' }}
                      />
                      <div className="flex flex-col">
                        <EditableText
                          as="a"
                          href={`tel:${stripPhoneNumber(businessInfo?.phone || '')}`}
                          className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                          value={businessInfo?.phone || ''}
                          path="businessInfo.phone"
                          editable={editable}
                          onEdit={onEdit}
                          placeholder="Phone number"
                          textSize={contact?.phoneTextSize || 0.875} // text-sm = 0.875rem - smaller for contact details
                          onTextSizeChange={onEdit ? (size: number) => onEdit('contact.phoneTextSize', size.toString()) : undefined}
                          textSizeLabel="Phone Text Size"
                        />
                      </div>
                    </div>
                  )}
                  {businessInfo?.email && (
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon 
                        className="h-5 w-5 flex-shrink-0" 
                        style={{ color: colorPalette?.secondary || '#6B7280' }}
                      />
                      <EditableText
                        as="a"
                        href={`mailto:${businessInfo?.email || ''}`}
                        className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                        value={businessInfo?.email || ''}
                        path="businessInfo.email"
                        editable={editable}
                        onEdit={onEdit}
                        placeholder="Email address"
                        textSize={contact?.phoneTextSize || 0.875} // text-sm = 0.875rem - smaller for contact details
                        onTextSizeChange={onEdit ? (size: number) => onEdit('contact.phoneTextSize', size.toString()) : undefined}
                        textSizeLabel="Email Text Size"
                      />
                    </div>
                  )}
                  
                  {/* Business Hours */}
                  {(businessInfo?.businessHours || contact?.businessHours || editable) && (() => {
                    const businessHours = businessInfo?.businessHours || contact?.businessHours;
                    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
                    const abbreviations: Record<typeof days[number], string> = {
                      Monday: t('contact.days.mon', 'Mon'),
                      Tuesday: t('contact.days.tue', 'Tue'),
                      Wednesday: t('contact.days.wed', 'Wed'),
                      Thursday: t('contact.days.thu', 'Thu'),
                      Friday: t('contact.days.fri', 'Fri'),
                      Saturday: t('contact.days.sat', 'Sat'),
                      Sunday: t('contact.days.sun', 'Sun'),
                    };
                    
                    return (
                      <div className="flex items-start space-x-3">
                        <ClockIcon 
                          className="h-5 w-5 flex-shrink-0 mt-0.5" 
                          style={{ color: colorPalette?.secondary || '#6B7280' }}
                        />
                        <div className="flex flex-col space-y-1 w-full">
                          <span className="text-sm font-medium text-gray-900 mb-2">{t('contact.businessHours', 'Business Hours')}</span>
                          <div className="space-y-1">
                            {days.map((day) => {
                              const dayHours = businessHours?.[day];
                              return (
                                <div key={day} className="flex text-sm text-gray-700 min-w-[200px] py-0.5 items-center">
                                  <span className="font-medium w-12">{abbreviations[day]}:</span>
                                  <div className="ml-2">
                                    <BusinessHoursEditor
                                      day={day}
                                      hours={dayHours}
                                      editable={editable}
                                      onEdit={onEdit}
                                      path={`businessInfo.businessHours.${day}`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Licenses - Multiple licenses support */}
                  {(validLicenses.length > 0 || editable) && (
                    <div className="space-y-3">
                      {licenses.map((license, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <svg 
                            className="h-5 w-5 flex-shrink-0" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                            style={{ color: colorPalette?.secondary || '#6B7280' }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="flex flex-col flex-grow">
                            <EditableText
                              as="span"
                              className="text-xs text-gray-500 mb-0.5"
                              value={license.title || 'License #'}
                              path={`contact.licenses.${index}.title`}
                              editable={editable}
                              onEdit={onEdit}
                              placeholder="License #"
                              textSize={0.75} // text-xs
                            />
                            <EditableText
                              as="span"
                              className="text-gray-700"
                              value={license.number || ''}
                              path={`contact.licenses.${index}.number`}
                              editable={editable}
                              onEdit={onEdit}
                              placeholder="License number"
                              textSize={0.875} // text-sm
                            />
                          </div>
                          {editable && licenses.length > 1 && (
                            <button
                              onClick={() => handleDeleteLicense(index)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Delete license"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {editable && (
                        <button
                          onClick={handleAddLicense}
                          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                          <span>{t('contact.addLicense', 'Add License')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Dynamic Social Media Links */}
                {(() => {
                  // Use centralized socialLinks if available and showInContact is true (default)
                  // Fall back to contact.social for backward compatibility
                  const showInContact = socialLinks?.showInContact ?? true;
                  const social = socialLinks?.links || contact?.social;
                  // Icon size multiplier - defaults to 1.0 for backward compatibility
                  const iconSize = socialLinks?.contactSocialIconSize ?? 1.0;
                  // Base sizes in pixels
                  const containerBaseSize = 48; // w-12 h-12
                  const iconBaseSize = 20; // h-5 w-5
                  const containerPx = Math.round(containerBaseSize * iconSize);
                  const iconPx = Math.round(iconBaseSize * iconSize);
                  const grubhubIconPx = Math.round(32 * iconSize); // h-8 w-8 for grubhub
                  const toastImagePx = Math.round(32 * iconSize);
                  // Check for social links - handle both string values and customLinks array
                  const hasStandardLinks = social && Object.entries(social).some(([key, value]) => 
                    key !== 'customLinks' && typeof value === 'string' && value.trim()
                  );
                  const hasCustomLinks = social?.customLinks?.some(link => link.url?.trim());
                  const hasSocialLinks = hasStandardLinks || hasCustomLinks;
                  
                  if (!showInContact || !hasSocialLinks || !social) return null;
                  
                  return (
                    <div 
                      ref={socialLinksTargetRef}
                      className={`border-t border-gray-300 pt-6 px-4 sm:px-0 mb-4 ${editable ? 'p-2 -m-2 rounded cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-dashed' : ''}`}
                      onClick={(e) => {
                        if (!editable) return;
                        // Don't open popup if clicking on an actual link
                        if ((e.target as HTMLElement).tagName === 'A' || (e.target as HTMLElement).closest('a')) return;
                        e.stopPropagation();
                        setShowSocialLinksPopup(true);
                      }}
                    >
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        {t('contact.followUs', 'Follow Us')}
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {social.facebook && (
                          <a
                            href={social.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-blue-600 flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx }}
                            aria-label="Follow us on Facebook"
                          >
                            <FaFacebookF style={{ width: iconPx, height: iconPx }} />
                          </a>
                        )}
                        {social.twitter && (
                          <a
                            href={social.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-black flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx }}
                            aria-label="Follow us on X (Twitter)"
                          >
                            <FaXTwitter style={{ width: iconPx, height: iconPx }} />
                          </a>
                        )}
                        {social.instagram && (
                          <a
                            href={social.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-pink-600 flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx }}
                            aria-label="Follow us on Instagram"
                          >
                            <FaInstagram style={{ width: iconPx, height: iconPx }} />
                          </a>
                        )}
                        {social.linkedin && (
                          <a
                            href={social.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-blue-700 flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx }}
                            aria-label="Connect with us on LinkedIn"
                          >
                            <FaLinkedinIn style={{ width: iconPx, height: iconPx }} />
                          </a>
                        )}
                        {social.youtube && (
                          <a
                            href={social.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-red-600 flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx }}
                            aria-label="Follow us on YouTube"
                          >
                            <svg style={{ width: iconPx, height: iconPx }} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </a>
                        )}
                        {social.tiktok && (
                          <a
                            href={social.tiktok}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-black flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx }}
                            aria-label="Follow us on TikTok"
                          >
                            <FaTiktok style={{ width: iconPx, height: iconPx }} />
                          </a>
                        )}
                        {social.yelp && (
                          <a
                            href={social.yelp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-red-600 flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx }}
                            aria-label="Review us on Yelp"
                          >
                            <FaYelp style={{ width: iconPx, height: iconPx }} />
                          </a>
                        )}
                        {social.googleBusinessProfile && (
                          <a
                            href={social.googleBusinessProfile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-blue-600 flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx }}
                            aria-label="View our Google Business Profile"
                          >
                            <FaGoogle style={{ width: iconPx, height: iconPx }} />
                          </a>
                        )}
                        {social.other && (
                          <a
                            href={social.other}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-gray-600 flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx }}
                            aria-label="Visit our other social link"
                          >
                            <FaStar style={{ width: iconPx, height: iconPx }} />
                          </a>
                        )}
                        {social.doordash && (
                          <a
                            href={social.doordash}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-red-500 flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx }}
                            aria-label="Order from us on DoorDash"
                          >
                            <SiDoordash style={{ width: iconPx, height: iconPx }} />
                          </a>
                        )}
                        {social.ubereats && (
                          <a
                            href={social.ubereats}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-green-600 flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx }}
                            aria-label="Order from us on Uber Eats"
                          >
                            <SiUbereats style={{ width: iconPx, height: iconPx }} />
                          </a>
                        )}
                        {social.grubhub && (
                          <a
                            href={social.grubhub}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-orange-600 flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx, padding: Math.round(4 * iconSize) }}
                            aria-label="Order from us on Grubhub"
                          >
                            <SiGrubhub style={{ width: grubhubIconPx, height: grubhubIconPx }} />
                          </a>
                        )}
                        {social.postmates && (
                          <a
                            href={social.postmates}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-black flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx }}
                            aria-label="Order from us on Postmates"
                          >
                            <SiPostmates style={{ width: iconPx, height: iconPx }} />
                          </a>
                        )}
                        {social.instacart && (
                          <a
                            href={social.instacart}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-green-500 flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx }}
                            aria-label="Order from us on Instacart"
                          >
                            <SiInstacart style={{ width: iconPx, height: iconPx }} />
                          </a>
                        )}
                        {social.toast && (
                          <a
                            href={social.toast}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 flex items-center justify-center"
                            style={{ width: containerPx, height: containerPx, padding: Math.round(8 * iconSize) }}
                            aria-label="Order from us on Toast"
                          >
                            <Image 
                              src="/toast-logo.png" 
                              alt="Toast" 
                              width={toastImagePx}
                              height={toastImagePx}
                              loading="lazy"
                              className="object-contain"
                            />
                          </a>
                        )}
                        {/* Custom external links with custom icons */}
                        {social.customLinks?.map((customLink) => (
                          customLink.url && (
                            <a
                              key={customLink.id}
                              href={customLink.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 text-gray-600 flex items-center justify-center overflow-hidden"
                              style={{ width: containerPx, height: containerPx }}
                              aria-label={customLink.label || 'External Link'}
                            >
                              {customLink.iconUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                  src={customLink.iconUrl} 
                                  alt={customLink.label || 'Custom icon'} 
                                  style={{ width: iconPx, height: iconPx }}
                                  className="object-contain"
                                />
                              ) : (
                                <FaExternalLinkAlt style={{ width: iconPx, height: iconPx }} />
                              )}
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Social Links Editor Popup */}
      {editable && (
        <SocialLinksEditorPopup
          isOpen={showSocialLinksPopup}
          onClose={() => setShowSocialLinksPopup(false)}
          socialLinks={socialLinks}
          onEdit={onEdit}
          targetElement={socialLinksTargetRef.current}
        />
      )}
    </section>
  );
};

export default Contact; 