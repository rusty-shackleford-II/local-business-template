import React from 'react';
import EditableText from './EditableText';
import IdbImage from './IdbImage';
import type { Services, BusinessBenefits, ColorPalette } from '../types';

type Props = { 
  services?: Services;
  businessBenefits?: BusinessBenefits;
  backgroundClass?: string;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
  colorPalette?: ColorPalette;
};

const Services: React.FC<Props> = ({ services: servicesProp, businessBenefits: businessBenefitsProp, backgroundClass = 'bg-gray-50', editable, onEdit, colorPalette }) => {

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

  const businessBenefits = businessBenefitsProp ?? {
    title: "Why Choose Our Services",
    items: [
      { title: "24/7 availability", description: "Available whenever you need us most" },
      { title: "Rapid response", description: "Quick response times to serve you better" },
      { title: "Expert professionals", description: "Licensed professionals with years of experience" },
      { title: "Modern equipment", description: "Advanced tools for efficient service delivery" },
      { title: "Transparent pricing", description: "No hidden fees or surprise charges" },
      { title: "Quality guarantee", description: "All work backed by our satisfaction guarantee" }
    ]
  };

  return (
    <section id="services" className={`py-16 lg:py-24 ${backgroundClass}`}>
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
                  textSize={service.titleTextSize || 1.25} // Default to sister site medium headline size
                  onTextSizeChange={onEdit ? (size: number) => onEdit(`services.items.${services.items.indexOf(service)}.titleTextSize`, size.toString()) : undefined}
                  textSizeLabel="Service Title Size"
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
                  textSize={service.descriptionTextSize || 1.0} // Default to standard body text
                  onTextSizeChange={onEdit ? (size: number) => onEdit(`services.items.${services.items.indexOf(service)}.descriptionTextSize`, size.toString()) : undefined}
                  textSizeLabel="Service Description Size"
                  textSizePresets={[0.875, 1.0, 1.125, 1.25]} // Body text presets
                  textSizeNormal={1.0} // 16px - standard body text
                  textSizeMin={0.75}
                  textSizeMax={1.75}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Business Benefits Section */}
        <div id="benefits" className="mt-16 bg-white rounded-2xl shadow-lg p-8 lg:p-12">
          <EditableText
            as="h3"
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center mobile-left"
            value={businessBenefits.title}
            path="businessBenefits.title"
            editable={editable}
            onEdit={onEdit}
            placeholder="Benefits section title"
            textSize={businessBenefits.titleTextSize || 1.5} // Default to sister site subsection title size
            onTextSizeChange={onEdit ? (size: number) => onEdit('businessBenefits.titleTextSize', size.toString()) : undefined}
            textSizeLabel="Benefits Title Size"
            textSizePresets={[1.25, 1.5, 1.875, 2.25]} // Subsection title presets
            textSizeNormal={1.5} // 24px - sister site subsection title size
            textSizeMin={1.0}
            textSizeMax={2.75}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(Array.isArray(businessBenefits.items) ? businessBenefits.items : [])
              .filter(benefit => benefit.title?.trim() || benefit.description?.trim())
              .map((benefit, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div 
                    className="flex items-center justify-center w-8 h-8 rounded-full"
                    style={{ 
                      backgroundColor: `${colorPalette?.primary || '#10B981'}20`,
                    }}
                  >
                    <span 
                      className="font-semibold text-sm"
                      style={{ 
                        color: colorPalette?.primary || '#10B981'
                      }}
                    >
                      {index + 1}
                    </span>
                  </div>
                </div>
                <div>
                  <EditableText
                    as="h4"
                    className="text-gray-900 font-semibold mb-1"
                    value={benefit.title}
                    path={`businessBenefits.items.${businessBenefits.items.indexOf(benefit)}.title`}
                    editable={editable}
                    onEdit={onEdit}
                    placeholder="Benefit title"
                    textSize={benefit.titleTextSize || 1.0} // Default to standard body text
                    onTextSizeChange={onEdit ? (size: number) => onEdit(`businessBenefits.items.${businessBenefits.items.indexOf(benefit)}.titleTextSize`, size.toString()) : undefined}
                    textSizeLabel="Benefit Title Size"
                    textSizePresets={[0.875, 1.0, 1.125, 1.25]} // Body text presets
                    textSizeNormal={1.0} // 16px - standard body text
                    textSizeMin={0.75}
                    textSizeMax={1.75}
                  />
                  <EditableText
                    as="p"
                    className="text-gray-700 leading-relaxed"
                    value={benefit.description}
                    path={`businessBenefits.items.${businessBenefits.items.indexOf(benefit)}.description`}
                    editable={editable}
                    onEdit={onEdit}
                    placeholder="Benefit description"
                    multiline
                    textSize={benefit.descriptionTextSize || 1.0} // Default to standard body text
                    onTextSizeChange={onEdit ? (size: number) => onEdit(`businessBenefits.items.${businessBenefits.items.indexOf(benefit)}.descriptionTextSize`, size.toString()) : undefined}
                    textSizeLabel="Benefit Description Size"
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
      </div>
    </section>
  );
};

export default Services; 