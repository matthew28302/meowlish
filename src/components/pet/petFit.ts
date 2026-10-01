export interface PetOutfitClip {
  kind: 'ellipse';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface PetOutfitFit {
  /** Horizontal scale applied to the canonical outfit artwork. */
  scaleX: number;
  /** Vertical SVG-unit shift applied after scaling. Negative moves the outfit up. */
  dy: number;
  /** Optional torso silhouette used to hide artwork that spills off the body. */
  clip?: PetOutfitClip;
}

export interface PetHatFit {
  /** Vertical offset for hats. Negative moves the hat up. */
  dy: number;
  /** Horizontal scale (default 1). */
  scaleX?: number;
}

export interface PetGlassesFit {
  /** Vertical offset for glasses. Positive moves down to align with eyes. */
  dy: number;
  /** Horizontal offset (default 0). */
  dx?: number;
  /** Horizontal scale to match head width (default 1). */
  scaleX?: number;
}

/**
 * Canonical outfit artwork was drawn for the standard torso:
 * x 20..44 (center 32, width 24), y 38.5..53 (bottom 53).
 *
 * These per-species entries preserve the artwork's height and aspect ratio.
 * They only recenter/resize it horizontally and move it vertically so the
 * garment sits on that species' actual torso. Species absent here use the
 * original coordinates unchanged.
 *
 * Eye coordinate reference for each species (cy values):
 *   Standard: ~26 | Doraemon/Dorami: ~15.5 | Keroppi: ~15.5 | Chopper: ~26
 *   Alligator Loki: ~24 | Karoo: ~25 | Goose: ~23
 *
 * Torso top reference (where outfit collar should sit):
 *   Standard: 38.5 | Hello Kitty: 39 | Kuromi: 42 | Cinnamoroll: 35
 *   Doraemon: 35 | Chopper: 37 | Karoo: 35 | Bepo: 36 | Panda: 36
 */
const OUTFIT_FIT_BY_SPECIES: Record<string, PetOutfitFit> = {
  // --- SANRIO ---
  // Cinnamoroll: Petite soft cloud puppy body, slightly lower and chubbier.
  cinnamoroll: { scaleX: 0.88, dy: -2 },
  // Kuromi: Has its own jester collar, move garment down slightly to avoid overlap.
  kuromi: { scaleX: 1, dy: 1 },
  // Hello Kitty: Already wearing overalls; body y=36..54, standard fit is close.
  hello_kitty: { scaleX: 0.95, dy: 0 },
  // My Melody: Rounded body y=38..54, slightly narrower.
  my_melody: { scaleX: 0.9, dy: -1 },
  // Pompompurin: Chubby oval body, wide belly.
  pompompurin: {
    scaleX: 1.05,
    dy: -2,
    clip: { kind: 'ellipse', cx: 32, cy: 44, rx: 14, ry: 11 },
  },
  // Keroppi: Frog body starts at y=36, slightly wider.
  keroppi: { scaleX: 1, dy: -2 },

  // --- OWL / BIRD ---
  // Owl (Lexi): Round body, keep garment on the belly.
  owl: {
    scaleX: 0.95,
    dy: -8,
    clip: { kind: 'ellipse', cx: 32, cy: 30, rx: 16.5, ry: 15.5 },
  },
  // Hedwig: Same round body shape as owl.
  hedwig: {
    scaleX: 0.95,
    dy: -8,
    clip: { kind: 'ellipse', cx: 32, cy: 30, rx: 16.5, ry: 15.5 },
  },
  // Fawkes (Phoenix): Tall neck, narrow body.
  fawkes: {
    scaleX: 1,
    dy: -7,
    clip: { kind: 'ellipse', cx: 32, cy: 30, rx: 15.5, ry: 14.5 },
  },
  // Goose: Long neck, body starts at y=36.
  goose: {
    scaleX: 0.9,
    dy: -3,
    clip: { kind: 'ellipse', cx: 32, cy: 42, rx: 13, ry: 12 },
  },

  // --- ONE PIECE ---
  // Chopper: Torso y=37..52, slightly narrower.
  chopper: { scaleX: 0.92, dy: -1 },
  // Karoo (Duck): Round duck body y=35..54, needs outfit higher.
  karoo: {
    scaleX: 0.95,
    dy: -3,
    clip: { kind: 'ellipse', cx: 32, cy: 43, rx: 14, ry: 11.5 },
  },
  // Bepo: Large polar bear body y=36..54.
  bepo: { scaleX: 1.05, dy: -2 },

  // --- DORAEMON ---
  // Doraemon: Round body y=35..54, has belly pouch + collar at y=34.5.
  doraemon: {
    scaleX: 1,
    dy: -2,
    clip: { kind: 'ellipse', cx: 32, cy: 44, rx: 14, ry: 11 },
  },
  // Dorami: Similar to Doraemon but slightly smaller.
  dorami: {
    scaleX: 0.95,
    dy: -2,
    clip: { kind: 'ellipse', cx: 32, cy: 44, rx: 13.5, ry: 11 },
  },

  // --- KIRBY ---
  kirby: {
    scaleX: 1.05,
    dy: -4,
    clip: { kind: 'ellipse', cx: 32, cy: 30, rx: 16.5, ry: 16.5 },
  },

  // --- QUADRUPEDS & OTHERS ---
  // Cat: Standard torso y=36..54, fits well with minor adjustments.
  cat: { scaleX: 0.95, dy: 0 },
  // Dog (Shiba): Same body layout as cat.
  dog: { scaleX: 0.95, dy: 0 },
  // Fox: Slender body.
  fox: { scaleX: 0.9, dy: 0 },
  // Panda: Chubby wide body.
  panda: { scaleX: 1.05, dy: -1 },
  // Bunny: Tall slender body.
  bunny: { scaleX: 0.9, dy: -1 },

  // --- NARUTO ---
  // Kurama (Nine Tails): Large fox body.
  kurama: { scaleX: 1, dy: -1 },
  // Pakkun: Small compact dog.
  pakkun: { scaleX: 0.85, dy: -1 },
  // Gamakichi: Toad body, wide and round.
  gamakichi: {
    scaleX: 1.05,
    dy: -3,
    clip: { kind: 'ellipse', cx: 32, cy: 42, rx: 15, ry: 12 },
  },

  // --- HARRY POTTER ---
  // Crookshanks: Cat-like body, same as cat.
  crookshanks: { scaleX: 0.95, dy: 0 },

  // --- MARVEL / MISC ---
  // Rocket: Small compact raccoon body.
  rocket: { scaleX: 0.85, dy: -1 },
  // Alligator Loki: Standard upright body y=36..54 with belly.
  alligator_loki: { scaleX: 1, dy: -1 },
};

/**
 * Hat offset adjustments per species.
 * Canonical hat artwork: y=2..14, centered at x=32.
 * Species with built-in headgear or varying head height need offsets.
 */
const HAT_FIT_BY_SPECIES: Record<string, PetHatFit> = {
  // Doraemon: Head circle at cy=22, r=15.5 → top at y=6.5. Hat sits well at default.
  doraemon: { dy: 0 },
  // Dorami: Head at cy=22, bow at top. Move hat up slightly.
  dorami: { dy: -2 },
  // Chopper: Already has large hat brim at y=20. Move equipped hat above it.
  chopper: { dy: -4 },
  // Keroppi: Bulging eyes at y=7. Move hat up to clear eyes.
  keroppi: { dy: -3 },
  // Kuromi: Jester horns reach to y=3. Move hat up.
  kuromi: { dy: -5, scaleX: 0.9 },
  // My Melody: Hood ears at y=3. Move hat up.
  my_melody: { dy: -3, scaleX: 0.9 },
  // Alligator Loki: Crown horns reach y=1. Move hat way up.
  alligator_loki: { dy: -6, scaleX: 0.85 },
  // Cinnamoroll: Head is slightly lower and rounder, hat sits nicely down 2 units.
  cinnamoroll: { dy: 2 },
  // Kirby: Head top at ~y=16. Move hat down slightly.
  kirby: { dy: 4 },
  // Karoo: Aviator helmet at y=10. Move hat up slightly.
  karoo: { dy: -2 },
};

/**
 * Glasses offset adjustments per species.
 * Canonical glasses are drawn at cy=18.5.
 * Most species have eyes at cy=26, so default offset is +7.5.
 */
const GLASSES_FIT_BY_SPECIES: Record<string, PetGlassesFit> = {
  // Standard pets with eyes at cy=26 (cat, dog, fox, panda, bunny, hello_kitty, chopper, etc.)
  cat: { dy: 7.5 },
  dog: { dy: 7.5 },
  fox: { dy: 7.5 },
  panda: { dy: 7.5 },
  bunny: { dy: 7.5 },
  hello_kitty: { dy: 7.5 },
  chopper: { dy: 7.5 },
  bepo: { dy: 7.5 },
  kurama: { dy: 7.5 },
  pakkun: { dy: 7.5 },
  crookshanks: { dy: 7.5 },
  rocket: { dy: 7 },
  owl: { dy: 6 },
  hedwig: { dy: 6 },
  // Cinnamoroll: Eyes at cy=25.5, glasses adjust by +7.
  cinnamoroll: { dy: 7 },
  // Kirby: Eyes at cy=26.
  kirby: { dy: 7.5 },
  // My Melody: Eyes at ~cy=26.
  my_melody: { dy: 7.5 },
  // Pompompurin: Eyes at ~cy=26.
  pompompurin: { dy: 7.5 },
  // Kuromi: Eyes at cy=30.
  kuromi: { dy: 11.5 },
  // Gamakichi: Eyes at ~cy=22.
  gamakichi: { dy: 4 },
  // Alligator Loki: Eyes at cy=24.
  alligator_loki: { dy: 5.5 },
  // Karoo: Eyes at cy=25 but has aviator goggles already.
  karoo: { dy: 6.5 },
  // Goose: Eyes at cy=23.
  goose: { dy: 4.5 },
  // Fawkes: Eyes at ~cy=24.
  fawkes: { dy: 5.5 },
  // Doraemon: Eyes at cy=15.5 — glasses need to move UP.
  doraemon: { dy: -3 },
  // Dorami: Eyes at cy=16.
  dorami: { dy: -2.5 },
  // Keroppi: Eyes at cy=15.5.
  keroppi: { dy: -3 },
};

export function getOutfitFit(species: string): PetOutfitFit | undefined {
  return OUTFIT_FIT_BY_SPECIES[species];
}

/** SVG transform for an equipped outfit, or undefined when no adjustment is needed. */
export function getOutfitTransform(fit: PetOutfitFit | undefined): string | undefined {
  if (!fit) return undefined;
  const dx = 32 - 32 * fit.scaleX;
  const rounded = (value: number) => Math.round(value * 1000) / 1000;
  return `translate(${rounded(dx)} ${rounded(fit.dy)}) scale(${rounded(fit.scaleX)} 1)`;
}

export function getHatFit(species: string): PetHatFit | undefined {
  return HAT_FIT_BY_SPECIES[species];
}

/** SVG transform for an equipped hat, or undefined when no adjustment is needed. */
export function getHatTransform(fit: PetHatFit | undefined): string | undefined {
  if (!fit) return undefined;
  const scaleX = fit.scaleX ?? 1;
  const dx = 32 - 32 * scaleX;
  const rounded = (value: number) => Math.round(value * 1000) / 1000;
  if (scaleX !== 1) {
    return `translate(${rounded(dx)} ${rounded(fit.dy)}) scale(${rounded(scaleX)} 1)`;
  }
  return `translate(0 ${rounded(fit.dy)})`;
}

export function getGlassesFit(species: string): PetGlassesFit | undefined {
  return GLASSES_FIT_BY_SPECIES[species];
}

/** SVG transform for glasses, or undefined when no adjustment is needed. */
export function getGlassesTransform(fit: PetGlassesFit | undefined): string | undefined {
  if (!fit) return undefined;
  const dx = fit.dx ?? 0;
  const scaleX = fit.scaleX ?? 1;
  const rounded = (value: number) => Math.round(value * 1000) / 1000;
  if (scaleX !== 1) {
    const sdx = 32 - 32 * scaleX + dx;
    return `translate(${rounded(sdx)} ${rounded(fit.dy)}) scale(${rounded(scaleX)} 1)`;
  }
  if (dx !== 0) {
    return `translate(${rounded(dx)} ${rounded(fit.dy)})`;
  }
  return `translate(0 ${rounded(fit.dy)})`;
}
