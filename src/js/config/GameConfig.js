/**
 * Game Configuration
 * Centralized configuration for all game settings
 */

// Import asset paths
import player1car from './../../img/player1car.png';
import player2car from './../../img/player2car.png';
import trackRoad from './../../img/track_road.png';
import trackWall from './../../img/track_wall.png';
import trackGoal from './../../img/track_goal.png';
import trackFlag from './../../img/track_flag.png';
import trackTree from './../../img/track_tree.png';

export const GameConfig = {
  // Canvas settings
  CANVAS: {
    WIDTH: 800,
    HEIGHT: 600,
    BACKGROUND_COLOR: 'black'
  },

  // Game loop settings
  GAME_LOOP: {
    TARGET_FPS: 60,
    MAX_DELTA_TIME: 0.1 // Maximum delta time to prevent large jumps
  },

  // Track configuration
  TRACK: {
    TILE_WIDTH: 40,
    TILE_HEIGHT: 40,
    GAP: 2,
    COLS: 20,
    ROWS: 15,
    
    // Track tile types
    TYPES: {
      ROAD: 0,
      WALL: 1,
      PLAYER_START: 2,
      GOAL: 3,
      TREE: 4,
      FLAG: 5
    }
  },

  // Car physics parameters
  CAR: {
    PHYSICS: {
      GROUND_SPEED_DECAY: 0.95,  // Reduced from 0.99 to 0.95 for better braking
      DRIVE_POWER: 100.0,  // Much higher drive power
      REVERSE_POWER: 50.0,  // Higher reverse power
      BRAKE_POWER: 0.92,   // Additional braking when coasting
      ACTIVE_BRAKE_POWER: 0.85, // Strong braking when pressing S while moving forward
      TURN_RATE: 0.06,
      MIN_SPEED_TO_TURN: 0,
      MAX_SPEED: 200.0,  // High max speed
      COLLISION_BOUNCE: -0.1  // Reduced from -0.5 to be less punishing
    },
    
    // Car dimensions
    SIZE: {
      WIDTH: 32,
      HEIGHT: 16
    },

    // Starting positions
    START: {
      ANGLE: Math.PI / 2 // 90 degrees
    }
  },

  // Player input configuration
  INPUT: {
    PLAYER1: {
      UP: 'KeyW',
      DOWN: 'KeyS', 
      LEFT: 'KeyA',
      RIGHT: 'KeyD'
    },
    
    PLAYER2: {
      UP: 'ArrowUp',
      DOWN: 'ArrowDown',
      LEFT: 'ArrowLeft',
      RIGHT: 'ArrowRight'
    }
  },

  // Asset configuration
  ASSETS: {
    IMAGES: {
      // Car sprites
      PLAYER1_CAR: player1car,
      PLAYER2_CAR: player2car,
      
      // Track tiles
      TRACK_ROAD: trackRoad,
      TRACK_WALL: trackWall,
      TRACK_GOAL: trackGoal,
      TRACK_FLAG: trackFlag,
      TRACK_TREE: trackTree
    }
  },

  // UI configuration
  UI: {
    LOADING_SCREEN: {
      BACKGROUND_COLOR: 'black',
      TEXT_COLOR: 'white',
      TEXT_SIZE: '24px',
      TEXT_FONT: 'Arial'
    },
    
    HUD: {
      TEXT_COLOR: 'white',
      TEXT_SIZE: '16px',
      TEXT_FONT: 'Arial'
    }
  },

  // Debug settings
  DEBUG: {
    SHOW_FPS: false,
    SHOW_COLLISION_BOXES: false,
    SHOW_ENTITY_INFO: false,
    LOG_LEVEL: 'debug' // 'debug', 'info', 'warn', 'error'
  }
};

