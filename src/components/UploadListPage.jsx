import React, { useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { compressGroceryImage } from '../utils/imageCompressor';
import { createDirectImageOrder } from '../services/imageOrderService';
import {
  Upload, Camera, Image as ImageIcon, CheckCircle2,
  Trash2, RefreshCw, AlertCircle, ArrowRight, Check,
  Store, MessageSquare, Plus, Minus, FileText, ShoppingBag
} from 'lucide-react';

export default function UploadListPage() {
  const {
    currentStore,
    setCurrentStore,
    availableStores,
    customerName,
    customerPhone,
    currentLocation,
    setActiveTab,
    addToast,
    setIsCustomerOnboardingOpen
  } = useCart();

  // Image & Compression State
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [compressedResult, setCompressedResult] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Form State
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success State
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [shopkeeperWhatsAppUrl, setShopkeeperWhatsAppUrl] = useState('');
  const [hasWhatsAppNumber, setHasWhatsAppNumber] = useState(true);

  const fileInputRef = useRef(null);

  // Target store is currentStore, falling back to first available store
  const activeStore = currentStore || (availableStores && availableStores[0]) || null;

  // Handle image file selection and client-side compression
  const handleFileProcess = async (file) => {
    if (!file) return;

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const isImage = validTypes.includes((file.type || '').toLowerCase()) || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isImage) {
      addToast('Please select a valid JPG, PNG, or WebP photo.', 'error');
      return;
    }

    try {
      setIsCompressing(true);
      setSelectedFile(file);

      // Perform client-side compression targeting 100-300 KB
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
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setCompressedResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChangeImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Submit Direct Image Order
  const handleConfirmOrder = async () => {
    // 1. Image Check
    if (!compressedResult || !compressedResult.blob) {
      addToast('Please select an image.', 'error');
      return;
    }

    // 2. Store Check
    if (!activeStore || !activeStore.id) {
      addToast('Please select a store to send your order.', 'error');
      return;
    }

    // 3. Customer Authentication check
    const effectivePhone = customerPhone || localStorage.getItem('gharsee_customer_phone') || '';
    const effectiveName = customerName || localStorage.getItem('gharsee_customer_name') || 'Customer';

    if (!effectivePhone) {
      addToast('Please enter your name and phone number to place the order.', 'info');
      setIsCustomerOnboardingOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await createDirectImageOrder({
        store: activeStore,
        customerName: effectiveName,
        customerPhone: effectivePhone,
        deliveryAddress: currentLocation?.name || currentLocation?.formattedAddress || 'Doorstep Delivery',
        quantity: Math.max(1, Number(quantity) || 1),
        note: note.trim(),
        compressedBlob: compressedResult.blob,
        previewDataUrl: compressedResult.dataUrl
      });

      setIsSubmitting(false);

      if (!result.success) {
        addToast(result.error || "We couldn't send your order. Please try again.", 'error');
        return;
      }

      setConfirmedOrder(result.order);
      setShopkeeperWhatsAppUrl(result.whatsappUrl || '');
      setHasWhatsAppNumber(result.hasWhatsApp);

      addToast('✅ Order Confirmed! Your grocery image has been sent.', 'success');

      // Open Shopkeeper's WhatsApp automatically if number is present
      if (result.hasWhatsApp && result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
      } else if (!result.hasWhatsApp) {
        addToast('This shop has not added a WhatsApp number yet.', 'info');
      }
    } catch (err) {
      console.error('Order creation exception:', err);
      setIsSubmitting(false);
      addToast("We couldn't send your order. Please try again.", 'error');
    }
  };

  const handleResetForNewOrder = () => {
    setConfirmedOrder(null);
    setShopkeeperWhatsAppUrl('');
    setSelectedFile(null);
    setImagePreview(null);
    setCompressedResult(null);
    setQuantity(1);
    setNote('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // SUCCESS SCREEN
  if (confirmedOrder) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              ORDER #{confirmedOrder.id}
            </span>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-stone-900">
              ✅ Order Confirmed
            </h1>
            <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto">
              Your grocery image has been sent to <strong className="text-emerald-950 font-bold">{activeStore?.name || 'the selected shop'}</strong>.
            </p>
          </div>

          {/* ORDER SUMMARY CARD */}
          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-left space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center border-b border-stone-200/80 pb-2.5">
              <span className="text-stone-500 font-bold">Store:</span>
              <span className="font-extrabold text-stone-900">{activeStore?.name}</span>
            </div>
            <div className="flex justify-between items-center border-b border-stone-200/80 pb-2.5">
              <span className="text-stone-500 font-bold">Customer:</span>
              <span className="font-extrabold text-stone-900">{customerName || 'Customer'} ({customerPhone})</span>
            </div>
            <div className="flex justify-between items-center border-b border-stone-200/80 pb-2.5">
              <span className="text-stone-500 font-bold">Quantity:</span>
              <span className="font-extrabold text-stone-900">{quantity}</span>
            </div>
            {note && (
              <div className="flex justify-between items-start border-b border-stone-200/80 pb-2.5">
                <span className="text-stone-500 font-bold shrink-0 mr-2">Note:</span>
                <span className="font-semibold text-stone-800 text-right">{note}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-bold">Payment:</span>
              <span className="font-bold text-emerald-800">Pay After Shopkeeper Inspection</span>
            </div>
          </div>

          {/* WHATSAPP ACTION */}
          {hasWhatsAppNumber && shopkeeperWhatsAppUrl ? (
            <div className="space-y-3 pt-2">
              <a
                href={shopkeeperWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2.5"
              >
                <MessageSquare className="w-5 h-5 fill-current" />
                <span>Open Shopkeeper WhatsApp</span>
              </a>
              <p className="text-[11px] text-stone-400">
                Click above if WhatsApp did not open automatically.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-semibold">
              This shop has not added a WhatsApp number yet. The order has been recorded in the store portal.
            </div>
          )}

          {/* NAVIGATION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-200">
            <button
              onClick={() => setActiveTab('orders')}
              className="flex-1 py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors"
            >
              View My Orders
            </button>
            <button
              onClick={handleResetForNewOrder}
              className="flex-1 py-3.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm rounded-xl transition-colors"
            >
              Upload Another Photo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      
      {/* PAGE HEADER */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wider">
          <Camera className="w-3.5 h-3.5 text-emerald-700" />
          <span>DIRECT PHOTO ORDER</span>
        </div>
        <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          Upload Grocery Image
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
          Take a photo of your handwritten grocery list, items, or recipe note. We'll send it directly to your selected store for packing.
        </p>
      </div>

      {/* SELECTED STORE BANNER & SWITCHER */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold shrink-0 border border-emerald-200">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-400 uppercase font-extrabold tracking-wider block">
              Sending Order To Store:
            </span>
            <h3 className="font-display font-extrabold text-stone-900 text-sm sm:text-base">
              {activeStore ? activeStore.name : 'No store selected'}
            </h3>
            <p className="text-[11px] text-stone-500">
              {activeStore?.address || 'Local Neighborhood Store'}
            </p>
          </div>
        </div>

        {/* Quick Store Switch dropdown if multiple stores exist */}
        {availableStores && availableStores.length > 1 && (
          <div className="w-full sm:w-auto flex items-center gap-2">
            <label htmlFor="store-select" className="text-xs font-bold text-stone-500 hidden sm:inline">
              Switch:
            </label>
            <select
              id="store-select"
              value={activeStore?.id || ''}
              onChange={(e) => {
                const found = availableStores.find(s => s.id === e.target.value);
                if (found) setCurrentStore(found);
              }}
              className="w-full sm:w-auto bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:border-emerald-600"
            >
              {availableStores.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* MAIN UPLOAD & REVIEW CARD */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* HIDDEN NATIVE FILE INPUT (SUPPORTS CAMERA & GALLERY) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => e.target.files && handleFileProcess(e.target.files[0])}
          className="hidden"
        />

        {/* 1. IMAGE UPLOAD ZONE / PREVIEW */}
        {!imagePreview ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleChangeImageClick}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-600 bg-emerald-50/70'
                : 'border-stone-300 bg-stone-50/60 hover:border-emerald-500 hover:bg-stone-50'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 shadow-xs">
              <Camera className="w-8 h-8 stroke-[2.2]" />
            </div>

            <h3 className="font-display font-extrabold text-stone-900 text-base sm:text-lg">
              📸 Upload Grocery Image
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm mt-1 mb-6 max-w-sm">
              Tap to open phone camera or gallery. JPG, PNG, or WebP.
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleChangeImageClick();
              }}
              className="py-3.5 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>CHOOSE PHOTO</span>
            </button>
          </div>
        ) : (
          /* 2. IMAGE PREVIEW & EDIT CONTROLS */
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 max-h-96 flex items-center justify-center">
              <img
                src={imagePreview}
                alt="Selected Grocery Photo"
                className="w-full max-h-96 object-contain"
              />

              {isCompressing && (
                <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                  <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs font-bold text-emerald-300">Optimizing image size...</span>
                </div>
              )}
            </div>

            {/* PREVIEW BUTTONS: CHANGE & REMOVE */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleChangeImageClick}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                <span>🔄 Change Image</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveImage}
                className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>🗑 Remove Image</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. ORDER DETAILS: QUANTITY & OPTIONAL NOTE */}
        <div className="space-y-4 pt-4 border-t border-stone-200">
          
          {/* QUANTITY SELECTOR */}
          <div className="flex items-center justify-between bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div>
              <label className="font-extrabold text-sm text-stone-900 block">
                Quantity
              </label>
              <span className="text-[11px] text-stone-500 block">
                Number of list photos or order batches
              </span>
            </div>

            <div className="flex items-center border border-stone-300 rounded-xl bg-white p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 rounded-lg text-stone-700 font-extrabold text-sm transition-colors"
                title="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <span className="w-10 text-center font-display font-black text-sm text-stone-900">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 rounded-lg text-stone-700 font-extrabold text-sm transition-colors"
                title="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* OPTIONAL NOTE TEXTAREA */}
          <div className="space-y-1.5">
            <label htmlFor="order-note" className="font-extrabold text-sm text-stone-900 block">
              Optional Note
            </label>
            <textarea
              id="order-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Please deliver fresh items before 5 PM, or substitute brands if out of stock..."
              rows={3}
              className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all resize-none"
            />
          </div>

        </div>

        {/* 4. CONFIRM ORDER ACTION BUTTON */}
        <div className="pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={handleConfirmOrder}
            disabled={!imagePreview || isSubmitting || isCompressing}
            className="w-full py-4 px-6 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending Order to Store...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                <span>✓ CONFIRM ORDER</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-stone-400 mt-2 font-medium">
            The shopkeeper will inspect your photo and confirm items on WhatsApp.
          </p>
        </div>

      </div>

    </div>
  );
}