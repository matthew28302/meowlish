'use client';

import React from 'react';

// =========================================================================
// 2.5D CHUNG — HƯỚNG SÁNG NHẤT QUÁN TOÀN BẢN ĐỒ: ĐÈN Ở TRÊN ⇦ TRÁI
//   * mặt trên / mặt trái  → sáng hơn (viền nắng trắng mỏng)
//   * mặt phải / mặt dưới  → tối hơn (lớp xám đen cùng tông, không màu mới)
//   * vật tiếp đất          → bóng AO 2 lớp (quầng mềm + lõi đậm lệch phải)
// =========================================================================
const _AO = '#020617'; // bóng trung tính cùng tông dark-mode
const _RIM = '#ffffff';

/** Bóng tiếp đất 2 lớp: quầng AO loãng + lõi đậm (lệch nhẹ sang phải) */
function _ao(id: string, cx: number, cy: number, rx: number, ry: number, core = 0.26) {
  const halo = Math.min(1, core * 1.45);
  const mid = Math.min(1, core * 0.72);
  return (
    <>
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={_AO} stopOpacity={halo} />
          <stop offset="52%" stopColor={_AO} stopOpacity={mid} />
          <stop offset="100%" stopColor={_AO} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id})`} />
      <ellipse cx={cx + rx * 0.12} cy={cy + ry * 0.22} rx={rx * 0.58} ry={ry * 0.55} fill={_AO} opacity={core} />
    </>
  );
}

/** Mặt bên / mặt dưới tối hơn của một khối (đèn trên-trái ⇒ mặt phải tối nhất) */
function _side(d: string, o = 0.18) {
  return <path d={d} fill={_AO} opacity={o} />;
}

/** Viền nắng mặt trên / mặt trái của một khối */
function _rim(d: string, o = 0.2) {
  return <path d={d} fill={_RIM} opacity={o} />;
}

// =========================================================================
// 1. CỐI XAY GIÓ HÀ LAN THẬT (DUTCH WINDMILL WITH WOODEN LATTICE BLADES)
// =========================================================================
function _Raw_DutchWindmillSVG({ className = '', scale = 1.4 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 140 * scale, height: 180 * scale }}>
      <svg viewBox="0 0 140 180" width={140 * scale} height={180 * scale} className="overflow-visible drop-shadow-xl">
        <defs>
          <linearGradient id="millBaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="millBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id="millRoofGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#92400e" />
            <stop offset="50%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
        </defs>
        {/* Shadow: AO 2 lớp (quầng mềm + lõi đậm lệch phải — đèn trên-trái) */}
        {_ao('millAO', 70, 171, 68, 13, 0.3)}

        {/* Stone Base / Bệ đá xếp lớp */}
        <path d="M 32 170 L 40 100 L 100 100 L 108 170 Z" fill="url(#millBaseGrad)" stroke="#1e293b" strokeWidth="2" />
        {/* Stone Brick Lines with better detailing */}
        <path d="M36 150 L104 150 M38 130 L102 130 M39 115 L101 115" stroke="#334155" strokeWidth="1.5" />
        <path d="M55 150 L55 170 M85 150 L85 170 M70 130 L70 150 M45 130 L45 150 M95 130 L95 150 M50 115 L50 130 M90 115 L90 130 M70 100 L70 115" stroke="#334155" strokeWidth="1.5" />
        
        {/* Vines growing on base */}
        <path d="M 34 165 Q 40 145 38 135 Q 42 125 45 110" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
        <path d="M 106 160 Q 95 140 100 120" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
        <circle cx="38" cy="145" r="1.5" fill="#22c55e" />
        <circle cx="41" cy="130" r="1.5" fill="#22c55e" />
        <circle cx="98" cy="130" r="1.5" fill="#22c55e" />

        {/* Wooden Double Door at Base */}
        <path d="M 60 170 L 60 142 Q 70 138 80 142 L 80 170 Z" fill="#451a03" stroke="#1c1917" strokeWidth="2" />
        <line x1="70" y1="140" x2="70" y2="170" stroke="#1c1917" strokeWidth="1.5" />
        <circle cx="67" cy="156" r="1.5" fill="#facc15" />
        <circle cx="73" cy="156" r="1.5" fill="#facc15" />
        {/* Door glowing light spill */}
        <path d="M 60 170 L 80 170 L 85 175 L 55 175 Z" fill="#fef08a" opacity="0.3" />

        {/* Middle Observation Balcony / Lan can gỗ bao quanh */}
        <rect x="30" y="96" width="80" height="6" fill="#78350f" stroke="#451a03" strokeWidth="2" rx="2" />
        {/* Balcony Railings */}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={i} x1={34 + i * 7.2} y1="88" x2={34 + i * 7.2} y2="96" stroke="#b45309" strokeWidth="2" />
        ))}
        <line x1="32" y1="88" x2="108" y2="88" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />

        {/* Upper Tower Timber Body */}
        <path d="M 44 96 L 50 45 L 90 45 L 96 96 Z" fill="url(#millBodyGrad)" stroke="#78350f" strokeWidth="2" />
        {/* Timber Texture Planks */}
        <path d="M 54 45 L 50 96 M 65 45 L 64 96 M 76 45 L 76 96 M 86 45 L 90 96" stroke="#92400e" strokeWidth="1.5" />

        {/* Arched Window with Glowing Amber Light */}
        <path d="M 62 76 L 62 60 Q 70 54 78 60 L 78 76 Z" fill="#fef08a" stroke="#451a03" strokeWidth="2" />
        <line x1="70" y1="58" x2="70" y2="76" stroke="#451a03" strokeWidth="1.5" />
        <line x1="62" y1="67" x2="78" y2="67" stroke="#451a03" strokeWidth="1.5" />
        {/* Glowing window effect */}
        <circle cx="70" cy="67" r="10" fill="#fef08a" opacity="0.4" className="animate-pulse" style={{ animationDuration: '4s' }} />

        {/* Wooden Domed Cap / Mái vòm gỗ cối xay */}
        <path d="M 44 45 Q 70 15 96 45 Z" fill="url(#millRoofGrad)" stroke="#451a03" strokeWidth="2.5" />
        <circle cx="70" cy="24" r="3.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />

        {/* 2.5D — mặt phải sẫm (đèn trên-trái), viền nắng mặt trên, mặt tường trái sáng */}
        {_side('M 80 170 L 80 100 L 100 100 L 108 170 Z', 0.17)}
        {_side('M 80 96 L 80 45 L 90 45 L 96 96 Z', 0.15)}
        {_side('M 72 45 Q 86 32 96 45 L 72 46 Z', 0.16)}
        {_rim('M 40 100.5 L 100 100.5 L 99 103.5 L 41 103.5 Z', 0.22)}
        {_rim('M 44.5 96 L 50 45.5 L 55 45.5 L 50 96 Z', 0.14)}
        {_rim('M 44.5 45 Q 66 20 74 20.5 Q 58 30 47.5 46 Z', 0.2)}
        {/* Rêu/bụi bám chân tường + bolt sắt trên lan can */}
        <circle cx="36" cy="166" r="3" fill="#15803d" opacity="0.55" />
        <circle cx="104" cy="164" r="2.5" fill="#15803d" opacity="0.45" />
        {[34, 68, 102].map((bx) => (
          <circle key={bx} cx={bx} cy="99" r="1.2" fill="#451a03" />
        ))}
        {/* Center Rotor Hub */}
        <circle cx="70" cy="46" r="8" fill="#451a03" stroke="#facc15" strokeWidth="2" />
        <circle cx="70" cy="46" r="3" fill="#facc15" />

        {/* 4 AUTHENTIC WOODEN LATTICE SAILS (Cánh quạt nan gỗ chữ X xoay tròn) */}
        <g
          className="origin-[70px_46px] animate-spin"
          style={{ animationDuration: '8s', animationTimingFunction: 'linear' }}
        >
          {/* Sail 1: Top (Up) */}
          <g>
            <line x1="70" y1="46" x2="70" y2="-16" stroke="#451a03" strokeWidth="4" strokeLinecap="round" />
            <rect x="72" y="-12" width="18" height="54" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" rx="1.5" opacity="0.95" />
            {/* Cross-hatch lattice */}
            {[0, 10, 20, 30].map(y => (
              <line key={y} x1="72" y1={-2 + y} x2="90" y2={-2 + y} stroke="#b45309" strokeWidth="1" />
            ))}
            <line x1="81" y1="-12" x2="81" y2="42" stroke="#b45309" strokeWidth="1" />
          </g>

          {/* Sail 2: Right */}
          <g>
            <line x1="70" y1="46" x2="132" y2="46" stroke="#451a03" strokeWidth="4" strokeLinecap="round" />
            <rect x="74" y="48" width="54" height="18" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" rx="1.5" opacity="0.95" />
            {[84, 94, 104, 114].map(x => (
              <line key={x} x1={x} y1="48" x2={x} y2="66" stroke="#b45309" strokeWidth="1" />
            ))}
            <line x1="74" y1="57" x2="128" y2="57" stroke="#b45309" strokeWidth="1" />
          </g>

          {/* Sail 3: Bottom (Down) */}
          <g>
            <line x1="70" y1="46" x2="70" y2="108" stroke="#451a03" strokeWidth="4" strokeLinecap="round" />
            <rect x="50" y="50" width="18" height="54" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" rx="1.5" opacity="0.95" />
            {[60, 70, 80, 90].map(y => (
              <line key={y} x1="50" y1={y} x2="68" y2={y} stroke="#b45309" strokeWidth="1" />
            ))}
            <line x1="59" y1="50" x2="59" y2="104" stroke="#b45309" strokeWidth="1" />
          </g>

          {/* Sail 4: Left */}
          <g>
            <line x1="70" y1="46" x2="8" y2="46" stroke="#451a03" strokeWidth="4" strokeLinecap="round" />
            <rect x="12" y="26" width="54" height="18" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" rx="1.5" opacity="0.95" />
            {[22, 32, 42, 52].map(x => (
              <line key={x} x1={x} y1="26" x2={x} y2="44" stroke="#b45309" strokeWidth="1" />
            ))}
            <line x1="12" y1="35" x2="66" y2="35" stroke="#b45309" strokeWidth="1" />
          </g>
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 2. CÂY ĐẠI THỤ CỔ THỤ & THANG TRÈO (GRAND OAK TREE WITH CLIMBING LADDER)
// =========================================================================
function _Raw_GrandOakTreeSVG({ className = '', scale = 1.4 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 160 * scale, height: 180 * scale }}>
      <svg viewBox="0 0 160 180" width={160 * scale} height={180 * scale} className="overflow-visible drop-shadow-lg">
        <defs>
          <radialGradient id="leavesBackGrad" cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#14532d" />
          </radialGradient>
          <radialGradient id="leavesFrontGrad" cx="40%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </radialGradient>
          <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#451a03" />
            <stop offset="50%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
        </defs>

        {/* Tree Shadow: 2.5D AO — lõi đậm tiếp đất + quầng mềm loãng (nắng từ trên-trái) */}
        {_ao('oakAO', 78, 171, 76, 13, 0.26)}

        {/* Tree Trunk with Root Flares */}
        <path
          d="M 60 174 C 55 145, 66 115, 64 85 C 64 75, 96 75, 96 85 C 94 115, 105 145, 100 174 C 88 176, 72 176, 60 174 Z"
          fill="url(#trunkGrad)"
          stroke="#1c1917"
          strokeWidth="2.5"
        />
        {/* Bark Textures (Curved lines) */}
        <path d="M 68 172 Q 74 130 70 100" stroke="#1c1917" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M 82 170 Q 78 135 84 105" stroke="#1c1917" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M 92 170 Q 94 140 90 110" stroke="#1c1917" strokeWidth="1.5" fill="none" opacity="0.4" />
        {/* Tree Knot */}
        <ellipse cx="84" cy="120" rx="3" ry="5" fill="#451a03" stroke="#1c1917" strokeWidth="1" />
        <ellipse cx="84" cy="120" rx="1.5" ry="3" fill="#1c1917" />

        {/* 2.5D — mặt phải thân cây sẫm (đèn trên-trái) + viền nắng trái */}
        <path
          d="M 84 175 C 90 145 84 115 86 85 C 90 77 96 77 96 85 C 94 115 105 145 100 174 Z"
          fill={_AO}
          opacity="0.2"
        />
        <path
          d="M 60 174 C 55 145 66 115 64 85 C 64 77 70 76 74 77 C 70 110 72 145 70 174 Z"
          fill="#ffffff"
          opacity="0.12"
        />

        {/* Sturdy Wooden Climbing Ladder rungs on trunk */}
        {Array.from({ length: 7 }).map((_, i) => (
          <g key={i}>
            <rect x="68" y={95 + i * 11} width="24" height="4" rx="2" fill="#facc15" stroke="#78350f" strokeWidth="1.5" />
            <circle cx="70" cy={97 + i * 11} r="1" fill="#451a03" />
            <circle cx="90" cy={97 + i * 11} r="1" fill="#451a03" />
          </g>
        ))}

        {/* Treehouse Observation Platform on Lower Canopy */}
        <rect x="48" y="80" width="64" height="8" fill="#92400e" stroke="#451a03" strokeWidth="2" rx="2" />
        <rect x="52" y="70" width="56" height="10" fill="none" stroke="#b45309" strokeWidth="2" />
        {[56, 68, 80, 92, 104].map(x => (
          <line key={x} x1={x} y1="70" x2={x} y2="80" stroke="#b45309" strokeWidth="2" />
        ))}

        {/* Rope Swing Hanging from Left Branch */}
        <path d="M 40 65 Q 40 90 36 125" stroke="#b45309" strokeWidth="1.5" strokeDasharray="3 1.5" fill="none" />
        <path d="M 50 65 Q 48 90 46 125" stroke="#b45309" strokeWidth="1.5" strokeDasharray="3 1.5" fill="none" />
        <rect x="32" y="125" width="20" height="4" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1" />

        {/* Lush Layered Green Foliage (Tán cây nhiều lớp) */}
        {/* Back layer deep green */}
        <ellipse cx="38" cy="55" rx="36" ry="30" fill="url(#leavesBackGrad)" />
        <ellipse cx="122" cy="55" rx="36" ry="30" fill="url(#leavesBackGrad)" />
        <ellipse cx="80" cy="38" rx="46" ry="36" fill="url(#leavesBackGrad)" />
        
        {/* Extra small back leaves */}
        <ellipse cx="20" cy="65" rx="20" ry="16" fill="url(#leavesBackGrad)" />
        <ellipse cx="140" cy="65" rx="20" ry="16" fill="url(#leavesBackGrad)" />
        <ellipse cx="80" cy="15" rx="30" ry="20" fill="url(#leavesBackGrad)" />

        {/* Middle layer emerald */}
        <ellipse cx="46" cy="48" rx="32" ry="26" fill="url(#leavesFrontGrad)" />
        <ellipse cx="114" cy="48" rx="32" ry="26" fill="url(#leavesFrontGrad)" />
        <ellipse cx="80" cy="32" rx="40" ry="30" fill="url(#leavesFrontGrad)" />

        {/* Highlights (nắng từ trái-trên: sáng trái, tối dần phải = khối 2.5D) */}
        <ellipse cx="40" cy="38" rx="16" ry="10" fill="#4ade80" opacity="0.6" />
        <ellipse cx="76" cy="22" rx="20" ry="12" fill="#bbf7d0" opacity="0.55" />
        <ellipse cx="112" cy="38" rx="16" ry="10" fill="#4ade80" opacity="0.45" />
        {/* Rim sáng mặt trên + bóng mặt dưới tán (khối 2.5D: mặt trên/mặt bên) */}
        <ellipse cx="66" cy="12" rx="26" ry="6" fill="#ffffff" opacity="0.28" />
        <ellipse cx="92" cy="66" rx="30" ry="7" fill="#14532d" opacity="0.30" />

        {/* 2.5D — tán cây: mặt phải/dưới tối, viền ngọn sáng (đèn trên-trái) */}
        <ellipse cx="126" cy="64" rx="30" ry="24" fill={_AO} opacity="0.13" />
        <ellipse cx="94" cy="70" rx="38" ry="22" fill={_AO} opacity="0.1" />
        <ellipse cx="44" cy="72" rx="26" ry="16" fill={_AO} opacity="0.08" />
        {_rim('M 24 62 Q 40 34 76 24 Q 60 44 46 70 Z', 0.12)}

        {/* Ripe Red Apples with Leaves */}
        {[
          { x: 30, y: 50 },
          { x: 56, y: 32 },
          { x: 74, y: 46 },
          { x: 94, y: 28 },
          { x: 108, y: 52 },
          { x: 130, y: 40 },
          { x: 46, y: 64 },
          { x: 118, y: 66 },
          { x: 80, y: 20 },
          { x: 20, y: 62 },
          { x: 136, y: 62 },
        ].map((apple, i) => (
          <g key={i} className="animate-bounce" style={{ animationDuration: `${2.2 + (i % 4) * 0.4}s` }}>
            <circle cx={apple.x} cy={apple.y} r="4.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
            <circle cx={apple.x - 1.5} cy={apple.y - 1.5} r="1.5" fill="#fca5a5" />
            <path d={`M ${apple.x} ${apple.y - 4} Q ${apple.x + 3} ${apple.y - 8} ${apple.x + 5} ${apple.y - 6}`} stroke="#15803d" strokeWidth="1.5" fill="none" />
          </g>
        ))}
      </svg>
    </div>
  );
}

// =========================================================================
// 3. BIỆT THỰ NÔNG TRẠI MÁI NGÓI ĐỎ (FARMHOUSE VILLA WITH SMOKING CHIMNEY)
// =========================================================================
function _Raw_FarmhouseVillaSVG({ className = '', scale = 1.4 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 170 * scale, height: 130 * scale }}>
      <svg viewBox="0 0 170 130" width={170 * scale} height={130 * scale} className="overflow-visible drop-shadow-xl">
        <defs>
          <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        </defs>

        {/* Shadow: AO 2 lớp chạm đất (đèn trên-trái) */}
        {_ao('villaAO', 85, 125, 82, 9, 0.3)}

        {/* Cobblestone Chimney with Animated Smoke */}
        <g>
          {/* Animated smoke puffs */}
          <circle cx="132" cy="-2" r="6" fill="#ffffff" opacity="0.6" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="135" cy="8" r="5" fill="#f8fafc" opacity="0.75" className="animate-bounce" style={{ animationDuration: '2s' }} />
          <circle cx="128" cy="12" r="4" fill="#e2e8f0" opacity="0.8" className="animate-pulse" style={{ animationDuration: '2.5s' }} />
          
          <rect x="124" y="16" width="18" height="28" fill="#64748b" stroke="#1e293b" strokeWidth="2" />
          <path d="M 124 22 L 142 22 M 124 30 L 142 30 M 124 38 L 142 38" stroke="#334155" strokeWidth="1.5" />
          {/* Chimney stones detailing */}
          <path d="M 130 22 L 130 30 M 136 30 L 136 38 M 128 16 L 128 22 M 138 16 L 138 22" stroke="#334155" strokeWidth="1.5" />
        </g>

        {/* Main Walls (Timber / Sandstone) */}
        <rect x="25" y="55" width="120" height="68" fill="url(#wallGrad)" stroke="#78350f" strokeWidth="2.5" rx="2" />
        {/* Timber Beam Framing */}
        <line x1="25" y1="88" x2="145" y2="88" stroke="#92400e" strokeWidth="2.5" />
        <line x1="60" y1="55" x2="60" y2="123" stroke="#92400e" strokeWidth="2.5" />
        <line x1="110" y1="55" x2="110" y2="123" stroke="#92400e" strokeWidth="2.5" />
        {/* Additional Timber braces */}
        <line x1="25" y1="55" x2="60" y2="88" stroke="#92400e" strokeWidth="1.5" />
        <line x1="110" y1="88" x2="145" y2="55" stroke="#92400e" strokeWidth="1.5" />

        {/* Red Terracotta Shingled Roof (Mái ngói đất nung xếp tầng) */}
        <polygon points="12,58 85,16 158,58" fill="#7f1d1d" stroke="#450a0a" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="20,56 85,20 150,56" fill="url(#roofGrad)" />
        {/* Shingle lines */}
        {[50, 42, 34, 26].map((y, i) => (
          <line key={y} x1={32 + i * 14} y1={y} x2={138 - i * 14} y2={y} stroke="#991b1b" strokeWidth="2" strokeLinecap="round" />
        ))}
        {/* Vertical shingle details */}
        <path d="M 85 20 L 85 56 M 75 25 L 75 56 M 95 25 L 95 56 M 65 30 L 65 56 M 105 30 L 105 56 M 55 35 L 55 56 M 115 35 L 115 56" stroke="#991b1b" strokeWidth="1.5" />
        {/* Roof ridge cap */}
        <line x1="10" y1="58" x2="160" y2="58" stroke="#7f1d1d" strokeWidth="4" strokeLinecap="round" />
        
        {/* 2.5D — khối nhà: mặt phải tường/mái tối, mặt trái & viền trên nắng (đèn trên-trái) */}
        <polygon points="85,16 158,58 96,58" fill={_AO} opacity="0.16" />
        <polygon points="12,58 85,16 85,23 20,53" fill="#ffffff" opacity="0.16" />
        <rect x="104" y="55" width="41" height="68" fill={_AO} opacity="0.13" />
        <rect x="133" y="16" width="9" height="28" fill={_AO} opacity="0.18" />
        <rect x="124" y="16" width="4" height="28" fill="#ffffff" opacity="0.14" />
        {/* Đá móng + rêu chân tường */}
        <path d="M 25 123 L 145 123" stroke={_AO} strokeWidth="3" opacity="0.25" />

        {/* Attic Round Window */}
        <circle cx="85" cy="38" r="8" fill="#fef08a" stroke="#451a03" strokeWidth="2" />
        <line x1="85" y1="30" x2="85" y2="46" stroke="#451a03" strokeWidth="1.5" />
        <line x1="77" y1="38" x2="93" y2="38" stroke="#451a03" strokeWidth="1.5" />
        <circle cx="85" cy="38" r="8" fill="#fef08a" opacity="0.5" className="animate-pulse" style={{ animationDuration: '4s' }} />

        {/* 2 Lower Story Paned Windows with Warm Light */}
        <g>
          <rect x="32" y="64" width="22" height="20" fill="#fef08a" stroke="#451a03" strokeWidth="2" rx="1" />
          <line x1="43" y1="64" x2="43" y2="84" stroke="#451a03" strokeWidth="1.5" />
          <line x1="32" y1="74" x2="54" y2="74" stroke="#451a03" strokeWidth="1.5" />
          <rect x="32" y="64" width="22" height="20" fill="#fef08a" opacity="0.4" className="animate-pulse" style={{ animationDuration: '3s' }} />
        </g>

        <g>
          <rect x="116" y="64" width="22" height="20" fill="#fef08a" stroke="#451a03" strokeWidth="2" rx="1" />
          <line x1="127" y1="64" x2="127" y2="84" stroke="#451a03" strokeWidth="1.5" />
          <line x1="116" y1="74" x2="138" y2="74" stroke="#451a03" strokeWidth="1.5" />
          <rect x="116" y="64" width="22" height="20" fill="#fef08a" opacity="0.4" className="animate-pulse" style={{ animationDuration: '3.5s' }} />
        </g>

        {/* Front Porch Awning & Wooden Front Door */}
        <rect x="68" y="86" width="34" height="37" fill="#78350f" stroke="#290f04" strokeWidth="2" />
        {/* Door details */}
        <rect x="72" y="90" width="26" height="33" fill="#92400e" stroke="#290f04" strokeWidth="1.5" />
        <line x1="85" y1="90" x2="85" y2="123" stroke="#290f04" strokeWidth="1.5" />
        <rect x="74" y="92" width="10" height="12" fill="#78350f" stroke="#290f04" strokeWidth="1" />
        <rect x="87" y="92" width="10" height="12" fill="#78350f" stroke="#290f04" strokeWidth="1" />
        <circle cx="94" cy="108" r="1.5" fill="#facc15" />
        <circle cx="76" cy="108" r="1.5" fill="#facc15" />

        {/* Porch Columns & Awning Roof */}
        <polygon points="60,86 85,74 110,86" fill="url(#roofGrad)" stroke="#7f1d1d" strokeWidth="2" strokeLinejoin="round" />
        <rect x="62" y="86" width="6" height="37" fill="#92400e" stroke="#451a03" strokeWidth="1" />
        <rect x="102" y="86" width="6" height="37" fill="#92400e" stroke="#451a03" strokeWidth="1" />
        
        {/* Porch steps */}
        <rect x="60" y="123" width="50" height="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
        <rect x="64" y="126" width="42" height="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />

        {/* Flower Boxes with Blossoms */}
        <g>
          <rect x="28" y="84" width="30" height="6" fill="#78350f" stroke="#451a03" strokeWidth="1" rx="1.5" />
          <circle cx="33" cy="83" r="3" fill="#ef4444" />
          <circle cx="39" cy="82" r="3.5" fill="#f43f5e" />
          <circle cx="45" cy="83" r="3" fill="#fbbf24" />
          <circle cx="51" cy="82" r="3.5" fill="#ec4899" />
          <circle cx="36" cy="85" r="2" fill="#15803d" />
          <circle cx="42" cy="85" r="2" fill="#15803d" />
          <circle cx="48" cy="85" r="2" fill="#15803d" />
        </g>

        <g>
          <rect x="112" y="84" width="30" height="6" fill="#78350f" stroke="#451a03" strokeWidth="1" rx="1.5" />
          <circle cx="117" cy="83" r="3" fill="#ec4899" />
          <circle cx="123" cy="82" r="3.5" fill="#ef4444" />
          <circle cx="129" cy="83" r="3" fill="#fbbf24" />
          <circle cx="135" cy="82" r="3.5" fill="#f43f5e" />
          <circle cx="120" cy="85" r="2" fill="#15803d" />
          <circle cx="126" cy="85" r="2" fill="#15803d" />
          <circle cx="132" cy="85" r="2" fill="#15803d" />
        </g>

        {/* Porch Rocking Chair & Mailbox */}
        <path d="M 148 110 L 158 110 L 158 122 L 146 122" stroke="#451a03" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 148 110 L 148 120" stroke="#451a03" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        <line x1="16" y1="100" x2="16" y2="124" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
        <rect x="10" y="95" width="12" height="8" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" rx="3" />
        {/* Mailbox flag */}
        <line x1="14" y1="95" x2="14" y2="88" stroke="#ef4444" strokeWidth="1.5" />
        <polygon points="14,88 18,88 14,92" fill="#ef4444" />
      </svg>
    </div>
  );
}

// =========================================================================
// 4. HỒ SEN SINH THÁI & BẾN GỖ (LOTUS POND WITH WOODEN PIER & KOI FISH)
// =========================================================================
function _Raw_LotusPondSVG({ className = '', scale = 1.4 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 220 * scale, height: 110 * scale }}>
      <svg viewBox="0 0 220 110" width={220 * scale} height={110 * scale} className="overflow-visible drop-shadow-lg">
        <defs>
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="40%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <radialGradient id="lilyGrad1" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#15803d" />
          </radialGradient>
          <radialGradient id="lilyGrad2" cx="70%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#166534" />
          </radialGradient>
        </defs>

        {/* Shoreline Stones / Bờ sỏi đá uốn lượn (Thicker and more detailed) */}
        <path
          d="M 10 50 C 15 15, 70 8, 120 10 C 170 12, 210 25, 215 60 C 220 95, 160 108, 110 106 C 50 104, 5 85, 10 50 Z"
          fill="#a8a29e"
          stroke="#57534e"
          strokeWidth="4"
        />
        {/* Inner sand edge */}
        <path
          d="M 13 50 C 18 18, 70 11, 119 13 C 168 15, 207 27, 212 60 C 216 92, 158 105, 109 103 C 52 101, 9 83, 13 50 Z"
          fill="#d6d3d1"
        />

        {/* Pond Water Basin Gradient */}
        <path
          d="M 16 50 C 20 20, 72 14, 118 16 C 165 18, 204 28, 208 60 C 212 90, 155 102, 108 100 C 54 98, 12 80, 16 50 Z"
          fill="url(#waterGrad)"
          stroke="#0284c7"
          strokeWidth="2"
        />

        {/* Animated Water Ripples */}
        {/* Vệt nắng phản chiếu mặt nước (cùng hướng nắng trái-trên, chuẩn 2.5D) */}
        <ellipse cx="52" cy="30" rx="26" ry="6" fill="#ffffff" opacity="0.30" transform="rotate(-12 52 30)" className="animate-pulse" style={{ animationDuration: '3.2s' }} />
        <ellipse cx="60" cy="34" rx="14" ry="3.5" fill="#ffffff" opacity="0.35" transform="rotate(-12 60 34)" className="animate-pulse" style={{ animationDuration: '2.4s' }} />
        <ellipse cx="90" cy="45" rx="35" ry="12" fill="none" stroke="#bae6fd" strokeWidth="1" opacity="0.6" className="animate-pulse" style={{ animationDuration: '3s' }} />
        <ellipse cx="150" cy="70" rx="30" ry="10" fill="none" stroke="#bae6fd" strokeWidth="1" opacity="0.6" className="animate-pulse" style={{ animationDuration: '4s' }} />
        <ellipse cx="60" cy="75" rx="20" ry="8" fill="none" stroke="#bae6fd" strokeWidth="1" opacity="0.5" className="animate-pulse" style={{ animationDuration: '3.5s' }} />

        {/* Swimming Koi Fish (Cá koi bơi) */}
        <g className="animate-bounce" style={{ animationDuration: '2.5s' }}>
          <path d="M 80 50 Q 86 44 96 50 Q 86 56 80 50 Z" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
          <polygon points="96,50 102,45 102,55" fill="#ffffff" stroke="#c2410c" strokeWidth="0.5" />
          <circle cx="83" cy="48" r="1" fill="#0f172a" />
          <path d="M 86 47 Q 90 47 92 49" stroke="#ffffff" strokeWidth="1.5" fill="none" />
        </g>
        <g className="animate-bounce" style={{ animationDuration: '3.2s' }}>
          <path d="M 130 65 Q 138 59 148 65 Q 138 71 130 65 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
          <polygon points="148,65 155,60 155,70" fill="#facc15" stroke="#b91c1c" strokeWidth="0.5" />
          <circle cx="133" cy="63" r="1" fill="#0f172a" />
          <path d="M 136 62 Q 140 62 142 64" stroke="#ffffff" strokeWidth="1.5" fill="none" />
        </g>
        {/* Extra small fish */}
        <g className="animate-pulse" style={{ animationDuration: '2.8s' }}>
          <path d="M 170 35 Q 175 32 180 35 Q 175 38 170 35 Z" fill="#fcd34d" />
        </g>

        {/* Floating Green Water Lilies & Pink Lotus Flowers */}
        <g className="hover:-translate-y-1 transition-transform">
          {/* Lily Pad 1 */}
          <circle cx="50" cy="40" r="12" fill="url(#lilyGrad1)" stroke="#14532d" strokeWidth="1.5" />
          <polygon points="50,40 58,32 63,40" fill="#0ea5e9" />
          <path d="M 50 40 L 40 38 M 50 40 L 45 48 M 50 40 L 58 45" stroke="#166534" strokeWidth="1" />
          {/* Pink Lotus Flower */}
          <circle cx="47" cy="37" r="5" fill="#f43f5e" />
          <circle cx="47" cy="37" r="3" fill="#fda4af" />
          <circle cx="47" cy="37" r="1.5" fill="#fef08a" />
        </g>
        
        <g className="hover:-translate-y-1 transition-transform">
          {/* Lily Pad 2 */}
          <circle cx="165" cy="48" r="14" fill="url(#lilyGrad2)" stroke="#14532d" strokeWidth="1.5" />
          <polygon points="165,48 176,42 180,50" fill="#0ea5e9" />
          <path d="M 165 48 L 155 45 M 165 48 L 160 58 M 165 48 L 175 56" stroke="#166534" strokeWidth="1" />
          {/* White Water Lily */}
          <circle cx="162" cy="45" r="6" fill="#ffffff" />
          <circle cx="162" cy="45" r="3" fill="#fef08a" />
        </g>
        
        <g className="hover:-translate-y-1 transition-transform">
          {/* Lily Pad 3 */}
          <circle cx="115" cy="80" r="10" fill="url(#lilyGrad1)" stroke="#14532d" strokeWidth="1.5" />
          <polygon points="115,80 110,72 120,72" fill="#0ea5e9" />
          <circle cx="114" cy="78" r="4" fill="#ec4899" />
          <circle cx="114" cy="78" r="2" fill="#fbcfe8" />
        </g>

        {/* 2.5D GROUND — bờ đá: viền nắng trái-trên, AO trong lòng hồ, nước sâu dần chân phải */}
        <defs>
          <clipPath id="lotusBasinClip">
            <path d="M 16 50 C 20 20, 72 14, 118 16 C 165 18, 204 28, 208 60 C 212 90, 155 102, 108 100 C 54 98, 12 80, 16 50 Z" />
          </clipPath>
          <linearGradient id="lotusDepthGrad" x1="0%" y1="0%" x2="75%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
            <stop offset="45%" stopColor="#0ea5e9" stopOpacity="0" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <g clipPath="url(#lotusBasinClip)">
          <rect x="0" y="0" width="220" height="110" fill="url(#lotusDepthGrad)" />
        </g>
        {_rim('M 13 50 C 18 18 70 11 119 13 C 150 14 176 19 194 27', 0.3)}
        {_side('M 212 60 C 216 92 158 105 109 103 L 109 106 C 160 108 219 94 215 59 Z', 0.3)}

        {/* Wooden Pier Dock (Cầu cảng vươn dài ra hồ) */}
        <g>
          {/* Pilings under water (shadowed) */}
          <rect x="48" y="76" width="6" height="16" fill="#290f04" />
          <rect x="24" y="76" width="6" height="12" fill="#290f04" />
          
          {/* Pier Decking */}
          <rect x="0" y="56" width="58" height="20" fill="#92400e" stroke="#451a03" strokeWidth="2" rx="1" />
          {/* Wood Planks */}
          {[6, 18, 30, 42, 54].map(x => (
            <line key={x} x1={x} y1="56" x2={x} y2="76" stroke="#78350f" strokeWidth="2" />
          ))}
          {/* Nails */}
          {[12, 24, 36, 48].map(x => (
            <g key={x}>
              <circle cx={x} cy="59" r="1" fill="#451a03" />
              <circle cx={x} cy="73" r="1" fill="#451a03" />
            </g>
          ))}
          
          {/* Fishing Rod & Lantern on Pier */}
          <line x1="40" y1="62" x2="75" y2="35" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
          <line x1="75" y1="35" x2="77" y2="58" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 2" />
          {/* Bobber */}
          <circle cx="77" cy="59" r="2.5" fill="#ef4444" />
          <circle cx="77" cy="57" r="2.5" fill="#ffffff" />
          
          {/* Lantern */}
          <rect x="16" y="48" width="8" height="12" fill="#fef08a" stroke="#451a03" strokeWidth="1.5" rx="2" />
          <line x1="20" y1="48" x2="20" y2="60" stroke="#451a03" strokeWidth="1" />
          <circle cx="20" cy="54" r="3" fill="#fef08a" className="animate-pulse" style={{ animationDuration: '2s' }} />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 5. NẤM LÒ XO BẬT NHẢY (BOUNCY TRAMPOLINE MUSHROOM)
// =========================================================================
function _Raw_BouncyMushroomSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 70 * scale, height: 75 * scale }}>
      <svg viewBox="0 0 70 75" width={70 * scale} height={75 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp dưới lò xo (đèn trên-trái) */}
        {_ao('mushAO', 35, 71, 28, 5.5, 0.24)}

        {/* Coiled Steel Spring / Lò xo thép nảy */}
        <path
          d="M 28 68 C 22 66, 22 62, 35 62 C 48 62, 48 58, 35 58 C 22 58, 22 54, 35 54 C 48 54, 48 50, 35 50"
          stroke="#64748b"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Metallic Base Plate */}
        <rect x="22" y="68" width="26" height="4" fill="#334155" rx="1" />

        {/* Fleshy Mushroom Stem */}
        <path d="M 28 50 L 30 36 L 40 36 L 42 50 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />

        {/* Vibrant Fly Agaric Red Cap with White Dots */}
        <path
          d="M 8 36 C 8 10, 62 10, 62 36 C 55 40, 15 40, 8 36 Z"
          fill="#dc2626"
          stroke="#991b1b"
          strokeWidth="2"
        />
        {/* Cap Highlight */}
        <path d="M 16 28 C 20 16, 50 16, 54 28" fill="none" stroke="#ef4444" strokeWidth="2" />

        {/* 2.5D — mặt phải nấm tối, viền nấm trái-trên nắng, thân & lò xo có mặt bên */}
        <path d="M 35 11.5 C 45 11 56 17 62 36 C 55 40 45 40 35 40 Z" fill={_AO} opacity="0.17" />
        <path d="M 8 36 C 8 12 22 6.5 38 7 C 24 9.5 13.5 18 12 34 Z" fill="#ffffff" opacity="0.2" />
        <path d="M 36 36 L 40 36 L 42 50 L 38 50 Z" fill={_AO} opacity="0.2" />
        <path d="M 28 50 L 31 36 L 33 36 L 30 50 Z" fill="#ffffff" opacity="0.35" />
        <path d="M 35 68 C 44 67 47 65 47 63" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.4" />

        {/* White Circular Spots */}
        <circle cx="20" cy="24" r="3.5" fill="#ffffff" />
        <circle cx="35" cy="18" r="4.5" fill="#ffffff" />
        <circle cx="50" cy="24" r="3.5" fill="#ffffff" />
        <circle cx="26" cy="33" r="2.5" fill="#ffffff" />
        <circle cx="44" cy="33" r="2.5" fill="#ffffff" />
      </svg>
    </div>
  );
}

// =========================================================================
// 6. CHUỒNG GÀ & RƠM VÀNG (CHICKEN COOP & BARNYARD)
// =========================================================================
function _Raw_ChickenCoopSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 110 * scale, height: 85 * scale }}>
      <svg viewBox="0 0 110 85" width={110 * scale} height={85 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp dưới chuồng + đụn rơm (đèn trên-trái) */}
        {_ao('coopAO', 58, 81, 50, 6, 0.26)}

        {/* Golden Haystack / Đụn rơm vàng bên cạnh */}
        <ellipse cx="20" cy="74" rx="16" ry="9" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
        <ellipse cx="20" cy="68" rx="12" ry="7" fill="#facc15" />
        <ellipse cx="20" cy="62" rx="8" ry="5" fill="#fde047" />

        {/* Wooden Coop House */}
        <rect x="42" y="38" width="60" height="42" fill="#854d0e" stroke="#451a03" strokeWidth="2" rx="1" />
        {/* Timber slats */}
        <line x1="42" y1="52" x2="102" y2="52" stroke="#713f12" strokeWidth="1" />
        <line x1="42" y1="66" x2="102" y2="66" stroke="#713f12" strokeWidth="1" />

        {/* Straw Thatched Roof */}
        <polygon points="36,40 72,16 108,40" fill="#ca8a04" stroke="#854d0e" strokeWidth="2" />
        <polygon points="40,38 72,20 104,38" fill="#eab308" />

        {/* 2.5D — mặt phải chuồng tối, viền mái rơm trái-trên nắng, đụn rơm có khối */}
        <polygon points="72,16 108,40 74,40" fill={_AO} opacity="0.17" />
        <polygon points="36,40 72,16 72,22 42,37" fill="#ffffff" opacity="0.2" />
        <rect x="86" y="38" width="16" height="42" fill={_AO} opacity="0.15" />
        <ellipse cx="27" cy="72" rx="11" ry="8" fill={_AO} opacity="0.16" />
        <ellipse cx="15" cy="66" rx="7" ry="6" fill="#ffffff" opacity="0.2" />

        {/* Coop Doorway & Ramp */}
        <rect x="52" y="54" width="16" height="26" fill="#451a03" rx="1" />
        {/* Wooden Chicken Ramp */}
        <polygon points="45,80 54,64 58,64 49,80" fill="#a16207" stroke="#713f12" strokeWidth="1" />

        {/* Hen on Nest & Chick */}
        <g className="animate-bounce" style={{ animationDuration: '2s' }}>
          {/* Hen */}
          <ellipse cx="84" cy="62" rx="8" ry="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <circle cx="89" cy="57" r="4" fill="#ffffff" />
          <polygon points="93,57 97,59 93,60" fill="#f97316" />
          <polygon points="88,53 91,51 90,55" fill="#ef4444" />
          <circle cx="89.5" cy="56" r="0.8" fill="#0f172a" />
        </g>
        {/* Baby Chick */}
        <g className="animate-bounce" style={{ animationDuration: '1.4s' }}>
          <circle cx="36" cy="74" r="3.5" fill="#fef08a" stroke="#facc15" strokeWidth="0.8" />
          <polygon points="39,74 42,75 39,76" fill="#f97316" />
          <circle cx="37" cy="73" r="0.6" fill="#0f172a" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 7. VƯỜN RAU CỦ 4 LUỐNG (RAISED VEGGIE GARDEN BEDS)
// =========================================================================
function _Raw_VeggiePatchSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 140 * scale, height: 80 * scale }}>
      <svg viewBox="0 0 140 80" width={140 * scale} height={80 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp dưới 2 luống rau (đèn trên-trái) */}
        {_ao('vegAO', 72, 75, 66, 6, 0.24)}

        {/* 2 Raised Wooden Garden Beds with Rich Dark Soil */}
        {/* Bed 1 (Top) */}
        <rect x="10" y="10" width="120" height="28" fill="#5c2c0e" stroke="#381a07" strokeWidth="2" rx="3" />
        <rect x="14" y="13" width="112" height="22" fill="#381a07" rx="2" />

        {/* Carrots in Bed 1 */}
        {[24, 44, 64].map((x, i) => (
          <g key={i} className="animate-bounce" style={{ animationDuration: `${1.8 + i * 0.3}s` }}>
            <polygon points={`${x},26 ${x - 3},18 ${x + 3},18`} fill="#f97316" stroke="#c2410c" strokeWidth="0.6" />
            <path d={`M ${x} 18 Q ${x - 4} 12 ${x - 2} 8`} stroke="#22c55e" strokeWidth="1.5" fill="none" />
            <path d={`M ${x} 18 Q ${x + 4} 12 ${x + 2} 8`} stroke="#22c55e" strokeWidth="1.5" fill="none" />
          </g>
        ))}

        {/* Strawberries in Bed 1 */}
        {[84, 104].map((x, i) => (
          <g key={i} className="animate-pulse" style={{ animationDuration: `${2.2 + i * 0.4}s` }}>
            <circle cx={x} cy="24" r="4" fill="#ef4444" />
            <polygon points={`${x - 2},20 ${x + 2},20 ${x},17`} fill="#16a34a" />
            <circle cx={x - 1} cy="23" r="0.5" fill="#fde047" />
            <circle cx={x + 1} cy="25" r="0.5" fill="#fde047" />
          </g>
        ))}

        {/* Bed 2 (Bottom) */}
        <rect x="10" y="44" width="120" height="28" fill="#5c2c0e" stroke="#381a07" strokeWidth="2" rx="3" />
        <rect x="14" y="47" width="112" height="22" fill="#381a07" rx="2" />

        {/* 2.5D — luống gỗ: mặt đế trước tối, viền trên nắng, mặt phải sẫm (đèn trên-trái) */}
        <rect x="10" y="32" width="120" height="6" fill={_AO} opacity="0.24" />
        <rect x="10" y="10" width="120" height="4" fill="#ffffff" opacity="0.16" />
        <rect x="126" y="10" width="4" height="28" fill={_AO} opacity="0.22" />
        <rect x="10" y="66" width="120" height="6" fill={_AO} opacity="0.24" />
        <rect x="10" y="44" width="120" height="4" fill="#ffffff" opacity="0.16" />
        <rect x="126" y="44" width="4" height="28" fill={_AO} opacity="0.22" />
        {/* Đất trong luống: chấm hạt + AO góc */}
        <ellipse cx="60" cy="34" rx="52" ry="4" fill="#000000" opacity="0.14" />
        <ellipse cx="60" cy="70" rx="52" ry="4" fill="#000000" opacity="0.14" />

        {/* Corns & Pumpkins in Bed 2 */}
        {[26, 52].map((x, i) => (
          <g key={i}>
            <ellipse cx={x} cy="58" rx="4" ry="7" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <line x1={x} y1="52" x2={x} y2="64" stroke="#ca8a04" strokeWidth="0.8" />
            <path d={`M ${x - 4} 62 Q ${x - 8} 54 ${x - 4} 50`} stroke="#16a34a" strokeWidth="1.2" fill="none" />
          </g>
        ))}
        {[78, 106].map((x, i) => (
          <g key={i}>
            <ellipse cx={x} cy="60" rx="7" ry="5.5" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
            <line x1={x} y1="55" x2={x} y2="65" stroke="#9a3412" strokeWidth="0.8" />
            <rect x={x - 1} y="52" width="2" height="3" fill="#166534" />
          </g>
        ))}
      </svg>
    </div>
  );
}

// =========================================================================
// 8. NGỌN HẢI ĐĂNG BÃI BIỂN (COASTAL LIGHTHOUSE FOR SUNSET BEACH)
// =========================================================================
function _Raw_LighthouseSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 80 * scale, height: 160 * scale }}>
      <svg viewBox="0 0 80 160" width={80 * scale} height={160 * scale} className="overflow-visible">
        {/* Bóng AO dưới vách đá hải đăng (đèn trên-trái) */}
        {_ao('lightAO', 44, 154, 40, 7, 0.28)}
        {/* Coastal Rock Base */}
        <polygon points="12,155 24,130 56,130 68,155" fill="#475569" stroke="#1e293b" strokeWidth="2" />

        {/* Red & White Striped Tapered Tower */}
        <polygon points="26,130 32,50 48,50 54,130" fill="#ffffff" stroke="#991b1b" strokeWidth="2" />
        {/* Red Stripes */}
        <polygon points="28,110 30,90 50,90 52,110" fill="#dc2626" />
        <polygon points="31,70 33,52 47,52 49,70" fill="#dc2626" />

        {/* 2.5D — tháp hải đăng: mặt phải tối, viền trái nắng, vách đá có mặt bên */}
        <path d="M 40 50 L 48 50 L 54 130 L 40 130 Z" fill={_AO} opacity="0.18" />
        <path d="M 32 50 L 35 50 L 29 130 L 26 130 Z" fill="#ffffff" opacity="0.24" />
        <polygon points="45,130 56,130 68,155 52,155" fill={_AO} opacity="0.2" />
        <polygon points="12,155 24,130 28,130 17,155" fill="#ffffff" opacity="0.16" />
        {/* Bults vòng quanh đế + rêu mọc chân đá */}
        <circle cx="34" cy="140" r="1.6" fill="#1e293b" />
        <circle cx="46" cy="140" r="1.6" fill="#1e293b" />
        <path d="M 18 152 Q 24 145 30 150" stroke="#15803d" strokeWidth="2" fill="none" opacity="0.7" />

        {/* Gallery Balcony */}
        <rect x="26" y="46" width="28" height="4" fill="#1e293b" rx="1" />

        {/* Lantern Room with Revolving Light Beam */}
        <rect x="30" y="28" width="20" height="18" fill="#fef08a" stroke="#1e293b" strokeWidth="1.5" />
        <polygon points="30,28 40,12 50,28" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
        <circle cx="40" cy="11" r="2" fill="#ca8a04" />

        {/* Revolving Golden Beacon Light Beam */}
        <polygon
          points="40,36 -20,-10 -15,75"
          fill="rgba(254, 240, 138, 0.35)"
          className="animate-pulse"
          style={{ animationDuration: '3s' }}
        />
      </svg>
    </div>
  );
}

// =========================================================================
// 9. CÂY DỪA NHIỆT ĐỚI (TROPICAL COCONUT PALM TREE)
// =========================================================================
function _Raw_PalmTreeSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 130 * scale, height: 160 * scale }}>
      <svg viewBox="0 0 130 160" width={130 * scale} height={160 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp — rễ cây đổ bóng sang phải (đèn trên-trái) */}
        {_ao('palmAO', 44, 153, 38, 7.5, 0.26)}

        {/* Curved Palm Trunk with Segment Rings */}
        <path
          d="M 38 152 C 45 110, 68 80, 85 45 L 94 48 C 76 84, 52 112, 46 152 Z"
          fill="#92400e"
          stroke="#451a03"
          strokeWidth="2"
        />
        {/* Trunk Segment Lines */}
        {[60, 80, 100, 120, 138].map((y, i) => (
          <line key={i} x1={36 + (152 - y) * 0.35} y1={y} x2={44 + (152 - y) * 0.35} y2={y + 3} stroke="#78350f" strokeWidth="1.5" />
        ))}

        {/* Brown Coconuts */}
        <circle cx="85" cy="48" r="4.5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
        <circle cx="92" cy="49" r="4.5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
        <circle cx="89" cy="54" r="4" fill="#78350f" stroke="#451a03" strokeWidth="1" />

        {/* 2.5D — thân dừa: mặt phải tối, viền trái nắng, ngọn lá phải tối (đèn trên-trái) */}
        <path d="M 94 48 C 76 84 52 112 46 152 L 41 152 C 50 110 74 78 89 45 Z" fill={_AO} opacity="0.22" />
        <path d="M 38 152 C 45 110 68 80 85 45 L 89 46 C 72 82 50 112 43 152 Z" fill="#ffffff" opacity="0.16" />
        <path d="M 88 45 C 115 45 135 65 128 85 C 120 65 105 55 88 45 Z" fill={_AO} opacity="0.16" />
        <path d="M 88 45 C 50 35 10 50 0 75" fill="none" stroke="#0f172a" strokeWidth="1" opacity="0.35" />
        <path d="M 88 45 C 60 15 30 15 20 30" fill="none" stroke="#bbf7d0" strokeWidth="1.2" opacity="0.4" />

        {/* Arching Palm Fronds (Tán lá dừa cong vút) */}
        {/* Frond 1 (Left) */}
        <path d="M 88 45 C 50 35, 10 50, 0 75 C 20 60, 55 52, 88 45 Z" fill="#15803d" stroke="#14532d" strokeWidth="1.5" />
        {/* Frond 2 (Up-Left) */}
        <path d="M 88 45 C 60 15, 30 15, 20 30 C 40 25, 68 28, 88 45 Z" fill="#16a34a" stroke="#14532d" strokeWidth="1.5" />
        {/* Frond 3 (Up-Right) */}
        <path d="M 88 45 C 100 10, 125 12, 130 35 C 118 24, 100 28, 88 45 Z" fill="#16a34a" stroke="#14532d" strokeWidth="1.5" />
        {/* Frond 4 (Right) */}
        <path d="M 88 45 C 115 45, 135 65, 128 85 C 120 65, 105 55, 88 45 Z" fill="#15803d" stroke="#14532d" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// =========================================================================
// 10. TỦ SERVER RACK ĐÈN LED (ENTERPRISE 42U SERVER RACK FOR DEV DEN)
// =========================================================================
function _Raw_ServerRackSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 75 * scale, height: 130 * scale }}>
      <svg viewBox="0 0 75 130" width={75 * scale} height={130 * scale} className="overflow-visible">
        {/* Bóng AO dưới tủ rack (đèn trên-trái) */}
        {_ao('rackAO', 41, 125, 37, 6, 0.3)}
        {/* Metal Cabinet Outer Frame */}
        <rect x="5" y="5" width="65" height="120" fill="#0f172a" stroke="#334155" strokeWidth="2.5" rx="3" />
        <rect x="8" y="8" width="59" height="114" fill="#020617" />

        {/* 6 Server Blades */}
        {Array.from({ length: 6 }).map((_, i) => (
          <g key={i}>
            <rect x="11" y={14 + i * 18} width="53" height="15" fill="#1e293b" stroke="#334155" strokeWidth="1" rx="1" />
            {/* Ventilation slits */}
            <line x1="28" y1={18 + i * 18} x2="48" y2={18 + i * 18} stroke="#0f172a" strokeWidth="1.5" />
            <line x1="28" y1={23 + i * 18} x2="48" y2={23 + i * 18} stroke="#0f172a" strokeWidth="1.5" />
            {/* Blinking LEDs */}
            <circle cx="16" cy={21 + i * 18} r="1.5" fill="#22c55e" className="animate-ping" style={{ animationDuration: `${1.5 + (i % 3) * 0.5}s` }} />
            <circle cx="21" cy={21 + i * 18} r="1.5" fill={i % 2 === 0 ? '#38bdf8' : '#facc15'} />
            <circle cx="56" cy={21 + i * 18} r="1.2" fill="#22c55e" />
          </g>
        ))}

        {/* 2.5D — mặt phải tủ rack tối, mặt trên/đèn hắt sáng, chân đế chạm sàn */}
        <rect x="62" y="5" width="8" height="120" fill={_AO} opacity="0.26" />
        <rect x="5" y="5" width="65" height="4" fill="#ffffff" opacity="0.14" />
        <rect x="7" y="123" width="61" height="2" fill="#ffffff" opacity="0.08" />
        <rect x="8" y="125" width="10" height="4" fill="#020617" />
        <rect x="57" y="125" width="10" height="4" fill="#020617" />
      </svg>
    </div>
  );
}

// =========================================================================
// 11. BÀN LÀM VIỆC DUAL MONITOR (DEVELOPER WORKSTATION FOR DEV DEN)
// =========================================================================
function _Raw_DevWorkstationSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 140 * scale, height: 100 * scale }}>
      <svg viewBox="0 0 140 100" width={140 * scale} height={100 * scale} className="overflow-visible">
        {/* Bóng AO dưới 2 chân bàn (đèn trên-trái) */}
        {_ao('deskAO', 73, 96, 62, 6, 0.26)}
        {/* Desk Surface */}
        <rect x="10" y="60" width="120" height="8" fill="#b45309" stroke="#78350f" strokeWidth="1.5" rx="1" />
        {/* Metal Legs */}
        <rect x="16" y="68" width="6" height="28" fill="#334155" />
        <rect x="118" y="68" width="6" height="28" fill="#334155" />

        {/* Monitor 1 (Left - Code IDE with Syntax) */}
        <g>
          <rect x="22" y="18" width="44" height="32" fill="#0f172a" stroke="#64748b" strokeWidth="2" rx="2" />
          {/* Code lines */}
          <line x1="26" y1="24" x2="42" y2="24" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="26" y1="29" x2="52" y2="29" stroke="#4ade80" strokeWidth="1.5" />
          <line x1="30" y1="34" x2="60" y2="34" stroke="#facc15" strokeWidth="1.5" />
          <line x1="30" y1="39" x2="48" y2="39" stroke="#f43f5e" strokeWidth="1.5" />
          <line x1="26" y1="44" x2="38" y2="44" stroke="#a855f7" strokeWidth="1.5" />
          {/* Monitor Stand */}
          <rect x="41" y="50" width="6" height="10" fill="#475569" />
          <rect x="35" y="58" width="18" height="2" fill="#475569" rx="1" />
        </g>

        {/* Monitor 2 (Right - Terminal / Status) */}
        <g>
          <rect x="74" y="18" width="44" height="32" fill="#020617" stroke="#64748b" strokeWidth="2" rx="2" />
          <line x1="78" y1="24" x2="96" y2="24" stroke="#22c55e" strokeWidth="1.5" />
          <line x1="78" y1="30" x2="110" y2="30" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="78" y1="36" x2="102" y2="36" stroke="#e2e8f0" strokeWidth="1.5" />
          <circle cx="82" cy="42" r="1.5" fill="#22c55e" className="animate-ping" />
          {/* Monitor Stand */}
          <rect x="93" y="50" width="6" height="10" fill="#475569" />
          <rect x="87" y="58" width="18" height="2" fill="#475569" rx="1" />
        </g>

        {/* 2.5D — mặt bàn sáng trên, mặt cạnh trước tối; chân bàn & màn hình có mặt bên */}
        <rect x="10" y="60" width="120" height="2.5" fill="#ffffff" opacity="0.18" />
        <rect x="10" y="64" width="120" height="4" fill={_AO} opacity="0.24" />
        <rect x="120" y="68" width="4" height="28" fill={_AO} opacity="0.3" />
        <rect x="16" y="68" width="2.5" height="28" fill="#ffffff" opacity="0.14" />
        <rect x="60" y="18" width="6" height="32" fill={_AO} opacity="0.22" />
        <rect x="112" y="18" width="6" height="32" fill={_AO} opacity="0.22" />
        <rect x="22" y="18" width="3" height="32" fill="#ffffff" opacity="0.12" />
        <rect x="74" y="18" width="3" height="32" fill="#ffffff" opacity="0.12" />

        {/* Mechanical RGB Keyboard & Mouse */}
        <rect x="52" y="62" width="28" height="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" rx="1" />
        <rect x="84" y="63" width="6" height="4" fill="#0f172a" rx="1" />
      </svg>
    </div>
  );
}

function _Raw_CrystalCastleSVG({ className = '', scale = 1.4 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 150 * scale, height: 160 * scale }}>
      <svg viewBox="0 0 150 160" width={150 * scale} height={160 * scale} className="overflow-visible drop-shadow-2xl">
        <defs>
          <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="spireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>

        {/* Floating Cloud Base */}
        <g className="animate-pulse" style={{ animationDuration: '4s' }}>
          <ellipse cx="75" cy="148" rx="75" ry="16" fill="#ffffff" opacity="0.95" />
          <ellipse cx="35" cy="142" rx="32" ry="14" fill="#e0e7ff" opacity="0.9" />
          <ellipse cx="115" cy="142" rx="32" ry="14" fill="#e0e7ff" opacity="0.9" />
          <ellipse cx="75" cy="154" rx="40" ry="10" fill="#c7d2fe" opacity="0.7" />
        </g>

        {/* Castle Walls with Crystal Gradient */}
        <rect x="42" y="65" width="66" height="79" fill="url(#crystalGrad)" stroke="#3730a3" strokeWidth="2" rx="2" />
        {/* Wall segments / battlements */}
        <path d="M 42 65 L 48 55 L 54 65 L 60 55 L 66 65 L 72 55 L 78 65 L 84 55 L 90 65 L 96 55 L 102 65 L 108 55" fill="none" stroke="#3730a3" strokeWidth="2" />
        <polygon points="42,65 48,55 54,65 60,55 66,65 72,55 78,65 84,55 90,65 96,55 102,65 108,55 108,65" fill="#c7d2fe" />
        
        {/* Crystal Facets */}
        <line x1="64" y1="65" x2="64" y2="144" stroke="#6366f1" strokeWidth="1.5" />
        <line x1="86" y1="65" x2="86" y2="144" stroke="#6366f1" strokeWidth="1.5" />
        <path d="M 42 100 L 108 100" stroke="#6366f1" strokeWidth="1.5" opacity="0.5" />

        {/* Central Tall Spire with Golden Peak */}
        <polygon points="62,65 75,12 88,65" fill="url(#spireGrad)" stroke="#312e81" strokeWidth="2" strokeLinejoin="round" />
        <line x1="75" y1="12" x2="75" y2="65" stroke="#4f46e5" strokeWidth="1.5" />
        {/* Golden top */}
        <polygon points="71,20 75,6 79,20" fill="url(#goldGrad)" stroke="#a16207" strokeWidth="1" />
        <circle cx="75" cy="6" r="3" fill="#facc15" className="animate-ping" style={{ animationDuration: '2s' }} />
        <circle cx="75" cy="6" r="1.5" fill="#ffffff" />

        {/* Left Turret Tower */}
        <rect x="20" y="75" width="26" height="69" fill="url(#spireGrad)" stroke="#312e81" strokeWidth="2" />
        <line x1="33" y1="75" x2="33" y2="144" stroke="#4f46e5" strokeWidth="1.5" />
        <polygon points="18,75 33,30 48,75" fill="#a5b4fc" stroke="#4f46e5" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="30,40 33,30 36,40" fill="url(#goldGrad)" />

        {/* Right Turret Tower */}
        <rect x="104" y="75" width="26" height="69" fill="url(#spireGrad)" stroke="#312e81" strokeWidth="2" />
        <line x1="117" y1="75" x2="117" y2="144" stroke="#4f46e5" strokeWidth="1.5" />
        <polygon points="102,75 117,30 132,75" fill="#a5b4fc" stroke="#4f46e5" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="114,40 117,30 120,40" fill="url(#goldGrad)" />

        {/* 2.5D — mặt phải khối tháp tối, mặt trái tháp sáng, mây nền có chiều sâu */}
        <rect x="90" y="65" width="18" height="79" fill={_AO} opacity="0.18" />
        <rect x="42" y="65" width="6" height="79" fill="#ffffff" opacity="0.14" />
        <polygon points="75,12 88,65 75,65" fill={_AO} opacity="0.18" />
        <polygon points="62,65 75,12 75,65" fill="#ffffff" opacity="0.14" />
        <polygon points="33,30 48,75 33,75" fill={_AO} opacity="0.16" />
        <polygon points="18,75 33,30 33,75" fill="#ffffff" opacity="0.12" />
        <polygon points="117,30 132,75 117,75" fill={_AO} opacity="0.18" />
        <polygon points="102,75 117,30 117,75" fill="#ffffff" opacity="0.1" />
        <rect x="38" y="75" width="8" height="69" fill={_AO} opacity="0.2" />
        <rect x="122" y="75" width="8" height="69" fill={_AO} opacity="0.24" />
        <ellipse cx="75" cy="157" rx="72" ry="8" fill={_AO} opacity="0.12" />
        <ellipse cx="55" cy="140" rx="46" ry="9" fill="#ffffff" opacity="0.16" />

        {/* Floating Crystals */}
        <g className="animate-bounce" style={{ animationDuration: '3.5s' }}>
          <polygon points="15,60 18,50 21,60 18,70" fill="#c7d2fe" />
          <polygon points="135,50 140,35 145,50 140,65" fill="#e0e7ff" />
        </g>

        {/* Grand Gold Arch Gate */}
        <path d="M 60 144 L 60 105 Q 75 90 90 105 L 90 144 Z" fill="url(#goldGrad)" stroke="#854d0e" strokeWidth="2.5" />
        {/* Gate Bars */}
        <line x1="68" y1="100" x2="68" y2="144" stroke="#a16207" strokeWidth="2" />
        <line x1="75" y1="97" x2="75" y2="144" stroke="#a16207" strokeWidth="2" />
        <line x1="82" y1="100" x2="82" y2="144" stroke="#a16207" strokeWidth="2" />
        {/* Glowing portal effect */}
        <path d="M 64 144 L 64 105 Q 75 95 86 105 L 86 144 Z" fill="#ffffff" opacity="0.4" className="animate-pulse" />
      </svg>
    </div>
  );
}

// =========================================================================
// 13. SÂN BÓNG CHUYỀN BÃI BIỂN (BEACH VOLLEYBALL COURT WITH NET & BALL)
// =========================================================================
function _Raw_BeachVolleyballSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 140 * scale, height: 90 * scale }}>
      <svg viewBox="0 0 140 90" width={140 * scale} height={90 * scale} className="overflow-visible">
        {/* Ground shadow on sand: AO 2 lớp + quầng cát lún (đèn trên-trái) */}
        {_ao('volleyAO', 73, 84, 64, 7, 0.26)}

        {/* Sand Boundary Lines */}
        <polygon points="12,82 128,82 122,86 18,86" fill="#f59e0b" opacity="0.6" />

        {/* Left Wooden Net Post */}
        <rect x="14" y="16" width="5" height="68" fill="#78350f" stroke="#451a03" strokeWidth="1.2" rx="1" />
        <rect x="13" y="14" width="7" height="3" fill="#ca8a04" rx="1" />
        {/* Tension Guy Wire Left */}
        <line x1="16" y1="20" x2="4" y2="82" stroke="#64748b" strokeWidth="1" strokeDasharray="2 1" />

        {/* Right Wooden Net Post */}
        <rect x="121" y="16" width="5" height="68" fill="#78350f" stroke="#451a03" strokeWidth="1.2" rx="1" />
        <rect x="120" y="14" width="7" height="3" fill="#ca8a04" rx="1" />
        {/* Tension Guy Wire Right */}
        <line x1="123" y1="20" x2="135" y2="82" stroke="#64748b" strokeWidth="1" strokeDasharray="2 1" />

        {/* Volleyball Net Texture */}
        {/* Top White Canvas Band */}
        <rect x="19" y="24" width="102" height="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
        <line x1="19" y1="26" x2="121" y2="26" stroke="#ef4444" strokeWidth="1" />

        {/* Semi-transparent Net Grid */}
        <rect x="19" y="28" width="102" height="26" fill="rgba(255,255,255,0.15)" stroke="#94a3b8" strokeWidth="0.8" />
        {/* Horizontal Net Strings */}
        {[34, 40, 46, 52].map((y) => (
          <line key={y} x1="19" y1={y} x2="121" y2={y} stroke="rgba(255,255,255,0.85)" strokeWidth="0.8" />
        ))}
        {/* Vertical Net Strings */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1={27 + i * 8} y1="28" x2={27 + i * 8} y2="54" stroke="rgba(255,255,255,0.75)" strokeWidth="0.8" />
        ))}
        {/* Bottom Black Net Band */}
        <line x1="19" y1="54" x2="121" y2="54" stroke="#475569" strokeWidth="1.2" />

        {/* 3-Stripe Beach Volleyball (Bouncing high over net) */}
        <g className="animate-bounce" style={{ animationDuration: '1.4s' }}>
          <ellipse cx="70" cy="14" rx="8" ry="8" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
          <path d="M 64 10 Q 70 14 68 21" stroke="#3b82f6" strokeWidth="2.5" fill="none" />
          <path d="M 72 7 Q 72 15 76 19" stroke="#eab308" strokeWidth="2.5" fill="none" />
          <circle cx="68" cy="11" r="1.5" fill="#ffffff" opacity="0.8" />
        </g>

        {/* Beach Accessories: Striped Towel & Cold Drink */}
        <rect x="96" y="78" width="22" height="7" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" rx="1" />
        <line x1="102" y1="78" x2="102" y2="85" stroke="#ffffff" strokeWidth="1.5" />
        <line x1="110" y1="78" x2="110" y2="85" stroke="#ffffff" strokeWidth="1.5" />
        {/* Lemonade bottle */}
        <rect x="90" y="74" width="3.5" height="8" fill="#facc15" stroke="#ca8a04" strokeWidth="0.6" rx="0.5" />
        {/* 2.5D GROUND — mặt cát nghiêng: sáng trái-trên → tối phải-dưới, bóng lưới + mặt cột */}
        <defs>
          <linearGradient id="sandPlaneGrad" x1="10%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="45%" stopColor="#f59e0b" stopOpacity="0" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <polygon points="12,82 128,82 122,86 18,86" fill="url(#sandPlaneGrad)" />
        <path d="M 20 82 L 120 82 L 115 84.5 L 25 84.5 Z" fill={_AO} opacity="0.16" />
        <rect x="16" y="16" width="3" height="68" fill={_AO} opacity="0.26" />
        <rect x="14" y="16" width="1.6" height="68" fill="#ffffff" opacity="0.24" />
        <rect x="123" y="16" width="3" height="68" fill={_AO} opacity="0.26" />
        <rect x="121" y="16" width="1.6" height="68" fill="#ffffff" opacity="0.24" />
        <line x1="91" y1="72" x2="91" y2="74" stroke="#ef4444" strokeWidth="1" />
      </svg>
    </div>
  );
}

// =========================================================================
// 14. QUẦY TIKI BAR MÁI LÁ CỌ NHIỆT ĐỚI (TROPICAL TIKI BAR & SURFBOARD)
// =========================================================================
function _Raw_TikiBarCabanaSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 145 * scale, height: 115 * scale }}>
      <svg viewBox="0 0 145 115" width={145 * scale} height={115 * scale} className="overflow-visible">
        {/* Ground shadow on sand: AO 2 lớp (đèn trên-trái) */}
        {_ao('tikiAO', 75, 107, 68, 8, 0.28)}

        {/* Leaning Tropical Surfboard (Left side) */}
        <g transform="rotate(-14 22 90)">
          <ellipse cx="22" cy="62" rx="7" ry="32" fill="#06b6d4" stroke="#0891b2" strokeWidth="1.5" />
          <path d="M 22 30 L 22 94" stroke="#facc15" strokeWidth="2.5" />
          {/* Hibiscus flower print */}
          <circle cx="22" cy="55" r="3" fill="#f43f5e" />
          <circle cx="22" cy="55" r="1" fill="#fef08a" />
        </g>

        {/* 2 Bamboo Bar Stools */}
        {/* Left Stool */}
        <ellipse cx="46" cy="98" rx="10" ry="3.5" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
        <line x1="40" y1="98" x2="38" y2="108" stroke="#854d0e" strokeWidth="2" />
        <line x1="52" y1="98" x2="54" y2="108" stroke="#854d0e" strokeWidth="2" />
        <ellipse cx="46" cy="92" rx="9" ry="3.5" fill="#f43f5e" stroke="#be123c" strokeWidth="1.2" />

        {/* Right Stool */}
        <ellipse cx="102" cy="98" rx="10" ry="3.5" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
        <line x1="96" y1="98" x2="94" y2="108" stroke="#854d0e" strokeWidth="2" />
        <line x1="108" y1="98" x2="110" y2="108" stroke="#854d0e" strokeWidth="2" />
        <ellipse cx="102" cy="92" rx="9" ry="3.5" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />

        {/* Bamboo Bar Counter Legs & Front Panel */}
        <rect x="36" y="62" width="76" height="42" fill="#d97706" stroke="#78350f" strokeWidth="2" rx="2" />
        {/* Vertical Bamboo Canes */}
        {Array.from({ length: 9 }).map((_, i) => (
          <g key={i}>
            <rect x={39 + i * 8} y="64" width="6" height="38" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" rx="1" />
            <line x1={39 + i * 8} y1="74" x2={45 + i * 8} y2="74" stroke="#78350f" strokeWidth="1" />
            <line x1={39 + i * 8} y1="88" x2={45 + i * 8} y2="88" stroke="#78350f" strokeWidth="1" />
          </g>
        ))}

        {/* Polished Hardwood Countertop */}
        <rect x="30" y="56" width="88" height="8" fill="#78350f" stroke="#451a03" strokeWidth="1.5" rx="2" />
        <rect x="32" y="57" width="84" height="2.5" fill="#92400e" />

        {/* Counter Drinks: Fresh Coconut & Tropical Cocktail */}
        {/* Green Coconut with Straw */}
        <circle cx="48" cy="52" r="5" fill="#15803d" stroke="#166534" strokeWidth="1" />
        <ellipse cx="48" cy="49" rx="3.5" ry="1.5" fill="#fef08a" />
        <line x1="48" y1="49" x2="52" y2="42" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
        {/* Cocktail Glass with Umbrella */}
        <polygon points="98,55 104,55 102,48 100,48" fill="#f97316" stroke="#c2410c" strokeWidth="0.8" />
        <line x1="101" y1="48" x2="105" y2="40" stroke="#facc15" strokeWidth="1" />
        <polygon points="102,42 108,38 106,44" fill="#ec4899" />

        {/* 2 Heavy Timber Roof Poles */}
        <rect x="36" y="16" width="5" height="42" fill="#78350f" stroke="#451a03" strokeWidth="1.2" />
        <rect x="107" y="16" width="5" height="42" fill="#78350f" stroke="#451a03" strokeWidth="1.2" />

        {/* Straw Thatched Roof (Mái lá cọ xếp lớp) */}
        <polygon points="18,34 74,4 130,34" fill="#ca8a04" stroke="#854d0e" strokeWidth="2" />
        <polygon points="24,32 74,8 124,32" fill="#eab308" />
        {/* Straw fringe serrations */}
        <path
          d="M 16 34 Q 24 38 32 34 Q 40 38 48 34 Q 56 38 64 34 Q 74 38 84 34 Q 94 38 104 34 Q 114 38 124 34 Q 132 38 134 34"
          fill="none"
          stroke="#854d0e"
          strokeWidth="2"
        />

        {/* 2.5D — quầy: mặt phải tối, mặt trên quầy nắng; mái tranh 2 mặt; trụ nghiêng sáng tối */}
        <rect x="100" y="62" width="12" height="42" fill={_AO} opacity="0.2" />
        <rect x="36" y="62" width="4" height="42" fill="#ffffff" opacity="0.12" />
        <rect x="30" y="56" width="88" height="2.6" fill="#ffffff" opacity="0.18" />
        <rect x="30" y="61.4" width="88" height="2.6" fill={_AO} opacity="0.22" />
        <polygon points="74,4 130,34 74,34" fill={_AO} opacity="0.17" />
        <polygon points="18,34 74,4 74,11 26,31" fill="#ffffff" opacity="0.18" />
        <rect x="109" y="16" width="3" height="42" fill={_AO} opacity="0.28" />
        <rect x="36" y="16" width="1.8" height="42" fill="#ffffff" opacity="0.22" />
        <ellipse cx="46" cy="108" rx="12" ry="4" fill={_AO} opacity="0.2" />
        <ellipse cx="102" cy="108" rx="12" ry="4" fill={_AO} opacity="0.2" />

        {/* Hanging Wooden Sign: TIKI BAR */}
        <rect x="52" y="24" width="44" height="11" fill="#78350f" stroke="#ca8a04" strokeWidth="1" rx="1.5" />
        <text x="74" y="32.5" textAnchor="middle" fill="#fef08a" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
          TIKI BAR
        </text>
      </svg>
    </div>
  );
}

// =========================================================================
// 15. LÂU ĐÀI CÁT & ĐỐNG LỬA TRẠI (SANDCASTLE & BONFIRE CAMPING)
// =========================================================================
function _Raw_SandcastleBonfireSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 135 * scale, height: 90 * scale }}>
      <svg viewBox="0 0 130 85" width={130 * scale} height={85 * scale} className="overflow-visible">
        {/* Ground shadow on sand: AO 2 lớp (đèn trên-trái) */}
        {_ao('castleAO', 68, 79, 62, 7, 0.28)}

        {/* ================= LEFT: CAMPFIRE / LỬA TRẠI ================= */}
        {/* Stone Fire Ring */}
        <g>
          {/* Circular stones */}
          {[
            { cx: 18, cy: 74 },
            { cx: 28, cy: 76 },
            { cx: 38, cy: 75 },
            { cx: 44, cy: 71 },
            { cx: 38, cy: 67 },
            { cx: 26, cy: 66 },
            { cx: 16, cy: 69 },
          ].map((st, i) => (
            <ellipse key={i} cx={st.cx} cy={st.cy} rx="5" ry="3.5" fill="#475569" stroke="#1e293b" strokeWidth="1" />
          ))}
          {/* Hot Glowing Embers */}
          <ellipse cx="28" cy="71" rx="11" ry="4" fill="#ea580c" />

          {/* Wooden Logs criss-crossed */}
          <line x1="18" y1="74" x2="38" y2="67" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="38" y1="74" x2="18" y2="67" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />

          {/* Dynamic Animated Pixel Fire Flames */}
          <g className="animate-pulse" style={{ animationDuration: '1s' }}>
            {/* Outer flame (Red-Orange) */}
            <path d="M 22 71 Q 20 54 28 42 Q 36 54 34 71 Z" fill="#f97316" />
            {/* Mid flame (Yellow) */}
            <path d="M 24 71 Q 23 58 28 48 Q 33 58 32 71 Z" fill="#facc15" />
            {/* Core hot flame (White-Yellow) */}
            <path d="M 26 71 Q 25 64 28 56 Q 31 64 30 71 Z" fill="#fef08a" />
          </g>

          {/* Drifting Spark Embers */}
          <circle cx="27" cy="38" r="1.5" fill="#facc15" className="animate-ping" style={{ animationDuration: '1.8s' }} />
          <circle cx="33" cy="32" r="1" fill="#ea580c" className="animate-ping" style={{ animationDuration: '2.3s' }} />
        </g>

        {/* ================= RIGHT: MULTI-TOWER SANDCASTLE ================= */}
        <g>
          {/* Main Castle Keep Tower */}
          <rect x="74" y="44" width="30" height="34" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" rx="1" />
          {/* Crenellated battlements */}
          <rect x="73" y="38" width="6" height="7" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
          <rect x="83" y="38" width="6" height="7" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
          <rect x="93" y="38" width="6" height="7" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
          <rect x="103" y="38" width="4" height="7" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />

          {/* Arched Gate */}
          <path d="M 84 78 L 84 62 Q 89 57 94 62 L 94 78 Z" fill="#a16207" stroke="#713f12" strokeWidth="1.2" />

          {/* Left Flanking Spire */}
          <rect x="62" y="52" width="14" height="26" fill="#eab308" stroke="#ca8a04" strokeWidth="1.2" rx="1" />
          <polygon points="60,52 69,32 78,52" fill="#fde047" stroke="#ca8a04" strokeWidth="1.2" />

          {/* Right Flanking Spire with Red Pirate Flag */}
          <rect x="102" y="52" width="14" height="26" fill="#eab308" stroke="#ca8a04" strokeWidth="1.2" rx="1" />
          <polygon points="100,52 109,32 118,52" fill="#fde047" stroke="#ca8a04" strokeWidth="1.2" />
          {/* Flagpole & Red Pennant */}
          <line x1="109" y1="32" x2="109" y2="18" stroke="#78350f" strokeWidth="1.2" />
          <polygon points="109,19 123,24 109,29" fill="#ef4444" />

          {/* 2.5D — lâu đài cát: mặt phải các khối tối, viền trên nắng; nền cát phân lớp sáng tối */}
          <defs>
            <linearGradient id="sandDuneGrad" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="50%" stopColor="#eab308" stopOpacity="0" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <rect x="0" y="70" width="130" height="15" fill="url(#sandDuneGrad)" />
          <ellipse cx="30" cy="77" rx="20" ry="6" fill={_AO} opacity="0.2" />
          <rect x="94" y="44" width="10" height="34" fill={_AO} opacity="0.2" />
          <rect x="74" y="44" width="30" height="3" fill="#ffffff" opacity="0.24" />
          <polygon points="69,32 78,52 69,52" fill={_AO} opacity="0.18" />
          <polygon points="60,52 69,32 69,52" fill="#ffffff" opacity="0.2" />
          <polygon points="109,32 118,52 109,52" fill={_AO} opacity="0.22" />
          <polygon points="100,52 109,32 109,52" fill="#ffffff" opacity="0.16" />
          <rect x="62" y="52" width="4" height="26" fill="#ffffff" opacity="0.16" />

          {/* Starfish and Spiral Conch Shell in the Sand */}
          {/* Pink Starfish */}
          <polygon
            points="58,74 59,71 61,71 60,73 61,75 58,74"
            fill="#f43f5e"
            stroke="#e11d48"
            strokeWidth="0.6"
            transform="scale(1.8) translate(-22 -31)"
          />
          {/* Conch Shell */}
          <ellipse cx="118" cy="76" rx="4" ry="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
          <circle cx="119" cy="76" r="1.5" fill="#fed7aa" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 16A. ĐẠI DƯƠNG TRÀN HÀNG NGANG & SÓNG BIỂN NHIỆT ĐỚI (FULL-WIDTH COASTAL OCEAN)
// =========================================================================
function _Raw_FullWidthOceanWavesSVG({ className = '', height = 120 }: { className?: string; height?: number }) {
  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`} style={{ height }}>
      {/* Background deep ocean gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0369a1] via-[#0284c7] to-[#38bdf8]" />

      {/* 2.5D GROUND — mặt nước phân lớp: phía xa hơi trắng (haze), chân khung hình tối hơn */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 52%, rgba(2,6,23,0.10) 78%, rgba(2,6,23,0.26) 100%)',
        }}
      />

      {/* SVG Waves and Ocean Elements spanning 100% width */}
      <svg
        viewBox="0 0 800 110"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {/* Layer 1: Distant Deep Blue Swell */}
        <path
          d="M 0 42 Q 100 32 200 42 Q 300 52 400 42 Q 500 32 600 42 Q 700 52 800 42 L 800 110 L 0 110 Z"
          fill="#0284c7"
          opacity="0.8"
        />

        {/* Layer 2: Mid-ocean Turquoise Wave */}
        <path
          d="M 0 58 Q 100 70 200 58 Q 300 46 400 58 Q 500 70 600 58 Q 700 46 800 58 L 800 110 L 0 110 Z"
          fill="#0ea5e9"
          opacity="0.9"
        />
        <path
          d="M 0 58 Q 100 70 200 58 Q 300 46 400 58 Q 500 70 600 58 Q 700 46 800 58"
          fill="none"
          stroke="#e0f2fe"
          strokeWidth="2"
          opacity="0.8"
        />

        {/* Layer 3: Shorebreak Wave with White Seafoam */}
        <path
          d="M 0 78 Q 100 66 200 78 Q 300 90 400 78 Q 500 66 600 78 Q 700 90 800 78 L 800 110 L 0 110 Z"
          fill="#38bdf8"
        />
        {/* Foamy wave crest */}
        <path
          d="M 0 78 Q 100 66 200 78 Q 300 90 400 78 Q 500 66 600 78 Q 700 90 800 78"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Lăn tăn bọt sóng mép bờ biển (Water shoreline wash) */}
        <path
          d="M 0 96 Q 80 88 160 96 Q 240 104 320 96 Q 400 88 480 96 Q 560 104 640 96 Q 720 88 800 96 L 800 110 L 0 110 Z"
          fill="#7dd3fc"
          opacity="0.75"
        />
        <path
          d="M 0 96 Q 80 88 160 96 Q 240 104 320 96 Q 400 88 480 96 Q 560 104 640 96 Q 720 88 800 96"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeDasharray="6 3"
        />
      </svg>

      {/* Floating Interactive Elements: Sailboat, Dolphins, Seagulls positioned across width */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Cruising Sailboat (Gentle Rocking) */}
        <div className="absolute left-[50%] top-[12%] transform -translate-x-1/2 animate-bounce" style={{ animationDuration: '4s' }}>
          <svg width="68" height="52" viewBox="0 0 68 52">
            <polygon points="8,38 58,38 52,48 16,48" fill="#78350f" stroke="#451a03" strokeWidth="1.2" />
            <line x1="12" y1="41" x2="54" y2="41" stroke="#ca8a04" strokeWidth="1" />
            <line x1="36" y1="38" x2="36" y2="6" stroke="#451a03" strokeWidth="1.8" />
            <polygon points="36,10 56,35 36,35" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="36" y1="22" x2="50" y2="35" stroke="#0284c7" strokeWidth="2.5" />
            <polygon points="34,12 12,35 34,35" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
            <polygon points="36,6 26,8 36,11" fill="#ef4444" />
          </svg>
        </div>

        {/* Leaping Dolphin 1 */}
        <div className="absolute left-[24%] top-[34%] animate-pulse" style={{ animationDuration: '3s' }}>
          <svg width="42" height="28" viewBox="0 0 42 28">
            <path d="M 6 22 Q 18 4 34 16 Q 22 18 14 26 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
            <polygon points="10,22 4,18 6,24" fill="#38bdf8" />
            <circle cx="28" cy="14" r="1.2" fill="#0f172a" />
          </svg>
        </div>

        {/* Leaping Dolphin 2 (Baby Dolphin) */}
        <div className="absolute left-[78%] top-[26%] animate-pulse" style={{ animationDuration: '3.6s' }}>
          <svg width="28" height="20" viewBox="0 0 42 28">
            <path d="M 6 22 Q 18 4 34 16 Q 22 18 14 26 Z" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" />
            <polygon points="10,22 4,18 6,24" fill="#bae6fd" />
            <circle cx="28" cy="14" r="1.2" fill="#0f172a" />
          </svg>
        </div>

        {/* Soaring Seagulls */}
        <div className="absolute left-[36%] top-[10%]">
          <svg width="32" height="14" viewBox="0 0 32 14">
            <path d="M 2 8 Q 8 2 14 8 Q 20 2 26 8" fill="none" stroke="#ffffff" strokeWidth="1.8" />
          </svg>
        </div>
        <div className="absolute left-[68%] top-[14%] opacity-85">
          <svg width="24" height="10" viewBox="0 0 32 14">
            <path d="M 2 8 Q 8 2 14 8 Q 20 2 26 8" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 16. THUYỀN BUỒM & SÓNG BIỂN LƯỚT SÓNG (SAILBOAT & TROPICAL OCEAN WAVES)
