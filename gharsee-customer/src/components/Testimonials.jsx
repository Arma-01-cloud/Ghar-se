import React from 'react';
import { Star, Quote } from 'lucide-react';

export default function Testimonials() {
  const reviews = [
    {
      name: 'Ananya Deshmukh',
      location: 'Indiranagar, Bengaluru',
      rating: 5,
      comment: 'The Handwritten List Upload feature is a complete lifesaver! I snapped a picture of my mom’s grocery note and it converted all 8 items into my cart in seconds. Delivered in 18 minutes!'
    },
    {
      name: 'Vikram Mehta',
      location: 'Koramangala, Bengaluru',
      rating: 5,
      comment: 'The quality of royal Gala apples and fresh spinach is superior to supermarket chains. Vegetables arrive crisp, fresh, and clean. GharSee Fresh is now my go-to weekly app.'
    },
    {
      name: 'Pooja Iyer',
      location: 'Whitefield, Bengaluru',
      rating: 5,
      comment: 'Super fast delivery and incredible customer service! Love the clean layout and transparent prices on staples like Basmati rice and Aashirvaad Atta.'
    }
  ];

  return (
    <section className="py-16 bg-white border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">VERIFIED FEEDBACK</span>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-stone-900">
            Loved by 10,000+ Families
          </h2>
          <p className="text-stone-500 text-sm">See what real households say about their express grocery delivery experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="bg-stone-50 p-6 rounded-3xl border border-stone-200/80 space-y-4 relative flex flex-col justify-between"
            >
              <Quote className="w-8 h-8 text-emerald-200 absolute top-4 right-4" />

              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-stone-700 text-xs sm:text-sm leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-stone-200">
                <h4 className="font-display font-extrabold text-sm text-stone-900">{rev.name}</h4>
                <span className="text-[11px] text-stone-400 font-semibold">{rev.location}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
