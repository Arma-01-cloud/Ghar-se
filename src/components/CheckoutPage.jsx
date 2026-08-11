import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { MapPin, Clock, CreditCard, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function CheckoutPage() {
  const { cart, cartSubtotal, deliveryFee, placeOrder, setActiveTab } = useCart();

  const [address, setAddress] = useState({
    fullName: 'Rahul Sharma',
    phone: '+91 98765 43210',
    flat: 'Flat 402, Green Meadows Apartment',
    street: '100 Feet Road, Indiranagar',
    city: 'Bengaluru',
    pincode: '560038'
  });

  const [deliverySlot, setDeliverySlot] = useState('express'); // express, evening, tomorrow
  const [paymentMethod, setPaymentMethod] = useState('upi'); // upi, card, cod
  const [upiApp, setUpiApp] = useState('gpay');

  if (cart.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="font-display text-2xl font-extrabold text-stone-900">Your cart is empty</h2>
        <button onClick={() => setActiveTab('shop')} className="py-3 px-6 bg-emerald-800 text-white font-bold rounded-xl">
          Return to Shop
        </button>
      </div>
    );
  }

  const finalTotal = cartSubtotal + deliveryFee;

  const handleCompleteCheckout = (e) => {
    e.preventDefault();
    const formattedAddr = `${address.flat}, ${address.street}, ${address.city} - ${address.pincode}`;
    const paymentLabel = paymentMethod === 'upi' ? `UPI (${upiApp.toUpperCase()})` : paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery';

    placeOrder({
      subtotal: cartSubtotal,
      deliveryFee: deliveryFee,
      discount: 0,
      totalAmount: finalTotal,
      paymentMethod: paymentLabel,
      address: formattedAddr
    });
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-display text-3xl font-extrabold text-stone-900">Order Checkout</h1>
        <p className="text-stone-500 text-sm mt-0.5">Complete your grocery order delivery details below</p>
      </div>

      <form onSubmit={handleCompleteCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: ADDRESS, SLOT & PAYMENT */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* STEP 1: DELIVERY ADDRESS */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="font-display font-extrabold text-lg text-stone-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-700" /> Delivery Address
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-600 mb-1">Flat / House / Building</label>
                <input
                  type="text"
                  required
                  value={address.flat}
                  onChange={(e) => setAddress({ ...address, flat: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Street / Area / Landmark</label>
                <input
                  type="text"
                  required
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Pincode</label>
                <input
                  type="text"
                  required
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: DELIVERY SLOT */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="font-display font-extrabold text-lg text-stone-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-700" /> Select Delivery Slot
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'express', label: '⚡ Express (15-30 Mins)', sub: 'Fastest delivery option', tag: 'RECOMMENDED' },
                { id: 'evening', label: '🌆 Today Evening (6 PM - 9 PM)', sub: 'Standard evening slot' },
                { id: 'tomorrow', label: '🌅 Tomorrow Morning (8 AM - 11 AM)', sub: 'Scheduled morning' }
              ].map(slot => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setDeliverySlot(slot.id)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    deliverySlot === slot.id
                      ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20'
                      : 'bg-white border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div>
                    {slot.tag && (
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase mb-2 inline-block">
                        {slot.tag}
                      </span>
                    )}
                    <h4 className="font-bold text-xs sm:text-sm text-stone-900">{slot.label}</h4>
                    <p className="text-[11px] text-stone-500 mt-1">{slot.sub}</p>
                  </div>
                  {deliverySlot === slot.id && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-3 self-end" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: PAYMENT METHOD */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h2 className="font-display font-extrabold text-lg text-stone-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-700" /> Payment Method
              </h2>
            </div>

            <div className="space-y-3">
              {/* UPI */}
              <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'upi' ? 'bg-emerald-50/80 border-emerald-600' : 'bg-white border-stone-200'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <span className="font-extrabold text-sm text-stone-900 block">UPI Instant Payment (GPay / PhonePe / Paytm / BHIM)</span>
                  <p className="text-xs text-stone-500 mt-0.5">Pay safely via your favorite UPI app</p>
                  
                  {paymentMethod === 'upi' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-emerald-200">
                      {['gpay', 'phonepe', 'paytm', 'bhim'].map(app => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setUpiApp(app)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase border ${
                            upiApp === app ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-stone-700 border-stone-300'
                          }`}
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </label>

              {/* CARD */}
              <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'card' ? 'bg-emerald-50/80 border-emerald-600' : 'bg-white border-stone-200'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-extrabold text-sm text-stone-900 block">Credit / Debit Card</span>
                  <p className="text-xs text-stone-500 mt-0.5">Visa, MasterCard, RuPay & American Express</p>
                </div>
              </label>

              {/* CASH ON DELIVERY */}
              <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'cod' ? 'bg-emerald-50/80 border-emerald-600' : 'bg-white border-stone-200'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-extrabold text-sm text-stone-900 block">Cash / UPI on Delivery</span>
                  <p className="text-xs text-stone-500 mt-0.5">Pay at your doorstep when your groceries arrive</p>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-sm sticky top-24">
            
            <h3 className="font-display font-extrabold text-xl text-stone-900 border-b border-stone-100 pb-3">
              Order Items ({cart.length})
            </h3>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-black text-stone-900">{item.quantity}x</span>
                    <span className="truncate text-stone-700">{item.product.name}</span>
                  </div>
                  <span className="font-bold text-stone-900">₹{item.product.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-stone-100 pt-4 text-xs font-semibold text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{cartSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-black text-stone-900 border-t border-stone-200 pt-3">
                <span>Grand Total</span>
                <span className="text-xl text-emerald-950">₹{finalTotal}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
            >
              <span>PLACE GROCERY ORDER</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="text-center text-[11px] text-stone-400 font-semibold flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Guaranteed Fresh & 100% Secure</span>
            </div>

          </div>
        </div>

      </form>
    </div>
  );
}
