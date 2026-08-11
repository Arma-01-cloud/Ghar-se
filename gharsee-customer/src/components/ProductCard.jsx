import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Star, Plus, Minus, ShoppingBag, Heart, Eye } from 'lucide-react';

export default function ProductCard({ product, onQuickView }) {
  const { cart, addToCart, updateQuantity, wishlist, toggleWishlist } = useCart();
  const [qty, setQty] = useState(1);

  const cartItem = cart.find(item => item.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const isWishlisted = wishlist.includes(product.id);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product, qty);
  };

  const handleInc = (e) => {
    e.stopPropagation();
    updateQuantity(product.id, inCartQty + 1);
  };

  const handleDec = (e) => {
    e.stopPropagation();
    updateQuantity(product.id, inCartQty - 1);
  };

  return (
    <div 
      onClick={() => onQuickView && onQuickView(product)}
      className="group relative bg-white rounded-2xl border border-stone-200/80 p-3.5 sm:p-4 flex flex-col justify-between hover:shadow-xl hover:border-emerald-300 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      
      {/* DISCOUNT BADGE & WISHLIST BUTTON */}
      <div className="flex items-center justify-between z-10">
        {product.discount > 0 ? (
          <span className="bg-emerald-600 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg shadow-xs">
            {product.discount}% OFF
          </span>
        ) : (
          <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-lg">
            {product.unit}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`p-1.5 rounded-full transition-colors ${
            isWishlisted ? 'text-rose-500 bg-rose-50' : 'text-stone-400 hover:text-rose-500 hover:bg-stone-100'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
        </button>
      </div>

      {/* PRODUCT IMAGE CONTAINER */}
      <div className="relative w-full h-36 sm:h-44 my-2 flex items-center justify-center overflow-hidden rounded-xl bg-stone-50 group-hover:bg-emerald-50/20 transition-colors">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transform group-hover:scale-108 transition-transform duration-500"
        />

        {/* Quick View Hover Overlay */}
        <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/90 backdrop-blur-xs text-emerald-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
            <Eye className="w-3.5 h-3.5" /> Quick View
          </span>
        </div>
      </div>

      {/* PRODUCT DETAILS */}
      <div className="space-y-1.5">
        
        {/* Brand & Unit */}
        <div className="flex items-center justify-between text-[11px] text-stone-500 font-semibold">
          <span>{product.brand}</span>
          <span className="text-stone-400 font-normal">{product.unit}</span>
        </div>

        {/* Product Title */}
        <h3 className="font-display text-xs sm:text-sm font-extrabold text-stone-900 line-clamp-2 group-hover:text-emerald-800 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-1.5 py-0.2 rounded-md">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{product.rating}</span>
          </div>
          <span className="text-[11px] text-stone-400 font-medium">({product.reviews})</span>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-base sm:text-lg font-black text-stone-900">
            ₹{product.price}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-stone-400 line-through font-medium">
              ₹{product.originalPrice}
            </span>
          )}
        </div>
      </div>

      {/* QUANTITY SELECTOR & ADD TO CART BUTTON */}
      <div className="pt-3 border-t border-stone-100 mt-2">
        {inCartQty > 0 ? (
          <div className="flex items-center justify-between bg-emerald-800 text-white rounded-xl p-1 shadow-md">
            <button
              onClick={handleDec}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-700 transition-colors font-bold"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-xs px-2">{inCartQty} in cart</span>
            <button
              onClick={handleInc}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-700 transition-colors font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Local Qty Selector before adding */}
            <div className="hidden xs:flex items-center border border-stone-200 rounded-xl bg-stone-50 p-0.5 text-stone-700 text-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQty(Math.max(1, qty - 1));
                }}
                className="w-6 h-6 flex items-center justify-center hover:bg-stone-200 rounded-md font-bold"
              >
                -
              </button>
              <span className="w-5 text-center font-bold">{qty}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQty(qty + 1);
                }}
                className="w-6 h-6 flex items-center justify-center hover:bg-stone-200 rounded-md font-bold"
              >
                +
              </button>
            </div>

            {/* Add Button */}
            <button
              onClick={handleAdd}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-sm hover:shadow-emerald-900/20"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>ADD TO CART</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
