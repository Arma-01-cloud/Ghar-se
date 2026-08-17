import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { 
  X, MapPin, Phone, User, CreditCard, ShieldCheck, 
  Clock, ArrowRight, Loader2, ShoppingBag, CheckCircle2, 
  Banknote, Smartphone 
} from 'lucide-react';
import { get10DigitPhone } from '../services/authService';

export default function AnyStoreCheckoutModal({
  isOpen,
  onClose,
  requestCart,
  subtotal,
  deliveryFee = 49,
  totalAmount,
  onConfirmOrder,
  isSubmitting = false
}) {
  const { customerName, customerPhone, currentLocation, setCustomerLocation, setCustomerName, setCustomerPhone } = useCart();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    flat: '',
    street: '',
    city: '',
    pincode: '',
    paymentMethod: 'UPI',
    upiApp: 'Google Pay'
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Sync with current user profile & location when modal opens
  useEffect(() => {
    if (isOpen) {
      const cName = customerName && customerName !== 'Customer' ? customerName : '';
      let phoneNum = customerPhone || '';
      try {
        if (!phoneNum) phoneNum = localStorage.getItem('gharsee_customer_phone') || '';
      } catch {}

      const flat = currentLocation?.flat || '';
      const street = currentLocation?.street || currentLocation?.area || '';
      const city = currentLocation?.city || (currentLocation?.name?.includes(',') ? currentLocation.name.split(',')[0].trim() : (currentLocation?.name || ''));
      const pincode = currentLocation?.pincode || '';

      setFormData({
        fullName: cName,
        phone: phoneNum,
        flat: flat,
        street: street,
        city: city,
        pincode: pincode,
        paymentMethod: 'UPI',
        upiApp: 'Google Pay'
      });
      setErrorMsg('');
    }
  }, [isOpen, customerName, customerPhone, currentLocation]);

  if (!isOpen) return null;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    const cleanPhone = get10DigitPhone(formData.phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile phone number');
      return;
    }

    if (!formData.flat.trim()) {
      setErrorMsg('Please enter your House / Flat / Building number');
      return;
    }

    if (!formData.street.trim()) {
      setErrorMsg('Please enter your Street / Area / Landmark');
      return;
    }

    if (!formData.city.trim()) {
      setErrorMsg('Please enter your City');
      return;
    }

    const parts = [
      formData.flat.trim(),
      formData.street.trim(),
      formData.city.trim(),
      formData.pincode.trim() ? `PIN: ${formData.pincode.trim()}` : ''
    ].filter(Boolean);

    const formattedAddress = parts.join(', ');
    const normalizedPhone = `+91 ${cleanPhone}`;

    // Update global context & local storage so user profile is remembered
    if (setCustomerName) setCustomerName(formData.fullName.trim());
    if (setCustomerPhone) setCustomerPhone(normalizedPhone);
    if (setCustomerLocation) {
      setCustomerLocation({
        ...currentLocation,
        flat: formData.flat.trim(),
        street: formData.street.trim(),
        city: formData.city.trim(),
        pincode: formData.pincode.trim(),
        formattedAddress: formattedAddress,
        name: `${formData.street.trim()}, ${formData.city.trim()}`
      });
    }

    const paymentLabel = formData.paymentMethod === 'UPI' 
      ? `UPI (${formData.upiApp})` 
      : formData.paymentMethod === 'Card' 
      ? 'Credit/Debit Card' 
      : 'Cash on Delivery';

    await onConfirmOrder({
      fullName: formData.fullName.trim(),
      phone: normalizedPhone,
      address: formattedAddress,
      deliveryAddress: formattedAddress,
      delivery_address: formattedAddress,
      flat: formData.flat.trim(),
      street: formData.street.trim(),
      city: formData.city.trim(),
      pincode: formData.pincode.trim(),
      paymentMethod: paymentLabel
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 p-5 sm:p-7 space-y-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* MODAL HEADER */}
        <div className="border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4 text-emerald-700" />
            <span>CONFIRM SHOP FROM ANY STORE REQUEST</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-stone-900">
            Delivery Address & Payment
          </h2>
          <p className="text-stone-500 text-xs mt-0.5">
            Verify your contact details and address for fast local store pickup & doorstep delivery.
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="space-y-6">
          
          {/* 1. CONTACT & ADDRESS FORM */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-stone-900 font-black text-sm">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>1. Delivery Contact & Address</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Mobile Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-700 font-bold mb-1">Flat, House No., Building *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 302, Green Valley Apartments"
                  value={formData.flat}
                  onChange={(e) => setFormData({ ...formData, flat: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-700 font-bold mb-1">Street / Area / Landmark *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near City Bus Stand, Market Road"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">City / Town *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chikkamagaluru"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Pincode</label>
                <input
                  type="text"
                  placeholder="e.g. 577101"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* 2. PAYMENT METHOD SELECTION */}
          <div className="space-y-3 pt-3 border-t border-stone-100">
            <div className="flex items-center gap-2 text-stone-900 font-black text-sm">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>2. Payment Option</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'UPI' })}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                  formData.paymentMethod === 'UPI'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="block font-black">UPI (GPay / PhonePe)</span>
                  <span className="text-[10px] text-stone-500 font-medium">Fast & Secure</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'COD' })}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                  formData.paymentMethod === 'COD'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="block font-black">Cash on Delivery</span>
                  <span className="text-[10px] text-stone-500 font-medium">Pay on doorstep</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'Card' })}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                  formData.paymentMethod === 'Card'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="block font-black">Debit / Credit Card</span>
                  <span className="text-[10px] text-stone-500 font-medium">Visa / Mastercard</span>
                </div>
              </button>
            </div>
          </div>

          {/* 3. ORDER ITEMS & PRICE BREAKDOWN */}
          <div className="space-y-3 pt-3 border-t border-stone-100 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-stone-800">
                Grocery Items Requested ({requestCart.length})
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                ⚡ Delivery after 4:00 PM
              </span>
            </div>

            <div className="max-h-32 overflow-y-auto divide-y divide-stone-200/60 pr-1 text-xs">
              {requestCart.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 first:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 truncate max-w-[160px] sm:max-w-xs">{item.name}</span>
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                      Weight: {item.unit}
                    </span>
                    <span className="text-stone-600 text-[11px] font-bold">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-extrabold text-stone-900">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-200 space-y-1 text-xs font-semibold text-stone-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-stone-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Partner Delivery Fee</span>
                <span className="font-bold text-emerald-800">₹{deliveryFee}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-stone-900 border-t border-stone-200/80 pt-1.5">
                <span>Total Amount to Pay</span>
                <span className="text-base text-emerald-950 font-black">₹{totalAmount || subtotal + deliveryFee}</span>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Placing Order & Broadcasting to Riders...</span>
                </>
              ) : (
                <>
                  <span>Place the Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-stone-400 text-[11px] font-semibold pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Broadcasted to nearest local delivery partners • 100% Verified</span>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
