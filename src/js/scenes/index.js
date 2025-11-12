/**
 * Base Scene class
 * All scenes should extend this class
 */
export class Scene {
  constructor(name) {
    this.name = name;
    this.game = null;
    this.active = true;
  }

  /**
   * Initialize the scene
   * @param {Game} game - Reference to the game engine
   */
  init(game) {
    this.game = game;
    console.log(`Initialized scene: ${this.name}`);
  }

  /**
   * Update the scene
   * @param {number} deltaTime - Time elapsed since last frame
   */
  update(deltaTime) {
    // Override in derived classes
  }

  /**
   * Render the scene
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render(ctx) {
    // Override in derived classes
  }

  /**
   * Cleanup when leaving the scene
   */
  cleanup() {
    console.log(`Cleaning up scene: ${this.name}`);
  }

  /**
   * Handle scene activation
   */
  onActivate() {
    this.active = true;
    console.log(`Scene activated: ${this.name}`);
  }

  /**
   * Handle scene deactivation
   */
  onDeactivate() {
    this.active = false;
    console.log(`Scene deactivated: ${this.name}`);
  }
}

/**
 * Loading Scene - Shows loading progress
 */
export class LoadingScene extends Scene {
  constructor(assetConfig, onComplete) {
    super('Loading');
    this.assetConfig = assetConfig;
    this.onComplete = onComplete;
    this.progress = 0;
    this.loadingText = 'Loading...';
    this.assetManager = null;
  }

  /**
   * Initialize loading scene
   * @param {Game} game 
   */
  init(game) {
    super.init(game);
    
    // Import asset manager dynamically
    import('../managers/AssetManager.js').then(module => {
      this.assetManager = module.assetManager;
      this.startLoading();
    });
  }

  /**
   * Start loading assets
   */
  async startLoading() {
    if (!this.assetManager) {
      console.error('AssetManager not available!');
      return;
    }

    try {
      console.log('Starting asset loading with config:', this.assetConfig);
      console.log('Config.images:', this.assetConfig.images);
      
      // Set up progress callback
      this.assetManager.onProgress((loaded, total, progress) => {
        this.progress = progress;
        this.loadingText = `Loading... ${loaded}/${total} (${Math.round(progress)}%)`;
        console.log(`Loading progress: ${loaded}/${total} (${Math.round(progress)}%)`);
      });

      // Load assets
      console.log('Calling assetManager.preloadAssets...');
      const assets = await this.assetManager.preloadAssets(this.assetConfig);
      
      // Loading complete
      console.log('All assets loaded successfully');
      console.log('Loaded assets:', assets);
      console.log('Asset keys:', Object.keys(assets || {}));
      console.log('Asset values sample:', assets?.PLAYER1_CAR ? 'PLAYER1_CAR exists' : 'PLAYER1_CAR missing');
      this.loadingText = 'Loading Complete!';
      
      // Wait a moment then transition
      setTimeout(() => {
        if (this.onComplete) {
          console.log('Calling onComplete with assets:', assets);
          this.onComplete(assets);
        }
      }, 500);

    } catch (error) {
      console.error('Asset preload failed:', error);
      this.loadingText = 'Loading Failed!';
    }
  }

  /**
   * Render loading screen
   * @param {CanvasRenderingContext2D} ctx 
   */
  render(ctx) {
    const canvas = this.game.canvas;
    
    // Clear screen
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw loading text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.loadingText,
      canvas.width / 2,
      canvas.height / 2 - 100
    );

    // Show config info for debugging
    if (this.assetConfig) {
      ctx.fillStyle = '#CCCCCC';
      ctx.font = '14px Arial';
      ctx.fillText(
        `Config: ${JSON.stringify(this.assetConfig).substring(0, 100)}...`,
        canvas.width / 2,
        canvas.height / 2 - 70
      );
    }

    // Draw progress bar
    const barWidth = 300;
    const barHeight = 20;
    const barX = (canvas.width - barWidth) / 2;
    const barY = canvas.height / 2 - 30;

    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress
    ctx.fillStyle = '#00FF00';
    const progressWidth = (barWidth * this.progress) / 100;
    ctx.fillRect(barX, barY, progressWidth, barHeight);

    // Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Progress percentage
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.fillText(
      `${Math.round(this.progress)}%`,
      canvas.width / 2,
      barY + 40
    );
  }
}

/**
 * Game Scene - Main gameplay scene
 */
export class GameScene extends Scene {
  constructor() {
    super('Game');
    this.entities = [];
    this.systems = [];
    this.assets = null;
    this.inputManager = null; // Store reference to inputManager
  }

  /**
   * Initialize game scene with loaded assets
   * @param {Game} game 
   * @param {Object} assets 
   */
  init(game, assets) {
    super.init(game);
    this.assets = assets;
    
    console.log('GameScene.init() called with assets:', assets);
    console.log('Asset keys:', Object.keys(assets || {}));
    
    // Set up the game scene
    this.setupSystems();
    this.setupInput();
    
    // Delay entity creation to ensure all systems are ready
    setTimeout(() => {
      this.createEntities();
    }, 100);
    
    console.log('Game scene initialized');
  }

