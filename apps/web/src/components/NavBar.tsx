'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';

export default function NavBar() {
  const { isConnected, address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show content before client-side rendering
  if (!mounted) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold text-gray-900">
          Note3
        </div>
        
        <div className="flex items-center space-x-4">
          {isConnected && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Connected:</span>
              <span className="ml-2 font-mono text-xs">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          )}
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
