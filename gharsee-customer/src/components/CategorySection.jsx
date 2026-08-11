import React from 'react';
import { CATEGORIES } from '../data/products';
import { ChevronRight } from 'lucide-react';

export default function CategorySection({ selectedCategory, onSelectCategory, onViewAll }) {
  return (
    <section className="py-12 bg-[#FBF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SECTION HEADER */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">CURATED SELECTION</span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
              Shop by Category
            </h2>
          </div>
          
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-900 transition-colors group"
          >
            <span>View All Products</span>
            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* CATEGORY GRID / HORIZONTAL CAROUSEL */}
        <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex flex-col items-center gap-3 min-w-[110px] sm:min-w-[130px] p-3 rounded-2xl transition-all duration-200 snap-start shrink-0 group ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-950/20 ring-2 ring-emerald-600 scale-105'
                    : 'bg-white text-stone-800 border border-stone-200/80 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                {/* Category Image / Circle */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-stone-100 p-1 border-2 border-stone-200/60 group-hover:border-emerald-400 transition-colors">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover rounded-full transform group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl">
                      🛒
                    </div>
                  )}
                  {cat.badge && (
                    <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-xs">
                      {cat.badge}
                    </span>
                  )}
                </div>

                {/* Category Label */}
                <span className={`text-xs font-bold text-center leading-snug line-clamp-2 ${
                  isSelected ? 'text-white' : 'text-stone-800 group-hover:text-emerald-800'
                }`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
