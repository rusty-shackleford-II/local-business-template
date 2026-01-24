import React, { useState, useEffect, useRef } from 'react';
import EditableText from './EditableText';
import { 
  CheckCircleIcon, 
  UsersIcon, 
  BuildingOfficeIcon, 
  AcademicCapIcon,
  StarIcon,
  TrophyIcon,
  ShieldCheckIcon,
  ClockIcon,
  CalendarIcon,
  CheckBadgeIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ScaleIcon,
  CalculatorIcon,
  ChartBarIcon,
  PresentationChartBarIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  HeartIcon,
  PlusIcon,
  UserIcon,
  EyeIcon,
  HandRaisedIcon,
  HomeIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  FireIcon,
  WrenchIcon,
  PaintBrushIcon,
  SwatchIcon,
  GiftIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  CogIcon,
  KeyIcon,
  SparklesIcon,
  ScissorsIcon,
  SunIcon,
  FaceSmileIcon,
  BookOpenIcon,
  LightBulbIcon,
  LanguageIcon,
  MicrophoneIcon,
  MusicalNoteIcon,
  WifiIcon,
  ServerIcon,
  CloudIcon,
  CodeBracketIcon,
  CpuChipIcon,
  MapIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import IdbImage from './IdbImage';
import type { About as AboutCfg, AboutImage, ColorPalette } from '../types';

type Props = { 
  about?: AboutCfg; 
  backgroundClass?: string;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
  colorPalette?: ColorPalette;
  sectionId?: string;
};

const About: React.FC<Props> = ({ about, backgroundClass = 'bg-white', editable, onEdit, colorPalette, sectionId = 'about' }) => {
  // Gallery state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);
  
  // Determine layout style
  const layoutStyle = about?.layoutStyle || 'standard';
  const isMosaicLayout = layoutStyle === 'mosaic';

  // Icon mapping for dynamic icons
  const iconMap = {
    AcademicCapIcon,
    UsersIcon,
    BuildingOfficeIcon,
    StarIcon,
    TrophyIcon,
    ShieldCheckIcon,
    ClockIcon,
    CalendarIcon,
    CheckBadgeIcon,
    CurrencyDollarIcon,
    BriefcaseIcon,
    DocumentTextIcon,
    ScaleIcon,
    CalculatorIcon,
    ChartBarIcon,
    PresentationChartBarIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    HeartIcon,
    PlusIcon,
    UserIcon,
    EyeIcon,
    HandRaisedIcon,
    HomeIcon,
    WrenchScrewdriverIcon,
    BoltIcon,
    FireIcon,
    WrenchIcon,
    PaintBrushIcon,
    SwatchIcon,
    GiftIcon,
    BuildingStorefrontIcon,
    TruckIcon,
    CogIcon,
    KeyIcon,
    SparklesIcon,
    ScissorsIcon,
    SunIcon,
    FaceSmileIcon,
    BookOpenIcon,
    LightBulbIcon,
    LanguageIcon,
    MicrophoneIcon,
    MusicalNoteIcon,
    WifiIcon,
    ServerIcon,
    CloudIcon,
    CodeBracketIcon,
    CpuChipIcon,
    MapIcon,
  };


  // Default values with fallbacks
  const defaultStats = [
    {
      name: 'Years of Experience',
      value: '15+',
      icon: 'AcademicCapIcon',
    },
    {
      name: 'Satisfied Clients',
      value: '500+',
      icon: 'UsersIcon',
    },
    {
      name: 'Plumbing Services',
      value: '8',
      icon: 'BuildingOfficeIcon',
    },
  ];

  const defaultFeatures = [
    'Bilingual Services (English & Spanish)',
    'Licensed Plumbing Professionals',
    '24/7 Emergency Service',
    'Competitive Pricing',
    'Fast & Reliable Service',
    'Comprehensive Plumbing Solutions',
  ];

  const defaultImages: AboutImage[] = [
    {
      imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      alt: "Professional service consultation"
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      alt: "Professional tools and workspace"
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      alt: "Professional team collaboration"
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      alt: "Modern service vehicle"
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      alt: "Professional installation and repair"
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      alt: "Professional working on installation"
    }
  ];

  // Only show default stats if no about config is provided at all
  // If about config exists but statistics is empty/undefined, don't show any stats
  const stats = about ? (about.statistics || []) : defaultStats;
  const features = about?.features || defaultFeatures;
  const images = about?.images || defaultImages;
  const thumbnailSize = about?.thumbnailSize || 1.0;


  // Gallery navigation functions
  const openModal = (index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextModalImage = React.useCallback(() => {
    setModalImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevModalImage = React.useCallback(() => {
    setModalImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Handle keyboard navigation in modal
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevModalImage();
      } else if (e.key === 'ArrowRight') {
        nextModalImage();
      } else if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isModalOpen, nextModalImage, prevModalImage]);

  return (
    <>
      <section id={sectionId} className={`py-16 lg:py-24 ${backgroundClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mobile-left mb-16">
            <EditableText
              as="h2"
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              value={about?.title || 'About Us'}
              path="about.title"
              editable={editable}
              onEdit={onEdit}
              placeholder="Section title"
              textSize={about?.titleTextSize || 2.25} // Default to sister site section title size (desktop)
              onTextSizeChange={onEdit ? (size: number) => onEdit('about.titleTextSize', size.toString()) : undefined}
              textSizeLabel="About Title Size"
              textSizePresets={[1.875, 2.25, 2.75, 3.25]} // Section title presets
              textSizeNormal={2.25} // 36px - sister site section title size (desktop)
              textSizeMin={1.5}
              textSizeMax={4.0}
            />
            <EditableText
              as="p"
              className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
              value={about?.description}
              path="about.description"
              editable={editable}
              onEdit={onEdit}
              placeholder="Enter your about description"
              multiline
              textSize={about?.descriptionTextSize || 1.125} // Default to sister site body text size
              onTextSizeChange={onEdit ? (size: number) => onEdit('about.descriptionTextSize', size.toString()) : undefined}
              textSizeLabel="About Description Size"
              textSizePresets={[1.0, 1.125, 1.25, 1.5]} // Body text presets
              textSizeNormal={1.125} // 18px - sister site body text size
              textSizeMin={0.875}
              textSizeMax={2.0}
            />
          </div>

          {/* Two Column Benefits */}
          {features && features.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(Array.isArray(features) ? features : [])
                  .map((feature, index) => ({ feature, index }))
                  .filter(({ feature }) => feature && feature.trim() !== '')
                  .map(({ feature, index }) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircleIcon 
                        className="h-5 w-5 flex-shrink-0 mt-0.5" 
                        style={{ color: colorPalette?.secondary || '#6B7280' }}
                      />
                      <EditableText
                        as="span"
                        className="text-gray-700"
                        value={feature}
                        path={`about.features.${index}`}
                        editable={editable}
                        onEdit={onEdit}
                        placeholder=""
                        textSize={about?.featuresTextSize || 1.0} // Default to standard body text
                        onTextSizeChange={onEdit ? (size: number) => onEdit('about.featuresTextSize', size.toString()) : undefined}
                        textSizeLabel="Features Text Size"
                        textSizePresets={[0.875, 1.0, 1.125, 1.25]} // Feature text presets
                        textSizeNormal={1.0} // 16px - standard body text
                        textSizeMin={0.75}
                        textSizeMax={1.75}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Optional Statistics */}
          {stats && stats.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {stats.map((stat, index) => {
                  const IconComponent = iconMap[stat.icon as keyof typeof iconMap] || AcademicCapIcon;
                  return (
                    <div key={index} className="text-center mobile-left">
                      <div className="flex justify-center mb-2">
                        <IconComponent 
                          className="h-8 w-8" 
                          style={{ color: colorPalette?.primary || '#10B981' }}
                        />
                      </div>
                      <EditableText
                        className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2"
                        value={stat.value}
                        path={`about.statistics.${index}.value`}
                        editable={editable}
                        onEdit={onEdit}
                        placeholder="Stat value"
                        textSize={(stat as any).valueTextSize || 1.5} // Default to sister site statistics size
                        onTextSizeChange={onEdit ? (size: number) => onEdit(`about.statistics.${index}.valueTextSize`, size.toString()) : undefined}
                        textSizeLabel="Statistic Value Size"
                        textSizePresets={[1.25, 1.5, 1.875, 2.25]} // Statistics value presets
                        textSizeNormal={1.5} // 24px - sister site statistics size
                        textSizeMin={1.0}
                        textSizeMax={3.0}
                      />
                      <EditableText
                        className="text-sm text-gray-600"
                        value={stat.name}
                        path={`about.statistics.${index}.name`}
                        editable={editable}
                        onEdit={onEdit}
                        placeholder="Stat name"
                        textSize={(stat as any).nameTextSize || 0.875} // Default to sister site small text size
                        onTextSizeChange={onEdit ? (size: number) => onEdit(`about.statistics.${index}.nameTextSize`, size.toString()) : undefined}
                        textSizeLabel="Statistic Name Size"
                        textSizePresets={[0.75, 0.875, 1.0, 1.125]} // Small text presets
                        textSizeNormal={0.875} // 14px - sister site small text size
                        textSizeMin={0.625}
                        textSizeMax={1.5}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Image Gallery - Standard (Horizontal Carousel) or Mosaic (Grid) Layout */}
          {images && images.length > 0 && (
            <>
              {!isMosaicLayout ? (
                // Standard Horizontal Thumbnail Gallery with Swiper
                <div className="max-w-7xl mx-auto mt-12 px-4 md:px-4 lg:px-8">
                  <div 
                    className="relative about-images-swiper-container"
                    style={{
                      maxWidth: images.length === 1 ? '300px' : images.length === 2 ? '616px' : '100%',
                      margin: images.length < 3 ? '0 auto' : '0'
                    }}
                  >
                    <Swiper
                      modules={[Navigation, Pagination]}
                      spaceBetween={12}
                      slidesPerView={1}
                      centeredSlides={false}
                      navigation={{
                        prevEl: '.about-images-swiper-button-prev',
                        nextEl: '.about-images-swiper-button-next',
                      }}
                      pagination={{
                        clickable: true,
                        el: '.about-images-swiper-pagination',
                      }}
                      breakpoints={{
                        640: {
                          slidesPerView: Math.min(2, images.length),
                          spaceBetween: 16,
                        },
                        768: {
                          slidesPerView: Math.min(3, images.length),
                          spaceBetween: 16,
                        },
                        1024: {
                          slidesPerView: Math.min(3, images.length),
                          spaceBetween: 24,
                        },
                      }}
                      onSwiper={(swiper) => {
                        swiperRef.current = swiper;
                      }}
                      className="mx-2"
                    >
                      {images.map((image, index) => (
                        <SwiperSlide key={index}>
                          <button
                            onClick={() => openModal(index)}
                            className="relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl group w-full"
                            style={{
                              aspectRatio: '4/3'
                            }}
                          >
                            <IdbImage
                              src={image.thumbnailUrl || image.imageUrl}
                              alt={image.alt}
                              fill
                              loading="lazy"
                              className="object-cover transition-all duration-300 group-hover:scale-110"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl">
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3">
                                  <EyeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                              </div>
                            </div>
                          </button>
                        </SwiperSlide>
                      ))}
                    </Swiper>

                    {/* Navigation Arrows */}
                    <button
                      className="about-images-swiper-button-prev hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 z-10 -translate-x-4 items-center justify-center"
                      aria-label="Previous images"
                    >
                      <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
                    </button>

                    <button
                      className="about-images-swiper-button-next hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 z-10 translate-x-4 items-center justify-center"
                      aria-label="Next images"
                    >
                      <ChevronRightIcon className="h-6 w-6 text-gray-600" />
                    </button>

                    {/* Pagination Dots */}
                    <div className="about-images-swiper-pagination flex justify-center mt-8 space-x-2"></div>

                    {/* Custom pagination styles */}
                    <style dangerouslySetInnerHTML={{
                      __html: `
                        .about-images-swiper-pagination .swiper-pagination-bullet {
                          width: 12px;
                          height: 12px;
                          background-color: #D1D5DB;
                          opacity: 1;
                          transition: all 200ms;
                        }
                        .about-images-swiper-pagination .swiper-pagination-bullet-active {
                          background-color: ${colorPalette?.primary || '#10B981'};
                          transform: scale(1.1);
                        }
                        .about-images-swiper-pagination .swiper-pagination-bullet:hover {
                          background-color: #9CA3AF;
                        }
                      `
                    }} />
                  </div>
                </div>
              ) : (
                // Mosaic Grid Layout (desktop/tablet) with Swiper Carousel (mobile)
                <div className="max-w-7xl mx-auto mt-12 px-4 sm:px-6 lg:px-8">
                  {/* Mobile: Swiper Carousel */}
                  <div className="sm:hidden">
                    <div 
                      className="relative mosaic-mobile-swiper-container"
                      style={{
                        touchAction: 'pan-y pinch-zoom'
                      }}
                    >
                      <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={12}
                        slidesPerView={1}
                        touchReleaseOnEdges={true}
                        touchStartPreventDefault={false}
                        touchStartForcePreventDefault={false}
                        threshold={10}
                        pagination={{
                          clickable: true,
                          el: '.mosaic-mobile-swiper-pagination',
                        }}
                        onSwiper={(swiper) => {
                          swiperRef.current = swiper;
                        }}
                        className="mx-2"
                      >
                        {images.map((image, index) => (
                          <SwiperSlide key={index}>
                            <button
                              onClick={() => openModal(index)}
                              className="relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl group w-full"
                              style={{
                                aspectRatio: '4/3'
                              }}
                            >
                              <IdbImage
                                src={image.thumbnailUrl || image.imageUrl}
                                alt={image.alt}
                                fill
                                loading="lazy"
                                className="object-cover transition-all duration-300 group-hover:scale-110"
                                sizes="100vw"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl">
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                                    <EyeIcon className="h-5 w-5 text-white" />
                                  </div>
                                </div>
                              </div>
                            </button>
                          </SwiperSlide>
                        ))}
                      </Swiper>

                      {/* Pagination Dots */}
                      <div className="mosaic-mobile-swiper-pagination flex justify-center mt-6 space-x-2"></div>

                      {/* Custom pagination styles */}
                      <style dangerouslySetInnerHTML={{
                        __html: `
                          .mosaic-mobile-swiper-pagination .swiper-pagination-bullet {
                            width: 12px;
                            height: 12px;
                            background-color: #D1D5DB;
                            opacity: 1;
                            transition: all 200ms;
                          }
                          .mosaic-mobile-swiper-pagination .swiper-pagination-bullet-active {
                            background-color: ${colorPalette?.primary || '#10B981'};
                            transform: scale(1.1);
                          }
                          .mosaic-mobile-swiper-pagination .swiper-pagination-bullet:hover {
                            background-color: #9CA3AF;
                          }
                        `
                      }} />
                    </div>
                  </div>

                  {/* Tablet/Desktop: Grid Layout */}
                  <div 
                    className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                    style={{
                      gridTemplateColumns: `repeat(auto-fit, minmax(${Math.round(250 * thumbnailSize)}px, 1fr))`
                    }}
                  >
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => openModal(index)}
                        className="relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                        style={{
                          aspectRatio: '4/3'
                        }}
                      >
                        <IdbImage
                          src={image.thumbnailUrl || image.imageUrl}
                          alt={image.alt}
                          fill
                          loading="lazy"
                          className="object-cover transition-all duration-300 group-hover:scale-110"
                          sizes="(max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl">
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                              <EyeIcon className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>


      {/* Modal Carousel */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-6xl w-full max-h-full">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full p-2 transition-all duration-300 border border-white/20"
              aria-label="Close modal"
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
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevModalImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full p-3 transition-all duration-300 hover:scale-110 border border-white/20"
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon className="h-8 w-8" />
                </button>
                <button
                  onClick={nextModalImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full p-3 transition-all duration-300 hover:scale-110 border border-white/20"
                  aria-label="Next image"
                >
                  <ChevronRightIcon 
                    className="h-8 w-8" 
                    style={{ color: colorPalette?.secondary || '#6B7280' }}
                  />
                </button>
              </>
            )}

             {/* Image Counter - only show when more than 10 images (no dots) */}
             {images.length > 10 && (
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
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
                     className="w-3 h-3 rounded-full transition-all duration-300"
                     style={{
                       backgroundColor: index === modalImageIndex 
                         ? (colorPalette?.primary || '#10B981')
                         : 'rgba(255, 255, 255, 0.5)',
                       transform: index === modalImageIndex ? 'scale(1.25)' : 'scale(1)'
                     }}
                     onMouseEnter={(e) => {
                       if (index !== modalImageIndex) {
                         (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                       }
                     }}
                     onMouseLeave={(e) => {
                       if (index !== modalImageIndex) {
                         (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                       }
                     }}
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

export default About; 