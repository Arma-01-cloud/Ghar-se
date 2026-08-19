import React from 'react';
import { Truck, ShieldCheck, CreditCard, RotateCcw } from 'lucide-react';

export default function TrustFeatures() {
  const features = [
    {
      icon: Truck,
      title: 'Local Delivery',
      subtitle: 'Fresh groceries delivered from neighborhood stores',
      color: 'bg-emerald-100 text-emerald-800'
    },
    {
      icon: ShieldCheck,
      title: 'Trusted Quality',
      subtitle: '100% farm-fresh quality guaranteed',
      color: 'bg-amber-100 text-amber-800'
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      subtitle: 'Encrypted UPI, Cards & Cash on Delivery',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      icon: RotateCcw,
      title: 'Easy Returns',
      subtitle: 'No questions asked door-step return',
      color: 'bg-rose-100 text-rose-800'
    }
  ];

  return (
    <section className="py-8 bg-white border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-stone-50 border border-stone-200/70 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-2xl ${feat.color} flex items-center justify-center shrink-0 shadow-xs`}>
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-stone-900 leading-snug">{feat.title}</h4>
                  <p className="text-xs text-stone-500 font-medium leading-tight mt-0.5">{feat.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}