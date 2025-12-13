import React from 'react';
import EditableText from './EditableText';
import IdbImage from './IdbImage';
import type { Services, ColorPalette } from '../types';

type Props = { 
  services?: Services;
  backgroundClass?: string;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
  colorPalette?: ColorPalette;
  sectionId?: string;
};

const Services: React.FC<Props> = ({ services: servicesProp, backgroundClass = 'bg-gray-50', editable, onEdit, colorPalette, sectionId = 'services' }) => {

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
            value={services.title}
            path="services.title"
            editable={editable}
            onEdit={onEdit}
            placeholder="Services section title"
            textSize={services.titleTextSize || 2.25} // Default to sister site section title size (desktop)
            onTextSizeChange={onEdit ? (size: number) => onEdit('services.titleTextSize', size.toString()) : undefined}
            textSizeLabel="Services Title Size"
            textSizePresets={[1.875, 2.25, 2.75, 3.25]} // Section title presets
            textSizeNormal={2.25} // 36px - sister site section title size (desktop)
            textSizeMin={1.5}
            textSizeMax={4.0}
          />
          <EditableText
            as="p"
            className="text-lg text-gray-600 max-w-3xl mx-auto"
            value={services.subtitle}
            path="services.subtitle"
            editable={editable}
            onEdit={onEdit}
            placeholder="Services section subtitle"
            multiline
            textSize={services.subtitleTextSize || 1.125} // Default to sister site body text size
            onTextSizeChange={onEdit ? (size: number) => onEdit('services.subtitleTextSize', size.toString()) : undefined}
            textSizeLabel="Services Subtitle Size"
            textSizePresets={[1.0, 1.125, 1.25, 1.5]} // Body text presets
            textSizeNormal={1.125} // 18px - sister site body text size
            textSizeMin={0.875}
            textSizeMax={2.0}
          />
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(Array.isArray(services.items) ? services.items : []).map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden hover-lift group"
            >
              {/* Service Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                {service.imageUrl ? (
                  <IdbImage 
                    src={service.imageUrl}
                    alt={service.alt || service.title}
                    fill
                    loading="lazy"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <div className="text-primary-600 text-4xl font-bold">
                      {service.title.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              {/* Service Content */}
              <div className="p-6">
                <EditableText
                  as="h3"
                  className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors duration-200"
                  value={service.title}
                  path={`services.items.${services.items.indexOf(service)}.title`}
                  editable={editable}
                  onEdit={onEdit}
                  placeholder="Service title"
                  textSize={services.titleTextSize || 1.25} // Uniform size for ALL service titles
                  onTextSizeChange={onEdit ? (size: number) => onEdit(`services.titleTextSize`, size.toString()) : undefined}
                  textSizeLabel="Service Title Size (All Cards)"
                  textSizePresets={[1.0, 1.25, 1.5, 1.75]} // Medium headline presets
                  textSizeNormal={1.25} // 20px - sister site medium headline size
                  textSizeMin={0.875}
                  textSizeMax={2.25}
                />
                <EditableText
                  as="p"
                  className="text-gray-600 leading-relaxed"
                  value={service.description}
                  path={`services.items.${services.items.indexOf(service)}.description`}
                  editable={editable}
                  onEdit={onEdit}
                  placeholder="Service description"
                  multiline
                  textSize={services.descriptionTextSize || 1.0} // Uniform size for ALL service descriptions
                  onTextSizeChange={onEdit ? (size: number) => onEdit(`services.descriptionTextSize`, size.toString()) : undefined}
                  textSizeLabel="Service Description Size (All Cards)"
                  textSizePresets={[0.875, 1.0, 1.125, 1.25]} // Body text presets
                  textSizeNormal={1.0} // 16px - standard body text
                  textSizeMin={0.75}
                  textSizeMax={1.75}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services; 