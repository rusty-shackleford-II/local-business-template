import React, { useState, useEffect, useRef } from 'react';
import EditableText from './EditableText';
import IdbImage from './IdbImage';
import type { Payment as PaymentCfg, ColorPalette } from '../types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

type Props = { 
  payment?: PaymentCfg; 
  backgroundClass?: string;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
  colorPalette?: ColorPalette;
};

const Payment: React.FC<Props> = ({ payment, backgroundClass = 'bg-white', editable, onEdit, colorPalette }) => {
  const title = payment?.title || 'Buy Now';
  const description = payment?.description || 'Purchase our product or service securely.';
  const buttonLabel = payment?.buttonLabel || 'Proceed to Checkout';
  const href = payment?.paymentLinkUrl || '#';
  const provider = payment?.provider || 'link';

  // Gallery state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  // Convert gallery images to the format expected by the gallery
  const images = payment?.galleryImages?.map(img => ({
    imageUrl: img.imageUrl,
    alt: img.alt || 'Product image'
  })) || [];

  const thumbnailSize = payment?.thumbnailSize || 1.0;

  // Calculate dynamic thumbnail dimensions based on size multiplier for Swiper slides
  const getThumbnailDimensions = () => {
    const baseWidth = {
      mobile: 240,
      tablet: 192,
      desktop: 224
    };
    
    return {
      mobile: {
        width: Math.round(baseWidth.mobile * thumbnailSize),
        height: Math.round(baseWidth.mobile * thumbnailSize * 3 / 4)
      },
      tablet: {
        width: Math.round(baseWidth.tablet * thumbnailSize),
        height: Math.round(baseWidth.tablet * thumbnailSize * 3 / 4)
      },
      desktop: {
        width: Math.round(baseWidth.desktop * thumbnailSize),
        height: Math.round(baseWidth.desktop * thumbnailSize * 3 / 4)
      }
    };
  };

  const thumbnailDimensions = getThumbnailDimensions();

  // Gallery navigation functions
  const openModal = (index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextModalImage = () => {
    setModalImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevModalImage = () => {
    setModalImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Handle keyboard navigation in modal
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') prevModalImage();
      if (e.key === 'ArrowRight') nextModalImage();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Render product gallery with Swiper
  const renderGallery = () => {
    if (!images || images.length === 0) return null;

    // Calculate slides per view based on thumbnail size
    const getSlidesPerView = () => {
      const baseSlides = {
        mobile: 1.5,
        tablet: 2.5,
        desktop: 3
      };
      
      // Adjust based on thumbnail size - larger thumbnails = fewer slides visible
      const sizeAdjustment = 1 / thumbnailSize;
      
      // Limit slides per view to the number of images available to prevent left-justification
      const imageCount = images.length;
      
      return {
        mobile: Math.max(1, Math.min(baseSlides.mobile * sizeAdjustment, 3, imageCount)),
        tablet: Math.max(1, Math.min(baseSlides.tablet * sizeAdjustment, 4, imageCount)),
        desktop: Math.max(1, Math.min(baseSlides.desktop * sizeAdjustment, 6, imageCount))
      };
    };

    const slidesPerView = getSlidesPerView();

    return (
      <div className="mt-12">
        <EditableText
          as="h3"
          className="text-xl font-semibold text-gray-900 mb-6 text-center mobile-left"
          value={payment?.galleryTitle || "Product Gallery"}
          path="payment.galleryTitle"
          editable={editable}
          onEdit={onEdit}
          placeholder="Gallery title"
        />
        
        {/* Swiper Gallery */}
        <div 
          className="relative payment-gallery-swiper-container px-4 md:px-0"
          style={{
            maxWidth: images.length === 1 ? '320px' : images.length === 2 ? '656px' : '100%',
            margin: images.length < 3 ? '0 auto' : '0',
            touchAction: 'pan-y pinch-zoom'
          }}
        >
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={16}
            slidesPerView={slidesPerView.mobile}
            centeredSlides={false}
            touchReleaseOnEdges={true}
            touchStartPreventDefault={false}
            touchStartForcePreventDefault={false}
            threshold={10}
            navigation={{
              prevEl: '.payment-gallery-swiper-button-prev',
              nextEl: '.payment-gallery-swiper-button-next',
            }}
            pagination={{
              clickable: true,
              el: '.payment-gallery-swiper-pagination',
            }}
            breakpoints={{
              640: {
                slidesPerView: slidesPerView.tablet,
                spaceBetween: 16,
              },
              1024: {
                slidesPerView: slidesPerView.desktop,
                spaceBetween: 24,
              },
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            className="pb-8"
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <button
                  onClick={() => openModal(index)}
                  className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 aspect-square w-full"
                >
                  <IdbImage
                    src={image.imageUrl}
                    alt={image.alt}
                    fill
                    loading="lazy"
                    className="object-cover transition-all duration-300 group-hover:scale-110"
                    sizes={`(max-width: 640px) ${thumbnailDimensions.mobile.width}px, (max-width: 1024px) ${thumbnailDimensions.tablet.width}px, ${thumbnailDimensions.desktop.width}px`}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </button>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Arrows - Hidden on mobile, visible on desktop */}
          <button 
            className="payment-gallery-swiper-button-prev hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200 items-center justify-center" 
            style={{ marginLeft: '-20px', marginTop: '-40px' }}
            aria-label="Previous images"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className="payment-gallery-swiper-button-next hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200 items-center justify-center" 
            style={{ marginRight: '-20px', marginTop: '-40px' }}
            aria-label="Next images"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Pagination Dots */}
          <div className="payment-gallery-swiper-pagination flex justify-center mt-4"></div>
        </div>
      </div>
    );
  };

  // Render main component
  let mainComponent;

  // Render Shopify embed if provider is shopify_embed and embed code exists
  if (provider === 'shopify_embed' && payment?.shopifyEmbedCode) {
    mainComponent = (
      <section id="payment" className={`py-16 lg:py-24 ${backgroundClass}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mobile-left mb-8">
            <EditableText
              as="h2"
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              value={title}
              path="payment.title"
              editable={editable}
              onEdit={onEdit}
              placeholder="Payment section title"
              textSize={payment?.titleTextSize || 2.25}
              onTextSizeChange={onEdit ? (size: number) => onEdit('payment.titleTextSize', size.toString()) : undefined}
              textSizeLabel="Payment Title Size"
              textSizePresets={[1.5, 2.0, 2.25, 2.5, 3.0]}
              textSizeNormal={2.25}
              textSizeMin={1.0}
              textSizeMax={4.0}
            />
            <EditableText
              as="p"
              className="text-lg text-gray-600 mb-8"
              value={description}
              path="payment.description"
              editable={editable}
              onEdit={onEdit}
              placeholder="Payment description"
              multiline
              textSize={payment?.descriptionTextSize || 1.125}
              onTextSizeChange={onEdit ? (size: number) => onEdit('payment.descriptionTextSize', size.toString()) : undefined}
              textSizeLabel="Payment Description Size"
              textSizePresets={[0.875, 1.0, 1.125, 1.25, 1.5]}
              textSizeNormal={1.125}
              textSizeMin={0.75}
              textSizeMax={2.0}
            />
          </div>
          {renderGallery()}
          <div className="text-center mobile-left mt-8">
            <div 
              className="shopify-embed-container"
              dangerouslySetInnerHTML={{ __html: payment.shopifyEmbedCode }}
            />
          </div>
        </div>
      </section>
    );
  } else {
    // Default to payment link rendering
    mainComponent = (
      <section id="payment" className={`py-16 lg:py-24 ${backgroundClass}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mobile-left">
            <EditableText
              as="h2"
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              value={title}
              path="payment.title"
              editable={editable}
              onEdit={onEdit}
              placeholder="Payment section title"
              textSize={payment?.titleTextSize || 2.25}
              onTextSizeChange={onEdit ? (size: number) => onEdit('payment.titleTextSize', size.toString()) : undefined}
              textSizeLabel="Payment Title Size"
              textSizePresets={[1.5, 2.0, 2.25, 2.5, 3.0]}
              textSizeNormal={2.25}
              textSizeMin={1.0}
              textSizeMax={4.0}
            />
            <EditableText
              as="p"
              className="text-lg text-gray-600 mb-8"
              value={description}
              path="payment.description"
              editable={editable}
              onEdit={onEdit}
              placeholder="Payment description"
              multiline
              textSize={payment?.descriptionTextSize || 1.125}
              onTextSizeChange={onEdit ? (size: number) => onEdit('payment.descriptionTextSize', size.toString()) : undefined}
              textSizeLabel="Payment Description Size"
              textSizePresets={[0.875, 1.0, 1.125, 1.25, 1.5]}
              textSizeNormal={1.125}
              textSizeMin={0.75}
              textSizeMax={2.0}
            />
            {renderGallery()}
            <div className="mt-8">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 text-white font-semibold rounded-lg shadow transition"
                style={{ 
                  backgroundColor: colorPalette?.primary || payment?.buttonColor || '#10B981'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLAnchorElement;
                  const color = colorPalette?.primary || payment?.buttonColor || '#10B981';
                  if (color.startsWith('#')) {
                    const darkerColor = color.replace('#', '');
                    const r = parseInt(darkerColor.substr(0, 2), 16);
                    const g = parseInt(darkerColor.substr(2, 2), 16);
                    const b = parseInt(darkerColor.substr(4, 2), 16);
                    const darkerR = Math.max(0, Math.floor(r * 0.8));
                    const darkerG = Math.max(0, Math.floor(g * 0.8));
                    const darkerB = Math.max(0, Math.floor(b * 0.8));
                    target.style.backgroundColor = `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
                  }
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLAnchorElement;
                  target.style.backgroundColor = colorPalette?.primary || payment?.buttonColor || '#10B981';
                }}
              >
                <EditableText
                  value={buttonLabel}
                  path="payment.buttonLabel"
                  editable={editable}
                  onEdit={onEdit}
                  placeholder="Button text"
                  textSize={payment?.buttonLabelTextSize || 1.0}
                  onTextSizeChange={onEdit ? (size: number) => onEdit('payment.buttonLabelTextSize', size.toString()) : undefined}
                  textSizeLabel="Button Text Size"
                  textSizePresets={[0.875, 1.0, 1.125, 1.25]}
                  textSizeNormal={1.0}
                  textSizeMin={0.75}
                  textSizeMax={1.5}
                />
              </a>
              {!payment?.paymentLinkUrl && (
                <p className="mt-3 text-xs text-gray-500">Add your payment checkout link in the editor to enable this button.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Return both the main component and modal
  return (
    <>
      {mainComponent}
      
      {/* Image Modal */}
      {isModalOpen && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 rounded-full p-3 text-white transition-all duration-200"
            aria-label="Close gallery"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Main Image */}
          <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden">
            <IdbImage
              src={images[modalImageIndex].imageUrl}
              alt={images[modalImageIndex].alt}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              priority
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevModalImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 text-white transition-all duration-200"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextModalImage}
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
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {modalImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Dot Indicators - show for 2-10 images */}
            {images.length > 1 && images.length <= 10 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setModalImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === modalImageIndex 
                        ? 'bg-white scale-125' 
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Payment;


