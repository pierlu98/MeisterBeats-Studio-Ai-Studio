/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

interface PurchaseButtonProps {
  beatId: string;
}

export default function PurchaseButton({ beatId }: PurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/purchases/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beatId }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url; // Redirect to Stripe Checkout
      } else {
        console.error('Failed to create checkout session');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 p-8 bg-black/20 rounded-xl border border-white/10">
        <h3 className="text-md font-semibold text-gray-300 mb-4">Purchase a Beat</h3>
        <p className="text-sm text-gray-400 mb-4">Your current discount will be applied automatically at checkout.</p>
        <button
            onClick={handleClick}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
        >
            {isLoading ? 'Redirecting...' : 'Purchase Beat ($10.00)'}
        </button>
    </div>
  );
}
