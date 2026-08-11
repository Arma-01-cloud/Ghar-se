import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { X, Star, Plus, Minus, ShoppingBag, Truck, ShieldCheck, Heart } from 'lucide-react';

export default function ProductDetailModal({ product, onClose }) {
  const { addToCart, setActiveTab, wishlist, toggleWishlist } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isWishlisted = wishlist.includes(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
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
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT: IMAGE & BADGES */}
        <div className="md:w-1/2 bg-stone-50 p-6 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-stone-200">
          {product.discount > 0 && (
            <span className="absolute top-4 left-4 bg-emerald-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-xl">
              {product.discount}% DISCOUNT
            </span>
          )}

          <img
            src={product.image}
            alt={product.name}
            className="w-full max-h-64 sm:max-h-72 object-cover rounded-2xl shadow-sm"
          />

          <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-stone-500">
            <span className="flex items-center gap-1"><Truck className="w-4 h-4 text-emerald-600" /> 15-Min Express</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Organic</span>
          </div>
        </div>

        {/* RIGHT: DETAILS & ACTIONS */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                {product.brand}
              </span>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-2 rounded-full ${isWishlisted ? 'text-rose-500 bg-rose-50' : 'text-stone-400 hover:bg-stone-100'}`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
              </button>
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-stone-900 leading-tight">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <div className="flex items-center gap-1 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{product.rating}</span>
              </div>
              <span className="text-stone-400">({product.reviews} verified reviews)</span>
            </div>

            {/* Price & Unit */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-950">
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-stone-400 line-through font-bold">
                  ₹{product.originalPrice}
                </span>
              )}
              <span className="text-xs font-bold text-stone-500">/ {product.unit}</span>
            </div>

            {/* Description */}
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed border-t border-stone-100 pt-3">
              {product.description}
            </p>

            {/* Stock status */}
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              In Stock ({product.stock} units available at nearest darkstore)
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
                  className="w-8 h-8 flex items-center justify-center hover:bg-stone-200 rounded-lg font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-extrabold text-sm text-stone-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-stone-200 rounded-lg font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>ADD TO CART</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-colors"
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
