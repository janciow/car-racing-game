import { Entity } from '../engine/Entity.js';
import { Transform, Physics, Sprite } from '../components/index.js';
import { GameConfig, worldToGrid, isObstacle } from '../config/GameConfig.js';

/**
 * Input Component for car controls
 */
export class CarInput {
  constructor(keyBindings) {
    this.entity = null;
    this.keyBindings = keyBindings; // { up, down, left, right }
    
    // Input state
    this.gasPressed = false;
    this.reversePressed = false;
    this.leftPressed = false;
    this.rightPressed = false;
  }

  /**
   * Update input component
   * @param {number} deltaTime 
   * @param {InputManager} inputManager 
   */
  update(deltaTime, inputManager) {
    if (!this.entity || !inputManager) return;

    // Read input states
    this.gasPressed = inputManager.isActionDown(this.keyBindings.up);
    this.reversePressed = inputManager.isActionDown(this.keyBindings.down);
    this.leftPressed = inputManager.isActionDown(this.keyBindings.left);
    this.rightPressed = inputManager.isActionDown(this.keyBindings.right);

    // Apply input to physics component
    if (this.entity.hasComponent('Physics')) {
      this.applyInputToPhysics();
    }
  }

    /**
   * Apply current input state to the physics component
   */
  applyInputToPhysics() {
    const physics = this.entity.getComponent('Physics');
    const transform = this.entity.getComponent('Transform');
    
    if (!physics || !transform) return;

    const config = GameConfig.CAR.PHYSICS;
    
    // Apply driving forces
    if (this.gasPressed) {
      const forceX = Math.cos(transform.rotation) * config.DRIVE_POWER;
      const forceY = Math.sin(transform.rotation) * config.DRIVE_POWER;
      physics.applyForce(forceX, forceY);
    }
    
    if (this.reversePressed) {
      // Proper braking/reverse logic
      if (physics.speed > 2) {
        // If moving forward significantly, apply braking force
        physics.speed *= config.ACTIVE_BRAKE_POWER; // Strong braking
      } else if (physics.speed > -1) {
        // If nearly stopped or moving slowly, allow reverse
        const forceX = -Math.cos(transform.rotation) * config.REVERSE_POWER;
        const forceY = -Math.sin(transform.rotation) * config.REVERSE_POWER;
        physics.applyForce(forceX, forceY);
      }
    }
    
    // Apply extra braking when no input is pressed
    if (!this.gasPressed && !this.reversePressed) {
      // Apply stronger friction when coasting
      physics.speed *= config.BRAKE_POWER; // Use config value for coasting brake
    }

    // Apply turning - allow turning even when stationary
    if (this.leftPressed) {
      transform.rotate(-config.TURN_RATE);
    }
    if (this.rightPressed) {
      transform.rotate(config.TURN_RATE);
    }

    // Update physics direction to match car rotation
    physics.setDirection(Math.cos(transform.rotation), Math.sin(transform.rotation));
  }
}

/**
 * Car Physics Component - extends base Physics with car-specific behavior
 */
export class CarPhysics extends Physics {
  constructor() {
    super();
    
    const config = GameConfig.CAR.PHYSICS;
    this.maxSpeed = config.MAX_SPEED;
    this.friction = config.GROUND_SPEED_DECAY;
    
    // Add startup grace period to avoid collision issues at start
    this.startupTime = 0;
    this.startupGracePeriod = 2000; // 2 seconds grace period
    this.hasMovedFromStart = false;
    this.startPosition = null;
  }

  /**
   * Update physics with collision detection
   * @param {number} deltaTime 
   */
  update(deltaTime) {
    // Store previous position for collision response
    if (this.entity && this.entity.hasComponent('Transform')) {
      const transform = this.entity.getComponent('Transform');
      
      // Initialize start position on first update
      if (!this.startPosition) {
        this.startPosition = {
          x: transform.position.x,
          y: transform.position.y
        };
      }
      
      // Check if car has moved significantly from start
      const distanceFromStart = Math.sqrt(
        Math.pow(transform.position.x - this.startPosition.x, 2) + 
        Math.pow(transform.position.y - this.startPosition.y, 2)
      );
      
      if (distanceFromStart > 20) { // 20 pixels away from start
        this.hasMovedFromStart = true;
      }
      
      this.previousPosition = {
        x: transform.position.x,
        y: transform.position.y
      };
    }

    // Update startup timer
    this.startupTime += deltaTime * 1000; // Convert to milliseconds

    // Update physics normally
    super.update(deltaTime);

    // Only check collisions after grace period AND after moving from start
    if (this.startupTime > this.startupGracePeriod && this.hasMovedFromStart) {
      this.checkTrackCollision();
    }
  }

