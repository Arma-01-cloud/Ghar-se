import React, { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { Star, Plus, Minus, ShoppingBag, Heart, Eye, AlertCircle } from 'lucide-react';
import { getUnitVariants, getProductWithVariant } from '../utils/unitVariants';

export default function ProductCard({ product, onQuickView }) {
  const { cart, addToCart, updateQuantity, wishlist, toggleWishlist } = useCart();
  const [qty, setQty] = useState(1);

  // Compute available weight/volume/unit variants for this product
  const variants = useMemo(() => getUnitVariants(product), [product]);
  const defaultVariant = useMemo(() => variants.find(v => v.isBase) || variants[0] || null, [variants]);
  
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);

  // Derive current active product configured with the selected variant
  const activeProduct = useMemo(() => {
    return getProductWithVariant(product, selectedVariant || defaultVariant);
  }, [product, selectedVariant, defaultVariant]);

  // Determine availability status
  const isAvailable = activeProduct.isAvailable !== false && 
                      activeProduct.is_available !== false && 
                      activeProduct.status !== 'Unavailable' && 
                      activeProduct.status !== 'Out of Stock';

  // Check if this specific variant is already in cart
  const cartItem = cart.find(item => item.product.id === activeProduct.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const isWishlisted = wishlist.includes(product.id);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!isAvailable) return;
    addToCart(activeProduct, qty);
  };

  const handleInc = (e) => {
    e.stopPropagation();
    if (!isAvailable) return;
    updateQuantity(activeProduct.id, inCartQty + 1);
  };

  const handleDec = (e) => {
    e.stopPropagation();
    updateQuantity(activeProduct.id, inCartQty - 1);
  };

  const handleVariantChange = (e, variant) => {
    e.stopPropagation();
    setSelectedVariant(variant);
  };

  const discountPercent = activeProduct.originalPrice && activeProduct.originalPrice > activeProduct.price
    ? Math.round(((activeProduct.originalPrice - activeProduct.price) / activeProduct.originalPrice) * 100)
    : (product.discount || 0);

  return (
    <div 
      onClick={() => onQuickView && onQuickView(activeProduct)}
      className={`group relative bg-white rounded-2xl border p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden ${
        isAvailable 
          ? 'border-stone-200/80 hover:shadow-xl hover:border-emerald-300' 
          : 'border-stone-200 bg-stone-50/50 opacity-90'
      }`}
    >
      
      {/* DISCOUNT BADGE & WISHLIST BUTTON */}
      <div className="flex items-center justify-between z-10">
        {discountPercent > 0 && isAvailable ? (
          <span className="bg-emerald-700 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg shadow-xs">
            {discountPercent}% OFF
          </span>
        ) : !isAvailable ? (
          <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1">
            <span>Unavailable</span>
          </span>
        ) : (
          <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-lg">
            {activeProduct.unit}
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
          src={activeProduct.image || activeProduct.imageUrl || activeProduct.image_url || '/images/cat_veg_fruits.jpg'}
          alt={activeProduct.name}
          className={`w-full h-full object-cover transform group-hover:scale-108 transition-transform duration-500 ${
            !isAvailable ? 'opacity-60 grayscale-[40%]' : ''
          }`}
          onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }}
        />

        {/* Unavailable Overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
            <span className="bg-white/95 text-rose-800 text-[11px] font-black px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick View Hover Overlay */}
        {isAvailable && (
          <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-white/90 backdrop-blur-xs text-emerald-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
              <Eye className="w-3.5 h-3.5" /> Quick View
            </span>
          </div>
        )}
      </div>

      {/* PRODUCT DETAILS */}
      <div className="space-y-1.5">
        
        {/* Brand & Base Category */}
        <div className="flex items-center justify-between text-[11px] text-stone-500 font-semibold">
          <span>{activeProduct.brand || 'Fresh Produce'}</span>
          <span className="text-emerald-700 font-bold text-[10px] uppercase bg-emerald-50 px-1.5 py-0.2 rounded">
            {activeProduct.category || 'Grocery'}
          </span>
        </div>

        {/* Product Title */}
        <h3 className="font-display text-xs sm:text-sm font-extrabold text-stone-900 line-clamp-2 group-hover:text-emerald-800 transition-colors">
          {activeProduct.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-1.5 py-0.2 rounded-md">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{activeProduct.rating || 4.8}</span>
          </div>
          <span className="text-[11px] text-stone-400 font-medium">({activeProduct.reviews || 38})</span>
        </div>

        {/* UNIT / WEIGHT SELECTOR CHIPS */}
        {variants.length > 1 && (
          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {variants.map(v => {
                const isSelected = selectedVariant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={(e) => handleVariantChange(e, v)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow-2xs scale-102 ring-1 ring-emerald-900'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing for selected variant */}
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-base sm:text-lg font-black text-stone-900">
            ₹{activeProduct.price}
          </span>
          {activeProduct.originalPrice && activeProduct.originalPrice > activeProduct.price && (
            <span className="text-xs text-stone-400 line-through font-medium">
              ₹{activeProduct.originalPrice}
            </span>
          )}
          <span className="text-[11px] text-stone-400 font-semibold">
            / {activeProduct.unit}
          </span>
        </div>
      </div>

      {/* QUANTITY SELECTOR & ADD TO CART BUTTON */}
      <div className="pt-2.5 border-t border-stone-100 mt-2">
        {!isAvailable ? (
          <button
            disabled
            onClick={(e) => e.stopPropagation()}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-100 text-stone-400 border border-stone-200 text-xs sm:text-sm font-extrabold rounded-xl cursor-not-allowed uppercase tracking-wider"
          >
            <span>Unavailable</span>
          </button>
        ) : inCartQty > 0 ? (
          <div className="flex items-center justify-between bg-emerald-800 text-white rounded-xl p-1 shadow-md">
            <button
              onClick={handleDec}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-700 transition-colors font-bold cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-xs px-2">{inCartQty} in cart</span>
            <button
              onClick={handleInc}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-700 transition-colors font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="hidden xs:flex items-center border border-stone-200 rounded-xl bg-stone-50 p-0.5 text-stone-700 text-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQty(Math.max(1, qty - 1));
                }}
                className="w-6 h-6 flex items-center justify-center hover:bg-stone-200 rounded-md font-bold cursor-pointer"
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
                className="w-6 h-6 flex items-center justify-center hover:bg-stone-200 rounded-md font-bold cursor-pointer"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAdd}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-sm hover:shadow-emerald-900/20 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>ADD</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}