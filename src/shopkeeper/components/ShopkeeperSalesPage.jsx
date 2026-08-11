import React from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { TrendingUp, DollarSign, ShoppingBag, Award, ArrowUpRight } from 'lucide-react';

export default function ShopkeeperSalesPage() {
  const { totalSales, todayOrders, avgOrderValue, products } = useShopkeeper();

  const topSelling = products.slice(0, 4);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      <div className="border-b border-stone-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>FINANCIAL PERFORMANCE</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold text-stone-900 tracking-tight">
          Sales & Revenue Analytics
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Track store revenue, average order value, and top-performing products
        </p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#0E382B] to-[#134E3A] text-white p-6 rounded-3xl shadow-md space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 block">Total Revenue Today</span>
          <p className="font-display font-black text-3xl text-white">₹{totalSales}</p>
          <span className="text-xs text-emerald-200/80 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" /> +14.2% vs yesterday
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-stone-400 block">Completed Orders</span>
          <p className="font-display font-black text-3xl text-stone-900">{todayOrders}</p>
          <span className="text-xs text-stone-500 font-semibold">100% local express fulfillment</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-stone-400 block">Average Order Value</span>
          <p className="font-display font-black text-3xl text-emerald-950">₹{avgOrderValue}</p>
          <span className="text-xs text-stone-500 font-semibold">Optimal basket size</span>
        </div>
      </div>

      {/* TOP SELLING PRODUCTS */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="font-display font-extrabold text-lg text-stone-900">Top Selling Products</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topSelling.map((prod, i) => (
            <div key={prod.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                #{i + 1}
              </span>
              <div className="truncate">
                <h5 className="font-extrabold text-xs text-stone-900 truncate">{prod.name}</h5>
                <p className="text-[11px] font-bold text-emerald-700">₹{prod.price} / {prod.unit}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
