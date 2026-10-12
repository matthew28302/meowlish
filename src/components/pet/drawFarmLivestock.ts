/**
 * High-Definition Vector Rendering Engine for Meowlish 2D Farm
 * Renders charming, ultra-sharp vector graphics with soft gradients and rich details.
 */

export interface DrawChickenOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  direction: 1 | -1;
  state: 'idle' | 'walk' | 'eating' | 'producing';
  frame: number;
  isRooster?: boolean;
  isChick?: boolean;
  heartTimer?: number;
}

export interface DrawCowOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  direction: 1 | -1;
  state: 'idle' | 'walk' | 'eating' | 'producing';
  frame: number;
  heartTimer?: number;
}

export interface DrawSheepOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  direction: 1 | -1;
  state: 'idle' | 'walk' | 'eating' | 'producing';
  frame: number;
  heartTimer?: number;
}

export interface DrawDogOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  direction: 1 | -1;
  state: 'idle' | 'walk' | 'eating' | 'producing';
  frame: number;
  coat?: string;
  coatDark?: string;
  extra?: string;
  heartTimer?: number;
}

export interface DrawCatOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  direction: 1 | -1;
  state: 'idle' | 'walk' | 'eating' | 'producing';
  frame: number;
  coat?: string;
  coatDark?: string;
  extra?: string;
  heartTimer?: number;
}

export interface DrawFishOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  direction: 1 | -1;
  frame: number;
  coat?: string;
  heartTimer?: number;
}

/**
 * Draw Animated Chibi Hen / Rooster / Baby Chick
 */