// =========================================================================
function _Raw_SailboatWavesSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 175 * scale, height: 75 * scale }}>
      <svg viewBox="0 0 175 75" width={175 * scale} height={75 * scale} className="overflow-visible">
        {/* Layer 1: Back Deep Ocean Wave */}
        <path
          d="M 0 45 Q 30 36 60 45 Q 90 54 120 45 Q 150 36 175 45 L 175 75 L 0 75 Z"
          fill="#0284c7"
          opacity="0.85"
        />

        {/* Leaping Dolphin */}
        <g className="animate-pulse" style={{ animationDuration: '3s' }}>
          <path d="M 28 36 Q 38 22 52 32 Q 42 34 36 44 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
          <polygon points="30,36 24,32 26,38" fill="#38bdf8" />
          <circle cx="48" cy="30" r="1" fill="#0f172a" />
        </g>

        {/* Cruising Sailboat (Gentle Rocking) */}
        <g className="animate-bounce" style={{ animationDuration: '3.5s' }}>
          {/* Wooden Boat Hull */}
          <polygon points="105,42 145,42 140,52 112,52" fill="#78350f" stroke="#451a03" strokeWidth="1.2" />
          <line x1="108" y1="45" x2="142" y2="45" stroke="#ca8a04" strokeWidth="1.2" />

          {/* Wooden Mast */}
          <line x1="126" y1="42" x2="126" y2="12" stroke="#451a03" strokeWidth="1.8" />

          {/* Main White Canvas Sail with Blue Stripe */}
          <polygon points="126,16 142,39 126,39" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="126" y1="28" x2="137" y2="39" stroke="#0284c7" strokeWidth="2.5" />

          {/* Jib Front Sail */}
          <polygon points="124,18 106,39 124,39" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />

          {/* Masthead Red Pennant Flag */}
          <polygon points="126,12 118,14 126,16" fill="#ef4444" />
        </g>

        {/* Layer 2: Front Cresting Ocean Wave with White Foam */}
        <path
          d="M 0 54 Q 35 44 70 54 Q 105 64 140 54 Q 160 48 175 54 L 175 75 L 0 75 Z"
          fill="#38bdf8"
        />
        {/* Seafoam Crests */}
        <path
          d="M 0 54 Q 35 44 70 54 Q 105 64 140 54 Q 160 48 175 54"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* 2.5D — mặt sóng: dưới crest tối (khối nước), trên crest có viền nắng (đèn trên-trái) */}
        <path
          d="M 0 54 Q 35 44 70 54 Q 105 64 140 54 Q 160 48 175 54 L 175 63 Q 160 57 140 63 Q 105 73 70 63 Q 35 53 0 63 Z"
          fill={_AO}
          opacity="0.14"
        />
        <path
          d="M 0 54 Q 35 44 70 54 Q 105 64 140 54 Q 160 48 175 54 L 175 50 Q 158 44 138 50 Q 105 60 70 50 Q 35 40 0 50 Z"
          fill="#ffffff"
          opacity="0.14"
        />
        <path
          d="M 0 45 Q 100 36 200 45 Q 300 54 400 45 L 400 50 Q 300 59 200 50 Q 100 41 0 50 Z"
          fill={_AO}
          opacity="0.1"
        />

        {/* 2 Soaring White Seagulls */}
        <path d="M 68 18 Q 72 14 76 18 Q 80 14 84 18" fill="none" stroke="#ffffff" strokeWidth="1.5" />
        <path d="M 88 12 Q 91 9 94 12 Q 97 9 100 12" fill="none" stroke="#ffffff" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