// Track layout data
export const TRACK_GRID = [
  1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1,
  1,0,3,0,0, 0,0,0,0,0, 0,0,0,0,1, 4,0,0,0,1,
  1,0,3,0,0, 0,0,0,0,0, 0,0,0,0,1, 4,2,2,0,1,
  1,4,1,1,1, 1,1,1,1,1, 1,0,0,0,1, 1,0,0,0,1,
  1,1,1,0,0, 1,4,4,0,1, 0,0,0,0,0, 1,0,0,0,1,

  1,0,0,0,0, 0,0,0,0,5, 0,0,0,0,1, 1,0,0,0,1,
  1,0,0,0,0, 0,0,0,0,0, 0,0,0,0,1, 1,0,0,0,1,
  1,0,0,5,0, 0,0,0,0,0, 0,0,0,0,1, 1,0,0,0,1,
  1,0,0,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,0,0,0,1,
  1,0,0,0,0, 1,0,0,0,0, 0,0,0,0,1, 1,0,0,0,1,

  1,0,0,0,0, 1,0,0,0,0, 0,0,0,0,0, 1,0,0,0,1,
  1,0,0,0,0, 5,0,0,0,5, 0,0,0,0,0, 5,0,0,0,1,
  1,0,0,0,0, 0,0,0,0,1, 0,0,0,0,0, 0,0,0,0,1,
  1,0,0,0,0, 0,0,0,0,1, 1,0,0,0,0, 0,0,0,0,1,
  1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1
];

/**
 * Utility function to get track tile type at grid position
 * @param {number} col - Column index
 * @param {number} row - Row index
 * @returns {number} Track tile type
 */
export function getTrackTileAt(col, row) {
  if (col < 0 || col >= GameConfig.TRACK.COLS || row < 0 || row >= GameConfig.TRACK.ROWS) {
    return GameConfig.TRACK.TYPES.WALL; // Out of bounds is considered wall
  }
  
  const index = row * GameConfig.TRACK.COLS + col;
  return TRACK_GRID[index];
}

/**
 * Check if a track position is an obstacle (not road)
 * @param {number} col - Column index
 * @param {number} row - Row index
 * @returns {boolean} True if position is an obstacle
 */
export function isObstacle(col, row) {
  const tileType = getTrackTileAt(col, row);
  return tileType !== GameConfig.TRACK.TYPES.ROAD;
}

/**
 * Convert world coordinates to grid coordinates
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @returns {Object} Grid coordinates {col, row}
 */
export function worldToGrid(x, y) {
  return {
    col: Math.floor(x / GameConfig.TRACK.TILE_WIDTH),
    row: Math.floor(y / GameConfig.TRACK.TILE_HEIGHT)
  };
}

/**
 * Convert grid coordinates to world coordinates (center of tile)
 * @param {number} col - Column index
 * @param {number} row - Row index
 * @returns {Object} World coordinates {x, y}
 */
export function gridToWorld(col, row) {
  return {
    x: col * GameConfig.TRACK.TILE_WIDTH + GameConfig.TRACK.TILE_WIDTH / 2,
    y: row * GameConfig.TRACK.TILE_HEIGHT + GameConfig.TRACK.TILE_HEIGHT / 2
  };
}

/**
 * Find player start positions on the track
 * @returns {Array} Array of start positions {x, y, angle}
 */
export function getPlayerStartPositions() {
  const startPositions = [];
  
  for (let row = 0; row < GameConfig.TRACK.ROWS; row++) {
    for (let col = 0; col < GameConfig.TRACK.COLS; col++) {
      if (getTrackTileAt(col, row) === GameConfig.TRACK.TYPES.PLAYER_START) {
        const worldPos = gridToWorld(col, row);
        startPositions.push({
          x: worldPos.x,
          y: worldPos.y,
          angle: GameConfig.CAR.START.ANGLE
        });
      }
    }
  }
  
  return startPositions;
}

/**
 * Utility function to create asset configurations for the AssetManager
 * @param {Object} imagePaths - Object with image paths
 * @returns {Object} Asset configuration object
 */
export function createAssetConfig(imagePaths) {
  return {
    images: imagePaths
  };
}