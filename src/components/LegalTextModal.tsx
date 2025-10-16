import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  editable?: boolean;
  onEdit?: (value: string) => void;
};

const LegalTextModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  content,
  editable,
  onEdit,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  
  // Fetch HTML content from file based on modal title
  const isPrivacy = title.toLowerCase().includes('privacy');
  const htmlPath = isPrivacy ? '/html-content/privacy-policy.html' : '/html-content/terms-conditions.html';
  const htmlFromFile = useHtmlContent(htmlPath);

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setEditMode(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSave = () => {
    if (onEdit) {
      onEdit(editedContent);
    }
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setEditMode(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Custom styles for better HTML rendering in legal text */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .legal-content h1 { font-size: 1.875rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 1rem; }
          .legal-content h2 { font-size: 1.5rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.75rem; }
          .legal-content h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; }
          .legal-content p { margin-top: 0.5rem; margin-bottom: 0.5rem; line-height: 1.6; }
          .legal-content ul, .legal-content ol { margin-top: 0.5rem; margin-bottom: 0.5rem; padding-left: 1.5rem; }
          .legal-content li { margin-top: 0.25rem; margin-bottom: 0.25rem; }
          .legal-content strong { font-weight: 600; }
          .legal-content em { font-style: italic; }
          .legal-content a { color: #2563eb; text-decoration: underline; }
          .legal-content a:hover { color: #1d4ed8; }
          .legal-content hr { margin-top: 1rem; margin-bottom: 1rem; border-color: #e5e7eb; }
          .legal-content blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; margin: 1rem 0; font-style: italic; color: #6b7280; }
        `
      }} />
      
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
          <div
            className={`relative bg-white rounded-lg shadow-2xl w-full max-h-[90vh] flex flex-col transition-all duration-300 ${
              editMode ? 'max-w-7xl' : 'max-w-4xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <div className="flex items-center space-x-2">
                {editable && !editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {editMode ? (
                <div className="flex flex-col h-full">
                  {/* Two-column layout for textarea and preview */}
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
                    {/* Left: Textarea */}
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content (supports plain text or HTML)
                      </label>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
                        placeholder={`You can ask your favorite LLM like ChatGPT to give you HTML for your ${title.toLowerCase()}, just paste it in here.\n\nOr write your own using HTML tags like <h2>, <p>, <ul>, <li>, <strong>, etc.`}
                      />
                    </div>
                    
                    {/* Right: Live Preview */}
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Live Preview
                      </label>
                      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-y-auto p-4">
                        <div
                          className="legal-content prose prose-sm max-w-none text-gray-700"
                          dangerouslySetInnerHTML={{ __html: editedContent || '<p class="text-gray-400 italic">Preview will appear here...</p>' }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons at the bottom */}
                  <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {htmlFromFile && htmlFromFile.trim() ? (
                    <div
                      className="legal-content prose prose-sm sm:prose lg:prose-base max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: htmlFromFile }}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 italic mb-4">Add content here</p>
                      {editable && (
                        <button
                          onClick={() => setEditMode(true)}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add Content
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LegalTextModal;

