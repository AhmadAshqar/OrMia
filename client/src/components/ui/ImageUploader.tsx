import React, { useRef, useState } from 'react';
import { Image } from 'lucide-react';
import { uploadMessageImage } from '@/lib/firebaseMessages';
import { useAuth } from '@/hooks/use-auth';

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  disabled?: boolean;
}

export function ImageUploader({ onImageUploaded, disabled = false }: ImageUploaderProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    const file = files[0];
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      const imageUrl = await uploadMessageImage(file, user.id);
      onImageUploaded(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <button
        type="button"
        className={`text-gray-500 hover:text-blue-500 p-1 rounded-full ${isUploading ? 'opacity-50' : ''}`}
        onClick={handleClick}
        disabled={disabled || isUploading}
      >
        <Image size={20} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
    </>
  );
}