import React from 'react';
import { Leaf, Clock, ScanLine, HeartHandshake } from 'lucide-react';

export default function WhyUs() {
  const reasons = [
    {
      icon: Leaf,
      title: 'Direct Farm Harvest',
      desc: 'We source fruits, veggies, and dairy directly from local verified farmers every single morning at 4:00 AM.'
    },
    {
      icon: Clock,
      title: '15-Minute Darkstores',
      desc: 'Micro-warehouses located within 2 km of your neighborhood ensure hyper-fast 15-minute door delivery.'
    },
    {
      icon: ScanLine,
      title: 'AI Photo List Converter',
      desc: 'Simply snap your handwritten shopping list or paper note to automatically build an editable cart.'
    },
    {
      icon: HeartHandshake,
      title: 'Zero Plastics & Fair Pricing',
      desc: 'Delivered in 100% biodegradable cloth bags with zero plastic wraps and honest transparent pricing.'
    }
  ];

  return (
    <section className="py-16 bg-[#FBF9F5] border-t border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">OUR COMMITMENT</span>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-stone-900">
            Why Choose GharSee Fresh?
          </h2>
          <p className="text-stone-500 text-sm">
            Experience the gold standard in fresh local grocery commerce & convenient list conversion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((r, idx) => {
            const Icon = r.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-3xl border border-stone-200/80 space-y-3 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="font-display font-extrabold text-lg text-stone-900">{r.title}</h3>
                <p className="text-stone-500 text-xs leading-relaxed">{r.desc}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
