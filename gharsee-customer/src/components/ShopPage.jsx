import React, { useState, useMemo } from 'react';
import { PRODUCTS, CATEGORIES } from '../data/products';
import ProductGrid from './ProductGrid';
import { Search, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';

export default function ShopPage({ searchQuery, onSearchQuery, selectedCategory, onSelectCategory, onQuickView }) {
  const [priceRange, setPriceRange] = useState(1000);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('popular'); // popular, price-low, price-high, rating
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(product => {
      // Search match
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCat = product.category.toLowerCase().includes(query);
        const matchesBrand = product.brand.toLowerCase().includes(query);
        if (!matchesName && !matchesCat && !matchesBrand) return false;
      }

      // Category filter
      if (selectedCategory && selectedCategory !== 'all') {
        if (product.category !== selectedCategory) return false;
      }

      // Price filter
      if (product.price > priceRange) return false;

      // Rating filter
      if (product.rating < minRating) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.reviews - a.reviews; // popular default
    });
  }, [searchQuery, selectedCategory, priceRange, minRating, sortBy]);

  const clearFilters = () => {
    onSearchQuery('');
    onSelectCategory('all');
    setPriceRange(1000);
    setMinRating(0);
    setSortBy('popular');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* PAGE TITLE & SEARCH TOP BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-stone-900 tracking-tight">
            Explore All Groceries
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Showing <strong className="text-emerald-800">{filteredProducts.length}</strong> fresh products ready for express delivery
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* SEARCH INPUT */}
          <div className="relative flex-1 md:w-80">
            <input
              type="text"
              placeholder="Search products, brands..."
              value={searchQuery || ''}
              onChange={(e) => onSearchQuery(e.target.value)}
              className="w-full bg-white text-stone-900 text-sm pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          </div>

          {/* MOBILE FILTER TOGGLE */}
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="md:hidden p-2.5 bg-emerald-800 text-white rounded-2xl flex items-center gap-1.5 text-xs font-bold"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* SIDEBAR FILTERS (DESKTOP + MOBILE DRAWER) */}
        <aside className={`lg:col-span-3 space-y-6 ${isMobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-xs">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="font-display font-extrabold text-stone-900 text-base">Filter Groceries</span>
              <button onClick={clearFilters} className="text-xs font-bold text-emerald-700 hover:underline">
                Reset All
              </button>
            </div>

            {/* SORT BY */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-stone-500 block">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:border-emerald-600"
              >
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* CATEGORY FILTERS */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-stone-500 block">Categories</label>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                        isSelected
                          ? 'bg-emerald-800 text-white'
                          : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-300" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PRICE RANGE FILTER */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="uppercase tracking-wider text-stone-500">Max Price</span>
                <span className="text-emerald-950 font-black">₹{priceRange}</span>
              </div>
              <input
                type="range"
                min="30"
                max="1000"
                step="20"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-emerald-700 cursor-pointer"
              />
            </div>

            {/* RATING FILTER */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="text-xs font-extrabold uppercase tracking-wider text-stone-500 block">Minimum Rating</label>
              <div className="flex gap-2">
                {[0, 4.0, 4.5, 4.8].map(r => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold border transition-all ${
                      minRating === r
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {r === 0 ? 'All' : `${r}★+`}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* MAIN CATALOG GRID */}
        <main className="lg:col-span-9">
          <ProductGrid
            products={filteredProducts}
            onQuickView={onQuickView}
          />
        </main>

      </div>
    </div>
  );
}
