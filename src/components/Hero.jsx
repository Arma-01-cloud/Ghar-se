import React from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingBag, ShieldCheck, Zap, Sparkles, ArrowRight, Store, CheckCircle2, PhoneCall } from 'lucide-react';

export default function Hero() {
  const { setActiveTab } = useCart();

  return (
    <div className="space-y-12 pb-6">
      {/* HERO HERO STRIP */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0E382B] via-[#134E3A] to-[#0A2E23] text-white py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        
        {/* Background Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-mint-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-xs">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Fresh groceries. Delivered after 4:00 PM.</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              YOUR DAILY GROCERIES,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-mint-100 to-white">
                DELIVERED FRESH.
              </span>
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base lg:text-lg max-w-2xl font-normal leading-relaxed mx-auto lg:mx-0">
              Order fresh essentials directly from a specific local store or shop from any store in your area with express local fulfillment.
            </p>

            {/* CALL TO ORDER ACTION BUTTONS */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <a
                href="tel:8123821300"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/25 transition-all group"
              >
                <div className="w-7 h-7 rounded-xl bg-stone-950/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <PhoneCall className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                </div>
                <span>Call to Order</span>
              </a>

              <button
                onClick={() => setActiveTab('stores')}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm border border-emerald-600/60 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Store className="w-4 h-4 text-emerald-300" />
                <span>Browse Stores</span>
              </button>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-emerald-800/60 max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-sm">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Delivery after 4:00 PM</span>
                </div>
                <span className="text-[11px] text-emerald-200/70">Evening doorstep delivery</span>
              </div>

              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Fresh</span>
                </div>
                <span className="text-[11px] text-emerald-200/70">Direct from local darkstores</span>
              </div>

              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Direct Photo Order</span>
                </div>
                <span className="text-[11px] text-emerald-200/70">Photo to Store</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-600/30 bg-emerald-950/40">
                <img
                  src="/images/hero_grocery.jpg"
                  alt="Fresh Grocery Composition"
                  className="w-full h-72 sm:h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-emerald-950/80 backdrop-blur-md border border-emerald-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm">
                      🥦
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Daily Farm Harvest</h4>
                      <p className="text-[11px] text-emerald-200/80">30+ Fresh Items In Stock</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-extrabold text-xs">₹49 Free Ship</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* PROMINENT SHOPPING MODE SELECTION SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-md space-y-6">
          
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700">SHOPPING EXPERIENCE</span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-stone-900">
              How would you like to shop today?
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm font-medium">
              Choose between browsing a specific local store, finding products from any store, or calling us directly to order.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* CARD 1: CHOOSE A SPECIFIC STORE */}
            <div 
              onClick={() => setActiveTab('stores')}
              className="bg-stone-50 hover:bg-emerald-50/50 rounded-3xl p-6 sm:p-8 border-2 border-stone-200 hover:border-emerald-600 transition-all duration-300 cursor-pointer shadow-xs hover:shadow-xl group flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-stone-200 text-stone-800 group-hover:bg-emerald-700 group-hover:text-white flex items-center justify-center font-bold shadow-md transition-colors">
                  <Store className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl sm:text-2xl text-stone-900 group-hover:text-emerald-950">
                    Choose a Specific Store
                  </h3>
                  <p className="text-stone-600 text-xs sm:text-sm mt-1.5 leading-relaxed font-medium">
                    Browse products and live inventory from a local store near you. Order directly from your trusted neighborhood store.
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('stores');
                }}
                className="w-full py-4 px-6 bg-stone-900 group-hover:bg-emerald-800 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Browse Stores</span>
                <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* CARD 2: SHOP FROM ANY STORE */}
            <div 
              onClick={() => setActiveTab('any-store')}
              className="bg-emerald-950 hover:bg-emerald-900 text-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-700/80 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl group flex flex-col justify-between space-y-6 relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-md">
                    <ShoppingBag className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="bg-emerald-500 text-emerald-950 font-black text-[10px] uppercase px-3 py-1 rounded-full tracking-wider shadow-xs">
                    CUSTOM REQUEST
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-black text-xl sm:text-2xl text-white">
                    Shop From Any Store
                  </h3>
                  <p className="text-emerald-100/90 text-xs sm:text-sm mt-1.5 leading-relaxed font-medium">
                    Tell us what you need and we'll find it from a suitable store in your area. Add any grocery items to your cart.
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('any-store');
                }}
                className="w-full py-4 px-6 bg-emerald-500 group-hover:bg-emerald-400 text-emerald-950 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* CARD 3: CALL TO ORDER */}
            <a 
              href="tel:8123821300"
              className="bg-amber-50 hover:bg-amber-100/70 rounded-3xl p-6 sm:p-8 border-2 border-amber-200 hover:border-amber-400 transition-all duration-300 cursor-pointer shadow-xs hover:shadow-xl group flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400 text-stone-950 group-hover:bg-amber-500 flex items-center justify-center font-bold shadow-md transition-colors">
                    <PhoneCall className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="bg-amber-200 text-amber-950 font-black text-[10px] uppercase px-3 py-1 rounded-full tracking-wider shadow-xs">
                    INSTANT CALL
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-black text-xl sm:text-2xl text-stone-900 group-hover:text-amber-950">
                    Call to Order
                  </h3>
                  <p className="text-stone-600 text-xs sm:text-sm mt-1.5 leading-relaxed font-medium">
                    Prefer ordering over the phone? Tap here to place your grocery order directly with our support executive.
                  </p>
                </div>
              </div>

              <div
                className="w-full py-4 px-6 bg-amber-400 group-hover:bg-amber-500 text-stone-950 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <PhoneCall className="w-4 h-4 stroke-[2.5]" />
                <span>Call to Order</span>
                <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

          </div>
        </div>
      </section>

    </div>
  );
}