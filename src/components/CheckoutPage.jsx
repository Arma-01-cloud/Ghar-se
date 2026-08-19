import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { MapPin, Clock, CreditCard, ShieldCheck, CheckCircle2, ArrowRight, Loader2, MessageSquare } from 'lucide-react';

export default function CheckoutPage() {
  const { cart, cartSubtotal, deliveryFee, placeOrder, setActiveTab, customerPhone, customerName, currentLocation, isPlacingOrder } = useCart();

  const [address, setAddress] = useState(() => {
    const custName = customerName && customerName !== 'Customer' ? customerName : '';
    const phone = customerPhone || '';
    const flat = currentLocation?.flat || '';
    const street = currentLocation?.street || currentLocation?.area || '';
    const city = currentLocation?.city || (currentLocation?.name?.includes(',') ? currentLocation.name.split(',')[0].trim() : (currentLocation?.name || ''));
    const pincode = currentLocation?.pincode || '';

    return {
      fullName: custName,
      phone: phone,
      flat: flat,
      street: street,
      city: city,
      pincode: pincode
    };
  });

  useEffect(() => {
    if (customerName && customerName !== 'Customer') {
      setAddress(prev => ({ ...prev, fullName: customerName }));
    }
    if (customerPhone) {
      setAddress(prev => ({ ...prev, phone: customerPhone }));
    }
    if (currentLocation) {
      setAddress(prev => ({
        ...prev,
        flat: currentLocation.flat || prev.flat,
        street: currentLocation.street || currentLocation.area || prev.street,
        city: currentLocation.city || (currentLocation.name?.includes(',') ? currentLocation.name.split(',')[0].trim() : prev.city),
        pincode: currentLocation.pincode || prev.pincode
      }));
    }
  }, [customerName, customerPhone, currentLocation]);

  const [deliverySlot, setDeliverySlot] = useState('express'); // express, evening, tomorrow
  const [paymentMethod, setPaymentMethod] = useState('upi'); // upi, card, cod
  const [upiApp, setUpiApp] = useState('gpay');

  if (cart.length === 0) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <h2 className="font-display text-2xl font-extrabold text-stone-900">Your cart is empty</h2>
        <button onClick={() => setActiveTab('home')} className="py-3 px-6 bg-emerald-800 text-white font-bold rounded-xl shadow-md">
          Return to Catalog
        </button>
      </div>
    );
  }

  const finalTotal = cartSubtotal + deliveryFee;

  const handleCompleteCheckout = async (e) => {
    e.preventDefault();
    if (isPlacingOrder) return;

    const parts = [
      address.flat,
      address.street,
      address.city,
      address.pincode ? `PIN: ${address.pincode}` : ''
    ].map(s => (s || '').trim()).filter(Boolean);

    const formattedAddr = parts.join(', ') || 'Doorstep Delivery';
    const paymentLabel = paymentMethod === 'upi' ? `UPI (${upiApp.toUpperCase()})` : paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery';

    await placeOrder({
      fullName: address.fullName || customerName || 'Customer',
      phone: address.phone || customerPhone,
      subtotal: cartSubtotal,
      deliveryFee: deliveryFee,
      discount: 0,
      totalAmount: finalTotal,
      paymentMethod: paymentLabel,
      address: formattedAddr,
      deliveryAddress: formattedAddr,
      delivery_address: formattedAddr
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-display text-3xl font-black text-stone-900 tracking-tight">Checkout Order</h1>
        <p className="text-stone-500 text-sm">Review your delivery address and payment method</p>
      </div>

      <form onSubmit={handleCompleteCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: ADDRESS & PAYMENT */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* DELIVERY ADDRESS CARD */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm uppercase tracking-wider">
              <MapPin className="w-5 h-5 text-emerald-700" />
              <span>1. Delivery Address</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Mobile Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 81238 21300"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-700 font-bold mb-1">Flat, House No., Building *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Door No. 12, Main Road"
                  value={address.flat}
                  onChange={(e) => setAddress({ ...address, flat: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-700 font-bold mb-1">Street / Area / Landmark *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Bus Stand, Main Road"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">City / Town *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter city"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 577101"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* DELIVERY SLOT */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm uppercase tracking-wider">
              <Clock className="w-5 h-5 text-emerald-700" />
              <span>2. Delivery Speed & Time</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDeliverySlot('express')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  deliverySlot === 'express'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700'
                }`}
              >
                <span className="block font-black text-emerald-800">🚀 Evening Delivery</span>
                <span className="text-[10px] text-stone-500 font-medium">Delivery will be done after 4:00 PM</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliverySlot('evening')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  deliverySlot === 'evening'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700'
                }`}
              >
                <span className="block font-black text-stone-900">🌆 Today Evening</span>
                <span className="text-[10px] text-stone-500 font-medium">Slot: After 4:00 PM</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliverySlot('tomorrow')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  deliverySlot === 'tomorrow'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700'
                }`}
              >
                <span className="block font-black text-stone-900">☀️ Tomorrow</span>
                <span className="text-[10px] text-stone-500 font-medium">Delivery after 4:00 PM</span>
              </button>
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm uppercase tracking-wider">
              <CreditCard className="w-5 h-5 text-emerald-700" />
              <span>3. Payment Option</span>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-2xl border border-stone-200 bg-stone-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="accent-emerald-700"
                  />
                  <div>
                    <span className="font-extrabold text-stone-900 text-sm block">UPI (Google Pay / PhonePe / Paytm)</span>
                    <span className="text-stone-500 text-xs font-semibold">Direct discount available</span>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">RECOMMENDED</span>
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl border border-stone-200 bg-stone-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-emerald-700"
                  />
                  <div>
                    <span className="font-extrabold text-stone-900 text-sm block">Cash on Delivery (COD)</span>
                    <span className="text-stone-500 text-xs font-semibold">Pay cash or scan QR code when rider arrives</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs sticky top-28">
            <h3 className="font-display font-extrabold text-lg text-stone-900 border-b border-stone-100 pb-3">
              Order Summary ({cart.length} Items)
            </h3>

            <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center font-semibold text-stone-800">
                  <div className="truncate max-w-[190px] space-y-0.5">
                    <span className="font-bold text-stone-900 block truncate">
                      {item.product.name}
                      {!item.product.id || (typeof item.product.id === 'string' && item.product.id.length < 20) ? (
                        <span className="text-[10px] text-amber-700 font-bold ml-1">(Manual Item)</span>
                      ) : null}
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium block">
                      Quantity: <strong className="text-stone-700 font-bold">{item.quantity}</strong> • Weight: <strong className="text-stone-700 font-bold">{item.product.unit || '1 unit'}</strong>
                    </span>
                  </div>
                  <span className="font-bold text-stone-900 shrink-0 ml-2">₹{item.product.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 pt-3 space-y-2 text-xs font-semibold">
              <div className="flex justify-between text-stone-600">
                <span>Items Subtotal</span>
                <span>₹{cartSubtotal}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <span className="text-emerald-700 font-extrabold">FREE</span> : `₹${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-stone-900 font-extrabold text-base pt-2 border-t border-stone-100">
                <span>Total Payable</span>
                <span className="text-emerald-950">₹{finalTotal}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPlacingOrder}
              className={`w-full py-4 px-6 text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 mt-2 ${
                isPlacingOrder ? 'bg-stone-400 cursor-not-allowed' : 'bg-emerald-800 hover:bg-emerald-900'
              }`}
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SAVING ORDER TO SUPABASE...</span>
                </>
              ) : (
                <>
                  <span>CONFIRM ORDER (₹{finalTotal})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-stone-400 font-semibold flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Safe & Secure Doorstep Grocery Delivery
            </p>
          </div>
        </div>

      </form>

    </div>
  );
}