  /**
   * Set up game systems
   */
  setupSystems() {
    // Import and create systems
    import('../systems/index.js').then(module => {
      const { MovementSystem, RenderSystem, InputSystem } = module;
      
      // Import input manager
      import('../managers/InputManager.js').then(inputModule => {
        const { inputManager } = inputModule;
        
        // Create and add systems
        this.systems = [
          new InputSystem(inputManager),
          new MovementSystem(),
          new RenderSystem()
        ];
        
        // Add track rendering system
        import('../systems/TrackRenderSystem.js').then(trackModule => {
          const { TrackRenderSystem } = trackModule;
          // Import GameConfig to get assets directly instead of relying on passed assets
          import('../config/GameConfig.js').then(configModule => {
            const { GameConfig } = configModule;
            const trackAssets = GameConfig.ASSETS.IMAGES;
            console.log('Creating TrackRenderSystem with assets:', trackAssets);
            
            const trackSystem = new TrackRenderSystem(trackAssets);
            this.systems.unshift(trackSystem); // Add at beginning for background rendering
            
            // Sort systems by priority
            this.systems.sort((a, b) => a.priority - b.priority);
            
            console.log('Track rendering system added with assets:', Object.keys(trackAssets));
          });
        });
      });
    });
  }

  /**
   * Create game entities
   */
  createEntities() {
    console.log('createEntities called');
    
    // Import configuration and entities
    Promise.all([
      import('../config/GameConfig.js'),
      import('../entities/Car.js')
    ]).then(([configModule, carModule]) => {
      const { GameConfig, getPlayerStartPositions } = configModule;
      const { createPlayerCars } = carModule;
      
      // Use assets directly from GameConfig instead of relying on passed assets
      const assets = GameConfig.ASSETS.IMAGES;
      console.log('Using assets from GameConfig:', assets);
      console.log('Asset keys from GameConfig:', Object.keys(assets || {}));
      
      // Get start positions
      const startPositions = getPlayerStartPositions();
      console.log('Got start positions:', startPositions);
      
      // Create player cars
      console.log('Calling createPlayerCars with GameConfig assets');
      const cars = createPlayerCars(assets, startPositions);
      console.log('Created cars:', cars);
      
      // Add cars to game
      cars.forEach(car => {
        const entityId = this.game.addEntity(car);
        this.entities.push(entityId);
      });
      
      console.log('All cars added to game');
    }).catch(error => {
      console.error('Error creating entities:', error);
    });
  }

  /**
   * Set up input mappings
   */
  setupInput() {
    import('../managers/InputManager.js').then(module => {
      const { inputManager } = module;
      this.inputManager = inputManager; // Store reference for update method
      
      import('../config/GameConfig.js').then(configModule => {
        const { GameConfig } = configModule;
        
        // Initialize input manager
        inputManager.init(this.game.canvas);
        
        // Map player 1 controls
        inputManager.mapActions({
          'player1Up': GameConfig.INPUT.PLAYER1.UP,
          'player1Down': GameConfig.INPUT.PLAYER1.DOWN,
          'player1Left': GameConfig.INPUT.PLAYER1.LEFT,
          'player1Right': GameConfig.INPUT.PLAYER1.RIGHT
        });
        
        // Map player 2 controls
        inputManager.mapActions({
          'player2Up': GameConfig.INPUT.PLAYER2.UP,
          'player2Down': GameConfig.INPUT.PLAYER2.DOWN,
          'player2Left': GameConfig.INPUT.PLAYER2.LEFT,
          'player2Right': GameConfig.INPUT.PLAYER2.RIGHT
        });
        
        console.log('Input mappings configured:', {
          player1: {
            up: GameConfig.INPUT.PLAYER1.UP,
            down: GameConfig.INPUT.PLAYER1.DOWN,
            left: GameConfig.INPUT.PLAYER1.LEFT,
            right: GameConfig.INPUT.PLAYER1.RIGHT
          },
          player2: {
            up: GameConfig.INPUT.PLAYER2.UP,
            down: GameConfig.INPUT.PLAYER2.DOWN,
            left: GameConfig.INPUT.PLAYER2.LEFT,
            right: GameConfig.INPUT.PLAYER2.RIGHT
          }
        });
      });
    });
  }

  /**
   * Update game scene
   * @param {number} deltaTime 
   */
  update(deltaTime) {
    if (!this.active) return;

    // Update input manager first (must be done every frame)
    if (this.inputManager) {
      this.inputManager.update();
    }

    // Update systems
    this.systems.forEach(system => {
      if (system.update) {
        system.update(deltaTime, this.game.entities);
      }
    });
  }

  /**
   * Render game scene
   * @param {CanvasRenderingContext2D} ctx 
   */
  render(ctx) {
    if (!this.active) return;

    // Clear screen first
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

    // Show debug info about assets at the top of the screen
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    if (this.assets) {
      ctx.fillText(`Assets loaded: ${Object.keys(this.assets).join(', ')}`, 10, 30);
      ctx.fillText(`Entities: ${this.game.entities.size}`, 10, 50);
      ctx.fillText(`PLAYER1_CAR: ${this.assets.PLAYER1_CAR ? 'loaded' : 'missing'}`, 10, 70);
    } else {
      ctx.fillText('No assets loaded!', 10, 30);
    }

    // Render systems
    this.systems.forEach(system => {
      if (system.render) {
        system.render(ctx, this.game.entities);
      }
    });

    // Render debug info if enabled
    import('../config/GameConfig.js').then(configModule => {
      const { GameConfig } = configModule;
      if (GameConfig.DEBUG.SHOW_FPS) {
        this.renderDebugInfo(ctx);
      }
    });
  }

  /**
   * Render debug information
   * @param {CanvasRenderingContext2D} ctx 
   */
  renderDebugInfo(ctx) {
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Entities: ${this.game.entities.size}`, 10, 30);
    ctx.fillText(`Systems: ${this.systems.length}`, 10, 50);
  }

  /**
   * Cleanup game scene
   */
  cleanup() {
    super.cleanup();
    
    // Remove entities
    this.entities.forEach(entityId => {
      this.game.removeEntity(entityId);
    });
    this.entities = [];

    // Cleanup input manager
    import('../managers/InputManager.js').then(module => {
      const { inputManager } = module;
      inputManager.cleanup();
    });
  }
}