export function drawChibiChicken({
  ctx,
  x,
  y,
  direction,
  state,
  frame,
  isRooster = false,
  isChick = false,
  heartTimer = 0,
}: DrawChickenOptions) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);

  if (isChick) {
    drawBabyChick(ctx, state, frame, heartTimer);
    ctx.restore();
    return;
  }

  const hop = state === 'walk' ? Math.sin(frame * 0.35) * 3 : 0;
  const pecking = state === 'eating' ? Math.sin(frame * 0.45) * 6 : 0;
  const wingFlap = state === 'eating' || state === 'producing' ? Math.sin(frame * 0.5) * 0.3 : 0;

  // Shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Orange Legs & Claws
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  const legOffset = state === 'walk' ? Math.sin(frame * 0.35) * 4 : 0;
  // Left leg
  ctx.beginPath();
  ctx.moveTo(-4, 2);
  ctx.lineTo(-5, 9 + legOffset);
  ctx.lineTo(-8, 11 + legOffset);
  ctx.stroke();
  // Right leg
  ctx.beginPath();
  ctx.moveTo(4, 2);
  ctx.lineTo(3, 9 - legOffset);
  ctx.lineTo(6, 11 - legOffset);
  ctx.stroke();

  // Tail Feathers (Rooster has magnificent emerald/red tail)
  if (isRooster) {
    ctx.save();
    ctx.translate(-12, -8 + pecking * 0.2);
    ctx.rotate(-0.2 + Math.sin(frame * 0.15) * 0.1);
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-14, -18, -10, -28);
    ctx.quadraticCurveTo(-4, -16, 0, -4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.quadraticCurveTo(-8, -14, -6, -22);
    ctx.quadraticCurveTo(-2, -12, 2, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else {
    // Cute Hen Tail
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-10, -4 + pecking * 0.2);
    ctx.lineTo(-18, -14 + pecking * 0.2);
    ctx.lineTo(-8, -10 + pecking * 0.2);
    ctx.closePath();
    ctx.fill();
  }

  // Plump Round Body
  const bodyGrad = ctx.createLinearGradient(0, -18 + pecking * 0.3, 0, 6 + pecking * 0.3);
  bodyGrad.addColorStop(0, isRooster ? '#fbbf24' : '#fef08a');
  bodyGrad.addColorStop(1, isRooster ? '#ea580c' : '#f59e0b');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, -4 + pecking * 0.3, 14, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isRooster ? '#c2410c' : '#d97706';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cute Wing
  ctx.save();
  ctx.translate(-2, -5 + pecking * 0.3);
  ctx.rotate(wingFlap);
  ctx.fillStyle = isRooster ? '#ea580c' : '#fde047';
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 6, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isRooster ? '#9a3412' : '#eab308';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  // Head
  const headX = 9;
  const headY = -12 + pecking;
  ctx.fillStyle = isRooster ? '#fef08a' : '#fef9c3';
  ctx.beginPath();
  ctx.arc(headX, headY, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isRooster ? '#ea580c' : '#f59e0b';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Comb (Mào Gà Đỏ)
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  if (isRooster) {
    ctx.arc(headX - 2, headY - 8, 3.5, 0, Math.PI * 2);
    ctx.arc(headX + 2, headY - 10, 4, 0, Math.PI * 2);
    ctx.arc(headX + 6, headY - 8, 3, 0, Math.PI * 2);
  } else {
    ctx.arc(headX - 1, headY - 7, 2.5, 0, Math.PI * 2);
    ctx.arc(headX + 3, headY - 7, 2.8, 0, Math.PI * 2);
  }
  ctx.fill();

  // Wattle (Yếm Cổ Đỏ)
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.ellipse(headX + 2, headY + 7, 2.2, 3.5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Beak (Mỏ Vàng Cam)
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(headX + 5, headY - 2);
  ctx.lineTo(headX + 13, headY);
  ctx.lineTo(headX + 5, headY + 3);
  ctx.closePath();
  ctx.fill();

  // Glossy Eye
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(headX + 2, headY - 2, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(headX + 1.2, headY - 2.8, 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Heart animation above head if happy
  if (heartTimer > 0) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❤️', 0, -32 + Math.sin(frame * 0.15) * 3);
  }

  ctx.restore();
}

/**
 * Draw Tiny Baby Chick (Gà con chíp)
 */
function drawBabyChick(ctx: CanvasRenderingContext2D, state: string, frame: number, heartTimer: number) {
  const chickHop = state === 'walk' ? Math.abs(Math.sin(frame * 0.4)) * 5 : 0;

  // Shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Round Fluffy Body
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(0, -2 - chickHop, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Little Wing
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.ellipse(-3, -2 - chickHop, 4, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Orange Beak
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(5, -3 - chickHop);
  ctx.lineTo(10, -1 - chickHop);
  ctx.lineTo(5, 1 - chickHop);
  ctx.closePath();
  ctx.fill();

  // Cute Big Baby Eye
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(3, -3 - chickHop, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(2.3, -3.7 - chickHop, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Feet
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-2, 5 - chickHop);
  ctx.lineTo(-2, 8);
  ctx.moveTo(2, 5 - chickHop);
  ctx.lineTo(2, 8);
  ctx.stroke();
}

/**
 * Draw Adorable Chibi Dairy Cow (Bò Sữa Siêu Cưng)
 */
export function drawChibiDairyCow({
  ctx,
  x,
  y,
  direction,
  state,
  frame,
  heartTimer = 0,
}: DrawCowOptions) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);

  const walkStep = state === 'walk' ? Math.sin(frame * 0.28) * 4 : 0;
  const chew = state === 'eating' ? Math.sin(frame * 0.35) * 2.5 : 0;
  const tailWag = Math.sin(frame * 0.15) * 0.3;

  // Shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 30, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail with fluffy tuft
  ctx.save();
  ctx.translate(-26, -4);
  ctx.rotate(-0.2 + tailWag);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-10, 8, -6, 20);
  ctx.stroke();
  // Tuft
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(-6, 21, 4, 6, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4 Chubby Legs with Hooves
  drawCowLeg(ctx, -18, 6, 14 + walkStep);
  drawCowLeg(ctx, -7, 6, 14 - walkStep);
  drawCowLeg(ctx, 10, 6, 14 + walkStep);
  drawCowLeg(ctx, 21, 6, 14 - walkStep);

  // Pink Udder (Bầu vú)
  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath();
  ctx.ellipse(-4, 10, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Chubby White Body
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -4, 30, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Black Spots (Cute Heart-shaped & organic patches)
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(-12, -6, 10, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(11, -2, 8, 10, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Red Ribbon Collar & Golden Bell 🔔
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(16, -10, 6, 14);
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(19, 7, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Head (Chubby Cute Bovine Head)
  const headX = 26;
  const headY = -14 + chew;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(headX, headY, 15, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Black patch over one eye
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(headX - 4, headY - 4, 7, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Ears (Wiggling cute ears)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(headX - 10, headY - 14, 4, 8, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath();
  ctx.ellipse(headX - 10, headY - 14, 2.5, 5, -0.6, 0, Math.PI * 2);
  ctx.fill();

  // Little Horns
  ctx.fillStyle = '#ca8a04';
  ctx.beginPath();
  ctx.moveTo(headX - 3, headY - 12);
  ctx.quadraticCurveTo(headX - 2, headY - 20, headX + 3, headY - 22);
  ctx.quadraticCurveTo(headX + 2, headY - 14, headX + 4, headY - 12);
  ctx.closePath();
  ctx.fill();

  // Big Glossy Anime Eyes
  drawGlossyEye(ctx, headX - 3, headY - 4, 4.5, '#78350f');
  drawGlossyEye(ctx, headX + 7, headY - 4, 4.5, '#78350f');

  // Pink Muzzle & Snout with Cheerful Smile
  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath();
  ctx.ellipse(headX + 7, headY + 5, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Nostrils
  ctx.fillStyle = '#db2777';
  ctx.beginPath();
  ctx.arc(headX + 5, headY + 4, 1.6, 0, Math.PI * 2);
  ctx.arc(headX + 10, headY + 4, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Cute blade of clover in mouth when eating
  if (state === 'eating') {
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX + 11, headY + 7);
    ctx.lineTo(headX + 22, headY + 5 + Math.sin(frame * 0.4) * 2);
    ctx.stroke();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(headX + 22, headY + 4 + Math.sin(frame * 0.4) * 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rosy Cheeks
  ctx.fillStyle = 'rgba(244, 114, 182, 0.45)';
  ctx.beginPath();
  ctx.ellipse(headX - 4, headY + 2, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.ellipse(headX + 14, headY + 2, 3.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Heart animation above head if happy
  if (heartTimer > 0) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❤️', headX, -38 + Math.sin(frame * 0.15) * 3);
  }

  ctx.restore();
}

function drawCowLeg(ctx: CanvasRenderingContext2D, x: number, y: number, height: number) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 3.5, y, 7, height);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x - 3.5, y, 7, height);

  // Black Hoof
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x - 3.5, y + height - 3, 7, 3);
}

/**
 * Universal Anime Eye with Glossy Glints
 */
function drawGlossyEye(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, irisColor: string) {
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  const irisGrad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  irisGrad.addColorStop(0, irisColor);
  irisGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(cx, cy + 0.5, r - 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.38, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * H18: Cừu bông mây trắng — cho len mỗi 12 giờ.
 */
export function drawChibiSheep({
  ctx,
  x,
  y,
  direction,
  state,
  frame,
  heartTimer = 0,
}: DrawSheepOptions) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);

  const graze = state === 'eating' ? Math.sin(frame * 0.4) * 4 : 0;
  const bob = state === 'walk' ? Math.abs(Math.sin(frame * 0.3)) * 2.5 : 0;

  // Bóng đổ
  ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4 chân nhỏ
  ctx.strokeStyle = '#57534e';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const step = state === 'walk' ? Math.sin(frame * 0.3) * 3 : 0;
  ctx.beginPath();
  ctx.moveTo(-12, 4); ctx.lineTo(-12, 13 + step);
  ctx.moveTo(-4, 4); ctx.lineTo(-4, 13 - step);
  ctx.moveTo(8, 4); ctx.lineTo(8, 13 + step);
  ctx.moveTo(16, 4); ctx.lineTo(16, 13 - step);
  ctx.stroke();

  // Đám lông bông (cụm tròn xếp quanh thân)
  const puffs: [number, number, number][] = [
    [-14, -6, 9], [-6, -12, 10], [3, -13, 11], [12, -10, 10],
    [18, -3, 9], [10, 2, 9], [0, 1, 10], [-10, 1, 9],
  ];
  ctx.fillStyle = '#fafaf9';
  ctx.strokeStyle = '#e7e5e4';
  ctx.lineWidth = 1.4;
  for (const [px, py, pr] of puffs) {
    ctx.beginPath();
    ctx.arc(px, py - bob, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Đầu đen xinh (cúi khi gặm cỏ)
  const headX = 22;
  const headY = -6 + graze;
  ctx.fillStyle = '#44403c';
  ctx.beginPath();
  ctx.ellipse(headX, headY, 8, 9, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Chùm lông trên trán
  ctx.fillStyle = '#fafaf9';
  ctx.beginPath();
  ctx.arc(headX - 2, headY - 8, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e7e5e4';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Tai cụp
  ctx.fillStyle = '#57534e';
  ctx.beginPath();
  ctx.ellipse(headX - 7, headY - 2, 3, 5, -0.5, 0, Math.PI * 2);
  ctx.fill();
  drawGlossyEye(ctx, headX + 2, headY - 1, 3, '#1c1917');
  // Má hồng
  ctx.fillStyle = 'rgba(244, 114, 182, 0.5)';
  ctx.beginPath();
  ctx.arc(headX + 5, headY + 3, 2.2, 0, Math.PI * 2);
  ctx.fill();

  if (heartTimer > 0) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❤️', 0, -32 + Math.sin(frame * 0.15) * 3);
  }
  ctx.restore();
}

/**
 * H18: Chó cảnh nhiều giống (màu lông + kiểu tai theo breed).
 * extra: 'fox' tai dựng (shiba) / 'short' lùn chân ngắn (corgi) /
 *        'curly' lông xù (poodle) / 'mask' mặt nạ (husky).
 */
export function drawChibiDog({
  ctx,
  x,
  y,
  direction,
  state,
  frame,
  coat = '#e8a34d',
  coatDark = '#b8742a',
  extra = 'fox',
  heartTimer = 0,
}: DrawDogOptions) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);

  const short = extra === 'short';
  const bodyY = short ? 4 : 0;
  const run = state === 'walk' ? Math.sin(frame * 0.35) * 3 : 0;
  const wag = Math.sin(frame * 0.3) * 0.4;
  const pant = Math.sin(frame * 0.25) * 1.5;

  // Bóng đổ
  ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
  ctx.beginPath();
  ctx.ellipse(2, short ? 16 : 14, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Đuôi vẫy
  ctx.save();
  ctx.translate(-20, bodyY - 6);
  ctx.rotate(-0.6 + wag);
  ctx.strokeStyle = coat;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-10, -6, -12, -14);
  ctx.stroke();
  ctx.restore();

  // Chân
  ctx.strokeStyle = coatDark;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const legH = short ? 8 : 12;
  ctx.beginPath();
  ctx.moveTo(-10, bodyY + 2); ctx.lineTo(-10, bodyY + 2 + legH + run);
  ctx.moveTo(-2, bodyY + 2); ctx.lineTo(-2, bodyY + 2 + legH - run);
  ctx.moveTo(10, bodyY + 2); ctx.lineTo(10, bodyY + 2 + legH + run);
  ctx.moveTo(17, bodyY + 2); ctx.lineTo(17, bodyY + 2 + legH - run);
  ctx.stroke();

  // Thân tròn
  const bodyGrad = ctx.createLinearGradient(0, bodyY - 14, 0, bodyY + 6);
  bodyGrad.addColorStop(0, coat);
  bodyGrad.addColorStop(1, coatDark);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, bodyY - 4, 22, short ? 11 : 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = coatDark;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  // Yếm trắng
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(8, bodyY + 1, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Đầu
  const headX = 22;
  const headY = bodyY - 14 + pant * 0.3;
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.arc(headX, headY, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = coatDark;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Kiểu tai theo giống
  if (extra === 'fox' || extra === 'mask') {
    // Tai dựng tam giác
    ctx.fillStyle = coat;
    ctx.strokeStyle = coatDark;
    ctx.lineWidth = 1.4;
    for (const ex of [headX - 7, headX + 6]) {
      ctx.beginPath();
      ctx.moveTo(ex - 4, headY - 8);
      ctx.lineTo(ex, headY - 18);
      ctx.lineTo(ex + 4, headY - 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // Tai cụp
    ctx.fillStyle = coatDark;
    ctx.beginPath();
    ctx.ellipse(headX - 10, headY - 6, 4, 7, -0.4, 0, Math.PI * 2);
    ctx.ellipse(headX + 10, headY - 6, 4, 7, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Mặt nạ husky
  if (extra === 'mask') {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.ellipse(headX, headY + 2, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Lông xù poodle: viền xoăn quanh đầu
  if (extra === 'curly') {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(headX + Math.cos(a) * 12, headY + Math.sin(a) * 12, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Mõm + mũi
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(headX + 4, headY + 5, 6.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.arc(headX + 7, headY + 3, 2.6, 0, Math.PI * 2);
  ctx.fill();
  // Lưỡi thè khi vui
  if (state === 'producing' || heartTimer > 0) {
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(headX + 5, headY + 10, 2.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  drawGlossyEye(ctx, headX - 3, headY - 2, 3.4, '#451a03');
  drawGlossyEye(ctx, headX + 6, headY - 3, 3.2, '#451a03');

  if (heartTimer > 0) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❤️', headX, headY - 24 + Math.sin(frame * 0.15) * 3);
  }
  ctx.restore();
}

/**
 * H18: Mèo cảnh nhiều giống.
 * extra: 'stripes' vằn (mướp) / 'spots' đốm (bengal) /
 *        'points' mặt-tai-đuôi đậm (xiêm) / 'short' chân ngắn (munchkin).
 */
export function drawChibiCat({
  ctx,
  x,
  y,
  direction,
  state,
  frame,
  coat = '#d9a066',
  coatDark = '#9c6b3d',
  extra = 'stripes',
  heartTimer = 0,
}: DrawCatOptions) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);

  const short = extra === 'short';
  const bodyY = short ? 5 : 0;
  const stretch = state === 'walk' ? Math.sin(frame * 0.3) * 2 : 0;
  const tailCurl = Math.sin(frame * 0.2) * 0.25;

  // Bóng đổ
  ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
  ctx.beginPath();
  ctx.ellipse(0, short ? 15 : 13, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Đuôi cong
  ctx.save();
  ctx.translate(-18, bodyY - 4);
  ctx.rotate(0.5 + tailCurl);
  ctx.strokeStyle = extra === 'points' ? coatDark : coat;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-12, -4, -10, -16);
  ctx.stroke();
  ctx.restore();

  // Chân
  ctx.strokeStyle = coatDark;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  const legH = short ? 7 : 11;
  ctx.beginPath();
  ctx.moveTo(-9, bodyY + 2); ctx.lineTo(-9, bodyY + 2 + legH + stretch);
  ctx.moveTo(-1, bodyY + 2); ctx.lineTo(-1, bodyY + 2 + legH - stretch);
  ctx.moveTo(9, bodyY + 2); ctx.lineTo(9, bodyY + 2 + legH + stretch);
  ctx.moveTo(16, bodyY + 2); ctx.lineTo(16, bodyY + 2 + legH - stretch);
  ctx.stroke();

  // Thân
  const bodyGrad = ctx.createLinearGradient(0, bodyY - 12, 0, bodyY + 6);
  bodyGrad.addColorStop(0, coat);
  bodyGrad.addColorStop(1, coatDark);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, bodyY - 3, 20, short ? 10 : 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = coatDark;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Vằn / đốm trên thân
  if (extra === 'stripes' || extra === 'spots') {
    ctx.fillStyle = coatDark;
    for (const [sx, sy] of [[-10, -8], [0, -10], [10, -7]] as [number, number][]) {
      ctx.beginPath();
      if (extra === 'stripes') ctx.ellipse(sx, bodyY + sy, 2, 4, 0.2, 0, Math.PI * 2);
      else ctx.arc(sx, bodyY + sy, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Đầu tròn + tai tam giác
  const headX = 20;
  const headY = bodyY - 14;
  ctx.fillStyle = extra === 'points' ? coat : coat;
  ctx.beginPath();
  ctx.arc(headX, headY, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = coatDark;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  for (const ex of [headX - 7, headX + 7]) {
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.moveTo(ex - 4.5, headY - 7);
    ctx.lineTo(ex, headY - 17);
    ctx.lineTo(ex + 4.5, headY - 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f9a8d4';
    ctx.beginPath();
    ctx.moveTo(ex - 2, headY - 8);
    ctx.lineTo(ex, headY - 13);
    ctx.lineTo(ex + 2, headY - 8);
    ctx.closePath();
    ctx.fill();
  }
  // Mặt points của mèo Xiêm
  if (extra === 'points') {
    ctx.fillStyle = coatDark;
    ctx.beginPath();
    ctx.ellipse(headX + 2, headY + 2, 7, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Vằn chữ M trên trán mèo mướp
  if (extra === 'stripes') {
    ctx.strokeStyle = coatDark;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(headX - 4, headY - 9); ctx.lineTo(headX - 2, headY - 5);
    ctx.lineTo(headX, headY - 9); ctx.lineTo(headX + 2, headY - 5);
    ctx.lineTo(headX + 4, headY - 9);
    ctx.stroke();
  }

  // Mũi + miệng ω
  ctx.fillStyle = '#f9a8d4';
  ctx.beginPath();
  ctx.moveTo(headX + 1, headY + 3);
  ctx.lineTo(headX + 5, headY + 3);
  ctx.lineTo(headX + 3, headY + 5.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#57534e';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(headX + 3, headY + 5.5);
  ctx.quadraticCurveTo(headX, headY + 8, headX - 3, headY + 6.5);
  ctx.moveTo(headX + 3, headY + 5.5);
  ctx.quadraticCurveTo(headX + 6, headY + 8, headX + 9, headY + 6.5);
  ctx.stroke();
  // Ria
  ctx.strokeStyle = 'rgba(87,83,78,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(headX - 6, headY + 3); ctx.lineTo(headX - 14, headY + 1);
  ctx.moveTo(headX - 6, headY + 5); ctx.lineTo(headX - 14, headY + 6);
  ctx.stroke();

  drawGlossyEye(ctx, headX - 2, headY - 1, 3.2, '#166534');
  drawGlossyEye(ctx, headX + 7, headY - 1, 3.2, '#166534');

  if (heartTimer > 0) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❤️', headX, headY - 24 + Math.sin(frame * 0.15) * 3);
  }
  ctx.restore();
}

/**
 * H18: Cá chép hồ sen bơi lội.
 */
export function drawChibiFish({
  ctx,
  x,
  y,
  direction,
  frame,
  coat = '#fb923c',
  heartTimer = 0,
}: DrawFishOptions) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);

  const wag = Math.sin(frame * 0.35) * 0.35;
  const bobY = Math.sin(frame * 0.2) * 2;

  // Đuôi quẫy
  ctx.save();
  ctx.translate(-12, bobY);
  ctx.rotate(wag);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-10, -7);
  ctx.lineTo(-10, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Thân
  const bodyGrad = ctx.createLinearGradient(0, -8 + bobY, 0, 8 + bobY);
  bodyGrad.addColorStop(0, '#fdba74');
  bodyGrad.addColorStop(0.5, coat);
  bodyGrad.addColorStop(1, '#ea580c');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, bobY, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c2410c';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // Vảy lấp lánh
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  for (const vx of [-4, 1, 6]) {
    ctx.beginPath();
    ctx.arc(vx, bobY + 1, 3, 0.3, Math.PI - 0.3);
    ctx.stroke();
  }
  // Vây trên
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(-2, bobY - 7);
  ctx.quadraticCurveTo(2, bobY - 14, 7, bobY - 7);
  ctx.closePath();
  ctx.fill();

  drawGlossyEye(ctx, 7, bobY - 2, 2.8, '#0c4a6e');

  // Bong bóng
  if (Math.sin(frame * 0.05 + x) > 0.6) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(10, bobY - 12, 2.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (heartTimer > 0) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❤️', 0, bobY - 18);
  }
  ctx.restore();
}
