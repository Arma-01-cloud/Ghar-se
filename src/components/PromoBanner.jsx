import React from 'react';
import { useCart } from '../context/CartContext';
import { Sparkles, ArrowRight, Camera } from 'lucide-react';

export default function PromoBanner() {
  const { setActiveTab } = useCart();

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0E382B] via-[#134E3A] to-[#166534] text-white p-8 sm:p-12 shadow-2xl border border-emerald-700/50">
        
        {/* Background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>THE SMART WAY TO SHOP</span>
            </div>

            <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Got a Handwritten Grocery List?<br />
              <span className="text-emerald-300">Send photo directly to your local store.</span>
            </h2>

            <p className="text-emerald-100/90 text-xs sm:text-sm max-w-xl leading-relaxed">
              No need to search for items individually! Take a photo of your handwritten grocery list or items, and we'll send it directly to your trusted local shopkeeper for instant fulfillment.
            </p>

            <div className="pt-2">
              <button
                onClick={() => setActiveTab('upload')}
                className="py-3.5 px-7 bg-white text-emerald-950 font-extrabold text-sm rounded-2xl shadow-xl hover:bg-emerald-50 transition-all flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>ORDER BY GROCERY PHOTO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl max-w-sm">
              <img
                src="/images/promo_basket.jpg"
                alt="Promotional Fresh Grocery Basket"
                className="w-full h-56 sm:h-64 object-cover transform hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-center">
                <span className="bg-emerald-500 text-emerald-950 text-xs font-black px-3 py-1 rounded-full shadow-md">
                  Get ₹100 Off with Code: FRESH100
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
