'use client';
import React from 'react';
import PixelPetSprite from '@/components/pet/PixelPetSprite';

export default function PetTestPage() {
  const speciesList = [
    'hello_kitty', 'kuromi', 'cinnamoroll', 'my_melody', 'pompompurin', 'keroppi',
    'chopper', 'karoo', 'bepo',
    'doraemon', 'dorami', 'kirby',
    'cat', 'dog', 'fox', 'panda', 'bunny', 'owl',
    'kurama', 'pakkun', 'gamakichi',
    'hedwig', 'crookshanks', 'fawkes',
    'goose', 'rocket', 'alligator_loki'
  ];

  const fashionCombos = [
    {
      title: 'Cinnamoroll Luffy Hacker',
      species: 'cinnamoroll',
      hat: 'luffy_straw_hat',
      outfit: 'dev_hoodie',
      acc: 'smart_glasses',
    },
    {
      title: 'Hello Kitty Matsuri Bell',
      species: 'hello_kitty',
      hat: 'grad_cap',
      outfit: 'festival_kimono',
      acc: 'golden_bell',
    },
    {
      title: 'Kuromi Akatsuki Demon',
      species: 'kuromi',
      hat: 'gamer_headset',
      outfit: 'akatsuki_cloak',
      acc: 'demon_wings',
    },
    {
      title: 'Chopper Gryffindor Wizard',
      species: 'chopper',
      hat: 'sorting_hat',
      outfit: 'gryffindor_robe',
      acc: 'elder_wand',
    },
    {
      title: 'Doraemon Farmer Copter',
      species: 'doraemon',
      hat: 'bamboo_copter',
      outfit: 'farmer_overalls',
      acc: 'doraemon_bell',
    },
    {
      title: 'Dog Super Saiyan Pikachu',
      species: 'dog',
      hat: 'pikachu_cap',
      outfit: 'super_saiyan_gi',
      acc: 'pokeball_pendant',
    },
    {
      title: 'Cat Royal Business Zoro',
      species: 'cat',
      hat: 'royal_crown',
      outfit: 'business_suit',
      acc: 'zoro_bamboo_sword',
    },
    {
      title: 'Fox Konoha Ninja Flame',
      species: 'fox',
      hat: 'konoha_headband',
      outfit: 'master_gi',
      acc: 'flame_ninja_scarf',
    },
    {
      title: 'Owl Infinity Developer',
      species: 'owl',
      hat: 'wizard_hat',
      outfit: 'helloworld_tshirt',
      acc: 'infinity_gauntlet',
    },
    {
      title: 'Kirby Dream Star Fairy',
      species: 'kirby',
      hat: 'kirby_star_crown',
      outfit: 'doraemon_pocket',
      acc: 'fairy_wand',
    },
    {
      title: 'Rocket Iron Nano Shield',
      species: 'rocket',
      hat: 'ironman_mask',
      outfit: 'stark_nano_armor',
      acc: 'vibranium_shield',
    },
    {
      title: 'Loki Space Detective Angel',
      species: 'alligator_loki',
      hat: 'astronaut_helmet',
      outfit: 'detective_trenchcoat',
      acc: 'angel_wings',
    },
    {
      title: 'Karoo Cowboy RGB',
      species: 'karoo',
      hat: 'cowboy_hat',
      outfit: 'cozy_scarf',
      acc: 'rgb_gaming_headset',
    },
    {
      title: 'Bepo Bear Beanie Dev',
      species: 'bepo',
      hat: 'bear_beanie',
      outfit: 'dev_hoodie',
      acc: 'sunglasses',
    },
  ];

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* SECTION 1: FASHION FITTING SHOWCASE */}
      <h1 className="text-white text-3xl font-bold mb-2">🐾 Fashion Fitting Room (Vừa Khít & Sát Pet)</h1>
      <p className="text-slate-400 mb-8">Kiểm tra toàn bộ mũ nón, trang phục, kính và phụ kiện ôm sát cơ thể thú cưng</p>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-16">
        {fashionCombos.map((c, idx) => (
          <div key={idx} className="flex flex-col items-center bg-slate-800/80 p-4 rounded-2xl border border-slate-700 shadow-lg">
            <div className="text-xs font-semibold text-emerald-400 mb-1 text-center truncate w-full">{c.title}</div>
            <div className="text-[10px] text-slate-400 mb-3 text-center">{c.hat} + {c.outfit}</div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-center" style={{ width: 130, height: 130 }}>
              <PixelPetSprite
                species={c.species}
                scale={1.26}
                equippedHat={c.hat}
                equippedOutfit={c.outfit}
                equippedAccessory={c.acc}
                animationState="idle"
              />
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 2: BASE PET PREVIEW */}
      <h2 className="text-white text-2xl font-bold mb-6">27 Anime Pet Catalog (Bản Gốc 100%)</h2>
      <div className="flex flex-wrap gap-6">
        {speciesList.map((s) => (
          <div key={s} className="flex flex-col items-center bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-white text-xs font-semibold mb-2">{s}</div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 flex items-center justify-center" style={{ width: 110, height: 110 }}>
              <PixelPetSprite species={s} scale={1.05} animationState="idle" />
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 flex items-center justify-center mt-2" style={{ width: 110, height: 110 }}>
              <PixelPetSprite species={s} scale={1.05} animationState="sleep" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