// =========================================================================
// 17. KỆ SÁCH THƯ VIỆN & THANG TRƯỢT (LIBRARY BOOKSHELF & ROLLING LADDER)
// =========================================================================
function _Raw_LibraryBookshelfSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 130 * scale, height: 145 * scale }}>
      <svg viewBox="0 0 130 145" width={130 * scale} height={145 * scale} className="overflow-visible">
        {/* Ground shadow: AO 2 lớp (đèn trên-trái) */}
        {_ao('shelfAO', 68, 139, 57, 6.5, 0.27)}

        {/* Dark Oak Bookshelf Cabinet Outer Frame */}
        <rect x="15" y="10" width="95" height="128" fill="#451a03" stroke="#291002" strokeWidth="2.5" rx="3" />
        {/* Shelves backing */}
        <rect x="18" y="14" width="89" height="120" fill="#78350f" />

        {/* Classical Crown Molding on top */}
        <polygon points="12,12 18,6 107,6 113,12" fill="#5c2c0e" stroke="#291002" strokeWidth="1.5" />

        {/* 4 Sturdy Horizontal Wooden Shelves */}
        {[42, 72, 102, 132].map((y) => (
          <rect key={y} x="16" y={y} width="93" height="5" fill="#92400e" stroke="#451a03" strokeWidth="1" />
        ))}

        {/* ================= SHELF 1 (TOP) ================= */}
        {/* Colorful Tech Books: Python, React, AI */}
        {[
          { x: 22, h: 22, c: '#0284c7', t: 'PY' },
          { x: 30, h: 25, c: '#22c55e', t: 'TS' },
          { x: 38, h: 20, c: '#e11d48', t: 'ENG' },
          { x: 45, h: 24, c: '#a855f7', t: 'AI' },
          { x: 53, h: 21, c: '#f59e0b', t: 'JS' },
        ].map((bk, i) => (
          <rect key={i} x={bk.x} y={42 - bk.h} width="7" height={bk.h} fill={bk.c} stroke="#1e293b" strokeWidth="0.8" rx="0.5" />
        ))}
        {/* Trailing Potted Ivy Plant on top-right */}
        <rect x="84" y="32" width="14" height="10" fill="#ea580c" stroke="#9a3412" strokeWidth="1" rx="1" />
        <circle cx="88" cy="28" r="4" fill="#16a34a" />
        <circle cx="94" cy="26" r="4.5" fill="#22c55e" />
        <path d="M 94 36 Q 98 44 96 50" stroke="#15803d" strokeWidth="1.2" fill="none" />

        {/* ================= SHELF 2 (MID-TOP) ================= */}
        {/* Stack of books leaning sideways */}
        {[
          { x: 22, h: 24, c: '#3b82f6' },
          { x: 29, h: 23, c: '#f97316' },
          { x: 36, h: 22, c: '#10b981' },
          { x: 43, h: 25, c: '#ec4899' },
          { x: 50, h: 20, c: '#6366f1' },
        ].map((bk, i) => (
          <rect key={i} x={bk.x} y={72 - bk.h} width="6.5" height={bk.h} fill={bk.c} stroke="#1e293b" strokeWidth="0.8" rx="0.5" />
        ))}
        {/* Vintage Desk Lamp casting warm light */}
        <polygon points="86,72 88,58 96,58 98,72" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />
        <ellipse cx="92" cy="58" rx="6" ry="2" fill="#fde047" />

        {/* ================= SHELF 3 (MID-BOTTOM) ================= */}
        {Array.from({ length: 9 }).map((_, i) => (
          <rect
            key={i}
            x={22 + i * 8}
            y={102 - 18 - (i % 3) * 3}
            width="6.5"
            height={18 + (i % 3) * 3}
            fill={['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea'][i % 5]}
            stroke="#0f172a"
            strokeWidth="0.8"
            rx="0.5"
          />
        ))}

        {/* ================= SHELF 4 (BOTTOM) ================= */}
        {/* Thick Manuals & Rolled Scrolls */}
        <rect x="24" y="112" width="22" height="20" fill="#0f172a" stroke="#334155" strokeWidth="1" rx="1" />
        <rect x="50" y="116" width="18" height="16" fill="#854d0e" stroke="#451a03" strokeWidth="1" rx="1" />
        <ellipse cx="80" cy="124" rx="4" ry="8" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />

        {/* 2.5D — tủ sách: mặt phải cabinet tối, viền trên crown molding nắng, bóng trong từng ngăn */}
        <rect x="100" y="10" width="10" height="128" fill={_AO} opacity="0.2" />
        <rect x="15" y="10" width="4" height="128" fill="#ffffff" opacity="0.12" />
        <polygon points="18,6 107,6 105,8.6 20,8.6" fill="#ffffff" opacity="0.18" />
        {[47, 77, 107].map((sy) => (
          <rect key={sy} x="18" y={sy} width="89" height="4" fill={_AO} opacity="0.2" />
        ))}
        <rect x="18" y="136" width="89" height="4" fill={_AO} opacity="0.24" />
        <ellipse cx="65" cy="140" rx="50" ry="5" fill={_AO} opacity="0.2" />

        {/* ================= POLISHED BRASS ROLLING LADDER ================= */}
        {/* Brass Rail across top */}
        <line x1="16" y1="22" x2="108" y2="22" stroke="#facc15" strokeWidth="2.5" />
        <circle cx="17" cy="22" r="2.5" fill="#ca8a04" />
        <circle cx="107" cy="22" r="2.5" fill="#ca8a04" />

        {/* Wooden Ladder angled on the right side */}
        <g>
          {/* Top Hooks on Rail */}
          <circle cx="68" cy="22" r="3" fill="#ca8a04" />
          <circle cx="82" cy="22" r="3" fill="#ca8a04" />

          {/* Left Ladder Stringer */}
          <line x1="68" y1="22" x2="60" y2="138" stroke="#ca8a04" strokeWidth="3" strokeLinecap="round" />
          {/* Right Ladder Stringer */}
          <line x1="82" y1="22" x2="74" y2="138" stroke="#ca8a04" strokeWidth="3" strokeLinecap="round" />

          {/* Ladder Rungs for Pet to climb */}
          {Array.from({ length: 6 }).map((_, i) => {
            const y = 38 + i * 17;
            const xL = 68 - (i + 1) * 1.3;
            const xR = 82 - (i + 1) * 1.3;
            return <line key={i} x1={xL} y1={y} x2={xR} y2={y} stroke="#fde047" strokeWidth="2" strokeLinecap="round" />;
          })}

          {/* Bottom Caster Wheels */}
          <circle cx="60" cy="138" r="2.5" fill="#475569" stroke="#1e293b" strokeWidth="1" />
          <circle cx="74" cy="138" r="2.5" fill="#475569" stroke="#1e293b" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 18. GHẾ LƯỜI BEANBAG & THẢM NORDIC (PLUSH BEANBAG & WOVEN NORDIC RUG)
