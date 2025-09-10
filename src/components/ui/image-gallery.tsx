"use client";

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
    setShowModal(true);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {/* Image principale */}
        <div className="relative">
          <img
            src={images[selectedImageIndex]}
            alt={`${alt} - Photo principale`}
            className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => openModal(selectedImageIndex)}
          />
          {images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {selectedImageIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Miniatures */}
        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={cn(
                  "relative overflow-hidden rounded transition-all",
                  selectedImageIndex === index
                    ? "ring-2 ring-primary"
                    : "hover:opacity-75"
                )}
              >
                <img
                  src={image}
                  alt={`${alt} - Photo ${index + 1}`}
                  className="w-full h-16 object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal pour affichage en grand */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <img
              src={images[selectedImageIndex]}
              alt={`${alt} - Photo ${selectedImageIndex + 1}`}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            
            {/* Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Compteur */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded">
              {selectedImageIndex + 1} / {images.length}
            </div>

            {/* Bouton fermer */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setShowModal(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}