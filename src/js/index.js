/**
 * Main entry point for the Car Racing Game
 * Refactored to use modern architecture with Game Engine, Entity-Component System, and Scene Management
 */

import { Game } from './engine/Game.js';
import { LoadingScene, GameScene } from './scenes/index.js';
import { GameConfig } from './config/GameConfig.js';

// Global game instance
let game;

/**
 * Initialize the game
 */
async function initGame() {
  try {
    console.log('Initializing Car Racing Game...');
    
    // Get canvas element
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      throw new Error('Canvas element with id "gameCanvas" not found');
    }
    
    // Set canvas size from config
    canvas.width = GameConfig.CANVAS.WIDTH;
    canvas.height = GameConfig.CANVAS.HEIGHT;
    
    // Create game engine instance
    game = new Game(canvas);
    
    // Initialize game engine
    await game.init();
    
    // For now, skip the loading scene and go directly to the game with imported assets
    // The assets are already loaded by webpack
    const assets = GameConfig.ASSETS.IMAGES;
    console.log('GameConfig.ASSETS.IMAGES:', assets);
    console.log('GameConfig.ASSETS.IMAGES keys:', Object.keys(assets || {}));
    console.log('GameConfig.ASSETS.IMAGES.PLAYER1_CAR:', assets?.PLAYER1_CAR);
    
    onAssetsLoaded(assets);
    
    console.log('Game initialization complete');
    
  } catch (error) {
    console.error('Failed to initialize game:', error);
    showError('Failed to initialize game. Please refresh the page.');
  }
}

/**
 * Called when all assets are loaded
 * @param {Object} assets - Loaded game assets
 */
function onAssetsLoaded(assets) {
  console.log('Assets loaded, starting game scene...');
  console.log('onAssetsLoaded received assets:', assets);
  console.log('Asset keys:', Object.keys(assets || {}));
  console.log('Asset values:', assets);
  
  try {
    // Create and switch to game scene
    const gameScene = new GameScene();
    console.log('About to call gameScene.init with assets:', assets);
    gameScene.init(game, assets);
    game.setScene(gameScene);
    
    // Start game loop
    game.start();
    
    console.log('Game scene started successfully');
    
  } catch (error) {
    console.error('Failed to start game scene:', error);
    showError(`Failed to start game: ${error.message}`);
  }
}

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
  const canvas = game?.canvas || document.getElementById('gameCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Show error message
    ctx.fillStyle = '#FF0000';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Error!', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 20);
  }
}

/**
 * Handle window resize
 */
function handleResize() {
  // Could implement responsive canvas sizing here if needed
  console.log('Window resized');
}

/**
 * Clean up game resources
 */
function cleanup() {
  if (game) {
    game.stop();
    console.log('Game cleaned up');
  }
}

// Initialize game when page loads
window.addEventListener('load', initGame);

// Handle page unload
window.addEventListener('beforeunload', cleanup);

// Handle window resize (optional)
window.addEventListener('resize', handleResize);

// Export for debugging
if (GameConfig.DEBUG.LOG_LEVEL === 'debug') {
  window.game = game;
  console.log('Game instance available in window.game for debugging');
}