  /**
   * Check collision with track obstacles
   */
  checkTrackCollision() {
    if (!this.entity || !this.entity.hasComponent('Transform')) return;

    const transform = this.entity.getComponent('Transform');
    const gridPos = worldToGrid(transform.position.x, transform.position.y);

    // Check if current position is an obstacle
    if (isObstacle(gridPos.col, gridPos.row)) {
      // Collision detected - revert to previous position and reduce speed
      if (this.previousPosition) {
        transform.setPosition(this.previousPosition.x, this.previousPosition.y);
      }
      
      // Apply bounce effect - but not too harsh
      this.speed *= GameConfig.CAR.PHYSICS.COLLISION_BOUNCE;
      
      console.log('Collision detected at grid position:', gridPos, 'speed reduced to:', this.speed);
    }
  }
}

/**
 * Factory function to create a car entity
 * @param {HTMLImageElement} carImage - Car sprite image
 * @param {Object} startPosition - Starting position {x, y, angle}
 * @param {Object} keyBindings - Key bindings for controls
 * @returns {Entity} Car entity
 */
export function createCar(carImage, startPosition, keyBindings) {
  const car = new Entity();
  
  // Add Transform component
  const transform = new Transform(
    startPosition.x,
    startPosition.y,
    startPosition.angle
  );
  car.addComponent('Transform', transform);

  // Add Physics component (car-specific)
  const physics = new CarPhysics();
  car.addComponent('Physics', physics);

  // Add Sprite component
  const sprite = new Sprite(
    carImage,
    GameConfig.CAR.SIZE.WIDTH,
    GameConfig.CAR.SIZE.HEIGHT
  );
  car.addComponent('Sprite', sprite);

  // Add Input component
  const input = new CarInput(keyBindings);
  car.addComponent('Input', input);

  // Tag the entity as a car
  car.addTag('car');
  car.addTag('player');

  return car;
}

/**
 * Factory function to create player cars with predefined settings
 * @param {Object} assets - Loaded game assets (webpack imports)
 * @param {Array} startPositions - Array of start positions
 * @returns {Array} Array of car entities
 */
export function createPlayerCars(assets, startPositions) {
  const cars = [];

  console.log('Creating player cars with assets:', assets);
  console.log('Assets type:', typeof assets);
  console.log('Assets keys:', assets ? Object.keys(assets) : 'assets is null/undefined');
  console.log('Start positions:', startPositions);

  // Ensure assets exists
  if (!assets) {
    console.error('No assets provided to createPlayerCars!');
    return cars;
  }

  // Helper function to create Image element from webpack import
  function createImageFromImport(importPath) {
    const img = new Image();
    img.src = importPath;
    return img;
  }

  // Player 1 car (green)
  if (startPositions[0]) {
    const carAssetPath = assets.PLAYER1_CAR;
    console.log('Player 1 car asset path:', carAssetPath);
    
    if (carAssetPath) {
      const carImage = createImageFromImport(carAssetPath);
      
      const player1Actions = {
        up: 'player1Up',
        down: 'player1Down',
        left: 'player1Left',
        right: 'player1Right'
      };
      
      const player1Car = createCar(carImage, startPositions[0], player1Actions);
      player1Car.addTag('player1');
      cars.push(player1Car);
      console.log('Created Player 1 car');
    } else {
      console.warn('Player 1 car asset not found. Available assets:', Object.keys(assets));
    }
  } else {
    console.warn('Player 1 start position not available');
  }

  // Player 2 car (blue)
  if (startPositions[1]) {
    const carAssetPath = assets.PLAYER2_CAR;
    console.log('Player 2 car asset path:', carAssetPath);
    
    if (carAssetPath) {
      const carImage = createImageFromImport(carAssetPath);
      
      const player2Actions = {
        up: 'player2Up',
        down: 'player2Down',
        left: 'player2Left',
        right: 'player2Right'
      };
      
      const player2Car = createCar(carImage, startPositions[1], player2Actions);
      player2Car.addTag('player2');
      cars.push(player2Car);
      console.log('Created Player 2 car');
    } else {
      console.warn('Player 2 car asset not found. Available assets:', Object.keys(assets));
    }
  } else {
    console.warn('Player 2 start position not available');
  }

  console.log(`Created ${cars.length} player cars`);
  return cars;
}