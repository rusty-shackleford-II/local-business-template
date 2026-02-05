import React, { useState, useRef, memo, startTransition, useEffect, createContext, useContext } from 'react';
import Image from 'next/image';
import IdbImage from './IdbImage';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { Menu as MenuType, MenuItem, MenuCategory, MenuImage } from '../types';
import EditableText from './EditableText';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Context for image zoom modal
type ZoomContextType = {
  openZoom: (imageUrl: string, alt: string) => void;
};
const ZoomContext = createContext<ZoomContextType | null>(null);

// Image Zoom Modal Component
const ImageZoomModal: React.FC<{
  imageUrl: string | null;
  alt: string;
  onClose: () => void;
}> = ({ imageUrl, alt, onClose }) => {
  useEffect(() => {
    if (!imageUrl) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors duration-200 z-10"
        aria-label="Close"
      >
        <XMarkIcon className="w-6 h-6 text-white" />
      </button>
      <div
        className="relative max-w-[90vw] max-h-[90vh] w-auto h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <IdbImage
          src={imageUrl}
          alt={alt}
          width={1920}
          height={1080}
          className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
          sizes="90vw"
          priority
        />
      </div>
    </div>
  );
};

// Helper hook to fetch HTML content at runtime
function useHtmlContent(path: string | null): string {
  const [html, setHtml] = useState('');
  
  useEffect(() => {
    if (!path) {
      setHtml('');
      return;
    }
    
    fetch(path)
      .then(res => {
        if (!res.ok) {
          console.log(`[HTML] Failed to fetch ${path}: ${res.status}`);
          return '';
        }
        return res.text();
      })
      .then(text => {
        if (text) {
          console.log(`[HTML] Loaded ${path}: ${text.length} bytes`);
        }
        setHtml(text);
      })
      .catch(err => {
        console.error(`[HTML] Error fetching ${path}:`, err);
        setHtml('');
      });
  }, [path]);
  
  return html;
}

type Props = { 
  menu?: MenuType;
  editable?: boolean;
  onMenuUpdate?: (updatedMenu: MenuType) => void;
  onEdit?: (path: string, value: string) => void;
  backgroundClass?: string;
  isPreview?: boolean;
  sectionId?: string;
};

// Hoisted components to avoid remounts on parent re-renders
const MenuImageCarousel: React.FC<{ images: MenuImage[] }> = memo(({ images }) => {
  const zoomContext = useContext(ZoomContext);
  
  if (!images || images.length === 0) return null;
  
  const handleImageClick = (index: number) => {
    const image = images[index];
    zoomContext?.openZoom(
      image.imageUrl,
      image.alt || `Menu image ${index + 1}`
    );
  };
  
  return (
    <div className="mb-8 sm:mb-12 -mx-4 sm:mx-0">
      <div className="relative max-w-4xl sm:mx-auto" style={{ touchAction: 'pan-y pinch-zoom' }}>
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={0}
          slidesPerView={1}
          centeredSlides={false}
          touchReleaseOnEdges={true}
          touchStartPreventDefault={false}
          touchStartForcePreventDefault={false}
          threshold={10}
          navigation={{
            prevEl: '.menu-image-swiper-button-prev',
            nextEl: '.menu-image-swiper-button-next',
          }}
          pagination={{
            clickable: true,
            el: '.menu-image-swiper-pagination',
          }}
          className="sm:rounded-xl overflow-hidden"
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <div 
                className="relative w-full bg-gray-100 cursor-zoom-in"
                onClick={() => handleImageClick(index)}
              >
                <IdbImage
                  src={image.imageUrl}
                  alt={image.alt || `Menu image ${index + 1}`}
                  width={1024}
                  height={0}
                  className="w-full h-auto object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
                  loading={index === 0 ? "eager" : "lazy"}
                  priority={index === 0}
                  style={{ height: 'auto' }}
                />
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-white text-sm sm:text-base font-medium">{image.caption}</p>
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {/* Navigation Buttons - Hidden on mobile, visible on desktop */}
        {images.length > 1 && (
          <>
            <button 
              className="menu-image-swiper-button-prev hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 z-10 items-center justify-center" 
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
            </button>
            <button 
              className="menu-image-swiper-button-next hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 z-10 items-center justify-center" 
              aria-label="Next image"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}
        
        {/* Pagination Dots */}
        {images.length > 1 && (
          <div className="menu-image-swiper-pagination flex justify-center mt-4"></div>
        )}
      </div>
    </div>
  );
});

MenuImageCarousel.displayName = 'MenuImageCarousel';

type CategoryCarouselProps = { category: MenuCategory; categoryIndex: number; activeTab: number; editable?: boolean; onEdit?: (path: string, value: string) => void };
const CategoryCarousel: React.FC<CategoryCarouselProps> = memo(({ category, categoryIndex, activeTab, editable, onEdit }) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const zoomContext = useContext(ZoomContext);
  
  // Reset to first slide when category changes
  useEffect(() => {
    if (swiperRef.current) {
      swiperRef.current.slideTo(0);
    }
  }, [categoryIndex]);
  
  // Note: We use key={`carousel-${category.items.length}`} on the Swiper component
  // to force a full remount when items are added/removed. This is necessary because
  // the breakpoints configuration uses Math.min(X, category.items.length), which
  // changes the slidesPerView dynamically. Swiper doesn't recalculate breakpoints
  // on update(), so we need to recreate the instance.
  
  if (!category.items || category.items.length === 0) return null;
  
  // Get layout style and card size
  const layoutStyle = category.layoutStyle || 'carousel';
  const cardSize = category.cardSize || 1.0;
  const isMosaicLayout = layoutStyle === 'mosaic';
  
  // Shared menu item card renderer
  const renderMenuItem = (item: MenuItem, itemIndex: number, inSwiper: boolean = false) => {
    const CardWrapper = inSwiper ? 'div' : 'div';
    return (
      <CardWrapper
        key={item.id}
        className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 ${inSwiper ? 'h-full' : ''}`}
        style={
          !inSwiper && cardSize !== 1.0
            ? {
                transform: `scale(${cardSize})`,
                transformOrigin: 'top center',
                marginBottom: `${(cardSize - 1) * 100}%`,
              }
            : {}
        }
      >
        {item.imageUrl && (
          <div 
            className="relative aspect-[4/3] w-full overflow-hidden cursor-zoom-in bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              zoomContext?.openZoom(item.imageUrl!, item.alt || item.title);
            }}
          >
            <IdbImage src={item.imageUrl} alt={item.alt || item.title} fill loading="lazy" className="object-cover scale-[1.002]" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          </div>
        )}
        <div className="p-4 sm:p-5">
          <div className={`flex justify-between items-start mb-3 pb-3 ${item.price ? 'border-b border-gray-100' : ''}`}>
            <EditableText
              as="h4"
              className={`text-base sm:text-lg font-medium text-gray-900 leading-tight ${item.price ? 'flex-1 pr-3' : ''}`}
              value={item.title}
              path={`menu.tabs.${activeTab}.categories.${categoryIndex}.items.${itemIndex}.title`}
              editable={editable}
              onEdit={onEdit}
              placeholder="Enter item name"
              textSize={item.titleTextSize || 1.0}
              onTextSizeChange={onEdit ? (size: number) => onEdit(`menu.tabs.${activeTab}.categories.${categoryIndex}.items.${itemIndex}.titleTextSize`, size.toString()) : undefined}
              textSizeLabel="Menu Item Title Size"
              textSizePresets={[0.875, 1.0, 1.125, 1.25]}
              textSizeNormal={1.0}
              textSizeMin={0.75}
              textSizeMax={1.75}
            />
            {(item.price || editable) && (
              <EditableText
                as="span"
                className="text-base sm:text-lg font-semibold text-green-600 whitespace-nowrap"
                value={item.price}
                path={`menu.tabs.${activeTab}.categories.${categoryIndex}.items.${itemIndex}.price`}
                editable={editable}
                onEdit={onEdit}
                placeholder=""
                textSize={item.priceTextSize || 1.0}
                onTextSizeChange={onEdit ? (size: number) => onEdit(`menu.tabs.${activeTab}.categories.${categoryIndex}.items.${itemIndex}.priceTextSize`, size.toString()) : undefined}
                textSizeLabel="Menu Item Price Size"
                textSizePresets={[0.875, 1.0, 1.125, 1.25]}
                textSizeNormal={1.0}
                textSizeMin={0.75}
                textSizeMax={1.75}
              />
            )}
          </div>
          <EditableText
            as="p"
            className="text-gray-600 text-sm leading-relaxed mb-3"
            value={item.description}
            path={`menu.tabs.${activeTab}.categories.${categoryIndex}.items.${itemIndex}.description`}
            editable={editable}
            onEdit={onEdit}
            placeholder="Enter item description"
            multiline
            textSize={item.descriptionTextSize || 0.875}
            onTextSizeChange={onEdit ? (size: number) => onEdit(`menu.tabs.${activeTab}.categories.${categoryIndex}.items.${itemIndex}.descriptionTextSize`, size.toString()) : undefined}
            textSizeLabel="Menu Item Description Size"
            textSizePresets={[0.75, 0.875, 1.0, 1.125]}
            textSizeNormal={0.875}
            textSizeMin={0.625}
            textSizeMax={1.5}
          />
          {item.dietary && item.dietary.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.dietary.map((tag, index) => (
                <span key={index} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </CardWrapper>
    );
  };

  return (
    <div className="mb-8 sm:mb-12">
      {/* Category Header */}
      <div className="mb-4 sm:mb-6 px-4 sm:px-0 text-center mobile-left">
        <EditableText
          as="h3"
          className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2"
          value={category.name}
          path={`menu.tabs.${activeTab}.categories.${categoryIndex}.name`}
          editable={editable}
          onEdit={onEdit}
          placeholder="Enter category name"
          textSize={category.nameTextSize || 1.25}
          onTextSizeChange={onEdit ? (size: number) => onEdit(`menu.tabs.${activeTab}.categories.${categoryIndex}.nameTextSize`, size.toString()) : undefined}
          textSizeLabel="Category Name Size"
          textSizePresets={[1.0, 1.25, 1.5, 1.75]}
          textSizeNormal={1.25}
          textSizeMin={0.875}
          textSizeMax={2.25}
        />
        <div className="w-16 h-px bg-gray-300 mx-auto mb-2"></div>
        <EditableText
          as="p"
          className="text-gray-600 text-sm sm:text-base"
          value={category.description}
          path={`menu.tabs.${activeTab}.categories.${categoryIndex}.description`}
          editable={editable}
          onEdit={onEdit}
          placeholder="Enter category description"
          multiline
          textSize={category.descriptionTextSize || 1.0}
          onTextSizeChange={onEdit ? (size: number) => onEdit(`menu.tabs.${activeTab}.categories.${categoryIndex}.descriptionTextSize`, size.toString()) : undefined}
          textSizeLabel="Category Description Size"
          textSizePresets={[0.875, 1.0, 1.125, 1.25]}
          textSizeNormal={1.0}
          textSizeMin={0.75}
          textSizeMax={1.75}
        />
      </div>

      {/* Category Content - Either Mosaic Grid or Carousel */}
      {isMosaicLayout ? (
        /* Mosaic Grid Layout */
        <div className="px-4 sm:px-0">
          {/* Desktop/Tablet: Show as grid with cardSize scaling */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {category.items.map((item, itemIndex) => renderMenuItem(item, itemIndex, false))}
          </div>
          {/* Mobile: Show as carousel */}
          <div className="sm:hidden">
            <div className="relative menu-category-swiper-container" style={{ touchAction: 'pan-y pinch-zoom' }}>
              <Swiper
                key={`mosaic-${category.items.length}`}
                modules={[Navigation, Pagination]}
                spaceBetween={16}
                slidesPerView={1}
                centeredSlides={false}
                touchReleaseOnEdges={true}
                touchStartPreventDefault={false}
                touchStartForcePreventDefault={false}
                threshold={10}
                pagination={{
                  clickable: true,
                  el: `.menu-category-${categoryIndex}-mosaic-swiper-pagination`,
                }}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                className="pb-8"
              >
                {category.items.map((item, itemIndex) => (
                  <SwiperSlide key={item.id}>
                    {renderMenuItem(item, itemIndex, true)}
                  </SwiperSlide>
                ))}
              </Swiper>
              <div className={`menu-category-${categoryIndex}-mosaic-swiper-pagination flex justify-center mt-4`}></div>
            </div>
          </div>
        </div>
      ) : (
        /* Carousel Layout */
        <div 
          className="relative menu-category-swiper-container px-4 md:px-0"
          style={{
            maxWidth: category.items.length === 1 ? '400px' : category.items.length === 2 ? '816px' : '100%',
            margin: category.items.length < 3 ? '0 auto' : '0',
            touchAction: 'pan-y pinch-zoom'
          }}
        >
          <Swiper
            key={`carousel-${category.items.length}`}
            modules={[Navigation, Pagination]}
            spaceBetween={16 * cardSize}
            slidesPerView={1}
            centeredSlides={false}
            touchReleaseOnEdges={true}
            touchStartPreventDefault={false}
            touchStartForcePreventDefault={false}
            threshold={10}
            navigation={{
              prevEl: `.menu-category-${categoryIndex}-swiper-button-prev`,
              nextEl: `.menu-category-${categoryIndex}-swiper-button-next`,
            }}
            pagination={{
              clickable: true,
              el: `.menu-category-${categoryIndex}-swiper-pagination`,
            }}
            breakpoints={{
              640: {
                slidesPerView: Math.min(2, category.items.length),
                spaceBetween: 16 * cardSize,
              },
              1024: {
                slidesPerView: Math.min(3, category.items.length),
                spaceBetween: 24 * cardSize,
              },
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            className="pb-8"
            style={{
              transform: cardSize !== 1.0 ? `scale(${cardSize})` : undefined,
              transformOrigin: 'top center',
              marginBottom: cardSize !== 1.0 ? `${(cardSize - 1) * 100}%` : undefined,
            }}
          >
            {category.items.map((item, itemIndex) => (
              <SwiperSlide key={item.id}>
                {renderMenuItem(item, itemIndex, true)}
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* Navigation Buttons - Hidden on mobile, visible on desktop */}
          <button 
            className={`menu-category-${categoryIndex}-swiper-button-prev hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200 items-center justify-center`} 
            style={{ marginLeft: '-20px', marginTop: '-20px' }}
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            className={`menu-category-${categoryIndex}-swiper-button-next hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200 items-center justify-center`} 
            style={{ marginRight: '-20px', marginTop: '-20px' }}
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* Pagination Dots */}
          <div className={`menu-category-${categoryIndex}-swiper-pagination flex justify-center mt-4`}></div>
        </div>
      )}
    </div>
  );
});

CategoryCarousel.displayName = 'CategoryCarousel';

const Menu: React.FC<Props> = ({ menu: menuProp, editable, onMenuUpdate, onEdit, backgroundClass = 'bg-gray-50', isPreview = false, sectionId = 'menu' }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; alt: string } | null>(null);
  
  // Fetch HTML content from file if it exists, otherwise fall back to JSON
  const currentTabId = menuProp?.tabs?.[activeTab]?.id;
  const htmlFromFile = useHtmlContent(
    currentTabId ? `/html-content/menu-${currentTabId}.html` : null
  );
  
  // Zoom handlers
  const openZoom = (imageUrl: string, alt: string) => {
    setZoomedImage({ url: imageUrl, alt });
  };
  
  const closeZoom = () => {
    setZoomedImage(null);
  };
  
  const menu = menuProp ?? {
    title: "Our Menu",
    subtitle: "Delicious offerings made fresh daily",
    tabs: [
      {
        id: 'lunch',
        name: 'Lunch',
        description: 'Fresh lunch options available daily',
        categories: [
          {
            id: 'burgers',
            name: 'Burgers',
            description: 'Handcrafted burgers made with premium ingredients',
            items: [
              {
                id: 'item1',
                title: 'Signature Burger',
                description: 'Juicy beef patty with fresh lettuce, tomato, onion, and our special sauce on a toasted brioche bun.',
                price: '$14.99',
                imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
                alt: 'Signature burger with fresh ingredients',
                dietary: []
              },
              {
                id: 'item2',
                title: 'BBQ Bacon Burger',
                description: 'Smoky BBQ sauce, crispy bacon, cheddar cheese, and onion rings.',
                price: '$16.99',
                imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
                alt: 'BBQ bacon burger',
                dietary: []
              }
            ]
          }
        ]
      },
      {
        id: 'dinner',
        name: 'Dinner',
        description: 'Elegant dinner selections for a perfect evening',
        categories: [
          {
            id: 'seafood',
            name: 'Seafood',
            description: 'Fresh catches prepared to perfection',
            items: [
              {
                id: 'item3',
                title: 'Grilled Salmon',
                description: 'Fresh Atlantic salmon grilled to perfection, served with seasonal vegetables and lemon herb butter.',
                price: '$22.99',
                imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
                alt: 'Grilled salmon with vegetables',
                dietary: ['Gluten-Free']
              }
            ]
          }
        ]
      }
    ],
    items: [
      {
        id: 'item4',
        title: 'Vegetarian Pasta',
        description: 'House-made pasta with roasted vegetables, fresh basil, and parmesan cheese in a light olive oil sauce.',
        price: '$16.99',
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
        alt: 'Vegetarian pasta with fresh herbs',
        dietary: ['Vegetarian']
      }
    ]
  };

  // Check if we should use tabbed mode
  const useTabsMode = menu.tabs && menu.tabs.length > 0;
  
  // Get legacy items for fallback
  const legacyItems = menu.items || [];

  // Menu Image Carousel and CategoryCarousel are hoisted above to prevent remounts

  // Don't render if no content
  if (!useTabsMode && legacyItems.length === 0) {
    return null;
  }

  return (
    <ZoomContext.Provider value={{ openZoom }}>
      <ImageZoomModal
        imageUrl={zoomedImage?.url || null}
        alt={zoomedImage?.alt || ''}
        onClose={closeZoom}
      />
      <section id={sectionId} className={`py-12 sm:py-16 ${backgroundClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mobile-left mb-8 sm:mb-12">
            <EditableText
            as="h2"
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4"
            value={menu.title}
            path="menu.title"
            editable={editable}
            onEdit={onEdit}
            placeholder="Enter menu title"
            textSize={menu.titleTextSize || 2.25} // Default to sister site section title size (desktop)
            onTextSizeChange={onEdit ? (size: number) => onEdit('menu.titleTextSize', size.toString()) : undefined}
            textSizeLabel="Menu Title Size"
            textSizePresets={[1.875, 2.25, 2.75, 3.25]} // Section title presets
            textSizeNormal={2.25} // 36px - sister site section title size (desktop)
            textSizeMin={1.5}
            textSizeMax={4.0}
          />
          <EditableText
            as="p"
            className="text-lg text-gray-600 max-w-3xl mx-auto"
            value={menu.subtitle}
            path="menu.subtitle"
            editable={editable}
            onEdit={onEdit}
            placeholder="Enter menu subtitle"
            multiline
            textSize={menu.subtitleTextSize || 1.125} // Default to sister site body text size
            onTextSizeChange={onEdit ? (size: number) => onEdit('menu.subtitleTextSize', size.toString()) : undefined}
            textSizeLabel="Menu Subtitle Size"
            textSizePresets={[1.0, 1.125, 1.25, 1.5]} // Body text presets
            textSizeNormal={1.125} // 18px - sister site body text size
            textSizeMin={0.875}
            textSizeMax={2.0}
          />
        </div>

        {useTabsMode ? (
          <>
            {/* Tab Navigation - Only show if more than 1 tab */}
            {menu.tabs!.length > 1 && (
              <div className="flex justify-center mb-8 sm:mb-12">
                <div className="w-auto max-w-full overflow-x-auto scrollbar-hide">
                  <div className="inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-200">
                    {menu.tabs!.map((tab, index) => (
                      <button
                        key={tab.id || `tab-${index}`}
                        onClick={() => startTransition(() => setActiveTab(index))}
                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                          activeTab === index
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Active Tab Content */}
            {menu.tabs![activeTab] && (
              <div>
                {/* Tab Description */}
                {(menu.tabs![activeTab].description || editable) && (
                  <div className="text-center mobile-left mb-8 sm:mb-12 px-4 sm:px-0">
                    <EditableText
                      as="p"
                      className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto"
                      value={menu.tabs![activeTab].description}
                      path={`menu.tabs.${activeTab}.description`}
                      editable={editable}
                      onEdit={onEdit}
                      placeholder="Enter tab description"
                      multiline
                      textSize={menu.tabs![activeTab].descriptionTextSize || 1.125} // Default to sister site body text size
                      onTextSizeChange={onEdit ? (size: number) => onEdit(`menu.tabs.${activeTab}.descriptionTextSize`, size.toString()) : undefined}
                      textSizeLabel="Tab Description Size"
                      textSizePresets={[1.0, 1.125, 1.25, 1.5]} // Body text presets
                      textSizeNormal={1.125} // 18px - sister site body text size
                      textSizeMin={0.875}
                      textSizeMax={2.0}
                    />
                  </div>
                )}

                {/* Display either Canva Embed, HTML Content, OR Menu Images (priority order) */}
                {menu.tabs![activeTab].canvaEmbedUrl ? (
                  /* Canva Embed takes priority if present */
                  <div className="mb-8 sm:mb-12 -mx-4 sm:mx-0">
                    <div 
                      className="w-full max-w-4xl sm:mx-auto bg-white sm:rounded-xl sm:shadow-sm sm:border sm:border-gray-100 overflow-hidden"
                      dangerouslySetInnerHTML={{ 
                        __html: menu.tabs![activeTab].canvaEmbedUrl!.includes('<iframe') 
                          ? menu.tabs![activeTab].canvaEmbedUrl! 
                          : `<iframe src="${menu.tabs![activeTab].canvaEmbedUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`
                      }}
                    />
                  </div>
                ) : menu.tabs![activeTab].htmlContent !== undefined ? (
                  /* HTML Content takes priority over menu images */
                  <>
                    {/* Custom styles for better HTML rendering in menu content */}
                    <style dangerouslySetInnerHTML={{
                      __html: `
                        .menu-html-content h1 { font-size: 1.875rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 1rem; }
                        .menu-html-content h2 { font-size: 1.5rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.75rem; }
                        .menu-html-content h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; }
                        .menu-html-content p { margin-top: 0.5rem; margin-bottom: 0.5rem; line-height: 1.6; }
                        .menu-html-content ul, .menu-html-content ol { margin-top: 0.5rem; margin-bottom: 0.5rem; padding-left: 1.5rem; }
                        .menu-html-content li { margin-top: 0.25rem; margin-bottom: 0.25rem; }
                        .menu-html-content strong { font-weight: 600; }
                        .menu-html-content em { font-style: italic; }
                        .menu-html-content a { color: #2563eb; text-decoration: underline; }
                        .menu-html-content a:hover { color: #1d4ed8; }
                        .menu-html-content hr { margin-top: 1rem; margin-bottom: 1rem; border-color: #e5e7eb; }
                        .menu-html-content blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; margin: 1rem 0; font-style: italic; color: #6b7280; }
                        .menu-html-content table { width: 100%; border-collapse: collapse; margin-top: 1rem; margin-bottom: 1rem; }
                        .menu-html-content th, .menu-html-content td { padding: 0.5rem; border: 1px solid #e5e7eb; text-align: left; }
                        .menu-html-content th { background-color: #f9fafb; font-weight: 600; }
                      `
                    }} />
                    <div className="mb-8 sm:mb-12 -mx-4 sm:mx-0">
                      <div className="w-full max-w-4xl sm:mx-auto bg-white sm:rounded-xl sm:shadow-sm sm:border sm:border-gray-100 overflow-hidden p-4 sm:p-6 lg:p-8 relative group">
                        {/* Magic Wand Button - Only show in editable mode */}
                        {editable && onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Trigger the menu HTML generator modal
                              // This will be handled by the editor page via a custom event
                              const event = new CustomEvent('openMenuHTMLGenerator', {
                                detail: { tabIndex: activeTab }
                              });
                              window.dispatchEvent(event);
                            }}
                            className="absolute top-4 right-4 p-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                            title="AI Menu Editor"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </button>
                        )}
                        <div
                          className="menu-html-content prose prose-sm sm:prose lg:prose-base max-w-none text-gray-700"
                          dangerouslySetInnerHTML={{ 
                            __html: isPreview 
                              ? (menu.tabs![activeTab].htmlContent || (editable 
                                  ? '<div class="text-center py-12"><p class="text-gray-400 text-lg mb-2">Empty HTML Canvas</p><p class="text-gray-500 text-sm">Click the magic wand button above to generate menu content, or type HTML in the editor.</p></div>'
                                  : '<p class="text-gray-500 italic text-center py-8">Loading menu...</p>'))
                              : (htmlFromFile || (editable
                                  ? '<div class="text-center py-12"><p class="text-gray-400 text-lg mb-2">Empty HTML Canvas</p><p class="text-gray-500 text-sm">Click the magic wand button above to generate menu content, or type HTML in the editor.</p></div>'
                                  : '<p class="text-gray-500 italic text-center py-8">Loading menu...</p>'))
                          }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* Show Menu Images Carousel only if no Canva embed or HTML content */
                  menu.tabs![activeTab].menuImages && menu.tabs![activeTab].menuImages!.length > 0 && (
                    <MenuImageCarousel images={menu.tabs![activeTab].menuImages!} />
                  )
                )}

                {/* Menu Cards (always show if categories or items exist) */}
                <>
                  {/* Categories */}
                  {menu.tabs![activeTab].categories && menu.tabs![activeTab].categories!.map((category, categoryIndex) => (
                    <CategoryCarousel key={category.id || `category-${categoryIndex}`} category={category} categoryIndex={categoryIndex} activeTab={activeTab} editable={editable} onEdit={onEdit} />
                  ))}

                  {/* Legacy Items (if any exist) */}
                  {menu.tabs![activeTab].items && menu.tabs![activeTab].items!.length > 0 && (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0 ${
                      menu.tabs![activeTab].items!.length <= 3 ? 'justify-items-center' : ''
                    }`}>
                      {menu.tabs![activeTab].items!.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
                        >
                          {item.imageUrl && (
                            <div 
                              className="relative aspect-[4/3] w-full overflow-hidden cursor-zoom-in bg-gray-100"
                              onClick={() => openZoom(item.imageUrl!, item.alt || item.title)}
                            >
                              <IdbImage
                                src={item.imageUrl}
                                alt={item.alt || item.title}
                                fill
                                loading="lazy"
                                className="object-cover scale-[1.002]"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            </div>
                          )}
                          
                          <div className="p-4 sm:p-5">
                            <div className={`flex justify-between items-start mb-3 pb-3 ${item.price ? 'border-b border-gray-100' : ''}`}>
                              <h4 className={`text-base sm:text-lg font-medium text-gray-900 leading-tight ${item.price ? 'flex-1 pr-3' : ''}`}>
                                {item.title}
                              </h4>
                              {item.price && (
                                <span className="text-base sm:text-lg font-semibold text-green-600 whitespace-nowrap">
                                  {item.price}
                                </span>
                              )}
                            </div>
                            
                            {item.description && (
                              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                {item.description}
                              </p>
                            )}
                            
                            {item.dietary && item.dietary.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {item.dietary.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              </div>
            )}
          </>
        ) : (
          /* Legacy Mode - Simple Grid */
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0 ${
            legacyItems.length <= 3 ? 'justify-items-center' : ''
          }`}>
            {legacyItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {item.imageUrl && (
                  <div 
                    className="relative aspect-[4/3] w-full overflow-hidden cursor-zoom-in bg-gray-100"
                    onClick={() => openZoom(item.imageUrl!, item.alt || item.title)}
                  >
                    <IdbImage
                      src={item.imageUrl}
                      alt={item.alt || item.title}
                      fill
                      loading="lazy"
                      className="object-cover scale-[1.002]"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                
                <div className="p-4 sm:p-5">
                  <div className={`flex justify-between items-start mb-3 pb-3 ${item.price ? 'border-b border-gray-100' : ''}`}>
                    <h3 className={`text-base sm:text-lg font-medium text-gray-900 leading-tight ${item.price ? 'flex-1 pr-3' : ''}`}>
                      {item.title}
                    </h3>
                    {item.price && (
                      <span className="text-base sm:text-lg font-semibold text-green-600 whitespace-nowrap">
                        {item.price}
                      </span>
                    )}
                  </div>
                  
                  {item.description && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      {item.description}
                    </p>
                  )}
                  
                  {item.dietary && item.dietary.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.dietary.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </section>
    </ZoomContext.Provider>
  );
};

export default Menu;
