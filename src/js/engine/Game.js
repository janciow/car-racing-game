/**
 * Main Game Engine class that manages the game loop, entities, and systems
 */
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.entities = new Map();
    this.systems = [];
    this.isRunning = false;
    this.lastFrameTime = 0;
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
    
    // Game state
    this.currentScene = null;
    this.nextEntityId = 0;
    
    // Bind methods to preserve 'this' context
    this.gameLoop = this.gameLoop.bind(this);
  }

  /**
   * Initialize the game engine
   */
  async init() {
    console.log('Initializing game engine...');
    
    // Set up canvas context settings
    this.ctx.imageSmoothingEnabled = false; // For pixel art
    
    // Initialize systems (will be added later)
    this.systems.forEach(system => {
      if (system.init) {
        system.init();
      }
    });
    
    console.log('Game engine initialized successfully');
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) {
      console.warn('Game is already running');
      return;
    }
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    console.log('Starting game...');
    
    // Use requestAnimationFrame for smooth animation
    requestAnimationFrame(this.gameLoop);
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.isRunning = false;
    console.log('Game stopped');
  }

  /**
   * Main game loop using requestAnimationFrame with frame rate limiting
   */
  gameLoop(currentTime) {
    if (!this.isRunning) {
      return;
    }

    const deltaTime = currentTime - this.lastFrameTime;
    
    // Limit frame rate
    if (deltaTime >= this.frameInterval) {
      const dt = deltaTime / 1000; // Convert to seconds
      
      this.update(dt);
      this.render();
      
      this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);
    }

    requestAnimationFrame(this.gameLoop);
  }

  /**
   * Update game logic
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  update(deltaTime) {
    // Update current scene if exists
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(deltaTime);
    }

    // Update all systems
    this.systems.forEach(system => {
      if (system.update) {
        system.update(deltaTime, this.entities);
      }
    });
  }

  /**
   * Render the game
   */
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render current scene if exists
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(this.ctx);
    }

    // Render all systems
    this.systems.forEach(system => {
      if (system.render) {
        system.render(this.ctx, this.entities);
      }
    });
  }

  /**
   * Add an entity to the game
   * @param {Object} entity - The entity to add
   * @returns {number} The entity ID
   */
  addEntity(entity) {
    const id = this.nextEntityId++;
    entity.id = id;
    this.entities.set(id, entity);
    
    console.log(`Added entity with ID: ${id}`);
    return id;
  }

  /**
   * Remove an entity from the game
   * @param {number} entityId - The ID of the entity to remove
   */
  removeEntity(entityId) {
    if (this.entities.has(entityId)) {
      this.entities.delete(entityId);
      console.log(`Removed entity with ID: ${entityId}`);
    }
  }

  /**
   * Get an entity by ID
   * @param {number} entityId - The entity ID
   * @returns {Object|undefined} The entity or undefined if not found
   */
  getEntity(entityId) {
    return this.entities.get(entityId);
  }

  /**
   * Get all entities with a specific component
   * @param {string} componentName - The component name to filter by
   * @returns {Array} Array of entities with the specified component
   */
  getEntitiesWithComponent(componentName) {
    const result = [];
    this.entities.forEach(entity => {
      if (entity.hasComponent && entity.hasComponent(componentName)) {
        result.push(entity);
      }
    });
    return result;
  }

  /**
   * Add a system to the game
   * @param {Object} system - The system to add
   */
  addSystem(system) {
    this.systems.push(system);
    
    // Initialize system if game is already running
    if (this.isRunning && system.init) {
      system.init();
    }
    
    console.log(`Added system: ${system.constructor.name}`);
  }

  /**
   * Remove a system from the game
   * @param {Object} system - The system to remove
   */
  removeSystem(system) {
    const index = this.systems.indexOf(system);
    if (index > -1) {
      this.systems.splice(index, 1);
      console.log(`Removed system: ${system.constructor.name}`);
    }
  }

  /**
   * Set the current scene
   * @param {Object} scene - The scene to set as current
   */
  setScene(scene) {
    // Clean up previous scene
    if (this.currentScene && this.currentScene.cleanup) {
      this.currentScene.cleanup();
    }
    
    this.currentScene = scene;
    
    // Initialize new scene
    if (this.currentScene && this.currentScene.init) {
      this.currentScene.init(this);
    }
    
    console.log(`Set scene: ${scene.constructor.name}`);
  }

  /**
   * Get canvas dimensions
   * @returns {Object} Width and height of the canvas
   */
  getCanvasSize() {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  /**
   * Resize the canvas
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    console.log(`Canvas resized to ${width}x${height}`);
  }
}