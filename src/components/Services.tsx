import React from 'react';
import EditableText from './EditableText';
import IdbImage from './IdbImage';
import type { Services, ColorPalette, ServiceItem } from '../types';

type Props = { 
  services?: Services;
  backgroundClass?: string;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
  onServiceImageClick?: (service: ServiceItem, index: number) => void;
  colorPalette?: ColorPalette;
  sectionId?: string;
};

const Services: React.FC<Props> = ({ services: servicesProp, backgroundClass = 'bg-gray-50', editable, onEdit, onServiceImageClick, colorPalette, sectionId = 'services' }) => {

  const services = servicesProp ?? {
    title: "Our Services",
    subtitle: "Professional solutions tailored to your needs",
    items: [
      {
        id: 'service1',
        title: 'Emergency Service',
        description: '24/7 emergency services for urgent needs and critical situations.',
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
        alt: 'Emergency service response',
      },
      {
        id: 'service2',
        title: 'Maintenance & Repair',
        description: 'Professional maintenance and repair services to keep everything running smoothly.',
        imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
        alt: 'Professional maintenance service',
      },
      {
        id: 'service3',
        title: 'Installation & Setup',
        description: 'Complete installation and setup services for new systems and equipment.',
        imageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
        alt: 'Installation and setup work',
      },
    ]
  };

  return (
    <section id={sectionId} className={`py-16 lg:py-24 ${backgroundClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mobile-left mb-16">
          <EditableText
            as="h2"
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            style={{ color: services.titleTextColor }}
            value={services.title}
            path="services.title"
            editable={editable}
            onEdit={onEdit}
            placeholder="Services section title"
            textSize={services.titleTextSize || 2.25} // Default to sister site section title size (desktop)
            onTextSizeChange={onEdit ? (size: number) => onEdit('services.titleTextSize', size.toString()) : undefined}
            textSizeLabel="Services Title Style"
            textSizePresets={[1.875, 2.25, 2.75, 3.25]} // Section title presets
            textSizeNormal={2.25} // 36px - sister site section title size (desktop)
            textSizeMin={1.5}
            textSizeMax={4.0}
            textColor={services.titleTextColor}
            onTextColorChange={onEdit ? (color: string) => onEdit('services.titleTextColor', color) : undefined}
            showColorPicker={true}
            presetColors={['#000000', '#ffffff', ...(colorPalette ? [colorPalette.primary, colorPalette.secondary].filter(Boolean) : [])]}
            fontFamily={services.titleTextFont}
            onFontFamilyChange={onEdit ? (font: string) => onEdit('services.titleTextFont', font) : undefined}
            showFontPicker={true}
          />
          <EditableText
            as="p"
            className="text-lg text-gray-600 max-w-3xl mx-auto"
            style={{ color: services.subtitleTextColor }}
            value={services.subtitle}
            path="services.subtitle"
            editable={editable}
            onEdit={onEdit}
            placeholder="Services section subtitle"
            multiline
            textSize={services.subtitleTextSize || 1.125} // Default to sister site body text size
            onTextSizeChange={onEdit ? (size: number) => onEdit('services.subtitleTextSize', size.toString()) : undefined}
            textSizeLabel="Services Subtitle Style"
            textSizePresets={[1.0, 1.125, 1.25, 1.5]} // Body text presets
            textSizeNormal={1.125} // 18px - sister site body text size
            textSizeMin={0.875}
            textSizeMax={2.0}
            textColor={services.subtitleTextColor}
            onTextColorChange={onEdit ? (color: string) => onEdit('services.subtitleTextColor', color) : undefined}
            showColorPicker={true}
            presetColors={['#000000', '#ffffff', ...(colorPalette ? [colorPalette.primary, colorPalette.secondary].filter(Boolean) : [])]}
            fontFamily={services.subtitleTextFont}
            onFontFamilyChange={onEdit ? (font: string) => onEdit('services.subtitleTextFont', font) : undefined}
            showFontPicker={true}
          />
        </div>

        {/* Services Grid - flex with center justify for incomplete rows */}
        <div className="flex flex-wrap justify-center gap-8">
          {(Array.isArray(services.items) ? services.items : []).map((service, index) => {
            const hasLink = !editable && service.linkUrl;
            const CardWrapper = hasLink ? 'a' : 'div';
            const cardProps = hasLink ? {
              href: service.linkUrl,
              target: '_blank',
              rel: 'noopener noreferrer',
            } : {};
            
            return (
              <CardWrapper
                key={service.id}
                {...cardProps}
                className={`w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.334rem)] bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden hover-lift group ${hasLink ? 'cursor-pointer' : ''}`}
              >
                {/* Service Image */}
                {/* bg-gray-100 prevents black sub-pixel gaps; scale-[1.002] ensures full container coverage */}
                <div 
                  className={`relative aspect-[4/3] overflow-hidden bg-gray-100 ${editable && onServiceImageClick ? 'cursor-pointer' : ''}`}
                  onClick={editable && onServiceImageClick ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onServiceImageClick(service, index);
                  } : undefined}
                >
                  {service.imageUrl ? (
                    <IdbImage 
                      src={service.imageUrl}
                      alt={service.alt || service.title}
                      fill
                      loading="lazy"
                      className={`object-cover scale-[1.002] group-hover:scale-105 transition-transform duration-300 ${editable && onServiceImageClick ? 'group-hover:opacity-75' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <div className="text-primary-600 text-4xl font-bold">
                        {service.title.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                  
                  {/* Edit overlay for clicking on image in edit mode */}
                  {editable && onServiceImageClick && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Edit Image & Link
                      </div>
                    </div>
                  )}
                  
                  {/* Link indicator badge (non-edit mode) */}
                  {!editable && service.linkUrl && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg z-10">
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Service Content */}
                <div className="p-6">
                  <EditableText
                    as="h3"
                    className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors duration-200"
                    style={{ color: services.itemTitleTextColor }}
                    value={service.title}
                    path={`services.items.${index}.title`}
                    editable={editable}
                    onEdit={onEdit}
                    placeholder="Service title"
                    textSize={services.titleTextSize || 1.25} // Uniform size for ALL service titles
                    onTextSizeChange={onEdit ? (size: number) => onEdit(`services.titleTextSize`, size.toString()) : undefined}
                    textSizeLabel="Service Title Style (All Cards)"
                    textSizePresets={[1.0, 1.25, 1.5, 1.75]} // Medium headline presets
                    textSizeNormal={1.25} // 20px - sister site medium headline size
                    textSizeMin={0.875}
                    textSizeMax={2.25}
                    textColor={services.itemTitleTextColor}
                    onTextColorChange={onEdit ? (color: string) => onEdit('services.itemTitleTextColor', color) : undefined}
                    showColorPicker={true}
                    presetColors={['#000000', '#ffffff', ...(colorPalette ? [colorPalette.primary, colorPalette.secondary].filter(Boolean) : [])]}
                    fontFamily={services.itemTitleTextFont}
                    onFontFamilyChange={onEdit ? (font: string) => onEdit('services.itemTitleTextFont', font) : undefined}
                    showFontPicker={true}
                  />
                  <EditableText
                    as="p"
                    className="text-gray-600 leading-relaxed"
                    style={{ color: services.descriptionTextColor }}
                    value={service.description}
                    path={`services.items.${index}.description`}
                    editable={editable}
                    onEdit={onEdit}
                    placeholder="Service description"
                    multiline
                    textSize={services.descriptionTextSize || 1.0} // Uniform size for ALL service descriptions
                    onTextSizeChange={onEdit ? (size: number) => onEdit(`services.descriptionTextSize`, size.toString()) : undefined}
                    textSizeLabel="Service Description Style (All Cards)"
                    textSizePresets={[0.875, 1.0, 1.125, 1.25]} // Body text presets
                    textSizeNormal={1.0} // 16px - standard body text
                    textSizeMin={0.75}
                    textSizeMax={1.75}
                    textColor={services.descriptionTextColor}
                    onTextColorChange={onEdit ? (color: string) => onEdit('services.descriptionTextColor', color) : undefined}
                    showColorPicker={true}
                    presetColors={['#000000', '#ffffff', ...(colorPalette ? [colorPalette.primary, colorPalette.secondary].filter(Boolean) : [])]}
                    fontFamily={services.descriptionTextFont}
                    onFontFamilyChange={onEdit ? (font: string) => onEdit('services.descriptionTextFont', font) : undefined}
                    showFontPicker={true}
                  />
                </div>
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services; 