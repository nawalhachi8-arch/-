// Original Game Dimensions
export const ORIGINAL_GAME_WIDTH = 384;
export const ORIGINAL_GAME_HEIGHT = 512;
// Keep a fixed aspect ratio for calculations but allow the screen to be flexible
export const GAME_ASPECT_RATIO = 9 / 16; 

// Relative sizes and positions (percentages of screen dimensions)
export const BIRD_WIDTH_PERCENT = 38 / 384; // Bird width relative to game width
export const BIRD_HEIGHT_PERCENT = 38 / 512; // Bird height relative to game height
export const BIRD_START_X_PERCENT = 0.25; // Bird starts at 25% of the screen width
export const BIRD_START_Y_PERCENT = 0.5;

export const GRAVITY_FACTOR = 0.5 / 512; // Gravity relative to a nominal height
export const FLAP_STRENGTH_FACTOR = 8 / 512; // Flap strength relative to a nominal height
export const BIRD_ROTATION_SPEED = 4;
export const MAX_BIRD_ROTATION = 90;
export const MIN_BIRD_ROTATION = -30;

export const PIPE_WIDTH_PERCENT = 60 / 384;
export const PIPE_GAP_PERCENT = 150 / 512;
export const PIPE_SPEED_FACTOR = 3 / 384; // Speed relative to width
export const PIPE_SPAWN_RATE = 100; // frames, can remain constant

export const COIN_SIZE_PERCENT = 24 / 384;
export const COIN_SPAWN_CHANCE = 0.5;
