import React, { useState, useCallback, useRef } from 'react';
import EditableText from './EditableText';
import type { BusinessBenefits, ColorPalette } from '../types';

type Props = { 
  businessBenefits?: BusinessBenefits;
  backgroundClass?: string;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
  onDeleteBenefit?: (index: number) => void;
  onAddBenefit?: (afterIndex?: number) => void;
  colorPalette?: ColorPalette;
  sectionId?: string;
};

const BusinessBenefitsComponent: React.FC<Props> = ({ 
  businessBenefits: businessBenefitsProp, 
  backgroundClass = 'bg-white', 
  editable, 
  onEdit,
  onDeleteBenefit,
  onAddBenefit,
  colorPalette,
  sectionId = 'benefits'
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showAddAtEnd, setShowAddAtEnd] = useState(false);

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

  // Get the actual items array (filtering empty ones for display)
  const allItems = Array.isArray(businessBenefits.items) ? businessBenefits.items : [];
  const displayItems = allItems
    .map((benefit, originalIndex) => ({ benefit, originalIndex }))
    .filter(({ benefit }) => benefit.title?.trim() || benefit.description?.trim());

  // Track the latest edited values for each benefit (before React re-renders)
  const editedValuesRef = useRef<Map<number, { title?: string; description?: string }>>(new Map());
  // Track blur timeout for each benefit
  const blurTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Custom onEdit that tracks values for blur check
  const handleEdit = useCallback((path: string, value: string) => {
    // Track the edited value for blur checking
    const match = path.match(/^businessBenefits\.items\.(\d+)\.(title|description)$/);
    if (match) {
      const idx = Number(match[1]);
      const field = match[2] as 'title' | 'description';
      const current = editedValuesRef.current.get(idx) || {};
      editedValuesRef.current.set(idx, { ...current, [field]: value });
    }
    
    // Call the parent's onEdit
    if (onEdit) {
      onEdit(path, value);
    }
  }, [onEdit]);

  // Handle blur for checking if benefit should be deleted
  const handleBenefitBlur = useCallback((originalIndex: number) => {
    if (!onDeleteBenefit) return;

    // Clear any existing timeout for this benefit
    const existingTimeout = blurTimeoutRef.current.get(originalIndex);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Use a small timeout to allow both blur events to fire if user tabs between fields
    const timeout = setTimeout(() => {
      // Get the current benefit data from props (may be stale)
      const currentBenefit = allItems[originalIndex];
      if (!currentBenefit) return;

      // Get the latest edited values (if any)
      const edited = editedValuesRef.current.get(originalIndex);
      
      // Determine the final values - prefer edited values, fall back to current props
      const finalTitle = edited?.title !== undefined ? edited.title : currentBenefit.title;
      const finalDescription = edited?.description !== undefined ? edited.description : currentBenefit.description;

      // Check if both are empty
      if (!finalTitle?.trim() && !finalDescription?.trim()) {
        editedValuesRef.current.delete(originalIndex);
        blurTimeoutRef.current.delete(originalIndex);
        onDeleteBenefit(originalIndex);
      }
    }, 200);

    blurTimeoutRef.current.set(originalIndex, timeout);
  }, [allItems, onDeleteBenefit]);

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
            textSize={businessBenefits.titleTextSize || 1.5}
            onTextSizeChange={onEdit ? (size: number) => onEdit('businessBenefits.titleTextSize', size.toString()) : undefined}
            textSizeLabel="Benefits Title Size"
            textSizePresets={[1.25, 1.5, 1.875, 2.25]}
            textSizeNormal={1.5}
            textSizeMin={1.0}
            textSizeMax={2.75}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayItems.map(({ benefit, originalIndex }, displayIndex) => (
              <div 
                key={originalIndex} 
                className="relative group"
                onMouseEnter={() => editable && setHoveredIndex(displayIndex)}
                onMouseLeave={() => editable && setHoveredIndex(null)}
              >
                {/* Hover outline for editable mode */}
                {editable && hoveredIndex === displayIndex && (
                  <div className="absolute -inset-2 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none z-10" />
                )}
                
                <div className="flex items-start space-x-3">
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
                        {displayIndex + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <EditableText
                      as="h4"
                      className="text-gray-900 font-semibold mb-1"
                      value={benefit.title}
                      path={`businessBenefits.items.${originalIndex}.title`}
                      editable={editable}
                      onEdit={handleEdit}
                      onBlur={() => handleBenefitBlur(originalIndex)}
                      placeholder="Benefit title"
                      textSize={businessBenefits.itemTitleTextSize || 1.0}
                      onTextSizeChange={onEdit ? (size: number) => onEdit(`businessBenefits.itemTitleTextSize`, size.toString()) : undefined}
                      textSizeLabel="Benefit Title Size (All Items)"
                      textSizePresets={[0.875, 1.0, 1.125, 1.25]}
                      textSizeNormal={1.0}
                      textSizeMin={0.75}
                      textSizeMax={1.75}
                    />
                    <EditableText
                      as="p"
                      className="text-gray-700 leading-relaxed"
                      value={benefit.description}
                      path={`businessBenefits.items.${originalIndex}.description`}
                      editable={editable}
                      onEdit={handleEdit}
                      onBlur={() => handleBenefitBlur(originalIndex)}
                      placeholder="Benefit description"
                      multiline
                      textSize={businessBenefits.itemDescriptionTextSize || 1.0}
                      onTextSizeChange={onEdit ? (size: number) => onEdit(`businessBenefits.itemDescriptionTextSize`, size.toString()) : undefined}
                      textSizeLabel="Benefit Description Size (All Items)"
                      textSizePresets={[0.875, 1.0, 1.125, 1.25]}
                      textSizeNormal={1.0}
                      textSizeMin={0.75}
                      textSizeMax={1.75}
                    />
                  </div>
                </div>

                {/* Add button - appears on hover between items */}
                {editable && onAddBenefit && hoveredIndex === displayIndex && (
                  <button
                    onClick={() => onAddBenefit(originalIndex)}
                    className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center justify-center w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                    title="Add benefit below"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add new benefit button at the end */}
          {editable && onAddBenefit && (
            <div 
              className="mt-8 relative"
              onMouseEnter={() => setShowAddAtEnd(true)}
              onMouseLeave={() => setShowAddAtEnd(false)}
            >
              <button
                onClick={() => onAddBenefit()}
                className={`w-full py-4 border-2 border-dashed rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  showAddAtEnd 
                    ? 'border-blue-400 bg-blue-50 text-blue-600' 
                    : 'border-gray-300 text-gray-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Add Benefit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BusinessBenefitsComponent;

