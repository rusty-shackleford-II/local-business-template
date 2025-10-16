// import React, { useState, useRef, useEffect } from 'react';
// import type { UpcomingEvents, Contact, BusinessInfo } from '../types';

// type Props = {
//   upcomingEvents?: UpcomingEvents;
//   contact?: Contact;
//   businessInfo?: BusinessInfo;
// };

// const UpcomingEventsSection: React.FC<Props> = ({ upcomingEvents: upcomingEventsProp, contact, businessInfo }) => {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const carouselRef = useRef<HTMLDivElement>(null);
//   const touchStartX = useRef<number>(0);
//   const touchEndX = useRef<number>(0);

//   const upcomingEvents = upcomingEventsProp ?? {
//     title: 'Upcoming Events',
//     subtitle: 'Join us for these exciting upcoming events',
//     items: [
//       {
//         id: 'event1',
//         title: 'Corporate Dinner',
//         description: 'Perfect for business meetings and corporate gatherings with customized menus and professional service.',
//         eventType: 'Corporate',
//         date: '2025-01-15',
//         time: '18:00',
//         capacity: '20-50 guests',
//         pricePerPerson: '$85',
//         imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
//         alt: 'Elegant corporate dinner setup',
//       },
//       {
//         id: 'event2',
//         title: 'Wedding Reception',
//         description: 'Celebrate your special day with an unforgettable reception in our beautiful venue.',
//         eventType: 'Wedding',
//         date: '2025-02-14',
//         time: '17:00',
//         capacity: '50-150 guests',
//         pricePerPerson: '$120',
//         imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80',
//         alt: 'Beautiful wedding reception setup',
//       },
//       {
//         id: 'event3',
//         title: 'Birthday Celebration',
//         description: 'Make your birthday memorable with our personalized party packages and festive atmosphere.',
//         eventType: 'Birthday',
//         date: '2025-03-20',
//         time: '19:00',
//         capacity: '15-40 guests',
//         pricePerPerson: '$65',
//         imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80',
//         alt: 'Festive birthday party setup',
//       },
//     ],
//     contactInfo: {
//       phone: businessInfo?.phone || '(555) 123-4567',
//       email: businessInfo?.email || 'events@restaurant.com',
//       advanceBooking: (upcomingEventsProp as any)?.contactInfo?.advanceBooking || '2 weeks minimum',
//     },
//   };

//   // Sort events by date (newest first, then events without dates)
//   const sortedEvents = [...upcomingEvents.items].sort((a, b) => {
//     if (!a.date && !b.date) return 0;
//     if (!a.date) return 1;
//     if (!b.date) return -1;
//     return new Date(b.date).getTime() - new Date(a.date).getTime();
//   });

//   const totalEvents = sortedEvents.length;
//   const eventsPerView = {
//     mobile: 1,
//     tablet: 2,
//     desktop: 3
//   };


//   const getMaxIndex = () => {
//     if (typeof window === 'undefined') return Math.max(0, totalEvents - eventsPerView.desktop);
    
//     const width = window.innerWidth;
//     if (width <= 768) return Math.max(0, totalEvents - eventsPerView.mobile);
//     if (width <= 1024) return Math.max(0, totalEvents - eventsPerView.tablet);
//     return Math.max(0, totalEvents - eventsPerView.desktop);
//   };

//   const nextSlide = () => {
//     const maxIndex = getMaxIndex();
//     setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
//   };

//   const prevSlide = () => {
//     const maxIndex = getMaxIndex();
//     setCurrentIndex(prev => prev === 0 ? maxIndex : prev - 1);
//   };

//   const goToSlide = (index: number) => {
//     setCurrentIndex(index);
//   };

//   // Touch handlers for mobile swipe
//   const handleTouchStart = (e: React.TouchEvent) => {
//     touchStartX.current = e.targetTouches[0].clientX;
//   };

//   const handleTouchMove = (e: React.TouchEvent) => {
//     touchEndX.current = e.targetTouches[0].clientX;
//   };

//   const handleTouchEnd = () => {
//     if (!touchStartX.current || !touchEndX.current) return;
    
//     const distance = touchStartX.current - touchEndX.current;
//     const isLeftSwipe = distance > 50;
//     const isRightSwipe = distance < -50;

//     if (isLeftSwipe) {
//       nextSlide();
//     } else if (isRightSwipe) {
//       prevSlide();
//     }
//   };

//   // Helper function to format date for prominent display
//   const formatProminentDate = (dateString?: string) => {
//     if (!dateString) return { month: '', day: '', year: '' };
//     try {
//       const date = new Date(dateString);
//       return {
//         month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
//         day: date.getDate().toString(),
//         year: date.getFullYear().toString()
//       };
//     } catch {
//       return { month: '', day: '', year: '' };
//     }
//   };

