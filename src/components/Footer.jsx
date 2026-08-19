import React from 'react';
import { useCart } from '../context/CartContext';
import { Leaf, Send, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const { setActiveTab } = useCart();

  const phoneNumbers = [
    '+91 81238 21300',
    '+91 77600 32354',
    '+91 91080 22641',
    '+91 86601 20584'
  ];

  return (
    <footer className="bg-[#08241B] text-stone-300 pt-16 pb-20 md:pb-12 border-t border-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* TOP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* BRAND COLUMN */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center cursor-pointer" onClick={() => setActiveTab('home')}>
              <img 
                src="/ur-grozy-logo.png" 
                alt="UR GROZY" 
                className="h-10 sm:h-12 w-auto object-contain hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/logo.png';
                }}
              />
            </div>

            <p className="text-emerald-100/70 text-xs sm:text-sm max-w-sm leading-relaxed">
              Your daily local grocery commerce platform. Shop farm-fresh fruits, vegetables, and pantry staples or upload your handwritten grocery shopping list to convert it into a live cart in seconds.
            </p>

            <div className="space-y-2.5 text-xs text-emerald-200/90 pt-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-bold">Chikkamagaluru, Karnataka, India</span>
              </div>
              
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <Phone className="w-3.5 h-3.5" /> 24x7 Customer Support Hotline
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {phoneNumbers.map((num, idx) => (
                    <a
                      key={idx}
                      href={`tel:${num.replace(/\s+/g, '')}`}
                      className="bg-emerald-950/60 border border-emerald-800/80 hover:border-emerald-500 hover:bg-emerald-900 text-white font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 w-fit"
                    >
                      <span className="text-emerald-400">📞</span> {num}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div className="space-y-3">
            <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActiveTab('home')} className="hover:text-emerald-400 transition-colors">Home Page</button></li>
              <li><button onClick={() => setActiveTab('stores')} className="hover:text-emerald-400 transition-colors">Browse Local Stores</button></li>
              <li><button onClick={() => setActiveTab('upload')} className="hover:text-emerald-400 transition-colors">Upload Grocery Image</button></li>
              <li><button onClick={() => setActiveTab('orders')} className="hover:text-emerald-400 transition-colors">Order Tracking</button></li>
              <li><button onClick={() => setActiveTab('cart')} className="hover:text-emerald-400 transition-colors">View Cart</button></li>
            </ul>
          </div>

          {/* TOP CATEGORIES */}
          <div className="space-y-3">
            <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-wider">Fresh Categories</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>Fruits & Fresh Vegetables</li>
              <li>Farm Fresh Milk & Eggs</li>
              <li>Basmati Rice & Wheat Atta</li>
              <li>Cold Pressed Cooking Oils</li>
              <li>Snacks, Bakery & Beverages</li>
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div className="space-y-3">
            <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-wider">Stay Fresh</h4>
            <p className="text-xs text-emerald-100/70">
              Subscribe to get weekly fresh farm stock updates and ₹100 discount coupons.
            </p>
            <div className="space-y-2">
              <div className="flex bg-emerald-950/80 border border-emerald-800 rounded-xl p-1">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="w-full bg-transparent px-3 py-1.5 text-xs text-white placeholder-emerald-300/40 focus:outline-none"
                />
                <button className="bg-emerald-500 text-emerald-950 p-2 rounded-lg font-bold hover:bg-emerald-400 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[10px] text-emerald-300/60 block">We respect your privacy. Unsubscribe anytime.</span>
            </div>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="pt-8 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>© {new Date().getFullYear()} UR GROZY Technologies Pvt Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4 text-stone-400 text-xs">
            <span>UPI</span>
            <span>GPay</span>
            <span>Visa</span>
            <span>MasterCard</span>
            <span>Cash on Delivery</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
