/**
 * Chibi Pet Vector Drawing Engine for High-DPI Canvas
 * Renders charming, razor-sharp, animated chibi characters with smooth vector curves.
 */

export interface DrawPetOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  scale?: number;
  species: string;
  state?: 'idle' | 'walk' | 'run' | 'attack' | 'hit' | 'stunned' | 'happy';
  frame?: number;
  direction?: 1 | -1;
  equippedHat?: string | null;
  equippedOutfit?: string | null;
}

export function drawChibiPet({
  ctx,
  x,
  y,
  scale = 1.0,
  species = 'owl',
  state = 'idle',
  frame = 0,
  direction = 1,
}: DrawPetOptions) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction * scale, scale);

  // Animation bounces
  const bob = state === 'idle'
    ? Math.sin(frame * 0.08) * 2
    : state === 'walk'
    ? Math.sin(frame * 0.2) * 4
    : state === 'run'
    ? Math.sin(frame * 0.35) * 5
    : 0;

  const tilt = state === 'run' ? (direction === 1 ? 0.12 : -0.12) : 0;
  ctx.rotate(tilt);

  // Soft Ground Shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 22 * (state === 'run' ? 1.2 : 1), 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw Specific Chibi Species
  switch (species) {
    case 'cat':
      drawChibiCat(ctx, bob, frame, state);
      break;
    case 'corgi':
    case 'dog':
      drawChibiCorgi(ctx, bob, frame, state);
      break;
    case 'ice_dragon':
      drawChibiIceDragon(ctx, bob, frame, state);
      break;
    case 'karoo':
      drawChibiKaroo(ctx, bob, frame, state);
      break;
    case 'cinnamoroll':
      drawChibiCinnamoroll(ctx, bob, frame, state);
      break;
    case 'owl':
    default:
      drawChibiOwl(ctx, bob, frame, state);
      break;
  }

  ctx.restore();
}

/**
 * 1. LEXI THE OWL (Cú Mèo Tri Thức Chibi)
 */