// =========================================================================
function _Raw_BeanbagLoungeSVG({
  className = '',
  scale = 1,
  isBouncing = false,
}: {
  className?: string;
  scale?: number;
  isBouncing?: boolean;
}) {
  return (
    <div
      className={`relative inline-block select-none transition-transform duration-300 ${
        isBouncing ? 'scale-y-75 scale-x-125' : 'hover:scale-105'
      } ${className}`}
      style={{ width: 130 * scale, height: 95 * scale }}
    >
      <svg viewBox="0 0 130 95" width={130 * scale} height={95 * scale} className="overflow-visible">
        {/* Woven Nordic Rug Underneath */}
        <ellipse cx="65" cy="74" rx="60" ry="18" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
        <ellipse cx="65" cy="74" rx="52" ry="15" fill="#0284c7" opacity="0.2" />
        {/* Geometric Rug Fringe */}
        <ellipse cx="65" cy="74" rx="44" ry="12" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />

        {/* Soft Shadow of Beanbag: AO 2 lớp trên thảm (đèn trên-trái) */}
        {_ao('beanAO', 68, 78, 48, 12, 0.3)}

        {/* Plush Crimson / Rose Beanbag Main Body */}
        <path
          d="M 24 72 C 16 52, 28 26, 65 24 C 102 26, 114 52, 106 72 C 98 84, 32 84, 24 72 Z"
          fill="#f43f5e"
          stroke="#be123c"
          strokeWidth="2.5"
        />

        {/* Natural Sitting Depression & Cushion Wrinkles */}
        <path d="M 38 64 C 50 72, 80 72, 92 64" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 44 56 C 54 62, 76 62, 86 56" fill="none" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" />

        {/* Cozy Cat Plushie / Gấu bông mèo trên ghế */}
        <g>
          {/* Head & Ears */}
          <circle cx="50" cy="42" r="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <polygon points="44,38 46,31 49,37" fill="#fb7185" stroke="#e11d48" strokeWidth="0.8" />
          <polygon points="51,37 54,31 56,38" fill="#fb7185" stroke="#e11d48" strokeWidth="0.8" />
          {/* Sleeping Eyes */}
          <path d="M 46 42 Q 48 44 50 42" stroke="#475569" strokeWidth="0.8" fill="none" />
          <path d="M 50 42 Q 52 44 54 42" stroke="#475569" strokeWidth="0.8" fill="none" />
          <circle cx="50" cy="44" r="0.8" fill="#f43f5e" />
        </g>

        {/* Developer Over-Ear Headphones Draped on Side */}
        <g>
          <path d="M 72 36 Q 84 28 94 40" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="70" y="36" width="5" height="10" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" rx="2" />
          <rect x="91" y="40" width="5" height="10" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" rx="2" />
        </g>

        {/* 2.5D — khối ghế bành: mặt phải tối, viền trái-trên nắng, thảm có chiều sâu */}
        <path d="M 66 24 C 95 26 114 52 106 72 C 100 81 90 84 80 85 C 93 70 93 45 66 24 Z" fill={_AO} opacity="0.18" />
        <path d="M 24 72 C 16 52 28 26 65 24 C 45 31 33 50 35 75 Z" fill="#ffffff" opacity="0.16" />
        <ellipse cx="104" cy="80" rx="24" ry="10" fill={_AO} opacity="0.14" />
        <ellipse cx="30" cy="66" rx="22" ry="9" fill="#ffffff" opacity="0.35" />

        {/* Match Cup on wooden coaster */}
        <ellipse cx="112" cy="74" rx="8" ry="4" fill="#78350f" />
        <rect x="109" y="66" width="6" height="7" fill="#ffffff" stroke="#16a34a" strokeWidth="0.8" rx="1" />
        <ellipse cx="112" cy="67" rx="2.5" ry="1" fill="#22c55e" />
      </svg>
    </div>
  );
}

// =========================================================================
// 19. QUẦY CAFE ESPRESSO & PIZZA (ESPRESSO BAR & CHEESY PIZZA CORNER)
// =========================================================================
function _Raw_EspressoBarKitchenetteSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 135 * scale, height: 105 * scale }}>
      <svg viewBox="0 0 135 105" width={135 * scale} height={105 * scale} className="overflow-visible">
        {/* Ground shadow: AO 2 lớp (đèn trên-trái) */}
        {_ao('espressoAO', 70, 99, 62, 6.5, 0.26)}

        {/* Kitchenette Cabinet Base */}
        <rect x="18" y="56" width="100" height="42" fill="#334155" stroke="#1e293b" strokeWidth="2" rx="2" />
        {/* Cabinet Doors */}
        <rect x="22" y="60" width="45" height="34" fill="#475569" stroke="#1e293b" strokeWidth="1" rx="1" />
        <rect x="71" y="60" width="43" height="34" fill="#475569" stroke="#1e293b" strokeWidth="1" rx="1" />
        <circle cx="62" cy="76" r="1.5" fill="#facc15" />
        <circle cx="76" cy="76" r="1.5" fill="#facc15" />

        {/* Polished White Marble Countertop */}
        <rect x="14" y="50" width="108" height="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" rx="2" />

        {/* ================= LEFT: ITALIAN ESPRESSO MACHINE ================= */}
        {/* Machine Body */}
        <rect x="22" y="18" width="44" height="32" fill="#cbd5e1" stroke="#475569" strokeWidth="1.8" rx="2" />
        <rect x="26" y="22" width="36" height="12" fill="#94a3b8" rx="1" />

        {/* Circular Pressure Gauge */}
        <circle cx="44" cy="28" r="4" fill="#ffffff" stroke="#334155" strokeWidth="1" />
        <line x1="44" y1="28" x2="46" y2="26" stroke="#dc2626" strokeWidth="1" />

        {/* Portafilter Grouphead & Spout */}
        <rect x="36" y="34" width="16" height="4" fill="#334155" />
        <line x1="44" y1="38" x2="44" y2="44" stroke="#78350f" strokeWidth="1.5" />

        {/* Ceramic Espresso Cup Catching Coffee */}
        <rect x="40" y="42" width="8" height="8" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" rx="1" />
        <path d="M 48 44 Q 51 46 48 48" stroke="#94a3b8" strokeWidth="0.8" fill="none" />

        {/* Rising Animated Steam Puffs */}
        <circle cx="43" cy="38" r="2.5" fill="#ffffff" opacity="0.8" className="animate-ping" style={{ animationDuration: '2s' }} />
        <circle cx="45" cy="34" r="2" fill="#e2e8f0" opacity="0.7" className="animate-ping" style={{ animationDuration: '2.5s' }} />

        {/* Top Bean Hopper (Glass dome with coffee beans) */}
        <path d="M 30 18 Q 44 8 58 18 Z" fill="#64748b" stroke="#334155" strokeWidth="1" />
        <circle cx="38" cy="15" r="1.5" fill="#451a03" />
        <circle cx="44" cy="14" r="1.5" fill="#78350f" />
        <circle cx="50" cy="15" r="1.5" fill="#451a03" />

        {/* ================= RIGHT: FRESH HOT PIZZA ================= */}
        {/* Open Checkered Pizza Box */}
        <polygon points="74,50 114,50 118,42 78,42" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
        <rect x="74" y="46" width="40" height="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />

        {/* Delicious Pepperoni Pizza */}
        <ellipse cx="94" cy="46" rx="16" ry="7" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
        {/* Red Pepperoni Slices */}
        <ellipse cx="86" cy="46" rx="2.5" ry="1.5" fill="#dc2626" />
        <ellipse cx="94" cy="44" rx="3" ry="1.5" fill="#dc2626" />
        <ellipse cx="102" cy="46" rx="2.5" ry="1.5" fill="#dc2626" />
        <ellipse cx="94" cy="48" rx="2.5" ry="1.2" fill="#dc2626" />
        {/* Basil Leaves */}
        <circle cx="90" cy="48" r="1" fill="#16a34a" />
        <circle cx="98" cy="44" r="1" fill="#16a34a" />

        {/* 2.5D — quầy cafe: mặt phải tủ/máy tối, mặt trên bục marble & mặt bàn nắng */}
        <rect x="100" y="56" width="18" height="42" fill={_AO} opacity="0.2" />
        <rect x="18" y="56" width="4" height="42" fill="#ffffff" opacity="0.12" />
        <rect x="14" y="50" width="108" height="2.6" fill="#ffffff" opacity="0.22" />
        <rect x="14" y="55" width="108" height="3" fill={_AO} opacity="0.24" />
        <rect x="52" y="18" width="14" height="32" fill={_AO} opacity="0.18" />
        <rect x="22" y="18" width="44" height="3" fill="#ffffff" opacity="0.18" />
        <ellipse cx="94" cy="53" rx="18" ry="3" fill={_AO} opacity="0.2" />

        {/* Potted Monstera Deliciosa Plant on side */}
        <rect x="114" y="38" width="10" height="12" fill="#ea580c" stroke="#9a3412" strokeWidth="1" rx="1" />
        <ellipse cx="119" cy="30" rx="6" ry="8" fill="#16a34a" />
        <line x1="119" y1="38" x2="119" y2="24" stroke="#14532d" strokeWidth="1" />
      </svg>
    </div>
  );
}

// =========================================================================
// 20. BẢNG SPRINT KANBAN DI ĐỘNG (MOBILE AGILE KANBAN WHITEBOARD)
// =========================================================================
function _Raw_ScrumKanbanWhiteboardSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 135 * scale, height: 95 * scale }}>
      <svg viewBox="0 0 135 95" width={135 * scale} height={95 * scale} className="overflow-visible">
        {/* Ground shadow: AO 2 lớp cho 2 chân giá + bánh xe (đèn trên-trái) */}
        {_ao('kanbanAO', 70, 89, 57, 6, 0.26)}

        {/* Twin Aluminum Stand Legs & Wheels */}
        <line x1="26" y1="15" x2="26" y2="88" stroke="#64748b" strokeWidth="3" />
        <line x1="108" y1="15" x2="108" y2="88" stroke="#64748b" strokeWidth="3" />
        {/* Base feet & caster wheels */}
        <line x1="18" y1="88" x2="34" y2="88" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="88" x2="116" y2="88" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        <circle cx="20" cy="91" r="2" fill="#0f172a" />
        <circle cx="32" cy="91" r="2" fill="#0f172a" />
        <circle cx="102" cy="91" r="2" fill="#0f172a" />
        <circle cx="114" cy="91" r="2" fill="#0f172a" />

        {/* Magnetic Whiteboard Frame */}
        <rect x="20" y="8" width="94" height="66" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" rx="3" />
        {/* Shiny Whiteboard surface */}
        <rect x="23" y="11" width="88" height="60" fill="#ffffff" />

        {/* Board Header Banner: SPRINT #42 */}
        <rect x="23" y="11" width="88" height="12" fill="#0284c7" />
        <text x="67" y="19.5" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">
          🚀 SPRINT #42: 100% DONE
        </text>

        {/* 4 Vertical Columns Dividers */}
        <line x1="45" y1="23" x2="45" y2="71" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 1" />
        <line x1="67" y1="23" x2="67" y2="71" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 1" />
        <line x1="89" y1="23" x2="89" y2="71" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 1" />

        {/* Column Headers */}
        <text x="34" y="29" textAnchor="middle" fill="#64748b" fontSize="5" fontWeight="bold">TODO</text>
        <text x="56" y="29" textAnchor="middle" fill="#0284c7" fontSize="5" fontWeight="bold">DEV</text>
        <text x="78" y="29" textAnchor="middle" fill="#d97706" fontSize="5" fontWeight="bold">TEST</text>
        <text x="100" y="29" textAnchor="middle" fill="#16a34a" fontSize="5" fontWeight="bold">DONE</text>

        {/* Sticky Notes (Post-its) */}
        {/* TODO column */}
        <rect x="28" y="33" width="12" height="10" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6" rx="0.5" />
        {/* DEV column */}
        <rect x="50" y="33" width="12" height="10" fill="#bae6fd" stroke="#0284c7" strokeWidth="0.6" rx="0.5" />
        <rect x="50" y="46" width="12" height="10" fill="#fed7aa" stroke="#ea580c" strokeWidth="0.6" rx="0.5" />
        {/* TEST column */}
        <rect x="72" y="33" width="12" height="10" fill="#fbcfe8" stroke="#db2777" strokeWidth="0.6" rx="0.5" />
        {/* DONE column (With big checkmarks!) */}
        <rect x="94" y="33" width="12" height="10" fill="#bbf7d0" stroke="#16a34a" strokeWidth="0.6" rx="0.5" />
        <text x="100" y="41" textAnchor="middle" fill="#15803d" fontSize="7" fontWeight="bold">✓</text>

        <rect x="94" y="46" width="12" height="10" fill="#bbf7d0" stroke="#16a34a" strokeWidth="0.6" rx="0.5" />
        <text x="100" y="54" textAnchor="middle" fill="#15803d" fontSize="7" fontWeight="bold">✓</text>

        <rect x="94" y="59" width="12" height="10" fill="#bbf7d0" stroke="#16a34a" strokeWidth="0.6" rx="0.5" />
        <text x="100" y="67" textAnchor="middle" fill="#15803d" fontSize="7" fontWeight="bold">✓</text>

        {/* 2.5D — bảng kanban: mặt phải khung tối, viền trên nắng, chân giá có mặt bên */}
        <rect x="100" y="8" width="14" height="66" fill={_AO} opacity="0.16" />
        <rect x="20" y="8" width="94" height="3" fill="#ffffff" opacity="0.2" />
        <rect x="20" y="69" width="94" height="5" fill={_AO} opacity="0.18" />
        <rect x="27" y="15" width="1.8" height="73" fill={_AO} opacity="0.32" />
        <rect x="24.6" y="15" width="1.6" height="73" fill="#ffffff" opacity="0.2" />
        <rect x="109" y="15" width="1.8" height="73" fill={_AO} opacity="0.32" />
        <rect x="106.6" y="15" width="1.6" height="73" fill="#ffffff" opacity="0.2" />

        {/* Bottom Marker Tray with Pens */}
        <rect x="22" y="74" width="90" height="3" fill="#64748b" rx="1" />
        <line x1="30" y1="74.5" x2="38" y2="74.5" stroke="#ef4444" strokeWidth="1.5" />
        <line x1="42" y1="74.5" x2="50" y2="74.5" stroke="#3b82f6" strokeWidth="1.5" />
        <line x1="54" y1="74.5" x2="62" y2="74.5" stroke="#0f172a" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// =========================================================================
// 21. ĐÀI PHUN SAO THIÊN THẦN (CELESTIAL MARBLE ANGEL FOUNTAIN)
// =========================================================================
function _Raw_CelestialAngelFountainSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 140 * scale, height: 120 * scale }}>
      <svg viewBox="0 0 140 120" width={140 * scale} height={120 * scale} className="overflow-visible">
        {/* Soft magical glow under fountain */}
        <ellipse cx="70" cy="112" rx="64" ry="7" fill="rgba(129, 140, 248, 0.35)" />

        {/* Carrara White Marble Hexagonal Lower Pool Basin */}
        <path
          d="M 12 110 L 26 90 L 114 90 L 128 110 L 114 116 L 26 116 Z"
          fill="#f8fafc"
          stroke="#c7d2fe"
          strokeWidth="2.5"
        />
        {/* Inner Starry Turquoise Water Pool */}
        <ellipse cx="70" cy="100" rx="46" ry="12" fill="#38bdf8" />
        <ellipse cx="70" cy="100" rx="40" ry="9" fill="#0284c7" />

        {/* Floating Star Blossoms on Water */}
        <circle cx="50" cy="98" r="2.5" fill="#facc15" />
        <circle cx="88" cy="102" r="3" fill="#f43f5e" />
        <circle cx="68" cy="105" r="2.5" fill="#ffffff" />

        {/* Central Fluted Marble Pedestal */}
        <rect x="62" y="64" width="16" height="32" fill="#f8fafc" stroke="#c7d2fe" strokeWidth="1.8" />
        <line x1="66" y1="64" x2="66" y2="96" stroke="#e2e8f0" strokeWidth="1" />
        <line x1="74" y1="64" x2="74" y2="96" stroke="#e2e8f0" strokeWidth="1" />

        {/* Middle Scallop Shell Basin */}
        <path
          d="M 38 64 Q 70 76 102 64 Q 70 56 38 64 Z"
          fill="#ffffff"
          stroke="#818cf8"
          strokeWidth="2"
        />
        <ellipse cx="70" cy="64" rx="28" ry="5" fill="#38bdf8" />

        {/* Cascading Water Streams from Middle Shell Basin */}
        <path d="M 44 65 Q 40 82 36 96" stroke="#e0f2fe" strokeWidth="1.8" fill="none" opacity="0.8" />
        <path d="M 96 65 Q 100 82 104 96" stroke="#e0f2fe" strokeWidth="1.8" fill="none" opacity="0.8" />

        {/* Top Marble Pedestal & Sculpted Celestial Swan */}
        <rect x="65" y="44" width="10" height="20" fill="#f8fafc" stroke="#c7d2fe" strokeWidth="1.2" />

        {/* Elegant Angel Swan */}
        <g>
          {/* Swan Body */}
          <ellipse cx="70" cy="38" rx="8" ry="6" fill="#ffffff" stroke="#c7d2fe" strokeWidth="1.2" />
          {/* Graceful Arching Neck */}
          <path d="M 74 38 Q 80 26 76 20" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Swan Head & Gold Beak */}
          <circle cx="76" cy="20" r="3" fill="#ffffff" />
          <polygon points="78,20 84,21 78,23" fill="#facc15" stroke="#ca8a04" strokeWidth="0.6" />
          {/* Wings */}
          <path d="M 64 36 Q 56 22 68 30 Z" fill="#ffffff" stroke="#c7d2fe" strokeWidth="1" />
        </g>

        {/* Arcing Water Fountain Jet from Swan Beak */}
        <g className="animate-pulse" style={{ animationDuration: '1.2s' }}>
          <path d="M 84 21 Q 96 26 94 62" stroke="#bae6fd" strokeWidth="2" fill="none" />
          <path d="M 84 21 Q 60 14 46 62" stroke="#bae6fd" strokeWidth="2" fill="none" />
        </g>

        {/* 2.5D — đá cẩm thạch: mặt phải bục/bể tối, viền trên nắng, đáy hồ sâu dần */}
        <rect x="72" y="64" width="6" height="32" fill={_AO} opacity="0.2" />
        <rect x="62" y="64" width="3" height="32" fill="#ffffff" opacity="0.3" />
        <rect x="71" y="44" width="4" height="20" fill={_AO} opacity="0.2" />
        <rect x="65" y="44" width="2.4" height="20" fill="#ffffff" opacity="0.3" />
        <path d="M 26 110 L 114 110 L 114 116 L 26 116 Z" fill={_AO} opacity="0.16" />
        <path d="M 12 110 L 26 90 L 30 90 L 16 110 Z" fill="#ffffff" opacity="0.3" />
        <path d="M 114 90 L 128 110 L 124 110 L 110 90 Z" fill={_AO} opacity="0.22" />
        <ellipse cx="70" cy="106" rx="44" ry="7" fill={_AO} opacity="0.16" />
        <ellipse cx="52" cy="95" rx="22" ry="5" fill="#ffffff" opacity="0.24" />
        <path d="M 38 64 Q 54 58 70 57 L 70 60 Q 56 62 40 66 Z" fill="#ffffff" opacity="0.3" />

        {/* Orbiting Magical Star Sparkles */}
        <circle cx="70" cy="14" r="2.5" fill="#fef08a" className="animate-ping" style={{ animationDuration: '2s' }} />
        <circle cx="48" cy="50" r="1.8" fill="#facc15" className="animate-ping" style={{ animationDuration: '2.5s' }} />
        <circle cx="98" cy="50" r="1.8" fill="#facc15" className="animate-ping" style={{ animationDuration: '1.8s' }} />
      </svg>
    </div>
  );
}

// =========================================================================
// 22. RƯƠNG BÁU KIM CƯƠNG TRI THỨC (GEMSTONE TREASURE CHEST OF WISDOM)
// =========================================================================
function _Raw_GemstoneTreasureChestSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 130 * scale, height: 95 * scale }}>
      <svg viewBox="0 0 130 95" width={130 * scale} height={95 * scale} className="overflow-visible">
        {/* Soft shadow on cloud */}
        <ellipse cx="65" cy="88" rx="55" ry="5.5" fill="rgba(67, 56, 202, 0.35)" />

        {/* Golden Aura / Light Rays radiating upward */}
        <g className="animate-pulse" style={{ animationDuration: '2.2s' }}>
          <polygon points="65,40 35,-5 50,-5" fill="rgba(254, 240, 138, 0.25)" />
          <polygon points="65,40 60,-10 70,-10" fill="rgba(254, 240, 138, 0.35)" />
          <polygon points="65,40 80,-5 95,-5" fill="rgba(254, 240, 138, 0.25)" />
        </g>

        {/* Chest Lower Tub (Polished Royal Cedar Wood) */}
        <rect x="25" y="46" width="80" height="40" fill="#78350f" stroke="#451a03" strokeWidth="2.5" rx="2" />
        {/* Wood grain slats */}
        <line x1="25" y1="60" x2="105" y2="60" stroke="#92400e" strokeWidth="1.5" />
        <line x1="25" y1="74" x2="105" y2="74" stroke="#92400e" strokeWidth="1.5" />

        {/* Reinforced Heavy Brass Straps & Corner Rivets */}
        <rect x="35" y="46" width="6" height="40" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
        <rect x="89" y="46" width="6" height="40" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
        <circle cx="38" cy="52" r="1.2" fill="#451a03" />
        <circle cx="38" cy="80" r="1.2" fill="#451a03" />
        <circle cx="92" cy="52" r="1.2" fill="#451a03" />
        <circle cx="92" cy="80" r="1.2" fill="#451a03" />

        {/* Front Golden Lock Plate & Keyhole */}
        <polygon points="60,52 70,52 68,66 62,66" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
        <circle cx="65" cy="57" r="1.5" fill="#451a03" />
        <line x1="65" y1="57" x2="65" y2="62" stroke="#451a03" strokeWidth="1" />

        {/* Open Arched Lid (Flung open at dramatic angle) */}
        <path
          d="M 23 46 L 35 14 Q 65 6 95 14 L 107 46 Z"
          fill="#92400e"
          stroke="#451a03"
          strokeWidth="2.5"
        />
        <path d="M 37 15 Q 65 8 93 15" stroke="#facc15" strokeWidth="2.5" fill="none" />

        {/* Overflowing Gemstones & Golden Doubloons */}
        {/* Gold coins heap */}
        {Array.from({ length: 9 }).map((_, i) => (
          <ellipse key={i} cx={40 + i * 6} cy={44 + (i % 2) * 3} rx="4" ry="2.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
        ))}

        {/* Sparkling Diamonds & Sapphires */}
        <g className="animate-bounce" style={{ animationDuration: '2.5s' }}>
          {/* Big Center Diamond */}
          <polygon points="65,30 72,37 65,44 58,37" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.2" />
          <polygon points="65,30 68,37 65,44" fill="#bae6fd" />
          {/* Blue Sapphire */}
          <polygon points="48,34 54,34 56,41 46,41" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
          {/* Red Ruby */}
          <polygon points="80,33 86,33 88,40 78,40" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
          {/* Emerald */}
          <polygon points="72,40 76,36 80,40 76,44" fill="#10b981" stroke="#047857" strokeWidth="1" />
        </g>

        {/* Ancient Glowing Tome / Book of English Knowledge */}
        <rect x="52" y="36" width="22" height="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" rx="1" />
        <line x1="63" y1="36" x2="63" y2="42" stroke="#ca8a04" strokeWidth="0.8" />

        {/* 2.5D — rương: mặt phải thùng/nắp tối, viền trên nắng, strap đồng có mặt bên */}
        <rect x="86" y="46" width="19" height="40" fill={_AO} opacity="0.2" />
        <rect x="25" y="46" width="4" height="40" fill="#ffffff" opacity="0.14" />
        <path d="M 70 14 Q 88 10 95 14 L 107 46 L 90 46 Z" fill={_AO} opacity="0.18" />
        <path d="M 35 14 Q 65 6 95 14 L 93 18 Q 65 10 38 19 Z" fill="#ffffff" opacity="0.22" />
        <rect x="95" y="46" width="6" height="40" fill={_AO} opacity="0.22" />
        <ellipse cx="65" cy="87" rx="52" ry="5" fill={_AO} opacity="0.2" />

        {/* Floating Magic Star Sparkles */}
        <circle cx="52" cy="20" r="2.5" fill="#facc15" className="animate-ping" style={{ animationDuration: '1.5s' }} />
        <circle cx="78" cy="16" r="2" fill="#38bdf8" className="animate-ping" style={{ animationDuration: '2s' }} />
        <circle cx="94" cy="28" r="1.8" fill="#ec4899" className="animate-ping" style={{ animationDuration: '2.4s' }} />
      </svg>
    </div>
  );
}

