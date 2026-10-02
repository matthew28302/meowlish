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