//   // Helper function to format full date
//   const formatDate = (dateString?: string) => {
//     if (!dateString) return '';
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('en-US', { 
//         weekday: 'long', 
//         year: 'numeric', 
//         month: 'long', 
//         day: 'numeric' 
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   // Helper function to format time
//   const formatTime = (timeString?: string) => {
//     if (!timeString) return '';
//     try {
//       const [hours, minutes] = timeString.split(':');
//       const hour = parseInt(hours, 10);
//       const ampm = hour >= 12 ? 'PM' : 'AM';
//       const hour12 = hour % 12 || 12;
//       return `${hour12}:${minutes} ${ampm}`;
//     } catch {
//       return timeString;
//     }
//   };

//   return (
//     <section id="upcomingEvents" className="py-16 lg:py-24 bg-gray-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Section Header */}
//         <div className="text-center mb-16">
//           <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//             {upcomingEvents.title}
//           </h2>
//           <p className="text-lg text-gray-600 max-w-3xl mx-auto">
//             {upcomingEvents.subtitle}
//           </p>
//         </div>

//         {/* Events Carousel */}
//         {sortedEvents.length ? (
//           <div className="relative mb-16">
//             {/* Carousel Container */}
//             <div 
//               className="overflow-hidden"
//               onTouchStart={handleTouchStart}
//               onTouchMove={handleTouchMove}
//               onTouchEnd={handleTouchEnd}
//             >
//               <div 
//                 ref={carouselRef}
//                 className="flex transition-transform duration-500 ease-in-out carousel-container"
//               >
//                 {sortedEvents.map((event) => {
//                   const prominentDate = formatProminentDate(event.date);
                  
//                   return (
//                     <div
//                       key={event.id}
//                       className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-4"
//                     >
//                       <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden hover-lift group h-full">
//                         {/* Event Image with Prominent Date */}
//                         <div className="relative aspect-[4/3] overflow-hidden">
//                           {event.imageUrl ? (
//                             // eslint-disable-next-line @next/next/no-img-element
//                             <img 
//                               src={event.imageUrl}
//                               alt={event.alt || event.title}
//                               className="object-cover group-hover:scale-105 transition-transform duration-300 w-full h-full"
//                             />
//                           ) : (
//                             <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
//                               <div className="text-primary-600 text-4xl font-bold">
//                                 {event.title.substring(0, 2).toUpperCase()}
//                               </div>
//                             </div>
//                           )}
//                           <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          
//                           {/* Prominent Date Display */}
//                           {event.date && (
//                             <div className="absolute top-4 right-4">
//                               <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 text-center shadow-lg">
//                                 <div className="text-primary-600 text-xs font-bold tracking-wide">
//                                   {prominentDate.month}
//                                 </div>
//                                 <div className="text-gray-900 text-2xl font-bold leading-none">
//                                   {prominentDate.day}
//                                 </div>
//                                 <div className="text-gray-600 text-xs font-medium">
//                                   {prominentDate.year}
//                                 </div>
//                               </div>
//                             </div>
//                           )}
                          
//                           {/* Event Type Badge */}
//                           <div className="absolute top-4 left-4">
//                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
//                               {event.eventType}
//                             </span>
//                           </div>
//                         </div>

//                         {/* Event Content */}
//                         <div className="p-6">
//                           <div className="flex items-start justify-between gap-4 mb-3">
//                             <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
//                               {event.title}
//                             </h3>
//                             {event.pricePerPerson && (
//                               <span className="text-primary-600 font-semibold whitespace-nowrap">
//                                 {event.pricePerPerson}
//                               </span>
//                             )}
//                           </div>

//                           <p className="text-gray-600 leading-relaxed mb-4">
//                             {event.description}
//                           </p>

//                           {/* Event Details */}
//                           <div className="space-y-2 text-sm text-gray-500 mb-6">
//                             {event.time && (
//                               <div className="flex items-center gap-2">
//                                 <span className="font-medium">🕐</span>
//                                 <span>{formatTime(event.time)}</span>
//                               </div>
//                             )}
//                             {event.capacity && (
//                               <div className="flex items-center gap-2">
//                                 <span className="font-medium">👥</span>
//                                 <span>{event.capacity}</span>
//                               </div>
//                             )}
//                           </div>

//                           {/* Inquire Button */}
//                           <button 
//                             onClick={() => {
//                               // Scroll to contact section
//                               const contactSection = document.getElementById('contact');
//                               if (contactSection) {
//                                 contactSection.scrollIntoView({ behavior: 'smooth' });
                                
//                                 // Wait for scroll to complete, then prefill form
//                                 setTimeout(() => {
//                                   const messageTextarea = document.querySelector('textarea[name="message"]') as HTMLTextAreaElement;
                                  
//                                   if (messageTextarea) {
//                                     const eventDate = event.date ? ` on ${formatDate(event.date)}` : '';
//                                     const eventTime = event.time ? ` at ${formatTime(event.time)}` : '';
//                                     const inquiryMessage = `Hello, I'd like to inquire about your "${event.title}" event${eventDate}${eventTime}. Could you please provide more information about availability, pricing, and what's included?

// Thank you!`;
                                    
//                                     messageTextarea.value = inquiryMessage;
//                                     messageTextarea.focus();
                                    
//                                     // Trigger React's onChange event
//                                     const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
//                                     if (nativeInputValueSetter) {
//                                       nativeInputValueSetter.call(messageTextarea, inquiryMessage);
//                                     }
//                                     messageTextarea.dispatchEvent(new Event('input', { bubbles: true }));
//                                   }
//                                 }, 800);
//                               }
//                             }}
//                             className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
//                           >
//                             Inquire About This Event
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Navigation Arrows */}
//             {totalEvents > 1 && (
//               <>
//                 <button
//                   onClick={prevSlide}
//                   className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 z-10 hidden sm:block"
//                   aria-label="Previous events"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                   </svg>
//                 </button>
//                 <button
//                   onClick={nextSlide}
//                   className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 z-10 hidden sm:block"
//                   aria-label="Next events"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                   </svg>
//                 </button>
//               </>
//             )}

//             {/* Dots Indicator */}
//             {totalEvents > 1 && (
//               <div className="flex justify-center mt-8 space-x-2">
//                 {Array.from({ length: getMaxIndex() + 1 }).map((_, index) => (
//                   <button
//                     key={index}
//                     onClick={() => goToSlide(index)}
//                     className={`w-3 h-3 rounded-full transition-all duration-200 ${
//                       index === currentIndex 
//                         ? 'bg-primary-600 scale-110' 
//                         : 'bg-gray-300 hover:bg-gray-400'
//                     }`}
//                     aria-label={`Go to slide ${index + 1}`}
//                   />
//                 ))}
//               </div>
//             )}

//             {/* Mobile Responsive Styles */}
//             {/* @ts-ignore */}
//             <style jsx>{`
//               @media (max-width: 768px) {
//                 .carousel-container {
//                   transform: translateX(-${currentIndex * 100}%) !important;
//                 }
//               }
//               @media (min-width: 769px) and (max-width: 1024px) {
//                 .carousel-container {
//                   transform: translateX(-${currentIndex * 50}%) !important;
//                 }
//               }
//               @media (min-width: 1025px) {
//                 .carousel-container {
//                   transform: translateX(-${currentIndex * (100 / 3)}%) !important;
//                 }
//               }
//             `}</style>
//           </div>
//         ) : (
//           <div className="text-center text-gray-500 mb-16">No upcoming events available.</div>
//         )}

//         {/* Contact Information */}
//         {upcomingEvents.contactInfo && (
//           <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 text-center">
//             <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
//               Ready to Plan Your Event?
//             </h3>
//             <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
//               Contact us to discuss your private event needs and create a memorable experience for you and your guests.
//             </p>
            
//             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
//               {upcomingEvents.contactInfo.phone && (
//                 <a 
//                   href={`tel:${upcomingEvents.contactInfo.phone}`}
//                   className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
//                 >
//                   📞 {upcomingEvents.contactInfo.phone}
//                 </a>
//               )}
//               {upcomingEvents.contactInfo.email && (
//                 <button 
//                   onClick={() => {
//                     // Scroll to contact section
//                     const contactSection = document.getElementById('contact');
//                     if (contactSection) {
//                       contactSection.scrollIntoView({ behavior: 'smooth' });
                      
//                       // Wait for scroll to complete, then prefill form
//                       setTimeout(() => {
//                         const messageTextarea = document.querySelector('textarea[name="message"]') as HTMLTextAreaElement;
                        
//                         if (messageTextarea) {
//                           const inquiryMessage = `Hello, I'd like to inquire about hosting a private event at your venue. Could you please provide more information about:

// • Available dates and times
// • Pricing and packages
// • Catering options
// • Capacity and setup options
// • Any special requirements or policies

// Thank you for your time, and I look forward to hearing from you!`;
                          
//                           messageTextarea.value = inquiryMessage;
//                           messageTextarea.focus();
                          
//                           // Trigger React's onChange event
//                           const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
//                           if (nativeInputValueSetter) {
//                             nativeInputValueSetter.call(messageTextarea, inquiryMessage);
//                           }
//                           messageTextarea.dispatchEvent(new Event('input', { bubbles: true }));
//                         }
//                       }, 800);
//                     }
//                   }}
//                   className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
//                 >
//                   ✉️ {upcomingEvents.contactInfo.email}
//                 </button>
//               )}
//             </div>

//             {upcomingEvents.contactInfo.advanceBooking && (
//               <p className="text-sm text-gray-500">
//                 <span className="font-medium">Advance booking required:</span> {upcomingEvents.contactInfo.advanceBooking}
//               </p>
//             )}
//           </div>
//         )}
//       </div> c
//     </section>
//   );
// };
 
// export default UpcomingEventsSection;
