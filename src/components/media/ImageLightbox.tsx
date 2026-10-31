// ============================================================
// ListingDesk Pro — Image Lightbox (Full-screen image viewer)
// ============================================================

import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Trash2 } from 'lucide-react';

interface ImageLightboxProps {
  images: Array<{ id: string; url: string; alt?: string }>;
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (index: number) => void;
  onDelete?: (index: number) => void;
  showActions?: boolean;
}

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onDelete,
  showActions = true,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(currentIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setIndex(currentIndex);
    setZoom(1);
    setRotation(0);
  }, [currentIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') navigatePrev();
      if (e.key === 'ArrowRight') navigateNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, index]);

  const navigatePrev = () => {
    const newIndex = index > 0 ? index - 1 : images.length - 1;
    setIndex(newIndex);
    onNavigate?.(newIndex);
  };

  const navigateNext = () => {
    const newIndex = index < images.length - 1 ? index + 1 : 0;
    setIndex(newIndex);
    onNavigate?.(newIndex);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleDownload = async () => {
    try {
      const response = await fetch(images[index].url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${index + 1}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = () => {
    if (confirm('Delete this image?')) {
      onDelete?.(index);
      if (images.length === 1) {
        onClose();
      } else if (index >= images.length - 1) {
        const newIndex = index - 1;
        setIndex(newIndex);
        onNavigate?.(newIndex);
      }
    }
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[index];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Counter */}
      <div className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white">
        {index + 1} / {images.length}
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={navigatePrev}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={navigateNext}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Image Container */}
      <div className="flex h-full w-full items-center justify-center p-16">
        <div
          className="relative max-h-full max-w-full overflow-hidden"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease-out',
          }}
        >
          {currentImage.url ? (
            <img
              src={currentImage.url}
              alt={currentImage.alt || `Image ${index + 1}`}
              className="max-h-[80vh] max-w-[90vw] object-contain"
              draggable={false}
            />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-gray-800 text-gray-400">
              No image
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      {showActions && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md">
          <ActionButton icon={<ZoomOut className="h-4 w-4" />} onClick={handleZoomOut} title="Zoom Out" />
          <span className="px-2 text-xs text-white">{Math.round(zoom * 100)}%</span>
          <ActionButton icon={<ZoomIn className="h-4 w-4" />} onClick={handleZoomIn} title="Zoom In" />
          <div className="mx-2 h-5 w-px bg-white/20" />
          <ActionButton icon={<RotateCw className="h-4 w-4" />} onClick={handleRotate} title="Rotate" />
          <div className="mx-2 h-5 w-px bg-white/20" />
          <ActionButton icon={<Download className="h-4 w-4" />} onClick={handleDownload} title="Download" />
          {onDelete && (
            <>
              <div className="mx-2 h-5 w-px bg-white/20" />
              <ActionButton icon={<Trash2 className="h-4 w-4" />} onClick={handleDelete} title="Delete" danger />
            </>
          )}
        </div>
      )}

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-black/50 p-2 backdrop-blur-md">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => {
                setIndex(i);
                onNavigate?.(i);
              }}
              className={clsx(
                'h-12 w-12 overflow-hidden rounded border-2 transition-all',
                i === index ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              {img.url ? (
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gray-700" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionButton({ icon, onClick, title, danger }: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        'rounded-full p-2 transition-colors',
        danger
          ? 'text-red-400 hover:bg-red-500/20'
          : 'text-white hover:bg-white/20'
      )}
    >
      {icon}
    </button>
  );
}
