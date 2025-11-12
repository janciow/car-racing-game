import { System } from './index.js';
import { GameConfig, TRACK_GRID } from '../config/GameConfig.js';

/**
 * Track Rendering System - Handles rendering the game track
 */
export class TrackRenderSystem extends System {
  constructor(trackAssets) {
    super();
    this.trackAssets = trackAssets; // Object containing track tile images
    this.priority = -10; // Render before everything else (background)
    
    console.log('TrackRenderSystem constructor called with assets:', trackAssets);
    console.log('Track asset keys:', Object.keys(trackAssets || {}));
    
    // Create tile lookup for rendering
    this.tileImages = this.createTileImageMap();
    
    console.log('Created tile image map with', this.tileImages.size, 'entries');
  }

  /**
   * Create a map of track types to images
   * @returns {Map} Map of track type -> image
   */
  createTileImageMap() {
    const tileMap = new Map();
    
    console.log('Creating tile image map, trackAssets:', this.trackAssets);
    
    if (this.trackAssets) {
      // Helper function to create Image element from webpack import
      function createImageFromImport(importPath) {
        console.log('Creating image from path:', importPath);
        const img = new Image();
        img.src = importPath;
        return img;
      }
      
      console.log('Available track assets:');
      console.log('- TRACK_ROAD:', this.trackAssets.TRACK_ROAD);
      console.log('- TRACK_WALL:', this.trackAssets.TRACK_WALL);
      console.log('- TRACK_GOAL:', this.trackAssets.TRACK_GOAL);
      console.log('- TRACK_FLAG:', this.trackAssets.TRACK_FLAG);
      console.log('- TRACK_TREE:', this.trackAssets.TRACK_TREE);
      
      tileMap.set(GameConfig.TRACK.TYPES.ROAD, createImageFromImport(this.trackAssets.TRACK_ROAD));
      tileMap.set(GameConfig.TRACK.TYPES.WALL, createImageFromImport(this.trackAssets.TRACK_WALL));
      tileMap.set(GameConfig.TRACK.TYPES.GOAL, createImageFromImport(this.trackAssets.TRACK_GOAL));
      tileMap.set(GameConfig.TRACK.TYPES.FLAG, createImageFromImport(this.trackAssets.TRACK_FLAG));
      tileMap.set(GameConfig.TRACK.TYPES.TREE, createImageFromImport(this.trackAssets.TRACK_TREE));
      // Player start positions are rendered as road
      tileMap.set(GameConfig.TRACK.TYPES.PLAYER_START, createImageFromImport(this.trackAssets.TRACK_ROAD));
    } else {
      console.warn('No track assets provided to TrackRenderSystem');
    }
    
    return tileMap;
  }

  /**
   * Render the track
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Map} entities 
   */
  render(ctx, entities) {
    if (!this.active) return;

    this.renderTrackGrid(ctx);
    
    // Optionally render debug grid
    if (GameConfig.DEBUG.SHOW_COLLISION_BOXES) {
      this.renderDebugGrid(ctx);
    }
  }

  /**
   * Render the track grid
   * @param {CanvasRenderingContext2D} ctx 
   */
  renderTrackGrid(ctx) {
    let arrayIndex = 0;
    let drawX = 0;
    let drawY = 0;

    for (let row = 0; row < GameConfig.TRACK.ROWS; row++) {
      for (let col = 0; col < GameConfig.TRACK.COLS; col++) {
        const tileType = TRACK_GRID[arrayIndex];
        const tileImage = this.tileImages.get(tileType);

        if (tileImage) {
          ctx.drawImage(
            tileImage,
            drawX,
            drawY,
            GameConfig.TRACK.TILE_WIDTH,
            GameConfig.TRACK.TILE_HEIGHT
          );
        } else {
          // Fallback: draw colored rectangle
          this.drawFallbackTile(ctx, tileType, drawX, drawY);
        }

        drawX += GameConfig.TRACK.TILE_WIDTH;
        arrayIndex++;
      }
      
      drawY += GameConfig.TRACK.TILE_HEIGHT;
      drawX = 0;
    }
  }

  /**
   * Draw fallback colored tile when image is missing
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} tileType 
   * @param {number} x 
   * @param {number} y 
   */
  drawFallbackTile(ctx, tileType, x, y) {
    let color = '#808080'; // Default gray

    switch (tileType) {
      case GameConfig.TRACK.TYPES.ROAD:
      case GameConfig.TRACK.TYPES.PLAYER_START:
        color = '#404040'; // Dark gray
        break;
      case GameConfig.TRACK.TYPES.WALL:
        color = '#8B4513'; // Brown
        break;
      case GameConfig.TRACK.TYPES.GOAL:
        color = '#FFD700'; // Gold
        break;
      case GameConfig.TRACK.TYPES.FLAG:
        color = '#FF0000'; // Red
        break;
      case GameConfig.TRACK.TYPES.TREE:
        color = '#228B22'; // Green
        break;
    }

    ctx.fillStyle = color;
    ctx.fillRect(x, y, GameConfig.TRACK.TILE_WIDTH, GameConfig.TRACK.TILE_HEIGHT);
  }

  /**
   * Render debug grid overlay
   * @param {CanvasRenderingContext2D} ctx 
   */
  renderDebugGrid(ctx) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let col = 0; col <= GameConfig.TRACK.COLS; col++) {
      const x = col * GameConfig.TRACK.TILE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GameConfig.TRACK.ROWS * GameConfig.TRACK.TILE_HEIGHT);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let row = 0; row <= GameConfig.TRACK.ROWS; row++) {
      const y = row * GameConfig.TRACK.TILE_HEIGHT;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GameConfig.TRACK.COLS * GameConfig.TRACK.TILE_WIDTH, y);
      ctx.stroke();
    }

    // Draw grid coordinates
    if (GameConfig.DEBUG.SHOW_ENTITY_INFO) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';

      for (let row = 0; row < GameConfig.TRACK.ROWS; row++) {
        for (let col = 0; col < GameConfig.TRACK.COLS; col++) {
          const x = col * GameConfig.TRACK.TILE_WIDTH + GameConfig.TRACK.TILE_WIDTH / 2;
          const y = row * GameConfig.TRACK.TILE_HEIGHT + GameConfig.TRACK.TILE_HEIGHT / 2;
          ctx.fillText(`${col},${row}`, x, y);
        }
      }
    }
  }

  /**
   * Update track assets
   * @param {Object} newAssets 
   */
  updateAssets(newAssets) {
    this.trackAssets = newAssets;
    this.tileImages = this.createTileImageMap();
    console.log('Track assets updated');
  }
}