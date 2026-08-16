import React, { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { X, Star, Plus, Minus, ShoppingBag, Truck, ShieldCheck, Heart } from 'lucide-react';
import { getUnitVariants, getProductWithVariant } from '../utils/unitVariants';

export default function ProductDetailModal({ product, onClose }) {
  const { addToCart, setActiveTab, wishlist, toggleWishlist } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Compute unit variants for this product
  const variants = useMemo(() => getUnitVariants(product), [product]);
  const defaultVariant = useMemo(() => variants.find(v => v.isBase) || variants[0] || null, [variants]);
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);

  const activeProduct = useMemo(() => {
    return getProductWithVariant(product, selectedVariant || defaultVariant);
  }, [product, selectedVariant, defaultVariant]);

  if (!product) return null;

  const isWishlisted = wishlist.includes(product.id);

  const handleAddToCart = () => {
    addToCart(activeProduct, quantity);
    onClose();
  };

  const handleBuyNow = () => {
    addToCart(activeProduct, quantity);
    onClose();
    setActiveTab('cart');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 max-h-[90vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT: IMAGE & BADGES */}
        <div className="md:w-1/2 bg-stone-50 p-6 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-stone-200">
          {activeProduct.discount > 0 && (
            <span className="absolute top-4 left-4 bg-emerald-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-xl">
              {activeProduct.discount}% DISCOUNT
            </span>
          )}

          <img
            src={activeProduct.image || activeProduct.imageUrl || activeProduct.image_url || '/images/cat_veg_fruits.jpg'}
            alt={activeProduct.name}
            className="w-full max-h-64 sm:max-h-72 object-cover rounded-2xl shadow-sm"
            onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }}
          />

          <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-stone-500">
            <span className="flex items-center gap-1"><Truck className="w-4 h-4 text-emerald-600" /> Delivery after 4:00 PM</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Quality Checked</span>
          </div>
        </div>

        {/* RIGHT: DETAILS & ACTIONS */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                {activeProduct.brand || 'Fresh Produce'}
              </span>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-2 rounded-full cursor-pointer ${isWishlisted ? 'text-rose-500 bg-rose-50' : 'text-stone-400 hover:bg-stone-100'}`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
              </button>
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-stone-900 leading-tight">
              {activeProduct.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <div className="flex items-center gap-1 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{activeProduct.rating || 4.8}</span>
              </div>
              <span className="text-stone-400">({activeProduct.reviews || 38} verified reviews)</span>
            </div>

            {/* UNIT / WEIGHT SELECTION CHIPS (GRAMS, KG, ML, LITER) */}
            {variants.length > 1 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                  Select Pack Size / Weight:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {variants.map(v => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-800 text-white shadow-xs ring-2 ring-emerald-950 scale-102'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200'
                        }`}
                      >
                        {v.label} (₹{v.price})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price & Unit */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-950">
                ₹{activeProduct.price}
              </span>
              {activeProduct.originalPrice && activeProduct.originalPrice > activeProduct.price && (
                <span className="text-sm text-stone-400 line-through font-bold">
                  ₹{activeProduct.originalPrice}
                </span>
              )}
              <span className="text-xs font-bold text-stone-500">/ {activeProduct.unit}</span>
            </div>

            {/* Description */}
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed border-t border-stone-100 pt-3">
              {activeProduct.description || 'Fresh groceries directly sourced from local darkstores and verified stores.'}
            </p>

            {/* Stock status */}
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              In Stock ({activeProduct.stock || 50} units available at nearest darkstore)
            </div>
          </div>

          {/* ACTIONS */}
          <div className="pt-6 space-y-3 border-t border-stone-100 mt-4">
            
            {/* Quantity Controls */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Select Quantity:</span>
              <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50 p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center hover:bg-stone-200 rounded-lg font-bold cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-extrabold text-sm text-stone-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-stone-200 rounded-lg font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>ADD TO CART</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-colors cursor-pointer"
              >
                <span>BUY NOW</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
