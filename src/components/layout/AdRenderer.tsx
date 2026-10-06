import React from 'react';
import DOMPurify from 'dompurify';

interface AdRendererProps {
  content?: string;
  position: 'top' | 'middle' | 'side' | 'bottom';
}

export default function AdRenderer({ content, position }: AdRendererProps) {
  if (!content) return null;

  // Check if content is a likely image URL
  const isImageUrl = content.trim().match(/\.(jpeg|jpg|gif|png|webp)$/i) || content.startsWith('http') && !content.includes('<');

  const containerClasses = {
    top: 'w-full mb-12 flex justify-center',
    middle: 'w-full my-12 flex justify-center',
    side: 'w-full mb-8 flex justify-center',
    bottom: 'w-full mt-12 mb-20 flex justify-center'
  };

  return (
    <div className={containerClasses[position]}>
      <div className="w-full max-w-4xl bg-gray-50 border-4 border-black p-2 flex flex-col items-center">
        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2 self-start">PUBLICIDADE</span>
        {isImageUrl ? (
          <img 
            src={content} 
            alt="Publicidade" 
            className="max-w-full h-auto"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div 
            className="w-full overflow-hidden flex justify-center"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(content, {
                ADD_TAGS: ["iframe", "script"],
                ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "src", "async", "charset"]
              }) 
            }} 
          />
        )}
      </div>
    </div>
  );
}
