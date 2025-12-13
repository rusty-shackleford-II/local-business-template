import React from 'react';
import EditableText from './EditableText';
import type { BusinessBenefits, ColorPalette } from '../types';

type Props = { 
  businessBenefits?: BusinessBenefits;
  backgroundClass?: string;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
  colorPalette?: ColorPalette;
  sectionId?: string;
};

const BusinessBenefitsComponent: React.FC<Props> = ({ 
  businessBenefits: businessBenefitsProp, 
  backgroundClass = 'bg-white', 
  editable, 
  onEdit, 
  colorPalette,
  sectionId = 'benefits'
}) => {

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
    <section id={sectionId} className={`py-16 lg:py-24 ${backgroundClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Business Benefits Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
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
                    textSize={businessBenefits.itemTitleTextSize || 1.0} // Uniform size for ALL benefit item titles
                    onTextSizeChange={onEdit ? (size: number) => onEdit(`businessBenefits.itemTitleTextSize`, size.toString()) : undefined}
                    textSizeLabel="Benefit Title Size (All Items)"
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
                    textSize={businessBenefits.itemDescriptionTextSize || 1.0} // Uniform size for ALL benefit item descriptions
                    onTextSizeChange={onEdit ? (size: number) => onEdit(`businessBenefits.itemDescriptionTextSize`, size.toString()) : undefined}
                    textSizeLabel="Benefit Description Size (All Items)"
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

export default BusinessBenefitsComponent;