// =========================================================================
// 23. CẦU VỒNG 7 MÀU PHA LÊ (7-COLOR CRYSTAL RAINBOW BRIDGE)
// =========================================================================
function _Raw_RainbowBridgeArchSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 190 * scale, height: 100 * scale }}>
      <svg viewBox="0 0 190 100" width={190 * scale} height={100 * scale} className="overflow-visible">
        {/* 7-Color Curved Rainbow Bands */}
        <g opacity="0.9">
          {/* Red */}
          <path d="M 20 85 C 20 15, 170 15, 170 85" stroke="#ef4444" strokeWidth="4" fill="none" />
          {/* Orange */}
          <path d="M 22 85 C 22 20, 168 20, 168 85" stroke="#f97316" strokeWidth="4" fill="none" />
          {/* Yellow */}
          <path d="M 24 85 C 24 25, 166 25, 166 85" stroke="#facc15" strokeWidth="4" fill="none" />
          {/* Green */}
          <path d="M 26 85 C 26 30, 164 30, 164 85" stroke="#22c55e" strokeWidth="4" fill="none" />
          {/* Cyan */}
          <path d="M 28 85 C 28 35, 162 35, 162 85" stroke="#06b6d4" strokeWidth="4" fill="none" />
          {/* Blue */}
          <path d="M 30 85 C 30 40, 160 40, 160 85" stroke="#3b82f6" strokeWidth="4" fill="none" />
          {/* Purple */}
          <path d="M 32 85 C 32 45, 158 45, 158 85" stroke="#a855f7" strokeWidth="4" fill="none" />
        </g>

        {/* Left Cloud Bank */}
        <g>
          <ellipse cx="22" cy="85" rx="20" ry="10" fill="#ffffff" />
          <ellipse cx="32" cy="80" rx="14" ry="12" fill="#ffffff" />
          <ellipse cx="14" cy="82" rx="12" ry="8" fill="#e0e7ff" />
        </g>

        {/* Right Cloud Bank */}
        <g>
          <ellipse cx="168" cy="85" rx="20" ry="10" fill="#ffffff" />
          <ellipse cx="158" cy="80" rx="14" ry="12" fill="#ffffff" />
          <ellipse cx="176" cy="82" rx="12" ry="8" fill="#e0e7ff" />
        </g>

        {/* 3 Suspended Star Lanterns under Arch */}
        {[
          { x: 65, y: 44, chain: 14 },
          { x: 95, y: 36, chain: 16 },
          { x: 125, y: 44, chain: 14 },
        ].map((lt, i) => (
          <g key={i} className="animate-pulse" style={{ animationDuration: `${1.8 + i * 0.4}s` }}>
            <line x1={lt.x} y1={lt.y - lt.chain} x2={lt.x} y2={lt.y} stroke="#ca8a04" strokeWidth="1" strokeDasharray="1 1" />
            <polygon points={`${lt.x},${lt.y - 4} ${lt.x + 3},${lt.y} ${lt.x + 5},${lt.y + 4} ${lt.x},${lt.y + 3} ${lt.x - 5},${lt.y + 4} ${lt.x - 3},${lt.y}`} fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <circle cx={lt.x} cy={lt.y} r="1.5" fill="#ffffff" />
          </g>
        ))}

        {/* 2.5D — cầu vồng: bóng cung đổ xuống mây, mây có khối sáng tối (đèn trên-trái) */}
        <path d="M 24 86 C 24 20 166 20 166 86 L 166 93 C 166 27 24 27 24 93 Z" fill={_AO} opacity="0.12" />
        <ellipse cx="40" cy="92" rx="22" ry="9" fill={_AO} opacity="0.13" />
        <ellipse cx="156" cy="92" rx="22" ry="9" fill={_AO} opacity="0.13" />
        <ellipse cx="30" cy="76" rx="14" ry="7" fill="#ffffff" />
        <ellipse cx="164" cy="76" rx="14" ry="7" fill="#ffffff" />
        <path d="M 20 84 C 20 14 170 14 170 84" fill="none" stroke="#ffffff" strokeWidth="1.4" opacity="0.3" />

        {/* Glittering Stardust Trail over rainbow */}
        <circle cx="95" cy="18" r="2.5" fill="#ffffff" className="animate-ping" style={{ animationDuration: '1.6s' }} />
        <circle cx="70" cy="24" r="1.8" fill="#fef08a" className="animate-ping" style={{ animationDuration: '2.2s' }} />
        <circle cx="120" cy="24" r="1.8" fill="#bae6fd" className="animate-ping" style={{ animationDuration: '1.9s' }} />
      </svg>
    </div>
  );
}

// =========================================================================
// 24. BẬC THANG MÂY & ĐÈN LỒNG TRĂNG SAO (STARRY CLOUD STAIRWAY PLATFORM)
// =========================================================================
function _Raw_StarryCloudPlatformSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 130 * scale, height: 80 * scale }}>
      <svg viewBox="0 0 130 80" width={130 * scale} height={80 * scale} className="overflow-visible">
        {/* Tier 1: Lowest Cloud Step */}
        <ellipse cx="65" cy="70" rx="55" ry="10" fill="#ffffff" opacity="0.9" />
        <ellipse cx="40" cy="66" rx="24" ry="9" fill="#e0e7ff" opacity="0.9" />
        <ellipse cx="90" cy="66" rx="24" ry="9" fill="#e0e7ff" opacity="0.9" />

        {/* Tier 2: Middle Cloud Step */}
        <ellipse cx="65" cy="50" rx="42" ry="9" fill="#ffffff" />
        <ellipse cx="48" cy="46" rx="18" ry="8" fill="#c7d2fe" opacity="0.8" />
        <ellipse cx="82" cy="46" rx="18" ry="8" fill="#c7d2fe" opacity="0.8" />

        {/* Tier 3: Top Cloud Platform */}
        <ellipse cx="65" cy="30" rx="30" ry="8" fill="#ffffff" />
        <ellipse cx="65" cy="28" rx="22" ry="6" fill="#f8fafc" />

        {/* Golden Crescent Moon Lantern on post */}
        <g>
          <line x1="22" y1="70" x2="22" y2="34" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />
          <path d="M 22 34 Q 28 30 28 36" stroke="#ca8a04" strokeWidth="1.5" fill="none" />
          {/* Crescent Moon Lantern */}
          <path
            d="M 28 36 C 34 36, 34 44, 28 44 C 31 42, 31 38, 28 36 Z"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="0.8"
            className="animate-pulse"
          />
        </g>

        {/* 2.5D — bậc mây: đáy mỗi tầng tối, viền trên sáng (đèn trên-trái) + trụ đèn có mặt bên */}
        <ellipse cx="70" cy="77" rx="52" ry="6" fill={_AO} opacity="0.17" />
        <ellipse cx="70" cy="57" rx="40" ry="5" fill={_AO} opacity="0.15" />
        <ellipse cx="70" cy="36" rx="28" ry="4.5" fill={_AO} opacity="0.13" />
        <ellipse cx="52" cy="64" rx="26" ry="4" fill="#ffffff" />
        <ellipse cx="55" cy="44" rx="20" ry="3.5" fill="#ffffff" />
        <rect x="23" y="34" width="1.6" height="36" fill="#ffffff" opacity="0.7" />
        <rect x="24.4" y="34" width="1.4" height="36" fill={_AO} opacity="0.18" />

        {/* Floating Constellation Stars */}
        <circle cx="106" cy="32" r="2.5" fill="#fef08a" className="animate-ping" style={{ animationDuration: '2s' }} />
        <circle cx="114" cy="40" r="1.8" fill="#facc15" />
        <line x1="106" y1="32" x2="114" y2="40" stroke="rgba(250, 204, 21, 0.4)" strokeWidth="0.8" strokeDasharray="1 1" />
      </svg>
    </div>
  );
}



// =========================================================================
// 25. THOUSAND SUNNY / ONE PIECE - ĐẦU SƯ TỬ SUNNY (LION FIGUREHEAD)
// =========================================================================
function _Raw_ThousandSunnyLionFigureheadSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 150 * scale, height: 140 * scale }}>
      <svg viewBox="0 0 150 140" width={150 * scale} height={140 * scale} className="overflow-visible">
        {/* Ocean Wave Splash at Bow */}
        <ellipse cx="75" cy="130" rx="65" ry="8" fill="rgba(14, 165, 233, 0.3)" />
        <path d="M 20 128 Q 40 120 60 128 T 100 128 T 135 126" stroke="#38bdf8" strokeWidth="2.5" fill="none" opacity="0.8" />
        <path d="M 35 132 Q 55 125 75 132 T 115 132" stroke="#bae6fd" strokeWidth="1.5" fill="none" />

        {/* Wooden Prow Platform / Sàn Mũi Tàu */}
        <polygon points="35,125 75,135 115,125 105,95 45,95" fill="#92400e" stroke="#451a03" strokeWidth="2" />
        <line x1="55" y1="95" x2="50" y2="128" stroke="#78350f" strokeWidth="1.5" />
        <line x1="75" y1="95" x2="75" y2="135" stroke="#78350f" strokeWidth="1.5" />
        <line x1="95" y1="95" x2="100" y2="128" stroke="#78350f" strokeWidth="1.5" />

        {/* Heavy Iron Anchor with Chains on Starboard */}
        <g>
          <line x1="112" y1="100" x2="125" y2="125" stroke="#64748b" strokeWidth="2" strokeDasharray="3 2" />
          <path d="M 120 120 C 120 135 135 135 135 120" stroke="#334155" strokeWidth="3" fill="none" />
          <line x1="127" y1="115" x2="127" y2="132" stroke="#334155" strokeWidth="2" />
          <line x1="123" y1="122" x2="131" y2="122" stroke="#334155" strokeWidth="2" />
        </g>

        {/* Crossed Bones behind Sunny Mane */}
        <g stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round">
          <line x1="32" y1="28" x2="118" y2="92" />
          <line x1="118" y1="28" x2="32" y2="92" />
        </g>
        <circle cx="30" cy="26" r="4.5" fill="#cbd5e1" />
        <circle cx="34" cy="30" r="4" fill="#cbd5e1" />
        <circle cx="120" cy="26" r="4.5" fill="#cbd5e1" />
        <circle cx="116" cy="30" r="4" fill="#cbd5e1" />

        {/* 16 Golden Sunflower Petals Mane (Bờm hoa hướng dương vàng óng) */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16;
          const rad = (angle * Math.PI) / 180;
          const cx = 75 + Math.cos(rad) * 36;
          const cy = 60 + Math.sin(rad) * 36;
          return (
            <ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx="9"
              ry="5.5"
              fill="#facc15"
              stroke="#ca8a04"
              strokeWidth="1.2"
              transform={`rotate(${angle} ${cx} ${cy})`}
            />
          );
        })}

        {/* White Lion Face Head */}
        <circle cx="75" cy="60" r="30" fill="#f8fafc" stroke="#ca8a04" strokeWidth="2.5" />

        {/* 2.5D — sàn mũi tàu 2 mặt (mặt trái nắng, mặt phải tối) + khối đầu sư tử có hướng sáng */}
        <polygon points="75,135 115,125 105,95 75,95" fill={_AO} opacity="0.2" />
        <polygon points="35,125 75,135 75,95 45,95" fill="#ffffff" opacity="0.12" />
        <defs>
          <radialGradient id="lionFaceShade" cx="32%" cy="26%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="52%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.26" />
          </radialGradient>
        </defs>
        <circle cx="75" cy="60" r="29" fill="url(#lionFaceShade)" />

        {/* Cute Lion Ears */}
        <circle cx="54" cy="38" r="8" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
        <circle cx="54" cy="38" r="4.5" fill="#fef08a" />
        <circle cx="96" cy="38" r="8" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
        <circle cx="96" cy="38" r="4.5" fill="#fef08a" />

        {/* Rosy Cheeks */}
        <circle cx="58" cy="68" r="5" fill="#fda4af" opacity="0.8" />
        <circle cx="92" cy="68" r="5" fill="#fda4af" opacity="0.8" />

        {/* Big Bright Anime Eyes */}
        <ellipse cx="64" cy="56" rx="4.5" ry="6" fill="#0f172a" />
        <circle cx="62.5" cy="53.5" r="2" fill="#ffffff" />
        <circle cx="65" cy="57" r="1" fill="#ffffff" />

        <ellipse cx="86" cy="56" rx="4.5" ry="6" fill="#0f172a" />
        <circle cx="84.5" cy="53.5" r="2" fill="#ffffff" />
        <circle cx="87" cy="57" r="1" fill="#ffffff" />

        {/* Snout & Nose */}
        <polygon points="72,61 78,61 75,65" fill="#ca8a04" />

        {/* Big Open Cheerful Smile (Gaon Cannon Muzzle) */}
        <path d="M 64 68 Q 75 84 86 68 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
        <ellipse cx="75" cy="74" rx="5" ry="3" fill="#f43f5e" />
        {/* Cute teeth */}
        <rect x="71" y="68" width="3.5" height="3" fill="#ffffff" rx="0.5" />
        <rect x="75.5" y="68" width="3.5" height="3" fill="#ffffff" rx="0.5" />
      </svg>
    </div>
  );
}

// =========================================================================
// 26. CỘT BUỒM HẢI TẶC MŨ RƠM & ĐÀI QUAN SÁT (PIRATE MAST & JOLLY ROGER)
// =========================================================================
function _Raw_PirateMastJollyRogerSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 170 * scale, height: 200 * scale }}>
      <svg viewBox="0 0 170 200" width={170 * scale} height={200 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp dưới cột buồm (đèn trên-trái) */}
        {_ao('mastAO', 88, 191, 47, 7.5, 0.27)}

        {/* Shrouds / Rope Rigging Ladders Left & Right for Pet Climbing */}
        <g stroke="#92400e" strokeWidth="1.5">
          {/* Left stays */}
          <line x1="85" y1="50" x2="25" y2="190" strokeWidth="2" />
          <line x1="85" y1="50" x2="40" y2="190" strokeWidth="2" />
          {/* Left ladder rungs */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={i}
              x1={25 + i * 7.5}
              y1={190 - i * 16}
              x2={40 + i * 5.5}
              y2={190 - i * 16}
              stroke="#ca8a04"
              strokeWidth="1.5"
            />
          ))}

          {/* Right stays */}
          <line x1="85" y1="50" x2="145" y2="190" strokeWidth="2" />
          <line x1="85" y1="50" x2="130" y2="190" strokeWidth="2" />
          {/* Right ladder rungs */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={i}
              x1={130 - i * 5.5}
              y1={190 - i * 16}
              x2={145 - i * 7.5}
              y2={190 - i * 16}
              stroke="#ca8a04"
              strokeWidth="1.5"
            />
          ))}
        </g>

        {/* Solid Wooden Main Mast (Cột Buồm Gỗ) */}
        <rect x="80" y="25" width="10" height="168" fill="#78350f" stroke="#451a03" strokeWidth="2" rx="1" />
        <rect x="79" y="80" width="12" height="3" fill="#ca8a04" />
        <rect x="79" y="140" width="12" height="3" fill="#ca8a04" />

        {/* 2.5D — cột buồm: mặt phải tối, viền trái nắng (đèn trên-trái) */}
        <rect x="86" y="25" width="4" height="168" fill={_AO} opacity="0.24" />
        <rect x="80" y="25" width="1.8" height="168" fill="#ffffff" opacity="0.22" />

        {/* Billowing Cream Mainsail (Cánh buồm trắng no gió) */}
        <path
          d="M 35 75 Q 85 92 135 75 Q 130 145 85 140 Q 40 145 35 75 Z"
          fill="#fef3c7"
          stroke="#ca8a04"
          strokeWidth="2"
          opacity="0.95"
        />
        {/* Sail vertical seams */}
        <path d="M 60 77 Q 60 110 58 141" stroke="#fde68a" strokeWidth="1.5" fill="none" />
        <path d="M 85 82 Q 85 110 85 140" stroke="#fde68a" strokeWidth="1.5" fill="none" />
        <path d="M 110 77 Q 110 110 112 141" stroke="#fde68a" strokeWidth="1.5" fill="none" />

        {/* 2.5D — cánh buồm có khối: sáng góc trái-trên, tối góc phải-dưới (gió thổi từ trái) */}
        <defs>
          <clipPath id="sunnySailClip">
            <path d="M 35 75 Q 85 92 135 75 Q 130 145 85 140 Q 40 145 35 75 Z" />
          </clipPath>
          <linearGradient id="sunnySailLight" x1="8%" y1="0%" x2="92%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="46%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <g clipPath="url(#sunnySailClip)">
          <rect x="30" y="70" width="110" height="80" fill="url(#sunnySailLight)" />
        </g>

        {/* Straw Hat Jolly Roger Emblem painted on sail */}
        <g transform="translate(85, 110) scale(0.65)">
          {/* Crossbones */}
          <line x1="-28" y1="-28" x2="28" y2="28" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
          <line x1="28" y1="-28" x2="-28" y2="28" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
          {/* White skull */}
          <circle cx="0" cy="0" r="16" fill="#0f172a" />
          {/* Eye sockets */}
          <circle cx="-6" cy="-2" r="3.5" fill="#fef3c7" />
          <circle cx="6" cy="-2" r="3.5" fill="#fef3c7" />
          {/* Grinning teeth */}
          <rect x="-7" y="6" width="14" height="6" fill="#fef3c7" rx="1" />
          <line x1="-3" y1="6" x2="-3" y2="12" stroke="#0f172a" strokeWidth="1" />
          <line x1="1" y1="6" x2="1" y2="12" stroke="#0f172a" strokeWidth="1" />
          {/* Straw Hat over Skull */}
          <ellipse cx="0" cy="-14" rx="22" ry="5" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
          <path d="M -13 -14 Q 0 -26 13 -14 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
          <rect x="-13" y="-17" width="26" height="3" fill="#dc2626" />
        </g>

        {/* Wooden Crow's Nest (Đài quan sát trên đỉnh cột) */}
        <polygon points="62,50 108,50 102,68 68,68" fill="#92400e" stroke="#451a03" strokeWidth="2" />
        {/* Baluster slats */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i} x1={68 + i * 6.5} y1={50} x2={70 + i * 5.8} y2={68} stroke="#78350f" strokeWidth="1.5" />
        ))}
        {/* Pirate Brass Spyglass Telescope on Nest */}
        <line x1="98" y1="46" x2="114" y2="38" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />

        {/* Waving Black Pirate Flag at Topmost Mast Tip */}
        <g className="animate-pulse" style={{ animationDuration: '2.5s' }}>
          <line x1="85" y1="25" x2="85" y2="2" stroke="#ca8a04" strokeWidth="2" />
          <circle cx="85" cy="2" r="2.5" fill="#facc15" />
          {/* Black waving Jolly Roger flag */}
          <path d="M 85 4 Q 105 0 125 6 Q 115 18 128 26 Q 105 20 85 24 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <circle cx="104" cy="14" r="3.5" fill="#ffffff" />
          <line x1="98" y1="10" x2="110" y2="18" stroke="#ffffff" strokeWidth="1" />
          <line x1="110" y1="10" x2="98" y2="18" stroke="#ffffff" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 27. RƯƠNG KHO BÁU HẢI TẶC TRÀN VÀNG (PIRATE TREASURE CHEST)
// =========================================================================
function _Raw_PirateTreasureChestSVG({ className = '', scale = 1, isOpen = false }: { className?: string; scale?: number; isOpen?: boolean }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 90 * scale, height: 75 * scale }}>
      <svg viewBox="0 0 90 75" width={90 * scale} height={75 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp (đèn trên-trái) */}
        {_ao('pchestAO', 48, 69, 40, 6.5, 0.3)}

        {/* Main Chest Base (Thùng gỗ sồi viền đồng) */}
        <rect x="14" y="34" width="62" height="34" fill="#78350f" stroke="#451a03" strokeWidth="2" rx="2" />
        {/* Wood planks */}
        <line x1="14" y1="46" x2="76" y2="46" stroke="#5c2605" strokeWidth="1.2" />
        <line x1="14" y1="58" x2="76" y2="58" stroke="#5c2605" strokeWidth="1.2" />

        {/* Brass corner brackets & vertical bands */}
        <rect x="22" y="34" width="7" height="34" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
        <rect x="61" y="34" width="7" height="34" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
        <circle cx="25.5" cy="40" r="1" fill="#451a03" />
        <circle cx="25.5" cy="62" r="1" fill="#451a03" />
        <circle cx="64.5" cy="40" r="1" fill="#451a03" />
        <circle cx="64.5" cy="62" r="1" fill="#451a03" />

        {/* Spilling Gold Doubloons & Gems Heap */}
        <g>
          {/* Golden coins mound */}
          <ellipse cx="45" cy="34" rx="24" ry="9" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
          <circle cx="36" cy="32" r="3" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
          <circle cx="44" cy="30" r="3.5" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
          <circle cx="53" cy="33" r="3" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
          <circle cx="48" cy="27" r="3" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />

          {/* Sparkling Ruby Gem */}
          <polygon points="34,26 38,22 42,26 38,30" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
          {/* Emerald Gem */}
          <polygon points="52,24 56,20 60,24 56,28" fill="#10b981" stroke="#047857" strokeWidth="0.8" />
          {/* Pearl Necklace draped over edge */}
          <path d="M 28 36 Q 32 48 38 42" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="3 3" fill="none" />
        </g>

        {/* Chest Arched Lid (Open or Closed) */}
        {isOpen ? (
          <g transform="translate(0, -18)">
            <path d="M 12 30 Q 45 10 78 30 Z" fill="#92400e" stroke="#451a03" strokeWidth="2" />
            <path d="M 14 30 Q 45 14 76 30" fill="none" stroke="#ca8a04" strokeWidth="3" />
          </g>
        ) : (
          <g>
            <path d="M 14 34 Q 45 14 76 34 Z" fill="#92400e" stroke="#451a03" strokeWidth="2" />
            {/* Brass Bands on Lid */}
            <path d="M 22 34 Q 25 18 29 34" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
            <path d="M 61 34 Q 65 18 68 34" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
            {/* Skull Lock in Center */}
            <rect x="41" y="30" width="8" height="10" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" rx="1" />
            <circle cx="43.5" cy="33" r="1" fill="#0f172a" />
            <circle cx="46.5" cy="33" r="1" fill="#0f172a" />
            <line x1="45" y1="36" x2="45" y2="38" stroke="#0f172a" strokeWidth="1" />
          </g>
        )}

        {/* 2.5D — rương hải tặc: mặt phải tối, viền trên nắng, metal strap có mặt bên */}
        <rect x="64" y="34" width="12" height="34" fill={_AO} opacity="0.2" />
        <rect x="14" y="34" width="4" height="34" fill="#ffffff" opacity="0.14" />
        <path d="M 45 24 Q 62 21 76 34 L 45 34 Z" fill={_AO} opacity="0.16" />
        <path d="M 14 34 Q 28 20 45 15 Q 34 24 30 34 Z" fill="#ffffff" opacity="0.2" />
        <rect x="70" y="34" width="7" height="34" fill={_AO} opacity="0.18" />

        {/* Animated Glittering Stardust */}
        <circle cx="40" cy="18" r="2" fill="#ffffff" className="animate-ping" style={{ animationDuration: '1.4s' }} />
        <circle cx="58" cy="16" r="1.8" fill="#fef08a" className="animate-ping" style={{ animationDuration: '2s' }} />
      </svg>
    </div>
  );
}

// =========================================================================
// 28. BÁNH LÁI TÀU VÀ LAN CAN BOONG (PIRATE HELM & DECK RAILING)
// =========================================================================
function _Raw_PirateHelmAndDeckRailingSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 100 * scale, height: 100 * scale }}>
      <svg viewBox="0 0 100 100" width={100 * scale} height={100 * scale} className="overflow-visible">
        {/* Deck Railing Balusters */}
        <rect x="5" y="72" width="90" height="5" fill="#78350f" stroke="#451a03" strokeWidth="1.5" rx="1" />
        {Array.from({ length: 7 }).map((_, i) => (
          <rect key={i} x={12 + i * 12} y="77" width="4" height="20" fill="#92400e" stroke="#451a03" strokeWidth="1" />
        ))}
        <rect x="5" y="96" width="90" height="4" fill="#5c2605" />

        {/* Helm Stand / Bệ bánh lái */}
        <polygon points="42,75 58,75 62,96 38,96" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
        {/* Brass Compass Binnacle Dome */}
        <circle cx="50" cy="74" r="4.5" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />

        {/* 8-Spoke Rotating Pirate Ship Steering Wheel (Bánh Lái Hải Tặc 8 nan) */}
        <g className="origin-[50px_42px] animate-spin" style={{ animationDuration: '24s', animationTimingFunction: 'linear' }}>
          {/* Outer Rim */}
          <circle cx="50" cy="42" r="22" fill="none" stroke="#78350f" strokeWidth="4.5" />
          <circle cx="50" cy="42" r="19" fill="none" stroke="#ca8a04" strokeWidth="1.5" />
          {/* 8 Spokes with Handles */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 360) / 8;
            return (
              <g key={i} transform={`rotate(${angle} 50 42)`}>
                <line x1="50" y1="42" x2="50" y2="14" stroke="#78350f" strokeWidth="3" />
                {/* Turned handle grip */}
                <circle cx="50" cy="14" r="3" fill="#ca8a04" stroke="#451a03" strokeWidth="1" />
              </g>
            );
          })}
          {/* Center Hub */}
          <circle cx="50" cy="42" r="8" fill="#ca8a04" stroke="#451a03" strokeWidth="1.5" />
          <circle cx="50" cy="42" r="4" fill="#facc15" />
        </g>

        {/* 2.5D — lan can boong & bệ bánh lái: mặt phải tối, viền trên nắng, nan bánh có mặt bên */}
        <rect x="5" y="72" width="90" height="1.8" fill="#ffffff" opacity="0.22" />
        <rect x="5" y="75" width="90" height="2" fill={_AO} opacity="0.24" />
        {Array.from({ length: 7 }).map((_, i) => (
          <g key={`sh${i}`}>
            <rect x={14.4} y="77" width="1.6" height="20" fill={_AO} opacity="0.3" />
            <rect x={12} y="77" width="1.2" height="20" fill="#ffffff" opacity="0.22" />
          </g>
        ))}
        <polygon points="50,75 58,75 62,96 50,96" fill={_AO} opacity="0.22" />
        <polygon points="42,75 50,75 50,96 38,96" fill="#ffffff" opacity="0.12" />
        <circle
          cx="50"
          cy="42"
          r="22"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.3"
          opacity="0.3"
          strokeDasharray="36 104"
          transform="rotate(-145 50 42)"
        />
      </svg>
    </div>
  );
}

