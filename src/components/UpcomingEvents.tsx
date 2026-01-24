import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import type { UpcomingEvents, Contact, BusinessInfo, ColorPalette, EventsButtonStyles } from '../types';
import { getAllFutureEventInstances, type EventInstance } from '../utils/recurringEvents';
import EventDetailsModal from './EventDetailsModal';
import EventButtonEditor from './EventButtonEditor';
import EditableText from './EditableText';
import TimeSelector from './TimeSelector';
import DateSelector from './DateSelector';
import IdbImage from './IdbImage';
import { useI18nContext } from './I18nProvider';

type Props = {
  upcomingEvents?: UpcomingEvents;
  contact?: Contact;
  businessInfo?: BusinessInfo;
  backgroundClass?: string;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
  colorPalette?: ColorPalette;
  sectionId?: string;
};

const UpcomingEventsSection: React.FC<Props> = ({ upcomingEvents: upcomingEventsProp, contact, businessInfo, backgroundClass = 'bg-gray-50', editable, onEdit, colorPalette, sectionId = 'upcomingEvents' }) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const [selectedEventInstance, setSelectedEventInstance] = useState<EventInstance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<{ eventIndex: number; buttonType: 'secondary' | 'primary' } | null>(null);
  const i18n = useI18nContext();
  const t = i18n?.t || ((key: string, defaultValue?: string) => defaultValue || key);
  
  // Get button styles with defaults for backwards compatibility - memoized to prevent useCallback dependency changes
  const buttonStyles = useMemo(() => 
    upcomingEventsProp?.buttonStyles || {},
    [upcomingEventsProp?.buttonStyles]
  );
  
  // Check if buttons are enabled (default to true for backwards compatibility)
  const primaryButtonEnabled = buttonStyles.primaryButtonEnabled !== false;
  const secondaryButtonEnabled = buttonStyles.secondaryButtonEnabled !== false;
  
  // Compute button styles for primary buttons
  const getPrimaryButtonStyle = useCallback((): React.CSSProperties => {
    const defaultBgColor = colorPalette?.primary || '#10B981';
    return {
      backgroundColor: buttonStyles.backgroundColor || defaultBgColor,
      color: buttonStyles.textColor || '#ffffff',
      borderRadius: buttonStyles.borderRadius !== undefined ? `${buttonStyles.borderRadius}px` : '0.5rem',
      fontSize: buttonStyles.fontSize !== undefined ? `${buttonStyles.fontSize}px` : undefined,
      fontFamily: buttonStyles.fontFamily || undefined,
      fontWeight: buttonStyles.fontWeight || 500,
    };
  }, [buttonStyles, colorPalette]);
  
  // Compute button styles for secondary buttons
  const getSecondaryButtonStyle = useCallback((): React.CSSProperties => {
    return {
      backgroundColor: buttonStyles.secondaryBackgroundColor || '#f3f4f6',
      color: buttonStyles.secondaryTextColor || '#1f2937',
      borderRadius: buttonStyles.borderRadius !== undefined ? `${buttonStyles.borderRadius}px` : '0.5rem',
      fontSize: buttonStyles.fontSize !== undefined ? `${buttonStyles.fontSize}px` : undefined,
      fontFamily: buttonStyles.fontFamily || undefined,
      fontWeight: buttonStyles.fontWeight || 500,
      border: '1px solid #d1d5db',
    };
  }, [buttonStyles]);
  
  // Update Swiper when events change to recalculate slide widths
  useEffect(() => {
    if (swiperRef.current) {
      // Small delay to allow DOM to update first
      const timer = setTimeout(() => {
        swiperRef.current?.update();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [upcomingEventsProp?.items?.length, upcomingEventsProp?.items]);

  // Handle upcomingEvents data with proper fallback logic
  const upcomingEvents = upcomingEventsProp || {
    title: 'Upcoming Events',
    subtitle: 'Join us for these exciting upcoming events',
    items: [
      {
        id: 'event1',
        title: 'Corporate Dinner',
        description: 'Perfect for business meetings and corporate gatherings with customized menus and professional service.',
        eventType: 'Corporate',
        date: '2025-01-15',
        time: '18:00',
        capacity: '20-50 guests',
        pricePerPerson: '$85',
        imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
        alt: 'Elegant corporate dinner setup',
      },
      {
        id: 'event2',
        title: 'Wedding Reception',
        description: 'Celebrate your special day with an unforgettable reception in our beautiful venue.',
        eventType: 'Wedding',
        date: '2025-02-14',
        time: '17:00',
        capacity: '50-150 guests',
        pricePerPerson: '$120',
        imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80',
        alt: 'Beautiful wedding reception setup',
      },
      {
        id: 'event3',
        title: 'Birthday Celebration',
        description: 'Make your birthday memorable with our personalized party packages and festive atmosphere.',
        eventType: 'Birthday',
        date: '2025-03-20',
        time: '19:00',
        capacity: '15-40 guests',
        pricePerPerson: '$65',
        imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80',
        alt: 'Festive birthday party setup',
      },
    ],
  };

  // Get all future event instances (including recurring events) sorted by next occurrence
  const eventInstances = getAllFutureEventInstances(upcomingEvents.items, 3);

  // Helper function to format date for prominent display
  const formatProminentDate = (dateString?: string) => {
    if (!dateString) return { month: '', day: '', year: '' };
    try {
      const date = new Date(dateString);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        day: date.getDate().toString(),
        year: date.getFullYear().toString()
      };
    } catch {
      return { month: '', day: '', year: '' };
    }
  };

  // Helper function to format full date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Helper function to format time
  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  // Handle inquiry from modal
  const handleModalInquiry = () => {
    if (!selectedEventInstance) return;
    
    // Scroll to contact section
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      // Calculate header height offset using the dynamic header height
      const dynamicHeaderHeight = document.documentElement.style.getPropertyValue('--dynamic-header-height');
      let headerOffset = 80; // Default fallback
      
      if (dynamicHeaderHeight) {
        // Convert rem to pixels (assuming 1rem = 16px)
        const remValue = parseFloat(dynamicHeaderHeight.replace('rem', ''));
        headerOffset = remValue * 16;
      } else {
        // Fallback to responsive values if dynamic height not set
        const isMobile = window.innerWidth < 768;
        headerOffset = isMobile ? 80 : 96;
      }
      
      const elementPosition = contactSection.offsetTop - headerOffset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
      
      // Wait for scroll to complete, then prefill form
      setTimeout(() => {
        const messageTextarea = document.querySelector('textarea[name="message"]') as HTMLTextAreaElement;
        
        if (messageTextarea) {
          const event = selectedEventInstance.originalEvent;
          const eventDate = selectedEventInstance.date ? ` on ${formatDate(selectedEventInstance.date)}` : '';
          const eventTime = selectedEventInstance.time ? ` at ${formatTime(selectedEventInstance.time)}` : '';
          const inquiryMessage = `Hello, I'd like to inquire about your "${event.title}" event${eventDate}${eventTime}. Could you please provide more information about availability, pricing, and what's included?

Thank you!`;
          
          messageTextarea.value = inquiryMessage;
          messageTextarea.focus();
          
          // Trigger React's onChange event
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(messageTextarea, inquiryMessage);
          }
          messageTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 800);
    }
  };

  return (
    <section id={sectionId} className={`py-16 lg:py-24 ${backgroundClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mobile-left mb-16">
          <EditableText
            as="h2"
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            value={upcomingEvents.title}
            path="upcomingEvents.title"
            editable={editable}
            onEdit={onEdit}
            placeholder="Enter events title"
            textSize={upcomingEvents.titleTextSize || 2.25} // Default to sister site section title size (desktop)
            onTextSizeChange={onEdit ? (size: number) => onEdit('upcomingEvents.titleTextSize', size.toString()) : undefined}
            textSizeLabel="Events Title Size"
            textSizePresets={[1.875, 2.25, 2.75, 3.25]} // Section title presets
            textSizeNormal={2.25} // 36px - sister site section title size (desktop)
            textSizeMin={1.5}
            textSizeMax={4.0}
          />
          <EditableText
            as="p"
            className="text-lg text-gray-600 max-w-3xl mx-auto"
            value={upcomingEvents.subtitle}
            path="upcomingEvents.subtitle"
            editable={editable}
            onEdit={onEdit}
            placeholder="Enter events subtitle"
            multiline
            textSize={upcomingEvents.subtitleTextSize || 1.125} // Default to sister site body text size
            onTextSizeChange={onEdit ? (size: number) => onEdit('upcomingEvents.subtitleTextSize', size.toString()) : undefined}
            textSizeLabel="Events Subtitle Size"
            textSizePresets={[1.0, 1.125, 1.25, 1.5]} // Body text presets
            textSizeNormal={1.125} // 18px - sister site body text size
            textSizeMin={0.875}
            textSizeMax={2.0}
          />
        </div>

        {/* Events Carousel */}
        {eventInstances.length ? (
          <div 
            className="relative mb-16 events-swiper-container"
            style={{
              maxWidth: eventInstances.length === 1 ? '400px' : eventInstances.length === 2 ? '816px' : '100%',
              margin: eventInstances.length < 3 ? '0 auto' : '0',
              touchAction: 'pan-y pinch-zoom'
            }}
          >
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={16}
              slidesPerView={1}
              centeredSlides={false}
              touchReleaseOnEdges={true}
              touchStartPreventDefault={false}
              touchStartForcePreventDefault={false}
              threshold={10}
              navigation={{
                prevEl: '.events-swiper-button-prev',
                nextEl: '.events-swiper-button-next',
              }}
              pagination={{
                clickable: true,
                el: '.events-swiper-pagination',
              }}
              breakpoints={{
                768: {
                  slidesPerView: Math.min(2, eventInstances.length),
                  spaceBetween: 16,
                },
                1024: {
                  slidesPerView: Math.min(3, eventInstances.length),
                  spaceBetween: 24,
                },
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
            >
                {eventInstances.map((eventInstance) => {
                  const event = eventInstance.originalEvent;
                  const prominentDate = formatProminentDate(eventInstance.date);
                  const eventIndex = upcomingEvents.items.findIndex(item => item.id === event.id);
                  
                  return (
                    <SwiperSlide key={eventInstance.id}>
                      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden hover-lift group h-full">
                        {/* Event Image with Prominent Date */}
                        <div className="relative aspect-[4/3] overflow-hidden">
                          {event.imageUrl ? (
                            <IdbImage 
                              src={event.thumbnailUrl || event.imageUrl}
                              alt={event.alt || event.title}
                              fill
                              loading="lazy"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                              <div className="text-primary-600 text-4xl font-bold">
                                {event.title.substring(0, 2).toUpperCase()}
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          
                          {/* Prominent Date Display */}
                          {(event.date || editable) && (
                            <div className="absolute top-4 right-4">
                              <DateSelector
                                value={event.date}
                                onChange={(newDate) => {
                                  if (onEdit) {
                                    onEdit(`upcomingEvents.items.${eventIndex}.date`, newDate);
                                  }
                                }}
                                editable={editable}
                                displayFormat="prominent"
                                placeholder="Select date"
                              />
                            </div>
                          )}
                          
                          {/* Event Type Badge */}
                          <div className="absolute top-4 left-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
                              {event.eventType}
                            </span>
                          </div>
                        </div>

                        {/* Event Content */}
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <EditableText
                              as="h3"
                              className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200"
                              value={event.title}
                              path={`upcomingEvents.items.${eventIndex}.title`}
                              editable={editable}
                              onEdit={onEdit}
                              placeholder="Enter event title"
                              textSize={event.titleTextSize || 1.25} // Default to sister site medium headline size
                              onTextSizeChange={onEdit ? (size: number) => onEdit(`upcomingEvents.items.${eventIndex}.titleTextSize`, size.toString()) : undefined}
                              textSizeLabel="Event Title Size"
                              textSizePresets={[1.0, 1.25, 1.5, 1.75]} // Medium headline presets
                              textSizeNormal={1.25} // 20px - sister site medium headline size
                              textSizeMin={0.875}
                              textSizeMax={2.25}
                            />
                            <EditableText
                              as="span"
                              className="text-primary-600 font-semibold whitespace-nowrap"
                              value={event.pricePerPerson}
                              path={`upcomingEvents.items.${eventIndex}.pricePerPerson`}
                              editable={editable}
                              onEdit={onEdit}
                              placeholder="$0.00"
                              textSize={event.pricePerPersonTextSize || 1.0} // text-base = 1rem
                              onTextSizeChange={onEdit ? (size: number) => onEdit(`upcomingEvents.items.${eventIndex}.pricePerPersonTextSize`, size.toString()) : undefined}
                              textSizeLabel="Event Price Size"
                            />
                          </div>

                          <EditableText
                            as="p"
                            className="text-gray-600 leading-relaxed mb-4"
                            value={event.description}
                            path={`upcomingEvents.items.${eventIndex}.description`}
                            editable={editable}
                            onEdit={onEdit}
                            placeholder="Enter event description"
                            multiline
                            textSize={event.descriptionTextSize || 1.0} // Default to standard body text
                            onTextSizeChange={onEdit ? (size: number) => onEdit(`upcomingEvents.items.${eventIndex}.descriptionTextSize`, size.toString()) : undefined}
                            textSizeLabel="Event Description Size"
                            textSizePresets={[0.875, 1.0, 1.125, 1.25]} // Body text presets
                            textSizeNormal={1.0} // 16px - standard body text
                            textSizeMin={0.75}
                            textSizeMax={1.75}
                          />

                          {/* Event Details */}
                          <div className="space-y-2 text-sm text-gray-500 mb-6">
                            {(event.time || editable) && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">🕐</span>
                                <TimeSelector
                                  value={event.time}
                                  onChange={(newTime) => {
                                    if (onEdit) {
                                      onEdit(`upcomingEvents.items.${eventIndex}.time`, newTime);
                                    }
                                  }}
                                  editable={editable}
                                  placeholder="Select time"
                                />
                              </div>
                            )}
                            {(event.capacity || editable) && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">👥</span>
                                <EditableText
                                  as="span"
                                  value={event.capacity}
                                  path={`upcomingEvents.items.${eventIndex}.capacity`}
                                  editable={editable}
                                  onEdit={onEdit}
                                  placeholder="20-50 guests"
                                  textSize={event.capacityTextSize || 0.875} // text-sm = 0.875rem
                                  onTextSizeChange={onEdit ? (size: number) => onEdit(`upcomingEvents.items.${eventIndex}.capacityTextSize`, size.toString()) : undefined}
                                  textSizeLabel="Event Capacity Size"
                                />
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2">
                            {/* Secondary Button (e.g., See More Details) */}
                            {(secondaryButtonEnabled || editable) && (
                              editable ? (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingButton({ eventIndex, buttonType: 'secondary' });
                                  }}
                                  className={`w-full font-medium py-2 px-4 transition-colors duration-200 relative group hover:opacity-90 ${!secondaryButtonEnabled ? 'opacity-40' : ''}`}
                                  style={getSecondaryButtonStyle()}
                                >
                                  {event.detailsButtonLabel || 'See More Details'}
                                  {/* Edit indicator */}
                                  <span className="absolute inset-0 flex items-center justify-center bg-blue-500/90 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    Edit Button
                                  </span>
                                  {!secondaryButtonEnabled && (
                                    <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-[10px] px-1 rounded">OFF</span>
                                  )}
                                </button>
                              ) : secondaryButtonEnabled && event.detailsButtonAction === 'external' && event.detailsButtonUrl ? (
                                <a 
                                  href={event.detailsButtonUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full font-medium py-2 px-4 transition-colors duration-200 inline-block text-center hover:opacity-90"
                                  style={getSecondaryButtonStyle()}
                                >
                                  {event.detailsButtonLabel || 'See More Details'}
                                </a>
                              ) : secondaryButtonEnabled ? (
                                <button 
                                  onClick={() => {
                                    setSelectedEventInstance(eventInstance);
                                    setIsModalOpen(true);
                                  }}
                                  className="w-full font-medium py-2 px-4 transition-colors duration-200 hover:opacity-90"
                                  style={getSecondaryButtonStyle()}
                                >
                                  {event.detailsButtonLabel || 'See More Details'}
                                </button>
                              ) : null
                            )}

                            {/* Primary Button (e.g., Inquire About This Event) */}
                            {(primaryButtonEnabled || editable) && (
                              editable ? (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingButton({ eventIndex, buttonType: 'primary' });
                                  }}
                                  className={`w-full font-medium py-2 px-4 transition-colors duration-200 relative group hover:opacity-90 ${!primaryButtonEnabled ? 'opacity-40' : ''}`}
                                  style={getPrimaryButtonStyle()}
                                >
                                  {event.inquireButtonLabel || 'Inquire About This Event'}
                                  {/* Edit indicator */}
                                  <span className="absolute inset-0 flex items-center justify-center bg-blue-500/90 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    Edit Button
                                  </span>
                                  {!primaryButtonEnabled && (
                                    <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-[10px] px-1 rounded">OFF</span>
                                  )}
                                </button>
                              ) : primaryButtonEnabled && event.inquireUrl ? (
                                <a 
                                  href={event.inquireUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full font-medium py-2 px-4 transition-colors duration-200 inline-block text-center hover:opacity-90"
                                  style={getPrimaryButtonStyle()}
                                >
                                  {event.inquireButtonLabel || 'Inquire About This Event'}
                                </a>
                              ) : primaryButtonEnabled ? (
                                <button 
                                  onClick={() => {
                                    // Scroll to contact section
                                    const contactSection = document.getElementById('contact');
                                    if (contactSection) {
                                      // Calculate header height offset using the dynamic header height
                                      const dynamicHeaderHeight = document.documentElement.style.getPropertyValue('--dynamic-header-height');
                                      let headerOffset = 80; // Default fallback
                                      
                                      if (dynamicHeaderHeight) {
                                        // Convert rem to pixels (assuming 1rem = 16px)
                                        const remValue = parseFloat(dynamicHeaderHeight.replace('rem', ''));
                                        headerOffset = remValue * 16;
                                      } else {
                                        // Fallback to responsive values if dynamic height not set
                                        const isMobile = window.innerWidth < 768;
                                        headerOffset = isMobile ? 80 : 96;
                                      }
                                      
                                      const elementPosition = contactSection.offsetTop - headerOffset;
                                      
                                      window.scrollTo({
                                        top: elementPosition,
                                        behavior: 'smooth'
                                      });
                                      
                                      // Wait for scroll to complete, then prefill form
                                      setTimeout(() => {
                                        const messageTextarea = document.querySelector('textarea[name="message"]') as HTMLTextAreaElement;
                                        
                                        if (messageTextarea) {
                                          const eventDate = eventInstance.date ? ` on ${formatDate(eventInstance.date)}` : '';
                                          const eventTime = eventInstance.time ? ` at ${formatTime(eventInstance.time)}` : '';
                                          const inquiryMessage = `Hello, I'd like to inquire about your "${event.title}" event${eventDate}${eventTime}. Could you please provide more information about availability, pricing, and what's included?

Thank you!`;
                                          
                                          messageTextarea.value = inquiryMessage;
                                          messageTextarea.focus();
                                          
                                          // Trigger React's onChange event
                                          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                                          if (nativeInputValueSetter) {
                                            nativeInputValueSetter.call(messageTextarea, inquiryMessage);
                                          }
                                          messageTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                                        }
                                      }, 800);
                                    }
                                  }}
                                  className="w-full font-medium py-2 px-4 transition-colors duration-200 hover:opacity-90"
                                  style={getPrimaryButtonStyle()}
                                >
                                  {event.inquireButtonLabel || 'Inquire About This Event'}
                                </button>
                              ) : null
                            )}
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
            </Swiper>

            {/* Navigation Arrows */}
            <button
              className="events-swiper-button-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 z-10 hidden sm:flex items-center justify-center"
              aria-label="Previous events"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              className="events-swiper-button-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 z-10 hidden sm:flex items-center justify-center"
              aria-label="Next events"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots Indicator */}
            <div className="events-swiper-pagination flex justify-center mt-8 space-x-2"></div>
            
            {/* Custom pagination styles */}
            <style dangerouslySetInnerHTML={{
              __html: `
                .events-swiper-pagination .swiper-pagination-bullet {
                  width: 12px;
                  height: 12px;
                  background-color: #D1D5DB;
                  opacity: 1;
                  transition: all 200ms;
                }
                .events-swiper-pagination .swiper-pagination-bullet-active {
                  background-color: ${colorPalette?.primary || '#10B981'};
                  transform: scale(1.1);
                }
                .events-swiper-pagination .swiper-pagination-bullet:hover {
                  background-color: #9CA3AF;
                }
              `
            }} />
          </div>
        ) : (
          <div className="text-center mobile-left text-gray-500 mb-16">{t('events.noEventsAvailable', 'No upcoming events available.')}</div>
        )}

      </div>

      {/* Event Details Modal */}
      {selectedEventInstance && (
        <EventDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEventInstance(null);
          }}
          eventInstance={selectedEventInstance}
          onInquire={handleModalInquiry}
        />
      )}

      {/* Event Button Editor Modal */}
      {editingButton && onEdit && (
        <EventButtonEditor
          buttonType={editingButton.buttonType}
          label={
            editingButton.buttonType === 'secondary'
              ? upcomingEvents.items[editingButton.eventIndex]?.detailsButtonLabel || ''
              : upcomingEvents.items[editingButton.eventIndex]?.inquireButtonLabel || ''
          }
          actionType={
            editingButton.buttonType === 'secondary'
              ? upcomingEvents.items[editingButton.eventIndex]?.detailsButtonAction || 'modal'
              : upcomingEvents.items[editingButton.eventIndex]?.inquireUrl ? 'external' : 'contact'
          }
          url={
            editingButton.buttonType === 'secondary'
              ? upcomingEvents.items[editingButton.eventIndex]?.detailsButtonUrl || ''
              : upcomingEvents.items[editingButton.eventIndex]?.inquireUrl || ''
          }
          eventIndex={editingButton.eventIndex}
          onClose={() => setEditingButton(null)}
          onEdit={onEdit}
          colorPalette={colorPalette}
          buttonStyles={buttonStyles}
        />
      )}
    </section>
  );
};

export default UpcomingEventsSection;
