import React, { useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { compressGroceryImage } from '../utils/imageCompressor';
import { createDirectImageOrder } from '../services/imageOrderService';
import {
  Upload, Camera, RefreshCw, Trash2, CheckCircle2,
  Check, Store, MessageSquare, Plus, Minus
} from 'lucide-react';

export default function UploadGroceryListCard() {
  const {
    currentStore,
    availableStores,
    customerName,
    customerPhone,
    currentLocation,
    setActiveTab,
    addToast,
    setIsCustomerOnboardingOpen
  } = useCart();

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [compressedResult, setCompressedResult] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [hasWhatsAppNumber, setHasWhatsAppNumber] = useState(true);

  const fileInputRef = useRef(null);
  const activeStore = currentStore || (availableStores && availableStores[0]) || null;

  const handleFile = async (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const isImage = validTypes.includes((file.type || '').toLowerCase()) || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isImage) {
      addToast('Please select a JPG, PNG, or WebP photo.', 'error');
      return;
    }

    try {
      setIsCompressing(true);
      setSelectedFile(file);

      const result = await compressGroceryImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        targetMaxBytes: 300 * 1024
      });

      setCompressedResult(result);
      setImagePreview(result.dataUrl);
      setIsCompressing(false);
      addToast('Photo ready for order! 📸', 'success');
    } catch (err) {
      console.error('Compression error:', err);
      setIsCompressing(false);
      addToast(err.message || "We couldn't process this image. Please try another photo.", 'error');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setCompressedResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmOrder = async () => {
    if (!compressedResult || !compressedResult.blob) {
      addToast('Please select an image.', 'error');
      return;
    }

    if (!activeStore || !activeStore.id) {
      addToast('Please select a store to send your order.', 'error');
      return;
    }

    if (!customerPhone) {
      addToast('Please enter your phone number to place the order.', 'info');
      setIsCustomerOnboardingOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await createDirectImageOrder({
        store: activeStore,
        customerName: customerName || 'Customer',
        customerPhone: customerPhone,
        deliveryAddress: currentLocation?.name || currentLocation?.formattedAddress || 'Doorstep Delivery',
        quantity: Math.max(1, Number(quantity) || 1),
        note: note.trim(),
        compressedBlob: compressedResult.blob,
        previewDataUrl: compressedResult.dataUrl
      });

      setIsSubmitting(false);

      if (!res.success) {
        addToast(res.error || "We couldn't send your order. Please try again.", 'error');
        return;
      }

      setConfirmedOrder(res.order);
      setWhatsappUrl(res.whatsappUrl || '');
      setHasWhatsAppNumber(res.hasWhatsApp);

      addToast('✅ Order Confirmed! Your grocery image has been sent.', 'success');

      if (res.hasWhatsApp && res.whatsappUrl) {
        window.open(res.whatsappUrl, '_blank', 'noopener,noreferrer');
      } else if (!res.hasWhatsApp) {
        addToast('This shop has not added a WhatsApp number yet.', 'info');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setIsSubmitting(false);
      addToast("We couldn't send your order. Please try again.", 'error');
    }
  };

  if (confirmedOrder) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-black text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full">
            ORDER #{confirmedOrder.id}
          </span>
          <h4 className="font-display font-extrabold text-xl text-stone-900">
            ✅ Order Confirmed
          </h4>
          <p className="text-stone-600 text-xs sm:text-sm">
            Your grocery image has been sent to <strong>{activeStore?.name}</strong>.
          </p>
        </div>

        {hasWhatsAppNumber && whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Open Shopkeeper WhatsApp</span>
          </a>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium">
            This shop has not added a WhatsApp number yet.
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className="flex-1 py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl"
          >
            View Orders
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              setImagePreview(null);
              setSelectedFile(null);
              setCompressedResult(null);
              setQuantity(1);
              setNote('');
            }}
            className="flex-1 py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl"
          >
            New Photo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow space-y-6">
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              📸
            </span>
            <h3 className="font-display font-extrabold text-lg sm:text-xl text-stone-900">
              Upload Grocery Image
            </h3>
          </div>
          {activeStore && (
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              🏪 {activeStore.name}
            </span>
          )}
        </div>
        <p className="text-stone-500 text-xs sm:text-sm mb-4 leading-relaxed">
          Upload a photo of your handwritten grocery list or items. We'll send it directly to your selected store.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          className="hidden"
        />

        {!imagePreview ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-600 bg-emerald-50/60'
                : 'border-stone-300 bg-stone-50/50 hover:border-emerald-400 hover:bg-stone-50'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-xs">
              <Camera className="w-7 h-7 stroke-[2.2]" />
            </div>

            <h4 className="font-display font-bold text-stone-900 text-sm sm:text-base">
              📷 Drag & drop your image here
            </h4>
            <p className="text-stone-400 text-xs mt-1 mb-4 font-medium">
              JPG, PNG or WEBP
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="py-3 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Image</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 max-h-56 flex items-center justify-center">
              <img
                src={imagePreview}
                alt="Grocery List Preview"
                className="w-full h-48 object-contain"
              />

              {isCompressing && (
                <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                  <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mb-1" />
                  <span className="text-[11px] font-bold text-emerald-300">Compressing...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              <span className="truncate max-w-[150px] font-bold text-stone-900">
                {selectedFile?.name || 'grocery_image.jpg'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-emerald-700 hover:underline font-bold"
                >
                  🔄 Change
                </button>
                <span className="text-stone-300">•</span>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-rose-600 hover:underline font-bold"
                >
                  🗑 Remove
                </button>
              </div>
            </div>

            {/* Quantity & Note */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <span className="text-xs font-bold text-stone-700">Quantity</span>
                <div className="flex items-center border border-stone-300 rounded-lg bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-6 h-6 flex items-center justify-center hover:bg-stone-100 rounded text-stone-700 font-bold text-xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-xs text-stone-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-stone-100 rounded text-stone-700 font-bold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note for store (e.g. fresh items)..."
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={isSubmitting || isCompressing}
              className="w-full py-3.5 px-6 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending Order...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>✓ CONFIRM ORDER</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
