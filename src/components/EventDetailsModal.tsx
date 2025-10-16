import React, { useState, useEffect, useRef } from 'react';
import type { UpcomingEventItem } from '../types';
import { type EventInstance } from '../utils/recurringEvents';
import IdbImage from './IdbImage';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventInstance: EventInstance;
  onInquire?: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  eventInstance,
  onInquire
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  
  // Touch handling for mobile swipe
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const event = eventInstance.originalEvent;

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Helper functions
  const formatDate = (dateString: string) => {
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

  const formatAddress = (address?: UpcomingEventItem['address']) => {
    if (!address) return '';
    return `${address.streetAddress}, ${address.addressLocality}, ${address.addressRegion} ${address.postalCode}`;
  };

  const getGoogleMapsUrl = (address?: UpcomingEventItem['address']) => {
    if (!address) return '';
    const fullAddress = formatAddress(address);
    return `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;
  };

  const getGoogleMapsLinkUrl = (address?: UpcomingEventItem['address']) => {
    if (!address) return '';
    const fullAddress = formatAddress(address);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  };

  // Get all images for gallery (main image + gallery images)
  const allImages = [
    ...(event.imageUrl ? [{ url: event.imageUrl, alt: event.alt || event.title }] : []),
    ...(event.imageGallery || [])
  ];

  // Touch handlers for mobile swipe (gallery navigation)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && allImages.length > 1) {
      setSelectedImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1);
    } else if (isRightSwipe && allImages.length > 1) {
      setSelectedImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-all duration-200 backdrop-blur-sm"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Scrollable Content Container */}
          <div className="max-h-[95vh] overflow-y-auto">
            {/* Large Hero Image Section */}
            {event.imageUrl && (
              <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
                <IdbImage 
                  src={event.imageUrl}
                  alt={event.alt || event.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Event Type Badge */}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
                    {event.eventType}
                  </span>
                </div>

                {/* Image Gallery Button */}
                {allImages.length > 1 && (
                  <button
                    onClick={() => setIsImageGalleryOpen(true)}
                    className="absolute top-4 right-16 bg-black/40 hover:bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 backdrop-blur-sm"
                  >
                    📷 {allImages.length} photos
                  </button>
                )}

                {/* Event Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                        {event.title}
                      </h2>
                      
                      {/* Key Info Row */}
                      <div className="flex flex-wrap gap-6 text-white/90">
                        <div className="flex items-center gap-2">
                          <span>📅</span>
                          <span className="font-medium">{formatDate(eventInstance.date)}</span>
                        </div>
                        {eventInstance.time && (
                          <div className="flex items-center gap-2">
                            <span>🕐</span>
                            <span className="font-medium">{formatTime(eventInstance.time)}</span>
                          </div>
                        )}
                        {event.capacity && (
                          <div className="flex items-center gap-2">
                            <span>👥</span>
                            <span className="font-medium">{event.capacity}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price Display */}
                    {event.pricePerPerson && (
                      <div className="bg-white/95 text-gray-900 px-6 py-3 rounded-xl backdrop-blur-sm">
                        <div className="text-sm font-medium opacity-70">From</div>
                        <div className="text-2xl font-bold">{event.pricePerPerson}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Content Section */}
            <div className="p-8">
              {/* Recurring Event Indicator */}
              {event.isRecurring && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                  <span>🔄</span>
                  <span>Recurring Event</span>
                </div>
              )}

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h3>
                <p className="text-gray-700 leading-relaxed text-lg mb-4">
                  {event.description}
                </p>
                {event.longDescription && (
                  <p className="text-gray-600 leading-relaxed">
                    {event.longDescription}
                  </p>
                )}
              </div>

              {/* Event Details Grid */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Left Column - Additional Info */}
                {(event.dressCode || (event.externalLinks && event.externalLinks.length > 0)) && (
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4">Event Information</h4>
                    <div className="space-y-4">
                      {/* Dress Code */}
                      {event.dressCode && (
                        <div>
                          <h5 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span>👔</span>
                            Dress Code
                          </h5>
                          <p className="text-gray-600">{event.dressCode}</p>
                        </div>
                      )}

                      {/* External Links */}
                      {event.externalLinks && event.externalLinks.length > 0 && (
                        <div>
                          <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <span>🔗</span>
                            Related Links
                          </h5>
                          <div className="space-y-2">
                            {event.externalLinks.map((link, index) => (
                              <a
                                key={index}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                              >
                                {link.label}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Right Column - Location */}
                {event.address && (
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>📍</span>
                      Location
                    </h4>
                    <a 
                      href={getGoogleMapsLinkUrl(event.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 font-medium mb-4 hover:text-blue-600 transition-colors duration-200 hover:underline block"
                    >
                      {formatAddress(event.address)}
                    </a>
                    
                    {/* Google Maps Embed */}
                    <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                      <iframe
                        src={getGoogleMapsUrl(event.address)}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`Map showing ${formatAddress(event.address)}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                {event.inquireUrl ? (
                  <a 
                    href={event.inquireUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
                  >
                    Inquire About This Event
                  </a>
                ) : (
                  <button 
                    onClick={() => {
                      onClose();
                      if (onInquire) {
                        onInquire();
                      }
                    }}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    Inquire About This Event
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 border border-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {isImageGalleryOpen && allImages.length > 0 && (
        <div className="fixed inset-0 z-60 bg-black bg-opacity-90 flex items-center justify-center p-4">
          {/* Close Gallery Button */}
          <button
            onClick={() => setIsImageGalleryOpen(false)}
            className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 rounded-full p-3 text-white transition-all duration-200"
            aria-label="Close gallery"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Main Image */}
          <div 
            className="relative max-w-4xl max-h-[80vh] w-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <IdbImage
              src={allImages[selectedImageIndex].url}
              alt={allImages[selectedImageIndex].alt || `Image ${selectedImageIndex + 1}`}
              width={800}
              height={600}
              className="w-full h-full object-contain"
            />

            {/* Navigation Arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 text-white transition-all duration-200"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 text-white transition-all duration-200"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {selectedImageIndex + 1} / {allImages.length}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-md overflow-x-auto">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    index === selectedImageIndex 
                      ? 'border-white' 
                      : 'border-transparent opacity-60 hover:opacity-80'
                  }`}
                >
                  <IdbImage
                    src={image.url}
                    alt={image.alt || `Thumbnail ${index + 1}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventDetailsModal;