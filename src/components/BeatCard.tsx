/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShoppingCart, ArrowUpRight } from 'lucide-react';

interface BeatCardProps {
  beatTitle: string;
  producerName: string;
  youtubeId: string;
  beatstarsUrl: string;
  basePrice: number; // Price in cents
  discountPercentage?: number;
  isLifetimeDiscount?: boolean;
  onPurchase: (beatId: string) => void;
  collabUrl: string;
  beatId: string;
}

export default function BeatCard({
  beatTitle,
  producerName,
  youtubeId,
  beatstarsUrl,
  basePrice,
  discountPercentage = 0,
  isLifetimeDiscount = false,
  onPurchase,
  collabUrl,
  beatId,
}: BeatCardProps) {

  const finalPrice = basePrice * (1 - (discountPercentage / 100));

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        <div className="lg:col-span-3">
          <div className="aspect-w-16 aspect-h-9 bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={`YouTube video player for ${beatTitle}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
        <div className="lg:col-span-2 p-6 flex flex-col justify-between bg-black/20">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">{beatTitle}</h2>
            <p className="text-sm text-neutral-400 mt-1">by {producerName}</p>
            <div className="mt-4 w-full h-24">
                <iframe 
                    src={beatstarsUrl} 
                    className='w-full h-full'
                    seamless
                ></iframe>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-bold text-white">{formatPrice(finalPrice)}</p>
              {discountPercentage > 0 && (
                <p className="text-lg text-neutral-500 line-through">{formatPrice(basePrice)}</p>
              )}
            </div>
            {discountPercentage > 0 && (
              <div className="mt-2 inline-flex items-center gap-2 bg-green-500/10 text-green-300 text-xs font-semibold py-1 px-2 rounded-full">
                <span>SAVE {discountPercentage}%</span>
                {isLifetimeDiscount && <span className="w-1 h-1 bg-green-400 rounded-full"></span>}
                {isLifetimeDiscount && <span>LIFETIME</span>}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10">
        <button 
            onClick={() => onPurchase(beatId)}
            className="bg-indigo-600 text-white flex items-center justify-center gap-2 p-4 text-sm font-semibold hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-indigo-500"
        >
            <ShoppingCart size={16} />
            <span>Purchase License</span>
        </button>
        <a 
            href={collabUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-neutral-800/50 text-neutral-300 flex items-center justify-center gap-2 p-4 text-sm font-semibold hover:bg-neutral-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-white/20"
        >
            <span>Request Collaboration</span>
            <ArrowUpRight size={16} />
        </a>
      </div>
    </div>
  );
}
