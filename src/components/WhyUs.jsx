import React from 'react';
import { Store, UploadCloud } from 'lucide-react';

export default function WhyUs() {
  const reasons = [
    {
      icon: Store,
      title: 'Trusted Local Shops',
      desc: 'We deliver your groceries from trusted local shops in your neighborhood, bringing everyday essentials right to your doorstep.'
    },
    {
      icon: UploadCloud,
      title: 'Upload Your Grocery List',
      desc: 'Simply upload a photo of your grocery list, and we’ll send it to your selected local shop for easy order processing.'
    }
  ];

  return (
    <section className="py-16 bg-[#FBF9F5] border-t border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">OUR COMMITMENT</span>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-stone-900">
            Why Choose UR GROZY?
          </h2>
          <p className="text-stone-500 text-sm">
            Experience the gold standard in fresh local grocery commerce & convenient list conversion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {reasons.map((r, idx) => {
            const Icon = r.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 space-y-3 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="font-display font-extrabold text-lg sm:text-xl text-stone-900">{r.title}</h3>
                <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">{r.desc}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}