import React, { useState, useEffect, useRef } from 'react';
import { StarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import IdbImage from './IdbImage';
import EditableText from './EditableText';
import { useI18nContext } from './I18nProvider';
import type { Testimonials as TestimonialsCfg, TestimonialItem, ColorPalette } from '../types';

interface Review {
  author_image: string;
  author_name: string;
  rating: number;
  review_date: string;
  review_text: string | null;
  reviewTextTextSize?: number;
  authorNameTextSize?: number;
  reviewDateTextSize?: number;
  originalIndex?: number;
}

type Props = { 
  testimonials?: TestimonialsCfg;
  backgroundClass?: string;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
  colorPalette?: ColorPalette;
  sectionId?: string;
};

const Testimonials: React.FC<Props> = ({ testimonials, backgroundClass = 'bg-white', editable, onEdit, colorPalette, sectionId = 'testimonials' }) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const i18n = useI18nContext();
  const t = i18n?.t || ((key: string, defaultValue?: string) => defaultValue || key);

  // Google Reviews data
  const reviews: Review[] = (testimonials?.items || []).map((t: TestimonialItem, idx: number) => ({
    author_image: t.authorImageUrl || '',
    author_name: t.authorName,
    rating: t.rating,
    review_date: t.reviewDate || '',
    review_text: t.reviewText,
    reviewTextTextSize: t.reviewTextTextSize,
    authorNameTextSize: t.authorNameTextSize,
    reviewDateTextSize: t.reviewDateTextSize,
    originalIndex: idx,
  })) as Review[];
  // fallback if empty
  const fallback: Review[] = [
    {
      author_image: 'https://lh3.googleusercontent.com/a-/ALV-UjXZIy4taRbOklPagPapCdRSF06KvOMpaTIWvGk5DQ6WiRPfeMN8=s120-c-rp-mo-br100',
      author_name: 'kevin jay garcia',
      rating: 5,
      review_date: 'a day ago',
      review_text: null
    },
    {
      author_image: 'https://lh3.googleusercontent.com/a/ACg8ocKvPw4Lky7-AOkmqnzDQrbHPKmzHyFrdmDLkKtQ2Kya4C0fT84=s120-c-rp-mo-br100',
      author_name: 'Darren Louis Uyangurin',
      rating: 5,
      review_date: 'a day ago',
      review_text: 'They have always been professional and attentive, but I especially appreciated their fast response when I needed emergency service. They found and fixed the issue in just an hour. Excellent work.'
    },
    {
      author_image: 'https://lh3.googleusercontent.com/a/ACg8ocIFeyJgArRLHvcXBdxB-NVZaoDmBzvpTNFbv5x7c_t7xAe6qQ=s120-c-rp-mo-br100',
      author_name: 'Nieljose Villahermosa',
      rating: 5,
      review_date: 'a day ago',
      review_text: 'The work was completed expertly and thoroughly, far exceeding our expectations. The service took less than an hour, and the price was very reasonable.'
    },
    {
      author_image: 'https://lh3.googleusercontent.com/a/ACg8ocIOaAP5WcHgaQxLTjdg5xoQ-ezNQHhN1RQyylwhUDa9IXq2Lg=s120-c-rp-mo-br100',
      author_name: 'Lagaso21 Oplot',
      rating: 5,
      review_date: '2 days ago',
      review_text: 'Last week, I had a service issue resolved, and the technician did a great job. He was reliable, polite, and easy to work with. Honestly, I would work with him again any time. I was impressed, so I\'m telling everyone I know about the excellent service. Thanks!'
    },
    {
      author_image: 'https://lh3.googleusercontent.com/a-/ALV-UjUwBJw07EjmczJwinweKDagnwnYWeMajeEDFkau46LSxr2DXyM=s120-c-rp-mo-br100',
      author_name: 'Kennethryan Manto',
      rating: 5,
      review_date: '3 days ago',
      review_text: 'I contacted this company for the first time to fix an issue that was not working, and the technician arrived right on time and handled everything like a pro. Everything is now back up and running. Big thanks to the technician.'
    },
    {
      author_image: 'https://lh3.googleusercontent.com/a-/ALV-UjXrTyIHPJAChp_XQzDSpWy15-YVjBhEhCGxvRukyo0IVFyA4iwB=s120-c-rp-mo-br100',
      author_name: 'Acuna Thegreat',
      rating: 5,
      review_date: '5 days ago',
      review_text: 'The job was handled smoothly from start to finish. My experience with this company for repair work was excellent, from booking the appointment to the repair itself. I\'ll absolutely be recommending them to friends and family.'
    },
    {
      author_image: 'https://lh3.googleusercontent.com/a-/ALV-UjU27oOaRyGrh5jwVFAPSaQrjgGxC6CvPAFMi4FnaU4Ddh3rKjTD=s120-c-rp-mo-br100',
      author_name: 'Charls Jatusa',
      rating: 5,
      review_date: '6 days ago',
      review_text: 'Honest, fast, and friendly! They successfully fixed my clogged toilet that was overflowing. I\'m impressed with how quickly they handled everything, and I\'ll definitely use their service again.'
    },
    {
      author_image: 'https://lh3.googleusercontent.com/a/ACg8ocKO75pcakZ1Ba-btrrfLhkEzEtrTQECz5kPoU2XJZ5e3HGA_Q=s120-c-rp-mo-br100',
      author_name: 'Aijanchris Andrade',
      rating: 5,
      review_date: 'a week ago',
      review_text: 'Everything is working perfectly now. This company and their technician did an excellent job with the service, finishing it in just an hour with ease. Thank you so much! Highly recommended service.'
    },
    {
      author_image: 'https://lh3.googleusercontent.com/a-/ALV-UjVTx0MU8fDtt_B3tx9zk8HOt0ajA-3OfYI_HVxpFDqVgZqD1i1I=s120-c-rp-mo-br100',
      author_name: 'Arjie Pisos',
      rating: 5,
      review_date: 'a week ago',
      review_text: 'I contacted this company for emergency services, and they sent a top-notch technician right away. He was experienced and handled the issue perfectly. Great job to him and the whole team. Thank you!'
    },
    {
      author_image: 'https://lh3.googleusercontent.com/a/ACg8ocKOK0foUCb23qV8he4FTZ_4vx3x2oYK8n5J-p6irVlAD71YMw=s120-c-rp-mo-br100',
      author_name: 'Elsie Galceran',
      rating: 5,
      review_date: '3 weeks ago',
      review_text: 'The team was quick, professional, and thoughtful throughout. They kept me updated about the technician\'s arrival, and he came prepared. He wrapped up the installation in just an hour with no issues after. Everything went better than expected. Thank you for such great work.'
    }
  ];
  const effective = reviews.length ? reviews : fallback;

  // Filter out reviews without text for the main display
  const reviewsWithText = effective.filter(review => review.review_text);
  
  // Use provided overall rating and total reviews, or calculate from effective reviews as fallback
  const averageRating = testimonials?.overallRating ?? (effective.reduce((sum, review) => sum + review.rating, 0) / effective.length);
  const totalReviews = testimonials?.totalReviews ?? effective.length;


  // Render star rating
  const renderStars = (rating: number, onChange?: (value: number) => void) => {
    return (
      <div className="flex items-center">
        {[1,2,3,4,5].map((star) => {
          const icon = (
            <StarIcon
              key={star}
              className={`h-5 w-5 ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
            />
          );
          if (!onChange) return icon;
          return (
            <button
              key={star}
              type="button"
              className="focus:outline-none"
              aria-label={`Set rating to ${star}`}
              onClick={() => onChange(star)}
            >
              {icon}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <section id={sectionId} className={`py-16 lg:py-24 ${backgroundClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mobile-left mb-16">
          <EditableText
            as="h2"
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            value={testimonials?.title || "What Our Clients Say"}
            path="testimonials.title"
            editable={editable}
            onEdit={onEdit}
            placeholder="Testimonials section title"
            textSize={testimonials?.titleTextSize || 2.25} // Default to sister site section title size (desktop)
            onTextSizeChange={onEdit ? (size: number) => onEdit('testimonials.titleTextSize', size.toString()) : undefined}
            textSizeLabel="Testimonials Title Size"
            textSizePresets={[1.875, 2.25, 2.75, 3.25]} // Section title presets
            textSizeNormal={2.25} // 36px - sister site section title size (desktop)
            textSizeMin={1.5}
            textSizeMax={4.0}
          />
          <EditableText
            as="p"
            className="text-lg text-gray-600 max-w-3xl mx-auto mb-8"
            value={testimonials?.subtitle || "Don't just take our word for it. Here's what our satisfied clients have to say about our professional services."}
            path="testimonials.subtitle"
            editable={editable}
            onEdit={onEdit}
            placeholder="Testimonials section subtitle"
            multiline
            textSize={testimonials?.subtitleTextSize || 1.125} // Default to sister site body text size
            onTextSizeChange={onEdit ? (size: number) => onEdit('testimonials.subtitleTextSize', size.toString()) : undefined}
            textSizeLabel="Testimonials Subtitle Size"
            textSizePresets={[1.0, 1.125, 1.25, 1.5]} // Body text presets
            textSizeNormal={1.125} // 18px - sister site body text size
            textSizeMin={0.875}
            textSizeMax={2.0}
          />
          
          {/* Google Reviews Badge */}
          {(testimonials?.showGoogleReviewsBadge !== false) && (
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center space-x-4 bg-white rounded-lg border border-gray-200 px-6 py-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-semibold text-gray-900">
                    {t('testimonials.googleReviews', 'Google Reviews')}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {renderStars(Math.round(averageRating))}
                  <span className="ml-2 text-sm text-gray-600">
                    <EditableText
                      as="span"
                      className="inline"
                      value={averageRating.toFixed(1)}
                      path="testimonials.overallRating"
                      editable={editable}
                      onEdit={onEdit}
                      placeholder="4.5"
                    /> (
                    <EditableText
                      as="span"
                      className="inline"
                      value={totalReviews.toString()}
                      path="testimonials.totalReviews"
                      editable={editable}
                      onEdit={onEdit}
                      placeholder="100"
                    /> {t('testimonials.reviews', 'reviews')})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Testimonials Carousel */}
        <div 
          className="relative testimonials-swiper-container"
          style={{
            maxWidth: reviewsWithText.length === 1 ? '400px' : reviewsWithText.length === 2 ? '816px' : '100%',
            margin: reviewsWithText.length < 3 ? '0 auto' : '0',
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
              prevEl: '.testimonials-swiper-button-prev',
              nextEl: '.testimonials-swiper-button-next',
            }}
            pagination={{
              clickable: true,
              el: '.testimonials-swiper-pagination',
            }}
            breakpoints={{
              1024: {
                slidesPerView: Math.min(3, reviewsWithText.length),
                spaceBetween: 24,
              },
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            className="mx-2 sm:mx-4 lg:mx-12"
          >
            {reviewsWithText.map((review, index) => (
              <SwiperSlide key={index}>
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover-lift h-full">
                      {/* Quote */}
                      <div className="mb-6">
                        <svg 
                          className="h-8 w-8 mb-4" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ color: colorPalette?.primary || '#10B981' }}
                        >
                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                        </svg>
                        <EditableText
                          as="p"
                          className="text-gray-700 leading-relaxed italic"
                          value={`"${review.review_text}"`}
                          path={typeof review.originalIndex === 'number' ? `testimonials.items.${review.originalIndex}.reviewText` : undefined}
                          editable={editable}
                          onEdit={onEdit}
                          placeholder="Enter testimonial text"
                          multiline
                          textSize={review.reviewTextTextSize || 1.0} // Default to standard body text
                          onTextSizeChange={onEdit && typeof review.originalIndex === 'number' ? (size: number) => onEdit(`testimonials.items.${review.originalIndex}.reviewTextTextSize`, size.toString()) : undefined}
                          textSizeLabel="Review Text Size"
                          textSizePresets={[0.875, 1.0, 1.125, 1.25]} // Body text presets
                          textSizeNormal={1.0} // 16px - standard body text
                          textSizeMin={0.75}
                          textSizeMax={1.75}
                        />
                      </div>

                      {/* Rating */}
                      <div className="mb-4">
                        {renderStars(review.rating, editable && typeof review.originalIndex === 'number' && onEdit ? (newRating: number) => onEdit(`testimonials.items.${review.originalIndex}.rating`, String(newRating)) : undefined)}
                      </div>

                      {/* Author Info */}
                      <div className="flex items-center space-x-3">
                        <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-200">
                          {review.author_image ? (
                            <IdbImage
                              src={review.author_image}
                              alt={review.author_name}
                              fill
                              loading="lazy"
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary-100 text-primary-600 font-semibold text-sm">
                              {review.author_name.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <div>
                          <EditableText
                            className="font-semibold text-gray-900 capitalize"
                            value={review.author_name}
                            path={typeof review.originalIndex === 'number' ? `testimonials.items.${review.originalIndex}.authorName` : undefined}
                            editable={editable}
                            onEdit={onEdit}
                            placeholder="Author name"
                            textSize={review.authorNameTextSize || 0.875} // Default to sister site small text size
                            onTextSizeChange={onEdit ? (size: number) => onEdit(`testimonials.items.${reviewsWithText.indexOf(review)}.authorNameTextSize`, size.toString()) : undefined}
                            textSizeLabel="Author Name Size"
                            textSizePresets={[0.75, 0.875, 1.0, 1.125]} // Small text presets
                            textSizeNormal={0.875} // 14px - sister site small text size
                            textSizeMin={0.625}
                            textSizeMax={1.5}
                          />
                          <EditableText
                            as="div"
                            className="text-sm text-gray-500"
                            value={review.review_date}
                            path={typeof review.originalIndex === 'number' ? `testimonials.items.${review.originalIndex}.reviewDate` : undefined}
                            editable={editable}
                            onEdit={onEdit}
                            placeholder="2 weeks ago"
                            textSize={review.reviewDateTextSize || 0.75} // Default to tiny text for dates
                            onTextSizeChange={onEdit ? (size: number) => onEdit(`testimonials.items.${reviewsWithText.indexOf(review)}.reviewDateTextSize`, size.toString()) : undefined}
                            textSizeLabel="Review Date Size"
                            textSizePresets={[0.625, 0.75, 0.875, 1.0]} // Tiny text presets
                            textSizeNormal={0.75} // 12px - tiny text for dates
                            textSizeMin={0.5}
                            textSizeMax={1.25}
                          />
                        </div>
                      </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Buttons - Hidden on mobile, visible on desktop */}
          <button
            className="testimonials-swiper-button-prev hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 z-10 -translate-x-4 items-center justify-center"
            aria-label="Previous testimonial"
          >
            <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
          </button>

          <button
            className="testimonials-swiper-button-next hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 z-10 translate-x-4 items-center justify-center"
            aria-label="Next testimonial"
          >
            <ChevronRightIcon className="h-6 w-6 text-gray-600" />
          </button>

          {/* Dots Indicator */}
          <div className="testimonials-swiper-pagination flex justify-center mt-8 space-x-2"></div>
          
          {/* Custom pagination styles */}
          <style dangerouslySetInnerHTML={{
            __html: `
              .testimonials-swiper-pagination .swiper-pagination-bullet {
                width: 12px;
                height: 12px;
                background-color: #D1D5DB;
                opacity: 1;
                transition: all 200ms;
              }
              .testimonials-swiper-pagination .swiper-pagination-bullet-active {
                background-color: ${colorPalette?.primary || '#10B981'};
                transform: scale(1.1);
              }
              .testimonials-swiper-pagination .swiper-pagination-bullet:hover {
                background-color: #9CA3AF;
              }
            `
          }} />
        </div>


      </div>
    </section>
  );
};

export default Testimonials;
