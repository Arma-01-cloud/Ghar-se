import React from 'react';
import ProductCard from './ProductCard';
import { PackageSearch } from 'lucide-react';

export default function ProductGrid({ products, title, subtitle, onQuickView }) {
  if (!products || products.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 max-w-lg mx-auto my-8">
        <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <PackageSearch className="w-8 h-8" />
        </div>
        <h3 className="font-display text-xl font-bold text-stone-800">No groceries found</h3>
        <p className="text-stone-500 text-sm mt-1">
          We couldn't find any products matching your search criteria. Try clearing your filters.
        </p>
      </div>
    );
  }

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-stone-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
        ))}
      </div>
    </section>
  );
}
