'use client';

import type { Metadata } from 'next';

import PixelPetSprite from '@/components/pet/PixelPetSprite';

const CASES: Array<{ species: string; outfit: string }> = [
  { species: 'cinnamoroll', outfit: 'business_suit' },
  { species: 'cinnamoroll', outfit: 'detective_trenchcoat' },
  { species: 'cinnamoroll', outfit: 'cozy_scarf' },
  { species: 'cinnamoroll', outfit: 'doraemon_pocket' },
  { species: 'owl', outfit: 'business_suit' },
  { species: 'owl', outfit: 'detective_trenchcoat' },
  { species: 'owl', outfit: 'cozy_scarf' },
  { species: 'hedwig', outfit: 'business_suit' },
  { species: 'hedwig', outfit: 'detective_trenchcoat' },
  { species: 'kirby', outfit: 'business_suit' },
  { species: 'kirby', outfit: 'detective_trenchcoat' },
  { species: 'kirby', outfit: 'doraemon_pocket' },
  { species: 'fawkes', outfit: 'business_suit' },
  { species: 'fawkes', outfit: 'detective_trenchcoat' },
  { species: 'kuromi', outfit: 'business_suit' },
  { species: 'kuromi', outfit: 'detective_trenchcoat' },
];

/**
 * TEMPORARY visual verification harness for non-standard torso fits.
 * DELETE before finishing.
 */
export const metadata: Metadata = {
  title: 'Fit Check - Meowlish',
  description: 'Trang kiểm tra thời trang thú cưng nội bộ.',
  robots: { index: false, follow: false },
};

export default function FitCheckPage() {
  return (
    <div className="min-h-screen bg-slate-200 p-3">
      <style>{`*{animation:none !important;transition:none !important}`}</style>
      <h1 className="text-lg font-black mb-2">OUTFIT FIT MATRIX</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CASES.map(({ species, outfit }) => (
          <div
            key={`${species}-${outfit}`}
            data-fit-case={`${species}-${outfit}`}
            className="bg-white rounded-lg p-1 border border-slate-300"
          >
            <div className="text-[12px] leading-tight font-bold text-center text-slate-700 break-words hyphens-auto">
              {species} + {outfit}
            </div>
            <div className="flex justify-center items-end">
              <PixelPetSprite
                species={species}
                scale={0.98}
                animationState="idle"
                equippedOutfit={outfit}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