// =========================================================================
// 29. ĐẠI BÁC HẢI TẶC & THÙNG RƯỢU GỖ (PIRATE CANNON & BARRELS)
// =========================================================================
function _Raw_PirateCannonAndRumBarrelsSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 110 * scale, height: 80 * scale }}>
      <svg viewBox="0 0 110 80" width={110 * scale} height={80 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp cho thùng rượu + đại bác (đèn trên-trái) */}
        {_ao('cannonAO', 58, 75, 50, 6, 0.26)}

        {/* Wooden Oak Barrels on Left */}
        <g>
          {/* Barrel 1 (Upright) */}
          <path d="M 12 45 C 8 56 8 66 12 75 L 28 75 C 32 66 32 56 28 45 Z" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
          <line x1="10" y1="52" x2="30" y2="52" stroke="#334155" strokeWidth="1.8" />
          <line x1="10" y1="68" x2="30" y2="68" stroke="#334155" strokeWidth="1.8" />
          {/* Spigot */}
          <rect x="28" y="58" width="5" height="3" fill="#ca8a04" />

          {/* Barrel 2 (Tilted) */}
          <ellipse cx="36" cy="62" rx="9" ry="12" fill="#78350f" stroke="#451a03" strokeWidth="1.5" transform="rotate(35 36 62)" />
        </g>

        {/* Naval Cannon on Wheeled Carriage */}
        <g>
          {/* Wheeled Wooden Carriage */}
          <polygon points="54,68 88,68 84,52 60,52" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
          {/* Front & Back Wheels */}
          <circle cx="58" cy="70" r="7" fill="#451a03" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="58" cy="70" r="2.5" fill="#ca8a04" />
          <circle cx="84" cy="70" r="7" fill="#451a03" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="84" cy="70" r="2.5" fill="#ca8a04" />

          {/* Heavy Bronze Cannon Barrel */}
          <polygon points="50,56 102,40 100,32 46,50" fill="#ca8a04" stroke="#78350f" strokeWidth="2" />
          <rect x="99" y="32" width="6" height="10" fill="#ca8a04" stroke="#78350f" strokeWidth="1.5" rx="1" transform="rotate(-18 102 36)" />
          {/* Cannon Muzzle Hollow */}
          <ellipse cx="104" cy="35" rx="2" ry="4.5" fill="#0f172a" />
          {/* Fuse and Cascabel knob */}
          <circle cx="46" cy="53" r="3.5" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />
          <path d="M 52 48 Q 50 42 54 38" stroke="#ffffff" strokeWidth="1.2" fill="none" />
          <circle cx="54" cy="38" r="1.5" fill="#ef4444" className="animate-ping" />
        </g>

        {/* 2.5D — thùng rượu & thân đại bác: mặt phải tối, viền trên nắng (đèn trên-trái) */}
        <path d="M 24 45 C 28 56 28 66 24 75 L 28 75 C 32 66 32 56 28 45 Z" fill={_AO} opacity="0.22" />
        <path d="M 12 45 C 8 56 8 66 12 75 L 16 75 C 12 66 12 56 16 45 Z" fill="#ffffff" opacity="0.16" />
        <polygon points="78,68 88,68 84,52 74,52" fill={_AO} opacity="0.2" />
        <polygon points="60,52 84,52 83,54.6 61,54.6" fill="#ffffff" opacity="0.2" />
        <path d="M 50 53 L 102 37 L 102 40 L 50 56 Z" fill={_AO} opacity="0.24" />
        <path d="M 46 50 L 100 32 L 100 35 L 46 53 Z" fill="#ffffff" opacity="0.22" />

        {/* Stack of 3 Cannonballs */}
        <g>
          <circle cx="44" cy="72" r="5" fill="#334155" stroke="#0f172a" strokeWidth="1" />
          <circle cx="51" cy="72" r="5" fill="#334155" stroke="#0f172a" strokeWidth="1" />
          <circle cx="47.5" cy="63.5" r="5" fill="#334155" stroke="#0f172a" strokeWidth="1" />
          <circle cx="46" cy="62" r="1.2" fill="#94a3b8" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 30. VƯỜN CAM NAMI TRÊN BOONG TÀU (NAMI'S TANGERINE TREES)
// =========================================================================
function _Raw_NamiTangerineTreesSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 110 * scale, height: 110 * scale }}>
      <svg viewBox="0 0 110 110" width={110 * scale} height={110 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp dưới 2 chậu gỗ (đèn trên-trái) */}
        {_ao('namiAO', 58, 103, 48, 7, 0.26)}

        {/* Wooden Planting Tubs (Chậu gỗ trồng cam) */}
        <polygon points="20,82 48,82 45,102 23,102" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
        <line x1="21" y1="92" x2="46" y2="92" stroke="#334155" strokeWidth="1.5" />

        <polygon points="62,82 90,82 87,102 65,102" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
        <line x1="63" y1="92" x2="88" y2="92" stroke="#334155" strokeWidth="1.5" />

        {/* Left Tree Trunk & Canopy */}
        <path d="M 34 82 L 34 50" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="34" cy="42" rx="22" ry="20" fill="#15803d" />
        <ellipse cx="32" cy="38" rx="18" ry="16" fill="#22c55e" />

        {/* Right Tree Trunk & Canopy */}
        <path d="M 76 82 L 76 46" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="76" cy="38" rx="24" ry="22" fill="#15803d" />
        <ellipse cx="74" cy="34" rx="20" ry="18" fill="#22c55e" />

        {/* 2.5D — chậu gỗ 2 mặt (trái nắng / phải tối), tán cam có khối, thân cây mặt bên */}
        <polygon points="40,82 48,82 45,102 38,102" fill={_AO} opacity="0.22" />
        <polygon points="20,82 24,82 27,102 23,102" fill="#ffffff" opacity="0.18" />
        <polygon points="82,82 90,82 87,102 80,102" fill={_AO} opacity="0.24" />
        <polygon points="62,82 66,82 69,102 65,102" fill="#ffffff" opacity="0.18" />
        <path d="M 36 82 L 36 50" stroke={_AO} strokeWidth="1.6" opacity="0.3" />
        <path d="M 78 82 L 78 46" stroke={_AO} strokeWidth="1.6" opacity="0.3" />
        <ellipse cx="46" cy="50" rx="16" ry="14" fill={_AO} opacity="0.14" />
        <ellipse cx="88" cy="46" rx="18" ry="16" fill={_AO} opacity="0.16" />
        <ellipse cx="26" cy="34" rx="13" ry="9" fill="#4ade80" opacity="0.45" />
        <ellipse cx="66" cy="30" rx="14" ry="10" fill="#4ade80" opacity="0.45" />

        {/* Ripe Orange Tangerines (Quả cam Mikan mọng nước) */}
        {[
          { x: 24, y: 44 },
          { x: 38, y: 32 },
          { x: 42, y: 48 },
          { x: 28, y: 30 },
          { x: 66, y: 38 },
          { x: 82, y: 28 },
          { x: 86, y: 44 },
          { x: 74, y: 24 },
          { x: 72, y: 48 },
        ].map((tan, i) => (
          <g key={i} className="animate-pulse" style={{ animationDuration: `${2 + (i % 3) * 0.5}s` }}>
            <circle cx={tan.x} cy={tan.y} r="4" fill="#f97316" stroke="#ea580c" strokeWidth="0.8" />
            <circle cx={tan.x - 1} cy={tan.y - 1} r="1" fill="#fed7aa" />
            <path d={`M ${tan.x} ${tan.y - 4} Q ${tan.x + 2} ${tan.y - 6} ${tan.x + 3} ${tan.y - 5}`} stroke="#16a34a" strokeWidth="0.8" fill="none" />
          </g>
        ))}

        {/* Gardening Watering Can in center */}
        <rect x="48" y="90" width="12" height="10" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" rx="1" />
        <line x1="58" y1="92" x2="63" y2="86" stroke="#38bdf8" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// =========================================================================
// 31. KONOHA - VÁCH ĐÁ TƯỢNG HOKAGE (HOKAGE ROCK MONUMENT)
// =========================================================================
function _Raw_HokageRockMonumentSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 220 * scale, height: 110 * scale }}>
      <svg viewBox="0 0 220 110" width={220 * scale} height={110 * scale} className="overflow-visible">
        {/* Bóng AO chân vách đá (đèn trên-trái) */}
        {_ao('hokageAO', 118, 106, 108, 9, 0.3)}
        {/* Mountain Rock Base / Vách đá hoa cương */}
        <polygon points="5,108 15,28 60,18 110,14 165,18 208,28 215,108" fill="#78716c" stroke="#44403c" strokeWidth="2.5" />
        <polygon points="12,108 22,34 62,24 110,20 160,24 200,34 208,108" fill="#a8a29e" />

        {/* Bonsai Pine Trees on top edge */}
        {[28, 75, 125, 178].map((px, i) => (
          <g key={i}>
            <line x1={px} y1={22} x2={px} y2={12} stroke="#451a03" strokeWidth="2" />
            <ellipse cx={px} cy={10} rx="9" ry="5" fill="#15803d" />
            <ellipse cx={px - 2} cy={8} rx="6" ry="4" fill="#22c55e" />
          </g>
        ))}

        {/* Hokage 1: Hashirama Senju (Leftmost) */}
        <g transform="translate(28, 38)">
          <rect x="0" y="0" width="30" height="42" fill="#d6d3d1" stroke="#57534e" strokeWidth="1.5" rx="3" />
          {/* Long hair strands */}
          <path d="M -2 0 L -2 38" stroke="#57534e" strokeWidth="3" />
          <path d="M 32 0 L 32 38" stroke="#57534e" strokeWidth="3" />
          {/* Headband with Leaf crest */}
          <rect x="2" y="4" width="26" height="7" fill="#57534e" rx="1" />
          <circle cx="15" cy="7.5" r="1.8" fill="#facc15" />
          {/* Eyes & stern mouth */}
          <line x1="6" y1="18" x2="11" y2="18" stroke="#44403c" strokeWidth="1.5" />
          <line x1="19" y1="18" x2="24" y2="18" stroke="#44403c" strokeWidth="1.5" />
          <line x1="12" y1="30" x2="18" y2="30" stroke="#44403c" strokeWidth="1.5" />
        </g>

        {/* Hokage 2: Tobirama Senju */}
        <g transform="translate(68, 36)">
          <rect x="0" y="0" width="30" height="42" fill="#d6d3d1" stroke="#57534e" strokeWidth="1.5" rx="3" />
          {/* Spiky white hair frame */}
          <polygon points="-4,-4 5,2 15,-6 25,2 34,-4 30,12 0,12" fill="#f5f5f4" stroke="#57534e" strokeWidth="1" />
          {/* Forehead & Chin iron protector (Happuri) */}
          <path d="M 0 10 L 30 10 L 26 28 L 4 28 Z" fill="none" stroke="#57534e" strokeWidth="1.5" />
          {/* 3 red facial markings */}
          <line x1="4" y1="22" x2="10" y2="22" stroke="#dc2626" strokeWidth="1.5" />
          <line x1="20" y1="22" x2="26" y2="22" stroke="#dc2626" strokeWidth="1.5" />
          <line x1="15" y1="32" x2="15" y2="38" stroke="#dc2626" strokeWidth="1.5" />
          <line x1="7" y1="18" x2="12" y2="18" stroke="#44403c" strokeWidth="1.5" />
          <line x1="18" y1="18" x2="23" y2="18" stroke="#44403c" strokeWidth="1.5" />
        </g>

        {/* Hokage 3: Hiruzen Sarutobi */}
        <g transform="translate(112, 38)">
          <rect x="0" y="0" width="30" height="42" fill="#d6d3d1" stroke="#57534e" strokeWidth="1.5" rx="3" />
          {/* Hokage Hat (Nón Hokage đỏ & trắng) */}
          <polygon points="15,-8 -2,8 32,8" fill="#dc2626" stroke="#991b1b" strokeWidth="1.2" />
          <circle cx="15" cy="2" r="3" fill="#ffffff" />
          <text x="13.5" y="4" fontSize="4" fill="#dc2626" fontWeight="bold">火</text>
          {/* Eyes with wrinkle marks & goat beard */}
          <line x1="6" y1="18" x2="11" y2="19" stroke="#44403c" strokeWidth="1.2" />
          <line x1="19" y1="19" x2="24" y2="18" stroke="#44403c" strokeWidth="1.2" />
          <polygon points="13,38 17,38 15,44" fill="#a8a29e" stroke="#57534e" strokeWidth="1" />
        </g>

        {/* Hokage 4: Minato Namikaze (Tia chớp vàng) */}
        <g transform="translate(156, 36)">
          <rect x="0" y="0" width="30" height="42" fill="#d6d3d1" stroke="#57534e" strokeWidth="1.5" rx="3" />
          {/* Spiky hair with famous long sideburn spikes */}
          <polygon points="-6,2 -2,-8 8,-2 15,-10 22,-2 32,-8 36,2 30,12 0,12" fill="#d6d3d1" stroke="#57534e" strokeWidth="1.2" />
          <polygon points="-5,14 -7,28 -1,22" fill="#d6d3d1" stroke="#57534e" strokeWidth="1" />
          <polygon points="35,14 37,28 31,22" fill="#d6d3d1" stroke="#57534e" strokeWidth="1" />
          {/* Leaf Headband */}
          <rect x="2" y="4" width="26" height="7" fill="#57534e" rx="1" />
          <circle cx="15" cy="7.5" r="1.8" fill="#facc15" />
          {/* Sharp eyes & smile */}
          <line x1="6" y1="18" x2="11" y2="17" stroke="#44403c" strokeWidth="1.5" />
          <line x1="19" y1="17" x2="24" y2="18" stroke="#44403c" strokeWidth="1.5" />
          <path d="M 11 28 Q 15 32 19 28" stroke="#44403c" strokeWidth="1.2" fill="none" />
        </g>

        {/* 2.5D — vách đá 2 mặt: phải tối, trái nắng, nứt dọc + sương xa phía đỉnh (atmospheric) */}
        <polygon points="165,18 208,28 215,108 176,108" fill={_AO} opacity="0.18" />
        <polygon points="5,108 15,28 58,19 52,19 21,33 13,108" fill="#ffffff" opacity="0.13" />
        <path
          d="M 40 108 L 46 44 M 92 108 L 94 34 M 142 108 L 140 36 M 188 108 L 182 48"
          stroke={_AO}
          strokeWidth="1.5"
          opacity="0.16"
          fill="none"
        />
        <path d="M 6 105 Q 34 99 62 105 Q 96 111 128 104" stroke="#15803d" strokeWidth="3" opacity="0.45" fill="none" />
        <rect x="0" y="0" width="220" height="26" fill="#e7e5e4" opacity="0.13" />

        {/* Carved Kanji "木ノ葉" (Konoha) on Mountain Foot */}
        <rect x="85" y="92" width="50" height="14" fill="#44403c" rx="2" opacity="0.8" />
        <text x="92" y="102" fontSize="9" fill="#fef08a" fontWeight="black" fontFamily="sans-serif">
          🍃 KONOHA
        </text>
      </svg>
    </div>
  );
}

// =========================================================================
// 32. QUÁN MÌ ICHIRAKU RAMEN (ICHIRAKU RAMEN SHOP)
// =========================================================================
function _Raw_IchirakuRamenShopSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 150 * scale, height: 125 * scale }}>
      <svg viewBox="0 0 150 125" width={150 * scale} height={125 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp dưới quầy mì (đèn trên-trái) */}
        {_ao('ramenAO', 78, 119, 70, 7.5, 0.28)}

        {/* Wooden Stall Frame (Quầy gỗ thông) */}
        <rect x="18" y="48" width="114" height="68" fill="#92400e" stroke="#451a03" strokeWidth="2" rx="1" />
        {/* Counter Top bar */}
        <rect x="12" y="80" width="126" height="8" fill="#d97706" stroke="#78350f" strokeWidth="1.5" rx="1" />

        {/* Traditional Dark Japanese Tile Roof (Mái ngói đen) */}
        <polygon points="8,48 75,18 142,48" fill="#334155" stroke="#0f172a" strokeWidth="2.5" />
        <polygon points="14,46 75,22 136,46" fill="#475569" />
        <line x1="28" y1="40" x2="122" y2="40" stroke="#1e293b" strokeWidth="1.5" />
        <line x1="48" y1="30" x2="102" y2="30" stroke="#1e293b" strokeWidth="1.5" />
        {/* Roof ridge beam */}
        <line x1="6" y1="48" x2="144" y2="48" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />

        {/* 2 Hanging Glowing Red Paper Lanterns (Chochin) */}
        {[
          { x: 18, y: 55 },
          { x: 132, y: 55 },
        ].map((lt, i) => (
          <g key={i} className="animate-pulse" style={{ animationDuration: `${1.8 + i * 0.4}s` }}>
            <line x1={lt.x} y1={48} x2={lt.x} y2={lt.y} stroke="#0f172a" strokeWidth="1.5" />
            <ellipse cx={lt.x} cy={lt.y + 10} rx="9" ry="12" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
            <circle cx={lt.x} cy={lt.y + 10} r="4" fill="#fef08a" opacity="0.8" />
            <text x={lt.x - 3.5} y={lt.y + 13} fontSize="7" fill="#ffffff" fontWeight="black">
              拉
            </text>
            <rect x={lt.x - 4} y={lt.y + 22} width="8" height="2" fill="#ca8a04" />
          </g>
        ))}

        {/* 3 Red Noren Curtains with Kanji "ラーメン" */}
        {['ラ', 'ー', 'メ'].map((char, i) => (
          <g key={i}>
            <rect x={32 + i * 30} y="48" width="26" height="28" fill="#dc2626" stroke="#991b1b" strokeWidth="1.2" rx="1" />
            <text x={40 + i * 30} y="68" fontSize="13" fill="#ffffff" fontWeight="black" fontFamily="sans-serif">
              {char}
            </text>
          </g>
        ))}

        {/* 2.5D — quầy mì 2 mặt: mặt phải tối, mặt trái nắng; mái ngói & quầy có khối */}
        <rect x="110" y="48" width="18" height="68" fill={_AO} opacity="0.18" />
        <rect x="18" y="48" width="4" height="68" fill="#ffffff" opacity="0.12" />
        <polygon points="75,18 142,48 75,48" fill={_AO} opacity="0.17" />
        <polygon points="8,48 75,18 75,25 16,46" fill="#ffffff" opacity="0.18" />
        <rect x="12" y="80" width="126" height="2.6" fill="#ffffff" opacity="0.22" />
        <rect x="12" y="85.4" width="126" height="2.6" fill={_AO} opacity="0.24" />
        <ellipse cx="38" cy="117" rx="14" ry="5" fill={_AO} opacity="0.22" />
        <ellipse cx="112" cy="117" rx="14" ry="5" fill={_AO} opacity="0.22" />

        {/* Steaming Giant Ramen Bowl on Counter */}
        <g>
          {/* Rising Swirling Steam */}
          <path d="M 68 70 Q 64 60 70 52 Q 76 44 72 36" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.8" className="animate-bounce" style={{ animationDuration: '2s' }} />
          <path d="M 78 72 Q 84 62 78 54 Q 74 46 80 38" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.8" className="animate-bounce" style={{ animationDuration: '2.4s' }} />

          {/* Porcelain Bowl */}
          <path d="M 60 80 Q 75 96 90 80 Z" fill="#ffffff" stroke="#dc2626" strokeWidth="2" />
          <path d="M 62 80 Q 75 92 88 80" fill="#f59e0b" />
          {/* Swirl Narutomaki Fish Cake */}
          <circle cx="70" cy="80" r="3.5" fill="#ffffff" stroke="#f43f5e" strokeWidth="1" />
          <path d="M 69 80 Q 70 78 71 80" stroke="#f43f5e" strokeWidth="0.8" fill="none" />
          {/* Boiled Egg Half */}
          <ellipse cx="80" cy="80" rx="3.5" ry="3" fill="#ffffff" />
          <circle cx="80" cy="80" r="2" fill="#f97316" />
          {/* Chopsticks */}
          <line x1="64" y1="74" x2="88" y2="76" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Stools for Ninjas */}
        <ellipse cx="38" cy="112" rx="10" ry="4" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />
        <line x1="38" y1="112" x2="38" y2="120" stroke="#78350f" strokeWidth="2" />
        <ellipse cx="112" cy="112" rx="10" ry="4" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />
        <line x1="112" y1="112" x2="112" y2="120" stroke="#78350f" strokeWidth="2" />
      </svg>
    </div>
  );
}

// =========================================================================
// 33. HỒ SUỐI NƯỚC NÓNG ONSEN (ONSEN NATURAL HOT SPRING)
// =========================================================================
function _Raw_OnsenHotSpringSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 180 * scale, height: 105 * scale }}>
      <svg viewBox="0 0 180 105" width={180 * scale} height={105 * scale} className="overflow-visible">
        {/* Bóng AO quanh bờ suối (đèn trên-trái) */}
        {_ao('onsenAO', 92, 97, 80, 8, 0.26)}
        {/* Bamboo privacy partition in background */}
        <g stroke="#65a30d" strokeWidth="2">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={30 + i * 10} y1={10} x2={30 + i * 10} y2={45} />
          ))}
          <line x1="28" y1="20" x2="142" y2="20" stroke="#4d7c0f" strokeWidth="2.5" />
          <line x1="28" y1="36" x2="142" y2="36" stroke="#4d7c0f" strokeWidth="2.5" />
        </g>

        {/* Volcanic Rock Border (Bờ đá cuội núi lửa) */}
        <path
          d="M 15 50 C 20 22 75 16 115 18 C 155 20 170 35 168 65 C 165 92 125 102 85 100 C 35 98 12 78 15 50 Z"
          fill="#57534e"
          stroke="#292524"
          strokeWidth="3"
        />

        {/* Thermal Hot Spring Teal Water Basin */}
        <path
          d="M 22 50 C 26 28 75 22 112 24 C 150 26 162 38 160 65 C 158 88 122 96 85 94 C 40 92 20 74 22 50 Z"
          fill="url(#onsenWaterGrad)"
          stroke="#2dd4bf"
          strokeWidth="1.5"
        />
        <defs>
          <linearGradient id="onsenWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
        </defs>

        {/* 2.5D GROUND — bờ đá onsen 2 mặt + mặt nước phân lớp sáng tối (đèn trên-trái) */}
        <defs>
          <clipPath id="onsenBasinClip">
            <path d="M 22 50 C 26 28 75 22 112 24 C 150 26 162 38 160 65 C 158 88 122 96 85 94 C 40 92 20 74 22 50 Z" />
          </clipPath>
          <linearGradient id="onsenDepthGrad" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="48%" stopColor="#5eead4" stopOpacity="0" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.34" />
          </linearGradient>
        </defs>
        <path d="M 15 50 C 20 22 75 16 115 18 L 112 24 C 76 22 24 27 21 50 Z" fill="#ffffff" opacity="0.2" />
        <path d="M 168 65 C 165 92 125 102 85 100 L 85 94 C 122 95 157 87 159 64 Z" fill={_AO} opacity="0.24" />
        <g clipPath="url(#onsenBasinClip)">
          <rect x="0" y="0" width="180" height="105" fill="url(#onsenDepthGrad)" />
        </g>

        {/* Gentle Thermal Ripples & Rising Steam */}
        <ellipse cx="85" cy="58" rx="45" ry="16" fill="none" stroke="#ccfbf1" strokeWidth="1" opacity="0.6" />
        <ellipse cx="105" cy="72" rx="30" ry="10" fill="none" stroke="#ccfbf1" strokeWidth="1" opacity="0.6" />

        {/* Rising Steam Puffs */}
        <circle cx="70" cy="35" r="5" fill="#ffffff" opacity="0.6" className="animate-bounce" style={{ animationDuration: '2s' }} />
        <circle cx="95" cy="30" r="6" fill="#ffffff" opacity="0.65" className="animate-bounce" style={{ animationDuration: '2.5s' }} />
        <circle cx="120" cy="38" r="4.5" fill="#ffffff" opacity="0.6" className="animate-bounce" style={{ animationDuration: '2.2s' }} />

        {/* Floating Wooden Cedar Bucket (Oke) with white folded towel */}
        <g>
          <circle cx="56" cy="62" r="7.5" fill="#ca8a04" stroke="#78350f" strokeWidth="1.2" />
          <circle cx="56" cy="62" r="5.5" fill="#eab308" />
          {/* Folded white onsen towel */}
          <rect x="52" y="59" width="8" height="5" fill="#ffffff" rx="1" />
        </g>

        {/* Floating Sakura Blossom Petals */}
        <ellipse cx="95" cy="55" rx="3" ry="2" fill="#fda4af" transform="rotate(25 95 55)" />
        <ellipse cx="125" cy="68" rx="3" ry="2" fill="#fda4af" transform="rotate(-35 125 68)" />
        <ellipse cx="78" cy="76" rx="2.5" ry="1.8" fill="#fda4af" />

        {/* Bamboo Water Spout trickling into pool */}
        <g>
          <line x1="140" y1="36" x2="128" y2="46" stroke="#4d7c0f" strokeWidth="4" strokeLinecap="round" />
          {/* Trickling stream */}
          <line x1="126" y1="46" x2="124" y2="58" stroke="#5eead4" strokeWidth="1.5" strokeDasharray="2 1" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 34. CỔNG TORII ĐỎ VÀ RỪNG TRÚC (BAMBOO TORII SHRINE)
// =========================================================================
function _Raw_BambooToriiShrineSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 110 * scale, height: 130 * scale }}>
      <svg viewBox="0 0 110 130" width={110 * scale} height={130 * scale} className="overflow-visible">
        {/* Bóng AO dưới 2 chân cổng Torii (đèn trên-trái) */}
        {_ao('toriiAO', 58, 124, 48, 7, 0.28)}
        {/* Lush Bamboo Stalks on flanks */}
        <g stroke="#15803d" strokeWidth="3">
          <line x1="12" y1="125" x2="12" y2="15" />
          <line x1="22" y1="125" x2="22" y2="25" />
          <line x1="88" y1="125" x2="88" y2="25" />
          <line x1="98" y1="125" x2="98" y2="15" />
        </g>
        {/* Bamboo node segments */}
        {[30, 50, 70, 90, 110].map((by) => (
          <g key={by} stroke="#4ade80" strokeWidth="1">
            <line x1="10" y1={by} x2="14" y2={by} />
            <line x1="20" y1={by} x2="24" y2={by} />
            <line x1="86" y1={by} x2="90" y2={by} />
            <line x1="96" y1={by} x2="100" y2={by} />
          </g>
        ))}

        {/* Vermilion Red Torii Gate (Cổng Torii Thần Đạo) */}
        {/* Two Main Upright Pillars */}
        <rect x="32" y="32" width="6" height="92" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.5" rx="1" />
        <rect x="72" y="32" width="6" height="92" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.5" rx="1" />
        {/* Black Stone Bases */}
        <rect x="30" y="118" width="10" height="7" fill="#1e293b" rx="1" />
        <rect x="70" y="118" width="10" height="7" fill="#1e293b" rx="1" />

        {/* Lower Horizontal Tie Beam (Nuki) */}
        <rect x="26" y="52" width="58" height="5" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />

        {/* Upper Curved Crossbar (Kasagi) with Black Roof Cap */}
        <path d="M 18 32 Q 55 24 92 32 L 95 24 Q 55 16 15 24 Z" fill="#0f172a" stroke="#0f172a" strokeWidth="1" />
        <rect x="22" y="30" width="66" height="6" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />

        {/* Shimenawa Sacred Straw Rope & Zigzag Shide */}
        <path d="M 34 52 Q 55 58 76 52" stroke="#ca8a04" strokeWidth="2.5" fill="none" />
        {/* White folded paper shide */}
        <polygon points="46,55 50,55 48,64 45,62" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.5" />
        <polygon points="54,56 58,56 56,66 53,64" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.5" />
        <polygon points="62,55 66,55 64,64 61,62" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.5" />

        {/* 2.5D — cổng Torii 2 mặt: cột phải tối, cột trái nắng; xà ngang có mặt trên */}
        <rect x="35" y="32" width="3" height="92" fill={_AO} opacity="0.26" />
        <rect x="32" y="32" width="1.6" height="92" fill="#ffffff" opacity="0.26" />
        <rect x="75" y="32" width="3" height="92" fill={_AO} opacity="0.3" />
        <rect x="72" y="32" width="1.6" height="92" fill="#ffffff" opacity="0.22" />
        <rect x="26" y="52" width="58" height="1.8" fill="#ffffff" opacity="0.24" />
        <rect x="26" y="55.2" width="58" height="1.8" fill={_AO} opacity="0.26" />
        <path d="M 15 24 Q 55 16 95 24" fill="none" stroke="#ffffff" strokeWidth="1.6" opacity="0.22" />
        <rect x="36" y="118" width="4" height="7" fill="#ffffff" opacity="0.16" />
        <rect x="76" y="118" width="4" height="7" fill={_AO} opacity="0.3" />
        {/* Bóng trúc đổ sang phải (đèn trên-trái) */}
        <g stroke={_AO} strokeWidth="3" opacity="0.22">
          <line x1="14" y1="125" x2="20" y2="125" />
          <line x1="24" y1="125" x2="30" y2="125" />
          <line x1="90" y1="125" x2="96" y2="125" />
          <line x1="100" y1="125" x2="106" y2="125" />
        </g>

        {/* Stone Pagoda Lantern in front */}
        <g transform="translate(18, 92)">
          <rect x="0" y="12" width="10" height="20" fill="#64748b" stroke="#334155" strokeWidth="1" />
          <polygon points="-2,12 5,6 12,12" fill="#475569" stroke="#1e293b" strokeWidth="1" />
          <circle cx="5" cy="18" r="2" fill="#fef08a" className="animate-pulse" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 35. BIA TẬP PHÓNG KUNAI & SHURIKEN (NINJA TRAINING POST)