function drawChibiOwl(ctx: CanvasRenderingContext2D, bob: number, frame: number, state: string) {
  const wingFlap = state === 'run' || state === 'walk' ? Math.sin(frame * 0.3) * 0.25 : 0;

  // Body: Chubby Indigo Owl
  const bodyGrad = ctx.createLinearGradient(0, -28 + bob, 0, 12 + bob);
  bodyGrad.addColorStop(0, '#6366f1');
  bodyGrad.addColorStop(1, '#4338ca');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, -6 + bob, 20, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3730a3';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Belly Feathers (Lavender/Cream with soft feather scallops)
  ctx.fillStyle = '#e0e7ff';
  ctx.beginPath();
  ctx.ellipse(0, -2 + bob, 13, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#c7d2fe';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(-4, -4 + bob, 4, 0, Math.PI);
  ctx.arc(4, -4 + bob, 4, 0, Math.PI);
  ctx.arc(0, 2 + bob, 4, 0, Math.PI);
  ctx.stroke();

  // Feathery Ear Tufts
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.moveTo(-14, -22 + bob);
  ctx.lineTo(-20, -36 + bob);
  ctx.lineTo(-6, -26 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(14, -22 + bob);
  ctx.lineTo(20, -36 + bob);
  ctx.lineTo(6, -26 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Big Glowing Amber Anime Eyes
  drawGlossyEye(ctx, -8, -12 + bob, 6.5, '#f59e0b');
  drawGlossyEye(ctx, 8, -12 + bob, 6.5, '#f59e0b');

  // Cute Orange Beak
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(0, -8 + bob);
  ctx.lineTo(-3.5, -4 + bob);
  ctx.lineTo(0, 0 + bob);
  ctx.lineTo(3.5, -4 + bob);
  ctx.closePath();
  ctx.fill();

  // Wings (Left & Right)
  ctx.save();
  ctx.translate(-16, -6 + bob);
  ctx.rotate(-0.15 - wingFlap);
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 12, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(16, -6 + bob);
  ctx.rotate(0.15 + wingFlap);
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 12, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Graduation Cap 🎓 (Lexi's iconic accessory)
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.moveTo(0, -42 + bob);
  ctx.lineTo(18, -36 + bob);
  ctx.lineTo(0, -30 + bob);
  ctx.lineTo(-18, -36 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Cap skullcap base
  ctx.fillStyle = '#312e81';
  ctx.fillRect(-8, -33 + bob, 16, 5);

  // Golden Tassel
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -36 + bob);
  ctx.lineTo(14, -32 + bob + Math.sin(frame * 0.15) * 2);
  ctx.stroke();

  // Yellow Feet
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-9, 13 + bob, 6, 4);
  ctx.fillRect(3, 13 + bob, 6, 4);
}

/**
 * 2. MEOWLISH THE CAT (Mèo Vàng Chibi Đáng Yêu)
 */
function drawChibiCat(ctx: CanvasRenderingContext2D, bob: number, frame: number, state: string) {
  const tailWag = Math.sin(frame * 0.2) * 0.3;

  // Tail (Ginger & White striped)
  ctx.save();
  ctx.translate(-14, 4 + bob);
  ctx.rotate(tailWag - 0.4);
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-14, -12, -8, -26);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-10, -20);
  ctx.lineTo(-8, -26);
  ctx.stroke();
  ctx.restore();

  // Body: Round Ginger Kitten
  const catGrad = ctx.createLinearGradient(0, -24 + bob, 0, 14 + bob);
  catGrad.addColorStop(0, '#fb923c');
  catGrad.addColorStop(1, '#ea580c');
  ctx.fillStyle = catGrad;
  ctx.beginPath();
  ctx.ellipse(0, -4 + bob, 19, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c2410c';
  ctx.lineWidth = 2;
  ctx.stroke();

  // White Chest Patch
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, 2 + bob, 11, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cat Ears (Pointed with pink inner ear)
  drawCatEar(ctx, -12, -18 + bob, -0.2);
  drawCatEar(ctx, 12, -18 + bob, 0.2);

  // Big Sparkling Emerald Anime Eyes
  drawGlossyEye(ctx, -7, -7 + bob, 6, '#10b981');
  drawGlossyEye(ctx, 7, -7 + bob, 6, '#10b981');

  // Cute Pink Triangle Nose & Mouth
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.moveTo(0, -2 + bob);
  ctx.lineTo(-2.5, -4.5 + bob);
  ctx.lineTo(2.5, -4.5 + bob);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#9a3412';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(-2.5, 0 + bob, 2.5, 0, Math.PI);
  ctx.arc(2.5, 0 + bob, 2.5, 0, Math.PI);
  ctx.stroke();

  // Rosy Cheeks
  ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
  ctx.beginPath();
  ctx.ellipse(-12, -3 + bob, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.ellipse(12, -3 + bob, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = '#fed7aa';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-13, -3 + bob); ctx.lineTo(-22, -6 + bob);
  ctx.moveTo(-13, -1 + bob); ctx.lineTo(-22, 1 + bob);
  ctx.moveTo(13, -3 + bob); ctx.lineTo(22, -6 + bob);
  ctx.moveTo(13, -1 + bob); ctx.lineTo(22, 1 + bob);
  ctx.stroke();

  // Golden Bell Collar
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(-10, 4 + bob, 20, 3.5);
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 7 + bob, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Little Paws
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-7, 13 + bob, 5, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(7, 13 + bob, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fed7aa';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawCatEar(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(-8, 8);
  ctx.lineTo(0, -14);
  ctx.lineTo(8, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#c2410c';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#fda4af';
  ctx.beginPath();
  ctx.moveTo(-4, 6);
  ctx.lineTo(0, -8);
  ctx.lineTo(4, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * 3. CORGI / SHIBA (Cún Corgi Chibi Đáng Yêu)
 */
function drawChibiCorgi(ctx: CanvasRenderingContext2D, bob: number, frame: number, state: string) {
  // Body: Golden Amber with White Face Blaze
  const dogGrad = ctx.createLinearGradient(0, -22 + bob, 0, 14 + bob);
  dogGrad.addColorStop(0, '#f59e0b');
  dogGrad.addColorStop(1, '#d97706');
  ctx.fillStyle = dogGrad;
  ctx.beginPath();
  ctx.ellipse(0, -4 + bob, 20, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Large Perky Upright Ears
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.ellipse(-14, -20 + bob, 6, 13, -0.3, 0, Math.PI * 2);
  ctx.ellipse(14, -20 + bob, 6, 13, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath();
  ctx.ellipse(-14, -19 + bob, 3.5, 9, -0.3, 0, Math.PI * 2);
  ctx.ellipse(14, -19 + bob, 3.5, 9, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // White Blaze Down Forehead to Muzzle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-3, -20 + bob);
  ctx.lineTo(3, -20 + bob);
  ctx.lineTo(6, -6 + bob);
  ctx.lineTo(10, 2 + bob);
  ctx.lineTo(0, 7 + bob);
  ctx.lineTo(-10, 2 + bob);
  ctx.lineTo(-6, -6 + bob);
  ctx.closePath();
  ctx.fill();

  // Glossy Dark Brown Anime Eyes
  drawGlossyEye(ctx, -8, -8 + bob, 5.5, '#78350f');
  drawGlossyEye(ctx, 8, -8 + bob, 5.5, '#78350f');

  // Cute Black Button Nose & Open Smiling Mouth
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(0, -2 + bob, 3, 0, Math.PI * 2);
  ctx.fill();

  // Happy Tongue Panting 👅
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.ellipse(0, 3 + bob, 3.5, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Scout Blue Bandana
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.moveTo(-14, 5 + bob);
  ctx.lineTo(14, 5 + bob);
  ctx.lineTo(0, 15 + bob);
  ctx.closePath();
  ctx.fill();

  // Paws
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-8, 14 + bob, 5, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(8, 14 + bob, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 4. ICE DRAGON (Rồng Băng Thần Thoại Chibi)
 */
function drawChibiIceDragon(ctx: CanvasRenderingContext2D, bob: number, frame: number, state: string) {
  const wingBeat = Math.sin(frame * 0.25) * 0.3;

  // Ice Wings (Back)
  ctx.save();
  ctx.translate(-16, -10 + bob);
  ctx.rotate(-0.3 - wingBeat);
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-18, -14);
  ctx.lineTo(-12, 4);
  ctx.lineTo(-20, 8);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(16, -10 + bob);
  ctx.rotate(0.3 + wingBeat);
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(18, -14);
  ctx.lineTo(12, 4);
  ctx.lineTo(20, 8);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Dragon Body: Cyan Ice Shading
  const dragonGrad = ctx.createLinearGradient(0, -22 + bob, 0, 14 + bob);
  dragonGrad.addColorStop(0, '#7dd3fc');
  dragonGrad.addColorStop(1, '#0284c7');
  ctx.fillStyle = dragonGrad;
  ctx.beginPath();
  ctx.ellipse(0, -4 + bob, 19, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Frosty Horns
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.moveTo(-10, -18 + bob);
  ctx.lineTo(-16, -32 + bob);
  ctx.lineTo(-6, -20 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(10, -18 + bob);
  ctx.lineTo(16, -32 + bob);
  ctx.lineTo(6, -20 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Eyes: Glowing Crystal Cyan
  drawGlossyEye(ctx, -7, -7 + bob, 6, '#06b6d4');
  drawGlossyEye(ctx, 7, -7 + bob, 6, '#06b6d4');

  // Pale Blue Belly Scales
  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.ellipse(0, 3 + bob, 11, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Little Paws
  ctx.fillStyle = '#7dd3fc';
  ctx.fillRect(-9, 12 + bob, 6, 4);
  ctx.fillRect(3, 12 + bob, 6, 4);
}

/**
 * 5. KAROO THE DUCK (Vịt Karoo Tốc Độ Chibi)
 */
function drawChibiKaroo(ctx: CanvasRenderingContext2D, bob: number, frame: number, state: string) {
  // Body: Creamy Yellow Duck
  const duckGrad = ctx.createLinearGradient(0, -22 + bob, 0, 14 + bob);
  duckGrad.addColorStop(0, '#fef08a');
  duckGrad.addColorStop(1, '#fde047');
  ctx.fillStyle = duckGrad;
  ctx.beginPath();
  ctx.ellipse(0, -3 + bob, 18, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Aviator Goggles on Forehead
  ctx.fillStyle = '#475569';
  ctx.fillRect(-16, -18 + bob, 32, 5);
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(-7, -16 + bob, 5, 0, Math.PI * 2);
  ctx.arc(7, -16 + bob, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Eyes
  drawGlossyEye(ctx, -7, -7 + bob, 5.5, '#0f172a');
  drawGlossyEye(ctx, 7, -7 + bob, 5.5, '#0f172a');

  // Broad Orange Duck Bill
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(0, -1 + bob, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c2410c';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Orange Webbed Feet
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.ellipse(-7, 14 + bob, 6, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(7, 14 + bob, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 6. CINNAMOROLL (Thỏ/Cún Trắng Tai Dài Chibi)
 */
function drawChibiCinnamoroll(ctx: CanvasRenderingContext2D, bob: number, frame: number, state: string) {
  const earFlap = Math.sin(frame * 0.2) * 0.2;

  // Long Floppy Ears that float like cloud wings
  ctx.save();
  ctx.translate(-14, -12 + bob);
  ctx.rotate(-0.35 + earFlap);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-14, 0, 16, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(14, -12 + bob);
  ctx.rotate(0.35 - earFlap);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(14, 0, 16, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Round Cloud Body
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -3 + bob, 20, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Glossy Sky-Blue Eyes
  drawGlossyEye(ctx, -8, -6 + bob, 5.5, '#0284c7');
  drawGlossyEye(ctx, 8, -6 + bob, 5.5, '#0284c7');

  // Pink Blushing Cheeks
  ctx.fillStyle = 'rgba(251, 113, 133, 0.5)';
  ctx.beginPath();
  ctx.ellipse(-13, -2 + bob, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.ellipse(13, -2 + bob, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tiny Cute Nose & Smile
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(-2, 0 + bob, 2, 0, Math.PI);
  ctx.arc(2, 0 + bob, 2, 0, Math.PI);
  ctx.stroke();

  // Little Paws
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-7, 14 + bob, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.ellipse(7, 14 + bob, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/**
 * Universal Anime Eye with Glossy Glints & Iris Depth
 */
function drawGlossyEye(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, irisColor: string) {
  // Sclera / Outline
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Iris Gradient
  const irisGrad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  irisGrad.addColorStop(0, irisColor);
  irisGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(cx, cy + 0.5, r - 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Big White Reflection Sparkle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Secondary Tiny Glint
  ctx.beginPath();
  ctx.arc(cx + r * 0.3, cy + r * 0.3, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
}
