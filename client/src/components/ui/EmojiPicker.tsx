import React, { useEffect, useRef, useState } from 'react';
import { Smile } from 'lucide-react';
import data from '@emoji-mart/data';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Initialize the emoji picker
    const initializePicker = async () => {
      if (isOpen && pickerRef.current) {
        const { Picker } = await import('emoji-mart');
        
        // Clean previous content
        pickerRef.current.innerHTML = '';
        
        new Picker({
          data,
          onEmojiSelect: (emoji: any) => {
            onEmojiSelect(emoji.native);
            setIsOpen(false);
          },
          locale: 'he',
          theme: 'light',
          set: 'native',
          autoFocus: true,
          previewPosition: 'none',
          container: pickerRef.current
        });
      }
    };
    
    initializePicker();
  }, [isOpen, onEmojiSelect]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="text-gray-500 hover:text-blue-500 p-1 rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Smile size={20} />
      </button>
      
      {isOpen && (
        <div
          ref={pickerRef}
          className="absolute bottom-full mb-2 z-50"
          dir="ltr"
        />
      )}
    </div>
  );
}