// =========================================================================
function _Raw_NinjaTrainingPostSVG({ className = '', scale = 1, isHit = false }: { className?: string; scale?: number; isHit?: boolean }) {
  return (
    <div
      className={`relative inline-block select-none transition-transform duration-150 ${isHit ? 'animate-wiggle scale-110' : ''} ${className}`}
      style={{ width: 85 * scale, height: 100 * scale }}
    >
      <svg viewBox="0 0 85 100" width={85 * scale} height={100 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp dưới bia tập (đèn trên-trái) */}
        {_ao('ninjaAO', 45, 93, 30, 5.5, 0.26)}

        {/* Heavy Wooden Training Post Log */}
        <rect x="32" y="18" width="22" height="76" fill="#78350f" stroke="#451a03" strokeWidth="2" rx="2" />
        {/* Tree ring top cap */}
        <ellipse cx="43" cy="18" rx="11" ry="4" fill="#a16207" stroke="#451a03" strokeWidth="1.5" />

        {/* Target Bullseye Rings in center */}
        <g>
          <circle cx="43" cy="48" r="9" fill="#ffffff" stroke="#dc2626" strokeWidth="2.5" />
          <circle cx="43" cy="48" r="4.5" fill="#dc2626" />
          <circle cx="43" cy="48" r="1.5" fill="#ffffff" />
        </g>

        {/* Embedded Steel Kunai Knife */}
        <g transform="translate(30, 42) rotate(-25)">
          <polygon points="0,0 16,-4 16,4" fill="#94a3b8" stroke="#334155" strokeWidth="1" />
          <line x1="16" y1="0" x2="28" y2="0" stroke="#ca8a04" strokeWidth="2" />
          {/* Ring handle */}
          <circle cx="31" cy="0" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
        </g>

        {/* Embedded 4-pointed Shuriken Ninja Star */}
        <g transform="translate(48, 62) rotate(15)">
          <polygon points="0,-7 3,-2 8,0 3,2 0,7 -3,2 -8,0 -3,-2" fill="#64748b" stroke="#0f172a" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="1.5" fill="#0f172a" />
        </g>

        {/* 2.5D — thân bia tập 2 mặt: phải tối, trái nắng; tâm bia có bóng lệch phải */}
        <rect x="46" y="18" width="8" height="76" fill={_AO} opacity="0.24" />
        <rect x="32" y="18" width="3" height="76" fill="#ffffff" opacity="0.2" />
        <path d="M 33 17 A 11 4 0 0 1 54 17" fill="none" stroke="#ffffff" strokeWidth="1.6" opacity="0.35" />
        <path d="M 34 56 A 9 9 0 0 0 52 56" fill="none" stroke={_AO} strokeWidth="2" opacity="0.2" />
        <ellipse cx="43" cy="86" rx="11" ry="4" fill={_AO} opacity="0.22" />

        {/* Unrolled Ninja Ninjutsu Scroll leaning on ground */}
        <g>
          <path d="M 12 88 Q 30 82 45 88" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
          <rect x="14" y="80" width="28" height="12" fill="#fef3c7" stroke="#ca8a04" strokeWidth="1" rx="1" />
          <line x1="18" y1="84" x2="38" y2="84" stroke="#0f172a" strokeWidth="0.8" />
          <line x1="18" y1="88" x2="32" y2="88" stroke="#0f172a" strokeWidth="0.8" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 36. HOGWARTS - NẾN LƠ LỬNG VÀ CỬA SỔ GOTHIC (FLOATING CANDLES GOTHIC HALL)
// =========================================================================
function _Raw_FloatingCandlesGothicHallSVG({ className = '', scale = 1, isLit = false }: { className?: string; scale?: number; isLit?: boolean }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 190 * scale, height: 130 * scale }}>
      <svg viewBox="0 0 190 130" width={190 * scale} height={130 * scale} className="overflow-visible">
        {/* Gothic Stone Arches in Background */}
        <path d="M 20 120 L 20 50 Q 55 10 95 10 Q 135 10 170 50 L 170 120" stroke="#334155" strokeWidth="4" fill="none" opacity="0.4" />
        <path d="M 40 120 L 40 60 Q 95 24 150 60 L 150 120" stroke="#475569" strokeWidth="2.5" fill="none" opacity="0.35" />

        {/* Stained Glass Rose Window Silhouette */}
        <circle cx="95" cy="40" r="18" fill="none" stroke="#64748b" strokeWidth="1.5" opacity="0.5" />
        <line x1="95" y1="22" x2="95" y2="58" stroke="#64748b" strokeWidth="1" opacity="0.4" />
        <line x1="77" y1="40" x2="113" y2="40" stroke="#64748b" strokeWidth="1" opacity="0.4" />

        {/* 10 Enchanted Floating Beeswax Taper Candles at Varied Altitudes */}
        {[
          { x: 30, y: 45, h: 22 },
          { x: 55, y: 25, h: 26 },
          { x: 80, y: 55, h: 20 },
          { x: 95, y: 20, h: 28 },
          { x: 115, y: 48, h: 24 },
          { x: 140, y: 28, h: 22 },
          { x: 165, y: 52, h: 25 },
          { x: 42, y: 75, h: 18 },
          { x: 128, y: 78, h: 20 },
          { x: 85, y: 85, h: 18 },
        ].map((c, i) => (
          <g key={i} className="animate-pulse" style={{ animationDuration: `${1.5 + (i % 4) * 0.4}s` }}>
            {/* Dripping Wax Cylinder */}
            <rect x={c.x - 2.5} y={c.y} width="5" height={c.h} fill="#fef3c7" stroke="#ca8a04" strokeWidth="0.8" rx="1" />
            {/* Wax drip tear */}
            <circle cx={c.x + 2.5} cy={c.y + 6} r="1" fill="#fef3c7" />

            {/* Glowing Golden Flame & Halo */}
            <ellipse cx={c.x} cy={c.y - 7} rx={isLit ? "9" : "6"} ry={isLit ? "11" : "8"} fill="rgba(250, 204, 21, 0.35)" />
            {/* Flame drop */}
            <path
              d={`M ${c.x - 2} ${c.y - 1} Q ${c.x} ${c.y - 10} ${c.x} ${c.y - 12} Q ${c.x} ${c.y - 10} ${c.x + 2} ${c.y - 1} Z`}
              fill="#facc15"
            />
            <circle cx={c.x} cy={c.y - 4} r="1.5" fill="#ffffff" />
          </g>
        ))}

        {/* 2.5D — sảnh Gothic: cột trái ăn nắng, cột phải tối, sàn đá phân lớp */}
        <defs>
          <linearGradient id="hallFloorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.34" />
          </linearGradient>
        </defs>
        <rect x="18" y="12" width="3" height="108" fill="#ffffff" opacity="0.4" />
        <rect x="169" y="12" width="3" height="108" fill={_AO} opacity="0.45" />
        <rect x="39" y="26" width="2" height="94" fill="#ffffff" opacity="0.3" />
        <rect x="149" y="26" width="2" height="94" fill={_AO} opacity="0.35" />
        <rect x="0" y="120" width="190" height="10" fill="url(#hallFloorGrad)" />
        <path d="M 0 120 L 190 120" stroke="#94a3b8" strokeWidth="1" opacity="0.35" />

        {/* Ambient Floating Magic Sparkles */}
        <circle cx="65" cy="38" r="1.8" fill="#ffffff" className="animate-ping" style={{ animationDuration: '2.5s' }} />
        <circle cx="108" cy="32" r="2" fill="#fef08a" className="animate-ping" style={{ animationDuration: '1.8s' }} />
        <circle cx="150" cy="42" r="1.5" fill="#bae6fd" className="animate-ping" style={{ animationDuration: '2.2s' }} />
      </svg>
    </div>
  );
}

// =========================================================================
// 37. LÒ SƯỞI ĐÁ ĐẠI SẢNH ĐƯỜNG & LỬA FLOO (HOGWARTS GREAT FIREPLACE)
// =========================================================================
function _Raw_HogwartsGreatFireplaceSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 140 * scale, height: 130 * scale }}>
      <svg viewBox="0 0 140 130" width={140 * scale} height={130 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp trước lò sưởi (đèn trên-trái) */}
        {_ao('fireAO', 73, 125, 62, 7, 0.3)}

        {/* Carved Medieval Stone Chimney Breast */}
        <rect x="25" y="10" width="90" height="50" fill="#64748b" stroke="#334155" strokeWidth="2.5" />
        {/* Ashlar Stone lines */}
        <line x1="25" y1="26" x2="115" y2="26" stroke="#475569" strokeWidth="1.5" />
        <line x1="25" y1="42" x2="115" y2="42" stroke="#475569" strokeWidth="1.5" />
        <line x1="60" y1="26" x2="60" y2="42" stroke="#475569" strokeWidth="1.2" />
        <line x1="85" y1="10" x2="85" y2="26" stroke="#475569" strokeWidth="1.2" />

        {/* Carved Hogwarts Heraldic Crest Shield on Mantel */}
        <polygon points="62,20 78,20 75,34 70,38 65,34" fill="#b45309" stroke="#78350f" strokeWidth="1.2" />
        <text x="67" y="30" fontSize="7" fill="#facc15" fontWeight="bold">H</text>

        {/* Massive Fireplace Hearth Opening */}
        <path d="M 20 60 L 120 60 L 120 124 L 20 124 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
        <path d="M 32 124 L 32 80 Q 70 65 108 80 L 108 124 Z" fill="#0f172a" />

        {/* 2.5D — lò sưởi đá: mặt phải tối, mặt trái nắng, lò rỗng có AO sâu */}
        <rect x="95" y="10" width="20" height="50" fill={_AO} opacity="0.18" />
        <rect x="25" y="10" width="5" height="50" fill="#ffffff" opacity="0.16" />
        <rect x="92" y="60" width="28" height="64" fill={_AO} opacity="0.2" />
        <rect x="20" y="60" width="5" height="64" fill="#ffffff" opacity="0.12" />
        <rect x="20" y="60" width="100" height="3" fill="#ffffff" opacity="0.16" />
        <path
          d="M 32 124 L 32 80 Q 70 65 108 80 L 108 124"
          fill="none"
          stroke="#000000"
          strokeWidth="3"
          opacity="0.4"
        />

        {/* Burning Firewood Logs & Andirons */}
        <g>
          {/* Brass andirons */}
          <line x1="42" y1="120" x2="42" y2="100" stroke="#ca8a04" strokeWidth="3" />
          <circle cx="42" cy="98" r="3" fill="#facc15" />
          <line x1="98" y1="120" x2="98" y2="100" stroke="#ca8a04" strokeWidth="3" />
          <circle cx="98" cy="98" r="3" fill="#facc15" />
          {/* Wood logs */}
          <line x1="38" y1="118" x2="102" y2="118" stroke="#78350f" strokeWidth="7" strokeLinecap="round" />
          <line x1="44" y1="112" x2="96" y2="112" stroke="#5c2605" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* Roaring Emerald-Green Floo Powder Flames (Ngọn lửa Floo xanh ngọc bập bùng) */}
        <g className="animate-pulse" style={{ animationDuration: '1.2s' }}>
          {/* Back green flame glow */}
          <ellipse cx="70" cy="96" rx="28" ry="20" fill="rgba(16, 185, 129, 0.45)" />

          {/* Tongue of green flame */}
          <path d="M 52 112 Q 62 82 70 72 Q 78 82 88 112 Q 70 106 52 112 Z" fill="#10b981" />
          {/* Inner core flame */}
          <path d="M 58 112 Q 66 88 70 80 Q 74 88 82 112 Q 70 108 58 112 Z" fill="#6ee7b7" />
          <path d="M 64 112 Q 70 94 70 88 Q 72 94 76 112 Z" fill="#ffffff" />

          {/* Flying Floo Spark particles */}
          <circle cx="62" cy="74" r="1.5" fill="#34d399" className="animate-ping" />
          <circle cx="76" cy="68" r="1.8" fill="#a7f3d0" className="animate-ping" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 38. BÀN TIỆC PHÉP THUẬT HOGWARTS (MAGIC FEAST TABLE)
// =========================================================================
function _Raw_MagicFeastTableSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 180 * scale, height: 95 * scale }}>
      <svg viewBox="0 0 180 95" width={180 * scale} height={95 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp dưới bàn tiệc (đèn trên-trái) */}
        {_ao('feastAO', 93, 89, 84, 7, 0.28)}

        {/* Long Oak Banquet Table Top */}
        <polygon points="10,50 170,50 162,64 18,64" fill="#92400e" stroke="#451a03" strokeWidth="2" />
        {/* 2.5D: mép dày mặt bàn (mặt dưới tối) + viền nắng mép xa trên-trái */}
        <path d="M 18 64 L 162 64 L 161 69 L 19 69 Z" fill="#020617" opacity="0.32" />
        <path d="M 11.5 50.5 L 168.5 50.5 L 168 52.5 L 12 52.5 Z" fill="#ffffff" opacity="0.22" />
        {/* Table Legs with Braces */}
        <rect x="25" y="64" width="8" height="26" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
        <path d="M 31 65 L 33 65 L 33 89 L 31 89 Z" fill="#020617" opacity="0.35" />
        <rect x="147" y="64" width="8" height="26" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
        <path d="M 153 65 L 155 65 L 155 89 L 153 89 Z" fill="#020617" opacity="0.35" />
        <line x1="29" y1="80" x2="151" y2="80" stroke="#78350f" strokeWidth="3" />

        {/* White Linen Table Runner */}
        <polygon points="35,50 145,50 141,64 39,64" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />

        {/* Golden Roast Turkey Platter in Center */}
        <g>
          {/* Bóng tiếp đất của đĩa lên mặt bàn (đèn trên-trái) */}
          <ellipse cx="95" cy="51" rx="17" ry="5" fill="#020617" opacity="0.25" />
          <ellipse cx="90" cy="48" rx="18" ry="7" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          {/* Roasted golden turkey */}
          <ellipse cx="90" cy="45" rx="13" ry="8" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
          <line x1="102" y1="42" x2="108" y2="38" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Tall Golden Goblets (Ly rượu vàng ròng) */}
        {[30, 60, 120, 150].map((gx, i) => (
          <g key={i}>
            <polygon points={`${gx - 3},48 ${gx + 3},48 ${gx + 2},38 ${gx - 2},38`} fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <line x1={gx} y1={48} x2={gx} y2={51} stroke="#ca8a04" strokeWidth="1.5" />
            <ellipse cx={gx} cy={51} rx="3" ry="1.2" fill="#ca8a04" />
          </g>
        ))}

        {/* Frothy Butterbeer Glass Tankard */}
        <g transform="translate(136, 38)">
          <rect x="0" y="0" width="8" height="12" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" rx="1" />
          <ellipse cx="4" cy="0" rx="4.5" ry="2" fill="#ffffff" />
          <path d="M 8 3 Q 11 6 8 9" stroke="#b45309" strokeWidth="1.2" fill="none" />
        </g>

        {/* Hovering Silver Dessert Plate with Cupcake */}
        <g className="animate-bounce" style={{ animationDuration: '2.5s' }}>
          <ellipse cx="48" cy="34" rx="10" ry="3.5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" />
          <circle cx="48" cy="30" r="4.5" fill="#f43f5e" />
          <circle cx="48" cy="27" r="1.5" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 39. NÓN PHÂN LOẠI TRÊN GHẾ GỖ (SORTING HAT PEDESTAL)
// =========================================================================
function _Raw_SortingHatPedestalSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 85 * scale, height: 105 * scale }}>
      <svg viewBox="0 0 85 105" width={85 * scale} height={105 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp dưới ghế đẩu (đèn trên-trái) */}
        {_ao('hatAO', 45, 97, 30, 5.5, 0.26)}

        {/* Antique 3-Legged Wooden Stool */}
        <ellipse cx="42" cy="72" rx="18" ry="6" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
        {/* 2.5D: viền nắng mép ghế trên-trái + mặt dưới tối */}
        <path d="M 24.5 71 Q 32 67.5 42 67.3" stroke="#ffffff" strokeWidth="1.6" fill="none" opacity="0.35" />
        <path d="M 24.5 72.5 Q 42 80.5 59.5 72.5 Q 42 76 24.5 72.5 Z" fill="#020617" opacity="0.32" />
        <line x1="30" y1="74" x2="24" y2="98" stroke="#78350f" strokeWidth="2.5" />
        <line x1="42" y1="76" x2="42" y2="98" stroke="#78350f" strokeWidth="2.5" />
        <line x1="54" y1="74" x2="60" y2="98" stroke="#78350f" strokeWidth="2.5" />

        {/* Stack of Antique Leatherbound Spellbooks beneath */}
        <rect x="22" y="85" width="20" height="5" fill="#831843" stroke="#500724" strokeWidth="0.8" rx="1" />
        <path d="M 23 85.5 L 41 85.5 L 41 87 L 23 87 Z" fill="#ffffff" opacity="0.16" />
        <path d="M 39 85.5 L 41 85.5 L 41 89.5 L 39 89.5 Z" fill="#020617" opacity="0.35" />
        <rect x="20" y="90" width="24" height="6" fill="#1e3a8a" stroke="#172554" strokeWidth="0.8" rx="1" />
        <path d="M 21 90.5 L 43 90.5 L 43 92 L 21 92 Z" fill="#ffffff" opacity="0.16" />
        <path d="M 41 90.5 L 43 90.5 L 43 95.5 L 41 95.5 Z" fill="#020617" opacity="0.35" />

        {/* The Sentient Sorting Hat (Chiếc Nón Phân Loại) */}
        <g>
          {/* Wide floppy crumpled brim */}
          <ellipse cx="42" cy="68" rx="26" ry="7" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          <path d="M 18 68 Q 42 75 66 68" stroke="#5c2605" strokeWidth="1.5" fill="none" />

          {/* Pointed Wizard Cone with Characteristic Facial Folds */}
          <path
            d="M 26 67 Q 28 42 36 28 Q 44 14 54 18 Q 50 32 58 67 Z"
            fill="#854d0e"
            stroke="#451a03"
            strokeWidth="2"
          />

          {/* Deep fold creases forming Eyes */}
          <path d="M 33 46 Q 38 42 42 45" stroke="#451a03" strokeWidth="2" fill="none" />
          <path d="M 45 45 Q 49 42 54 46" stroke="#451a03" strokeWidth="2" fill="none" />

          {/* Wide Talking Mouth Crease */}
          <path d="M 32 58 Q 43 65 54 57" stroke="#451a03" strokeWidth="2.5" fill="none" />

          {/* Bent Tip with Stitch Patches */}
          <polygon points="36,36 42,36 42,41 36,41" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
          <line x1="37" y1="38" x2="41" y2="38" stroke="#ca8a04" strokeWidth="0.8" />

          {/* 2.5D: bóng mặt dưới vành nón + viền nắng mép trên-trái (đèn trên-trái) */}
          <path d="M 17 67.5 Q 42 75.5 67 67.5 Q 42 71.5 17 67.5 Z" fill="#020617" opacity="0.3" />
          <path d="M 18.5 66.5 Q 30 64 42 64.8" stroke="#ffffff" strokeWidth="1.6" fill="none" opacity="0.32" />
          <path d="M 28.5 65 Q 30.5 44 37.5 30.5" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.25" />
          <path d="M 55 66 Q 52 44 51.5 26" stroke="#451a03" strokeWidth="3" fill="none" opacity="0.3" />
        </g>

        {/* Magical Sparkles swirling around hat */}
        <circle cx="56" cy="24" r="2" fill="#fef08a" className="animate-ping" style={{ animationDuration: '2s' }} />
        <circle cx="28" cy="40" r="1.5" fill="#ffffff" className="animate-ping" style={{ animationDuration: '1.6s' }} />
      </svg>
    </div>
  );
}

// =========================================================================
// 40. CỜ HIỆU 4 NHÀ HOGWARTS (HOGWARTS HOUSE BANNERS)
// =========================================================================
function _Raw_HogwartsHouseBannersSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 160 * scale, height: 110 * scale }}>
      <svg viewBox="0 0 160 110" width={160 * scale} height={110 * scale} className="overflow-visible">
        {/* Bóng AO dưới dải cờ (đèn trên-trái) */}
        {_ao('hhbAO', 82, 104, 70, 5, 0.22)}
        {/* Horizontal Brass Hanging Rod */}
        <line x1="6" y1="15" x2="154" y2="15" stroke="#ca8a04" strokeWidth="3" strokeLinecap="round" />
        <circle cx="6" cy="15" r="3" fill="#facc15" />
        <circle cx="154" cy="15" r="3" fill="#facc15" />

        {/* Banner 1: Gryffindor (Scarlet & Gold) */}
        <g transform="translate(14, 16)">
          <polygon points="0,0 26,0 26,65 13,80 0,65" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1.2" />
          <polygon points="3,0 23,0 23,62 13,74 3,62" fill="#b91c1c" />
          {/* Golden Lion Emblem */}
          <circle cx="13" cy="30" r="6" fill="#facc15" />
          <text x="10" y="33" fontSize="8" fill="#78350f" fontWeight="bold">🦁</text>
          <text x="5" y="55" fontSize="5" fill="#facc15" fontWeight="bold">GRYFF</text>
        </g>

        {/* Banner 2: Ravenclaw (Navy & Bronze) */}
        <g transform="translate(48, 16)">
          <polygon points="0,0 26,0 26,65 13,80 0,65" fill="#1e3a8a" stroke="#172554" strokeWidth="1.2" />
          <polygon points="3,0 23,0 23,62 13,74 3,62" fill="#1d4ed8" />
          {/* Bronze Eagle Emblem */}
          <circle cx="13" cy="30" r="6" fill="#ca8a04" />
          <text x="10" y="33" fontSize="8" fill="#1e3a8a" fontWeight="bold">🦅</text>
          <text x="6" y="55" fontSize="5" fill="#93c5fd" fontWeight="bold">RAVEN</text>
        </g>

        {/* Banner 3: Hufflepuff (Yellow & Black) */}
        <g transform="translate(82, 16)">
          <polygon points="0,0 26,0 26,65 13,80 0,65" fill="#ca8a04" stroke="#854d0e" strokeWidth="1.2" />
          <polygon points="3,0 23,0 23,62 13,74 3,62" fill="#eab308" />
          {/* Black Badger Emblem */}
          <circle cx="13" cy="30" r="6" fill="#0f172a" />
          <text x="10" y="33" fontSize="8" fill="#facc15" fontWeight="bold">🦡</text>
          <text x="6" y="55" fontSize="5" fill="#0f172a" fontWeight="bold">HUFFL</text>
        </g>

        {/* Banner 4: Slytherin (Emerald & Silver) */}
        <g transform="translate(116, 16)">
          <polygon points="0,0 26,0 26,65 13,80 0,65" fill="#065f46" stroke="#064e3b" strokeWidth="1.2" />
          <polygon points="3,0 23,0 23,62 13,74 3,62" fill="#047857" />
          {/* Silver Serpent Emblem */}
          <circle cx="13" cy="30" r="6" fill="#e2e8f0" />
          <text x="10" y="33" fontSize="8" fill="#064e3b" fontWeight="bold">🐍</text>
          <text x="6" y="55" fontSize="5" fill="#e2e8f0" fontWeight="bold">SLYTH</text>
        </g>

        {/* 2.5D: viền nắng mép trái + mặt phải tối cho từng tấm cờ (đèn trên-trái) */}
        {[14, 48, 82, 116].map((bx) => (
          <g key={`b2d${bx}`} transform={`translate(${bx}, 16)`}>
            <polygon points="3,0 6.5,0 6.5,62 3,62" fill="#ffffff" opacity="0.15" />
            <polygon points="19.5,0 23,0 23,62 19.5,62" fill="#020617" opacity="0.3" />
            <polygon points="4,0 22,0 22,2 4,2" fill="#ffffff" opacity="0.2" />
          </g>
        ))}
        {/* Viền nắng thanh đồng treo cờ */}
        <line x1="8" y1="14" x2="152" y2="14" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
      </svg>
    </div>
  );
}

// =========================================================================
// 41. DORAEMON - 3 ỐNG BÊ TÔNG TAM GIÁC (DORAEMON CONCRETE PIPES)
// =========================================================================
function _Raw_DoraemonConcretePipesSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 175 * scale, height: 115 * scale }}>
      <svg viewBox="0 0 175 115" width={175 * scale} height={115 * scale} className="overflow-visible">
        {/* Ground Dirt & Grass Shadow: AO 2 lớp (đèn trên-trái) */}
        {_ao('pipeAO', 92, 109, 82, 8, 0.28)}

        {/* Tuft of green dandelions and wild weeds at base */}
        {[14, 45, 88, 130, 160].map((gx, i) => (
          <g key={i}>
            <path d={`M ${gx} 110 Q ${gx - 4} 102 ${gx - 6} 96`} stroke="#16a34a" strokeWidth="1.5" fill="none" />
            <path d={`M ${gx} 110 Q ${gx + 4} 100 ${gx + 6} 95`} stroke="#15803d" strokeWidth="1.5" fill="none" />
            <circle cx={gx - 6} cy={95} r="2" fill="#facc15" />
          </g>
        ))}

        {/* ================= LOWER LEFT PIPE ================= */}
        <g>
          {/* Cylinder Body Outer Surface */}
          <polygon points="26,62 100,62 95,108 21,108" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
          {/* Pipe Ring Bevel Edge */}
          <ellipse cx="26" cy="85" rx="14" ry="23" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          {/* Deep Hollow Interior Hole */}
          <ellipse cx="26" cy="85" rx="10" ry="18" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="28" cy="85" rx="7" ry="14" fill="#0f172a" />
        </g>

        {/* ================= LOWER RIGHT PIPE ================= */}
        <g>
          {/* Cylinder Body Outer Surface */}
          <polygon points="90,62 164,62 159,108 85,108" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
          {/* Pipe Ring Bevel Edge */}
          <ellipse cx="90" cy="85" rx="14" ry="23" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          {/* Deep Hollow Interior Hole */}
          <ellipse cx="90" cy="85" rx="10" ry="18" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="92" cy="85" rx="7" ry="14" fill="#0f172a" />
        </g>

        {/* ================= TOP PIPE (RESTING ON TOP OF LOWER TWO) ================= */}
        <g>
          {/* Cylinder Body Outer Surface */}
          <polygon points="58,18 132,18 127,64 53,64" fill="#94a3b8" stroke="#334155" strokeWidth="2" />
          {/* Flat Sitting/Standing Area for Pet on Top */}
          <rect x="68" y="16" width="55" height="4" fill="#cbd5e1" rx="1" />
          {/* Concrete Texture details */}
          <line x1="65" y1="36" x2="128" y2="36" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />

          {/* Pipe Ring Bevel Edge */}
          <ellipse cx="58" cy="41" rx="14" ry="23" fill="#e2e8f0" stroke="#334155" strokeWidth="2" />
          {/* Deep Hollow Interior Hole */}
          <ellipse cx="58" cy="41" rx="10" ry="18" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="60" cy="41" rx="7" ry="14" fill="#0f172a" />
        </g>

        {/* 2.5D: viền nắng mép trên-trái vành ống + mặt phải thân tối (đèn trên-trái) */}
        <path d="M 44 41 A 14 23 0 0 1 58 18" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.45" />
        <path d="M 12 85 A 14 23 0 0 1 26 62" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M 76 85 A 14 23 0 0 1 90 62" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.4" />
        <polygon points="120,18 132,18 127,64 115,64" fill="#020617" opacity="0.26" />
        <polygon points="92,62 100,62 95,108 87,108" fill="#020617" opacity="0.24" />
        <polygon points="156,62 164,62 159,108 151,108" fill="#020617" opacity="0.24" />
        <polygon points="53,60 127,60 127,64 53,64" fill="#020617" opacity="0.2" />
        <rect x="68" y="16" width="24" height="4" fill="#ffffff" opacity="0.4" rx="1" />
      </svg>
    </div>
  );
}

// =========================================================================
// 42. CỬA THẦN KỲ DORAEMON (ANYWHERE DOOR DOKODEMO)
// =========================================================================
function _Raw_AnywhereDoorPropSVG({ className = '', scale = 1, isOpen = false }: { className?: string; scale?: number; isOpen?: boolean }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 95 * scale, height: 135 * scale }}>
      <svg viewBox="0 0 95 135" width={95 * scale} height={135 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp dưới Cửa Thần Kỳ (đèn trên-trái) */}
        {_ao('doorAO', 51, 129, 44, 6.5, 0.26)}

        {/* Outer Architectural White Casement Frame */}
        <rect x="15" y="15" width="65" height="114" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="3" rx="3" />
        {/* 2.5D: mặt bên phải khung cửa + mặt trên sáng + viền nắng mép trái (đèn trên-trái) */}
        <polygon points="80,16 84.5,20.5 84.5,131 80,128" fill="#cbd5e1" />
        <polygon points="17,16.5 78,16.5 82,20.5 21,20.5" fill="#ffffff" />
        <line x1="17" y1="20" x2="17" y2="126" stroke="#ffffff" strokeWidth="1.6" opacity="0.5" />

        {/* Swirling Cosmic Portal Glow Inside Frame */}
        <rect x="20" y="20" width="55" height="104" fill="url(#portalRainbowGrad)" rx="2" />
        <defs>
          <linearGradient id="portalRainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="35%" stopColor="#c084fc" />
            <stop offset="70%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {/* Iconic Pink Door Slab (Cánh Cửa Màu Hồng) */}
        {isOpen ? (
          <>
            <polygon
              points="20,20 60,30 60,118 20,124"
              fill="#ec4899"
              stroke="#be185d"
              strokeWidth="2.5"
            />
            {/* 2.5D: viền nắng mép trên + mặt phải tối của cánh cửa mở */}
            <polygon points="21,21.5 59,31 59,34 21,24.5" fill="#ffffff" opacity="0.3" />
            <polygon points="55,31 59,31 59,116 55,116" fill="#020617" opacity="0.2" />
          </>
        ) : (
          <g>
            <rect x="20" y="20" width="55" height="104" fill="#ec4899" stroke="#be185d" strokeWidth="2.5" rx="2" />
            {/* 2.5D: viền nắng mép trên + mặt phải tối của cánh cửa đóng */}
            <rect x="21.5" y="21.5" width="52" height="3.5" fill="#ffffff" opacity="0.3" />
            <rect x="69" y="22" width="5" height="100" fill="#020617" opacity="0.18" />
            {/* Door Panel Insets */}
            <rect x="26" y="28" width="43" height="40" fill="#f472b6" stroke="#db2777" strokeWidth="1.5" rx="2" />
            <rect x="26" y="76" width="43" height="40" fill="#f472b6" stroke="#db2777" strokeWidth="1.5" rx="2" />

            {/* Shiny Brass Doorknob & Keyhole */}
            <circle cx="68" cy="74" r="4.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
            <circle cx="67" cy="72.5" r="1.5" fill="#ffffff" />
            <circle cx="68" cy="80" r="1" fill="#451a03" />
          </g>
        )}

        {/* Floating Magic Sparks around door */}
        <circle cx="28" cy="22" r="2" fill="#fef08a" className="animate-ping" style={{ animationDuration: '2s' }} />
        <circle cx="78" cy="45" r="1.5" fill="#ffffff" className="animate-ping" style={{ animationDuration: '1.5s' }} />
      </svg>
    </div>
  );
}

