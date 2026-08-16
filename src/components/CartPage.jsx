import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Tag, Sparkles } from 'lucide-react';

export default function CartPage() {
  const { 
    cart, 
    cartSubtotal, 
    deliveryFee, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    setActiveTab,
    addToast 
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'FRESH100') {
      setAppliedDiscount(100);
      setAppliedCoupon('FRESH100');
      addToast('Coupon FRESH100 applied! Saved ₹100 🎉', 'success');
    } else if (code === 'GROCERY50') {
      setAppliedDiscount(50);
      setAppliedCoupon('GROCERY50');
      addToast('Coupon GROCERY50 applied! Saved ₹50 🎉', 'success');
    } else {
      addToast('Invalid coupon code. Try FRESH100 or GROCERY50', 'error');
    }
  };

  const finalTotal = Math.max(0, cartSubtotal + deliveryFee - appliedDiscount);
  const freeShippingThreshold = 499;
  const freeShippingNeeded = Math.max(0, freeShippingThreshold - cartSubtotal);
  const freeShippingProgress = Math.min(100, (cartSubtotal / freeShippingThreshold) * 100);

  if (cart.length === 0) {
    return (
      <div className="py-20 px-4 text-center max-w-lg mx-auto space-y-5">
        <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-12 h-12 stroke-[1.8]" />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900">
          Your cart is waiting for some fresh groceries.
        </h2>
        <p className="text-stone-500 text-sm">
          Explore our wide selection of farm-fresh fruits, vegetables, staples, or upload your handwritten grocery shopping list.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
          <button
            onClick={() => setActiveTab('shop')}
            className="py-3.5 px-8 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all"
          >
            START SHOPPING
          </button>
          
          <button
            onClick={() => setActiveTab('upload')}
            className="py-3.5 px-8 bg-white text-emerald-800 border-2 border-emerald-700 font-extrabold text-sm rounded-2xl hover:bg-emerald-50 transition-all"
          >
            UPLOAD GROCERY LIST
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-stone-900">Your Shopping Cart</h1>
          <p className="text-stone-500 text-sm mt-0.5">{cart.length} unique items in your basket</p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: CART ITEMS & FREE SHIPPING PROGRESS BAR */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* FREE SHIPPING PROGRESS METER */}
          <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-4 sm:p-5 rounded-3xl shadow-md space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
              <span>
                {freeShippingNeeded === 0 
                  ? '🎉 Congratulations! You unlocked FREE Delivery!' 
                  : `Add ₹${freeShippingNeeded} more to unlock FREE Delivery`}
              </span>
              <span className="text-emerald-300 font-extrabold">{Math.floor(freeShippingProgress)}%</span>
            </div>

            <div className="w-full bg-emerald-950/60 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-mint-300 h-full transition-all duration-500 rounded-full" 
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* ITEM LIST */}
          <div className="bg-white rounded-3xl border border-stone-200 divide-y divide-stone-100 shadow-xs overflow-hidden">
            {cart.map(item => {
              const p = item.product;
              const itemTotal = p.price * item.quantity;
              return (
                <div key={p.id} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-stone-50/50 transition-colors">
                  
                  {/* IMAGE */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl bg-stone-100 border border-stone-200 shrink-0"
                  />

                  {/* INFO */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {p.brand}
                    </span>
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-stone-900 truncate mt-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">₹{p.price} / {p.unit}</p>
                  </div>

                  {/* QUANTITY CONTROLS */}
                  <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50 p-1">
                    <button
                      onClick={() => updateQuantity(p.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-stone-200 rounded-lg font-bold text-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-extrabold text-xs text-stone-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(p.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-stone-200 rounded-lg font-bold text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* ITEM SUBTOTAL & DELETE */}
                  <div className="text-right min-w-[70px]">
                    <span className="font-black text-base text-stone-900 block">₹{itemTotal}</span>
                    <button
                      onClick={() => removeFromCart(p.id)}
                      className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setActiveTab('shop')}
              className="text-sm font-bold text-emerald-800 hover:underline flex items-center gap-1.5"
            >
              ← Continue Shopping
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY & CHECKOUT BUTTON */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-sm">
            
            <h2 className="font-display font-extrabold text-xl text-stone-900 border-b border-stone-100 pb-3">
              Order Summary
            </h2>

            {/* COUPON CODE FORM */}
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label className="text-xs font-bold text-stone-600 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-600" /> Apply Coupon Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Try FRESH100"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl transition-colors"
                >
                  APPLY
                </button>
              </div>
              {appliedCoupon && (
                <span className="text-[11px] text-emerald-700 font-bold block">
                  ✓ Coupon {appliedCoupon} applied (-₹{appliedDiscount})
                </span>
              )}
            </form>

            {/* PRICE BREAKDOWN */}
            <div className="space-y-3 border-t border-stone-100 pt-4 text-xs font-semibold text-stone-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-stone-900">₹{cartSubtotal}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery Fee</span>
                {deliveryFee === 0 ? (
                  <span className="font-bold text-emerald-600 uppercase">FREE</span>
                ) : (
                  <span className="font-bold text-stone-900">₹{deliveryFee}</span>
                )}
              </div>

              {appliedDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{appliedDiscount}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Taxes & Darkstore Charges</span>
                <span>Included</span>
              </div>

              <div className="flex justify-between items-center text-lg font-black text-stone-900 border-t border-stone-200 pt-3">
                <span>Total Amount</span>
                <span className="text-xl text-emerald-950">₹{finalTotal}</span>
              </div>
            </div>

            {/* CHECKOUT BUTTON */}
            <button
              onClick={() => setActiveTab('checkout')}
              className="w-full py-4 px-6 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 text-stone-400 text-xs font-semibold pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & Encrypted Checkout</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