// =========================================================================
// 43. HÀNG RÀO GỖ TUỔI THƠ & BÃI CỎ (NOSTALGIC WOODEN FENCE FIELD)
// =========================================================================
function _Raw_NostalgicWoodenFenceFieldSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 180 * scale, height: 75 * scale }}>
      <svg viewBox="0 0 180 75" width={180 * scale} height={75 * scale} className="overflow-visible">
        {/* Horizontal Supporting Rails */}
        <line x1="5" y1="30" x2="175" y2="30" stroke="#78350f" strokeWidth="3" />
        <line x1="5" y1="52" x2="175" y2="52" stroke="#78350f" strokeWidth="3" />

        {/* Varied Wooden Pickets (Hàng rào nan gỗ) */}
        {Array.from({ length: 14 }).map((_, i) => {
          const h = 42 + ((i * 7) % 10);
          const px = 10 + i * 12;
          return (
            <g key={i}>
              <polygon
                points={`${px},18 ${px + 4},12 ${px + 8},18 ${px + 8},${18 + h} ${px},${18 + h}`}
                fill="#ca8a04"
                stroke="#854d0e"
                strokeWidth="1.2"
              />
              {/* 2.5D: mặt phải tối + viền nắng mép trái mỗi thanh rào (đèn trên-trái) */}
              <polygon
                points={`${px + 4},12 ${px + 8},18 ${px + 8},${18 + h} ${px + 5},${18 + h} ${px + 5},18`}
                fill="#020617"
                opacity="0.28"
              />
              <polyline
                points={`${px + 1},17.5 ${px + 4},13 ${px + 6.5},17`}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                opacity="0.4"
              />
              <line x1={px + 1} y1={18} x2={px + 1} y2={18 + h} stroke="#ffffff" strokeWidth="1" opacity="0.4" />
              <circle cx={px + 4} cy={30} r="0.8" fill="#451a03" />
              <circle cx={px + 4} cy={52} r="0.8" fill="#451a03" />
            </g>
          );
        })}

        {/* Grassy Mounds with blooming dandelion flowers */}
        <path d="M 0 68 Q 45 58 90 68 Q 135 60 180 68 L 180 75 L 0 75 Z" fill="#22c55e" />
        {/* 2.5D: bóng AO hàng rào đổ về phải trên cỏ + viền nắng mép cỏ (đèn trên-trái) */}
        {_ao('fenceAO', 98, 69, 76, 5, 0.22)}
        <path d="M 0 67 Q 45 57.5 90 67" stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.25" />
        {[20, 60, 105, 150].map((dx, i) => (
          <circle key={i} cx={dx} cy={64} r="3" fill="#facc15" stroke="#eab308" strokeWidth="0.8" />
        ))}
      </svg>
    </div>
  );
}

// =========================================================================
// 44. GẬY BÓNG CHÀY & BÁNH RÁN DORAYAKI (NOBITA BASEBALL GEAR & DORAYAKI)
// =========================================================================
function _Raw_NobitaBaseballGearSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 100 * scale, height: 75 * scale }}>
      <svg viewBox="0 0 100 75" width={100 * scale} height={75 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp dưới gậy bóng chày (đèn trên-trái) */}
        {_ao('batAO', 53, 69, 44, 5.5, 0.26)}

        {/* Brown Leather Baseball Mitt Glove */}
        <path
          d="M 15 50 C 12 36 28 32 38 42 C 45 48 42 66 32 68 C 22 70 15 62 15 50 Z"
          fill="#92400e"
          stroke="#451a03"
          strokeWidth="1.5"
        />
        {/* 2.5D: viền nắng mép găng trên-trái + bóng mặt dưới-phải */}
        <path d="M 16 47 C 15 38 25 33.5 34 40" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.32" />
        <path d="M 38 47 C 43.5 55 39 65.5 31 67.5" stroke="#020617" strokeWidth="3" fill="none" opacity="0.3" />
        {/* White Baseball with Red Seams inside Mitt */}
        <circle cx="28" cy="52" r="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M 24 48 Q 28 52 24 56" stroke="#ef4444" strokeWidth="0.8" fill="none" />
        <path d="M 32 48 Q 28 52 32 56" stroke="#ef4444" strokeWidth="0.8" fill="none" />

        {/* Wooden Baseball Bat Leaning */}
        <polygon points="32,68 84,20 88,24 38,72" fill="#ca8a04" stroke="#854d0e" strokeWidth="1.5" />
        {/* 2.5D: mặt dưới gậy tối + viền nắng mép trên-trái (đèn trên-trái) */}
        <polygon points="38,72 88,24 85.5,27 36,70.5" fill="#020617" opacity="0.32" />
        <line x1="33" y1="67" x2="84.5" y2="20.5" stroke="#ffffff" strokeWidth="1.4" opacity="0.45" />
        {/* Bat handle tape */}
        <polygon points="32,68 44,57 46,59 34,70" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.8" />

        {/* Plate of Golden Dorayaki Pancakes (Đĩa bánh rán Doraemon) */}
        <g>
          <ellipse cx="74" cy="62" rx="14" ry="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          {/* 2.5D: mặt đĩa bánh tối hơn */}
          <path d="M 61 62.5 Q 74 68.5 87 62.5 Q 74 66 61 62.5 Z" fill="#94a3b8" opacity="0.7" />
          {/* Dorayaki pancake 1 */}
          <ellipse cx="74" cy="58" rx="10" ry="4" fill="#a16207" stroke="#713f12" strokeWidth="1" />
          <ellipse cx="74" cy="56" rx="9" ry="3" fill="#ca8a04" />
          {/* Red bean paste filling edge */}
          <ellipse cx="74" cy="57" rx="8" ry="1.5" fill="#451a03" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 45. CỘT ĐIỆN VÀ GƯƠNG CẦU LỒI KHU PHỐ (JAPANESE NEIGHBORHOOD POLE)
// =========================================================================
function _Raw_JapaneseNeighborhoodPoleSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 80 * scale, height: 160 * scale }}>
      <svg viewBox="0 0 80 160" width={80 * scale} height={160 * scale} className="overflow-visible">
        {/* Bóng AO dưới chân cột điện (đèn trên-trái) */}
        {_ao('poleAO', 44, 156, 26, 5.5, 0.3)}
        {/* Concrete Utility Pole Base to Top */}
        <rect x="36" y="10" width="8" height="148" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
        {/* 2.5D: mặt trái sáng / mặt phải tối của trụ (đèn trên-trái) */}
        <rect x="36.5" y="11" width="2" height="146" fill="#e2e8f0" opacity="0.6" />
        <rect x="42" y="11" width="1.8" height="146" fill="#475569" opacity="0.6" />

        {/* Overhead Crossarms (Xà ngang đỡ dây điện) */}
        <rect x="15" y="24" width="50" height="4" fill="#334155" rx="1" />
        <rect x="15" y="24" width="26" height="1.2" fill="#94a3b8" opacity="0.55" />
        <rect x="15" y="27" width="50" height="1.2" fill="#020617" opacity="0.45" />
        <rect x="22" y="44" width="36" height="3" fill="#334155" rx="1" />
        <rect x="22" y="44" width="18" height="1" fill="#94a3b8" opacity="0.55" />
        <rect x="22" y="46.2" width="36" height="1" fill="#020617" opacity="0.45" />

        {/* Porcelain Insulators & Electric Cables */}
        {[20, 32, 48, 60].map((ix, i) => (
          <g key={i}>
            <circle cx={ix} cy={22} r="2" fill="#ffffff" stroke="#64748b" strokeWidth="0.8" />
            <line x1={ix} y1={22} x2={ix > 40 ? 80 : 0} y2={ix > 40 ? 15 : 15} stroke="#0f172a" strokeWidth="1" />
          </g>
        ))}

        {/* Cylindrical Transformer Drum */}
        <rect x="42" y="32" width="16" height="24" fill="#475569" stroke="#1e293b" strokeWidth="1.2" rx="2" />
        <rect x="42.5" y="33" width="2.5" height="22" fill="#94a3b8" opacity="0.5" />
        <rect x="54.5" y="33" width="3" height="22" fill="#1e293b" opacity="0.5" />
        <line x1="42" y1="40" x2="58" y2="40" stroke="#334155" strokeWidth="1" />

        {/* Orange Convex Safety Mirror (Gương cầu lồi ngã ba) */}
        <g>
          <line x1="36" y1="85" x2="20" y2="80" stroke="#475569" strokeWidth="2" />
          <circle cx="18" cy="80" r="9" fill="#f97316" stroke="#c2410c" strokeWidth="1.5" />
          <circle cx="18" cy="80" r="7" fill="#e0f2fe" stroke="#94a3b8" strokeWidth="0.8" />
          <circle cx="16" cy="78" r="2.5" fill="#ffffff" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 46. CÂY KẸO MÚT KHỔNG LỒ KIRBY (GIANT LOLLIPOP TREE)
// =========================================================================
function _Raw_GiantLollipopTreeSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 140 * scale, height: 170 * scale }}>
      <svg viewBox="0 0 140 170" width={140 * scale} height={170 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp dưới gốc kẹo (đèn trên-trái) */}
        {_ao('popAO', 74, 163, 57, 8, 0.28)}

        {/* Candy Cane Striped Pretzel Trunk */}
        <path d="M 64 164 L 66 85 L 74 85 L 76 164 Z" fill="#fef3c7" stroke="#ca8a04" strokeWidth="2" />
        {/* Red swirl candy stripes on trunk */}
        {[100, 120, 140].map((sy, i) => (
          <polygon key={i} points={`65,${sy} 75,${sy - 8} 75,${sy - 4} 65,${sy + 4}`} fill="#f43f5e" />
        ))}
        {/* 2.5D: mặt phải thân kẹo tối + viền nắng mép trái (đèn trên-trái) */}
        <polygon points="71.5,85 74,85 76,164 73.5,164" fill="#020617" opacity="0.3" />
        <line x1="65.8" y1="88" x2="64.4" y2="161" stroke="#ffffff" strokeWidth="1.6" opacity="0.6" />

        {/* Giant Swirling Rainbow Lollipop Canopy (Tán kẹo mút xoắn ngũ sắc khổng lồ) */}
        <circle cx="70" cy="52" r="45" fill="#ec4899" stroke="#be185d" strokeWidth="2.5" />
        <circle cx="70" cy="52" r="37" fill="#06b6d4" stroke="#0891b2" strokeWidth="2" />
        <circle cx="70" cy="52" r="29" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
        <circle cx="70" cy="52" r="21" fill="#a855f7" stroke="#7e22ce" strokeWidth="2" />
        <circle cx="70" cy="52" r="13" fill="#ffffff" />
        <circle cx="70" cy="52" r="6" fill="#f43f5e" />

        {/* 2.5D: khối kẹo bóng — bóng tối phải-dưới + viền nắng trắng mép trên-trái */}
        <defs>
          <clipPath id="popCrownClip">
            <circle cx="70" cy="52" r="45" />
          </clipPath>
        </defs>
        <g clipPath="url(#popCrownClip)">
          <circle cx="82" cy="64" r="45" fill="#020617" opacity="0.17" />
          <circle cx="76" cy="58" r="49" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.4" />
        </g>

        {/* Sugar Glaze Highlights */}
        <ellipse cx="52" cy="32" rx="10" ry="6" fill="#ffffff" opacity="0.6" transform="rotate(-30 52 32)" />

        {/* Colorful Gumdrop Shrubs at base */}
        <g>
          <ellipse cx="44" cy="160" rx="12" ry="8" fill="#10b981" />
          <ellipse cx="94" cy="160" rx="12" ry="8" fill="#a855f7" />
          <ellipse cx="70" cy="162" rx="10" ry="6" fill="#f43f5e" />
          {/* 2.5D: bóng dưới + viền nắng trên-trái từng búp kẹo */}
          <path d="M 34 161 Q 44 168 54 161 Q 44 164.5 34 161 Z" fill="#020617" opacity="0.3" />
          <path d="M 84 161 Q 94 168 104 161 Q 94 164.5 84 161 Z" fill="#020617" opacity="0.3" />
          <path d="M 61 162.5 Q 70 168 79 162.5 Q 70 165.5 61 162.5 Z" fill="#020617" opacity="0.3" />
          <ellipse cx="38" cy="156" rx="5" ry="3" fill="#ffffff" opacity="0.35" />
        </g>

        {/* Twinkling Star Candies falling */}
        <circle cx="34" cy="65" r="2.5" fill="#ffffff" className="animate-ping" style={{ animationDuration: '1.8s' }} />
        <circle cx="106" cy="40" r="2" fill="#fef08a" className="animate-ping" style={{ animationDuration: '2.2s' }} />
      </svg>
    </div>
  );
}

// =========================================================================
// 47. NGÔI SAO VÀNG WARP STAR (KIRBY WARP STAR LAUNCHPAD)
// =========================================================================
function _Raw_KirbyWarpStarSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 120 * scale, height: 110 * scale }}>
      <svg viewBox="0 0 120 110" width={120 * scale} height={110 * scale} className="overflow-visible">
        {/* Bóng AO tiếp đất dưới đám mây (đèn trên-trái) */}
        {_ao('warpAO', 62, 103, 46, 5, 0.2)}
        {/* Soft Fluffy Cloud Base */}
        <g>
          <ellipse cx="60" cy="92" rx="48" ry="12" fill="#ffffff" opacity="0.9" />
          <ellipse cx="38" cy="88" rx="22" ry="10" fill="#fce7f3" />
          <ellipse cx="82" cy="88" rx="22" ry="10" fill="#fce7f3" />
          {/* 2.5D: bóng dưới mây + viền nắng mép trên-trái */}
          <ellipse cx="66" cy="99" rx="40" ry="6" fill="#020617" opacity="0.14" />
          <ellipse cx="34" cy="84" rx="15" ry="5" fill="#ffffff" />
        </g>

        {/* Golden Warp Star (Floating & Glowing) */}
        <g className="animate-bounce" style={{ animationDuration: '2.2s' }}>
          {/* Outer Star Glow */}
          <polygon
            points="60,14 73,42 104,42 79,62 88,92 60,74 32,92 41,62 16,42 47,42"
            fill="rgba(250, 204, 21, 0.4)"
          />

          {/* 2.5D: chiều dày ngôi sao (bóng phải-dưới) + viền nắng mép trên-trái */}
          <polygon
            points="63,23 74,47 101,47 79,65 87,91 63,75 39,91 47,65 25,47 52,47"
            fill="#ca8a04"
            opacity="0.9"
          />
          <polygon
            points="58.5,18.5 69.5,42.5 96.5,42.5 74.5,60.5 82.5,86.5 58.5,70.5 34.5,86.5 42.5,60.5 20.5,42.5 47.5,42.5"
            fill="#ffffff"
            opacity="0.55"
          />

          {/* Golden 5-Pointed Warp Star */}
          <polygon
            points="60,20 71,44 98,44 76,62 84,88 60,72 36,88 44,62 22,44 49,44"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="2.5"
          />

          {/* Star Face / Gloss Highlight */}
          <ellipse cx="50" cy="46" rx="5" ry="8" fill="#fef08a" opacity="0.8" />
          {/* Trailing sparkle dust */}
          <circle cx="82" cy="74" r="2" fill="#ffffff" className="animate-ping" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 48. SUỐI THÁC CẦU VỒNG PASTEL (PASTEL RAINBOW RIVER WATERFALL)
// =========================================================================
function _Raw_RainbowRiverWaterfallSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 180 * scale, height: 105 * scale }}>
      <svg viewBox="0 0 180 105" width={180 * scale} height={105 * scale} className="overflow-visible">
        {/* Bóng AO bờ suối (đèn trên-trái) */}
        {_ao('rrwAO', 94, 102, 84, 5, 0.2)}
        {/* Soft Pastel Flowing Water Ribbon bands */}
        <g opacity="0.95">
          <path d="M 10 20 Q 55 45 90 25 Q 135 15 170 35 L 170 55 Q 135 35 90 45 Q 55 65 10 40 Z" fill="#f472b6" />
          <path d="M 10 32 Q 55 57 90 37 Q 135 27 170 47 L 170 67 Q 135 47 90 57 Q 55 77 10 52 Z" fill="#facc15" />
          <path d="M 10 44 Q 55 69 90 49 Q 135 39 170 59 L 170 79 Q 135 59 90 69 Q 55 89 10 64 Z" fill="#34d399" />
          <path d="M 10 56 Q 55 81 90 61 Q 135 51 170 71 L 170 91 Q 135 71 90 81 Q 55 101 10 76 Z" fill="#38bdf8" />
          <path d="M 10 68 Q 55 93 90 73 Q 135 63 170 83 L 170 103 Q 135 83 90 93 Q 55 113 10 88 Z" fill="#c084fc" />
        </g>

        {/* 2.5D: viền nắng mép nước trên-trái + bóng mặt dưới dải nước cuối (đèn trên-trái) */}
        <path d="M 10 20 Q 55 45 90 25 Q 135 15 170 35" stroke="#ffffff" strokeWidth="1.6" fill="none" opacity="0.45" />
        <path d="M 10 44 Q 55 69 90 49 Q 135 39 170 59" stroke="#ffffff" strokeWidth="1.4" fill="none" opacity="0.3" />
        <path d="M 10 88 Q 55 113 90 93 Q 135 83 170 103" stroke="#020617" strokeWidth="3" fill="none" opacity="0.18" />

        {/* Marshmallow Cloud Foam Crests */}
        {[
          { x: 35, y: 55 },
          { x: 90, y: 65 },
          { x: 145, y: 75 },
        ].map((c, i) => (
          <g key={i}>
            <ellipse cx={c.x} cy={c.y} rx="16" ry="6" fill="#ffffff" opacity="0.9" />
            {/* 2.5D: bóng mềm dưới cụm bọt trắng */}
            <path
              d={`M ${c.x - 15} ${c.y + 1} Q ${c.x} ${c.y + 9} ${c.x + 15} ${c.y + 1} Q ${c.x} ${c.y + 5} ${c.x - 15} ${c.y + 1} Z`}
              fill="#020617"
              opacity="0.16"
            />
          </g>
        ))}

        {/* Floating Star Water Lilies */}
        <polygon points="55,68 58,62 64,65 60,70 62,76 56,72 50,75 52,69 48,64 54,64" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

// =========================================================================
// 49. CÂY TÁO THẦN WHISPY WOODS (WHISPY WOODS APPLE TREE)
// =========================================================================
function _Raw_WhispyWoodsAppleTreeSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 150 * scale, height: 160 * scale }}>
      <svg viewBox="0 0 150 160" width={150 * scale} height={160 * scale} className="overflow-visible">
        {/* Shadow: AO 2 lớp dưới thân cây táo (đèn trên-trái) */}
        {_ao('whispyAO', 78, 153, 62, 8, 0.27)}

        {/* Wide Tree Trunk */}
        <path d="M 52 154 C 48 110, 52 80, 50 65 L 100 65 C 98 80, 102 110, 98 154 Z" fill="#a16207" stroke="#713f12" strokeWidth="2.5" />
        {/* 2.5D: mặt phải thân tối + viền nắng mép trái (đèn trên-trái) */}
        <path d="M 94 66 L 99.5 66 C 97.5 82 101 112 97.5 153 L 92 153 C 96 112 94 84 94 66 Z" fill="#020617" opacity="0.3" />
        <path d="M 52.5 150 C 49 112 53 82 51.5 67" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.4" />

        {/* Whispy Woods Kind Cartoon Wooden Face */}
        <ellipse cx="64" cy="98" rx="4" ry="6" fill="#451a03" />
        <circle cx="63" cy="96" r="1.5" fill="#ffffff" />
        <ellipse cx="86" cy="98" rx="4" ry="6" fill="#451a03" />
        <circle cx="85" cy="96" r="1.5" fill="#ffffff" />

        {/* Long Cartoon Wooden Nose */}
        <polygon points="72,98 78,98 75,114" fill="#854d0e" stroke="#451a03" strokeWidth="1.2" />

        {/* Gentle Smiling Mouth */}
        <path d="M 68 122 Q 75 128 82 122" stroke="#451a03" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Fluffy Green Cloud-Shaped Canopy */}
        <circle cx="45" cy="50" r="28" fill="#15803d" />
        <circle cx="105" cy="50" r="28" fill="#15803d" />
        <circle cx="75" cy="35" r="35" fill="#22c55e" />
        {/* 2.5D: viền nắng cung trên-trái tán + bóng cung dưới-phải (đèn trên-trái) */}
        <path d="M 17 50 A 28 28 0 0 1 45 22" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.35" />
        <path d="M 40 35 A 35 35 0 0 1 75 0" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.3" />
        <path d="M 105 78 A 28 28 0 0 0 133 50" stroke="#020617" strokeWidth="4.5" fill="none" opacity="0.32" />
        <path d="M 45 78 A 28 28 0 0 1 17 50" stroke="#020617" strokeWidth="4" fill="none" opacity="0.18" />
        <path d="M 60 67 Q 75 73 90 67 Q 75 70 60 67 Z" fill="#020617" opacity="0.22" />

        {/* Shimmering Star Apples (Quả táo ngôi sao) */}
        {[
          { x: 44, y: 46 },
          { x: 65, y: 30 },
          { x: 88, y: 36 },
          { x: 104, y: 52 },
        ].map((ap, i) => (
          <g key={i} className="animate-bounce" style={{ animationDuration: `${2 + i * 0.4}s` }}>
            <circle cx={ap.x} cy={ap.y} r="5" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
            <circle cx={ap.x - 1.5} cy={ap.y - 1.5} r="1.5" fill="#ffffff" />
          </g>
        ))}
      </svg>
    </div>
  );
}

// =========================================================================
// 50. TRƯỢNG SAO STAR ROD & BỆ PHÉP THUẬT (STAR ROD MONUMENT)
// =========================================================================
function _Raw_StarRodMonumentSVG({ className = '', scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: 100 * scale, height: 130 * scale }}>
      <svg viewBox="0 0 100 130" width={100 * scale} height={130 * scale} className="overflow-visible">
        {/* Bóng AO tiếp đất dưới bệ mây (đèn trên-trái) */}
        {_ao('rodAO', 54, 128, 42, 6, 0.24)}
        {/* Cloud Pedestal Base */}
        <ellipse cx="50" cy="120" rx="42" ry="10" fill="#ffffff" stroke="#e0e7ff" strokeWidth="1.5" />
        <ellipse cx="50" cy="112" rx="28" ry="8" fill="#ffffff" />
        {/* 2.5D: bóng mặt dưới khối mây + bọng tối mép phải (đèn trên-trái) */}
        <path d="M 14 118 Q 50 132 86 117 Q 52 128 14 118 Z" fill="#020617" opacity="0.16" />
        <ellipse cx="64" cy="114" rx="20" ry="5" fill="#e0e7ff" opacity="0.8" />
        {/* Bóng tiếp đất của gậy lên mặt mây */}
        <ellipse cx="53" cy="111" rx="12" ry="3" fill="#020617" opacity="0.18" />

        {/* Star Rod Wand Shaft (Thân gậy sọc kẹo) */}
        <g>
          <rect x="47" y="38" width="6" height="74" fill="#ffffff" stroke="#ca8a04" strokeWidth="1.5" rx="1" />
          {/* 2.5D: mặt phải thân gậy tối (đèn trên-trái) */}
          <rect x="50.5" y="39" width="2" height="72" fill="#cbd5e1" opacity="0.9" />
          {/* Red spiral ribbons */}
          <polygon points="47,48 53,44 53,48 47,52" fill="#ef4444" />
          <polygon points="47,62 53,58 53,62 47,66" fill="#ef4444" />
          <polygon points="47,76 53,72 53,76 47,80" fill="#ef4444" />
          <polygon points="47,90 53,86 53,90 47,94" fill="#ef4444" />
        </g>

        {/* Spinning Golden Star Tip */}
        <g className="origin-[50px_32px] animate-pulse">
          {/* 2.5D: chiều dày ngôi sao (bóng phải-dưới) */}
          <polygon
            points="52,16 57,28 70,28 59,37 63,50 52,42 41,50 45,37 34,28 47,28"
            fill="#ca8a04"
            opacity="0.9"
          />
          <polygon
            points="50,14 55,26 68,26 57,35 61,48 50,40 39,48 43,35 32,26 45,26"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="2"
          />
          <circle cx="50" cy="32" r="3" fill="#ffffff" />
        </g>

        {/* Orbiting Stardust Sparkles */}
        <circle cx="68" cy="20" r="2" fill="#ffffff" className="animate-ping" style={{ animationDuration: '1.5s' }} />
        <circle cx="32" cy="36" r="1.5" fill="#fef08a" className="animate-ping" style={{ animationDuration: '2.1s' }} />
      </svg>
    </div>
  );
}


// --- MEMOIZED ASSETS EXPORT (ZERO RE-RENDER COST WHEN PROPS UNCHANGED) ---
export const DutchWindmillSVG = React.memo(_Raw_DutchWindmillSVG);
export const GrandOakTreeSVG = React.memo(_Raw_GrandOakTreeSVG);
export const FarmhouseVillaSVG = React.memo(_Raw_FarmhouseVillaSVG);
export const LotusPondSVG = React.memo(_Raw_LotusPondSVG);
export const BouncyMushroomSVG = React.memo(_Raw_BouncyMushroomSVG);
export const ChickenCoopSVG = React.memo(_Raw_ChickenCoopSVG);
export const VeggiePatchSVG = React.memo(_Raw_VeggiePatchSVG);
export const LighthouseSVG = React.memo(_Raw_LighthouseSVG);
export const PalmTreeSVG = React.memo(_Raw_PalmTreeSVG);
export const ServerRackSVG = React.memo(_Raw_ServerRackSVG);
export const DevWorkstationSVG = React.memo(_Raw_DevWorkstationSVG);
export const CrystalCastleSVG = React.memo(_Raw_CrystalCastleSVG);
export const BeachVolleyballSVG = React.memo(_Raw_BeachVolleyballSVG);
export const TikiBarCabanaSVG = React.memo(_Raw_TikiBarCabanaSVG);
export const SandcastleBonfireSVG = React.memo(_Raw_SandcastleBonfireSVG);
export const FullWidthOceanWavesSVG = React.memo(_Raw_FullWidthOceanWavesSVG);
export const SailboatWavesSVG = React.memo(_Raw_SailboatWavesSVG);
export const LibraryBookshelfSVG = React.memo(_Raw_LibraryBookshelfSVG);
export const BeanbagLoungeSVG = React.memo(_Raw_BeanbagLoungeSVG);
export const EspressoBarKitchenetteSVG = React.memo(_Raw_EspressoBarKitchenetteSVG);
export const ScrumKanbanWhiteboardSVG = React.memo(_Raw_ScrumKanbanWhiteboardSVG);
export const CelestialAngelFountainSVG = React.memo(_Raw_CelestialAngelFountainSVG);
export const GemstoneTreasureChestSVG = React.memo(_Raw_GemstoneTreasureChestSVG);
export const RainbowBridgeArchSVG = React.memo(_Raw_RainbowBridgeArchSVG);
export const StarryCloudPlatformSVG = React.memo(_Raw_StarryCloudPlatformSVG);
export const ThousandSunnyLionFigureheadSVG = React.memo(_Raw_ThousandSunnyLionFigureheadSVG);
export const PirateMastJollyRogerSVG = React.memo(_Raw_PirateMastJollyRogerSVG);
export const PirateTreasureChestSVG = React.memo(_Raw_PirateTreasureChestSVG);
export const PirateHelmAndDeckRailingSVG = React.memo(_Raw_PirateHelmAndDeckRailingSVG);
export const PirateCannonAndRumBarrelsSVG = React.memo(_Raw_PirateCannonAndRumBarrelsSVG);
export const NamiTangerineTreesSVG = React.memo(_Raw_NamiTangerineTreesSVG);
export const HokageRockMonumentSVG = React.memo(_Raw_HokageRockMonumentSVG);
export const IchirakuRamenShopSVG = React.memo(_Raw_IchirakuRamenShopSVG);
export const OnsenHotSpringSVG = React.memo(_Raw_OnsenHotSpringSVG);
export const BambooToriiShrineSVG = React.memo(_Raw_BambooToriiShrineSVG);
export const NinjaTrainingPostSVG = React.memo(_Raw_NinjaTrainingPostSVG);
export const FloatingCandlesGothicHallSVG = React.memo(_Raw_FloatingCandlesGothicHallSVG);
export const HogwartsGreatFireplaceSVG = React.memo(_Raw_HogwartsGreatFireplaceSVG);
export const MagicFeastTableSVG = React.memo(_Raw_MagicFeastTableSVG);
export const SortingHatPedestalSVG = React.memo(_Raw_SortingHatPedestalSVG);
export const HogwartsHouseBannersSVG = React.memo(_Raw_HogwartsHouseBannersSVG);
export const DoraemonConcretePipesSVG = React.memo(_Raw_DoraemonConcretePipesSVG);
export const AnywhereDoorPropSVG = React.memo(_Raw_AnywhereDoorPropSVG);
export const NostalgicWoodenFenceFieldSVG = React.memo(_Raw_NostalgicWoodenFenceFieldSVG);
export const NobitaBaseballGearSVG = React.memo(_Raw_NobitaBaseballGearSVG);
export const JapaneseNeighborhoodPoleSVG = React.memo(_Raw_JapaneseNeighborhoodPoleSVG);
export const GiantLollipopTreeSVG = React.memo(_Raw_GiantLollipopTreeSVG);
export const KirbyWarpStarSVG = React.memo(_Raw_KirbyWarpStarSVG);
export const RainbowRiverWaterfallSVG = React.memo(_Raw_RainbowRiverWaterfallSVG);
export const WhispyWoodsAppleTreeSVG = React.memo(_Raw_WhispyWoodsAppleTreeSVG);
export const StarRodMonumentSVG = React.memo(_Raw_StarRodMonumentSVG);
