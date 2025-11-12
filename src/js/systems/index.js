/**
 * Base System class
 * All systems should extend this class
 */
export class System {
  constructor() {
    this.name = this.constructor.name;
    this.active = true;
    this.priority = 0; // Lower numbers run first
  }

  /**
   * Initialize the system
   */
  init() {
    // Override in derived classes
  }

  /**
   * Update the system
   * @param {number} deltaTime - Time elapsed since last frame
   * @param {Map} entities - Map of all entities
   */
  update(deltaTime, entities) {
    if (!this.active) return;
    // Override in derived classes
  }

  /**
   * Render the system
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Map} entities - Map of all entities
   */
  render(ctx, entities) {
    if (!this.active) return;
    // Override in derived classes
  }

  /**
   * Cleanup the system
   */
  cleanup() {
    // Override in derived classes
  }

  /**
   * Set system active state
   * @param {boolean} active 
   */
  setActive(active) {
    this.active = active;
  }

  /**
   * Check if system is active
   * @returns {boolean}
   */
  isActive() {
    return this.active;
  }
}

/**
 * Movement System - Handles entity movement based on Transform and Physics components
 */
export class MovementSystem extends System {
  constructor() {
    super();
    this.priority = 10;
  }

  update(deltaTime, entities) {
    if (!this.active) return;

    entities.forEach(entity => {
      if (entity.hasComponents(['Transform', 'Physics']) && entity.isActive()) {
        const transform = entity.getComponent('Transform');
        const physics = entity.getComponent('Physics');

        // Update physics first
        physics.update(deltaTime);
        
        // Then update transform
        transform.update(deltaTime);
      }
    });
  }
}

/**
 * Render System - Handles rendering of sprites
 */
export class RenderSystem extends System {
  constructor() {
    super();
    this.priority = 100; // Render last
  }

  render(ctx, entities) {
    if (!this.active) return;

    // Sort entities by render order (z-index) if needed
    const renderableEntities = Array.from(entities.values()).filter(entity => 
      entity.hasComponents(['Transform', 'Sprite']) && entity.isActive()
    );

    renderableEntities.forEach(entity => {
      const transform = entity.getComponent('Transform');
      const sprite = entity.getComponent('Sprite');

      if (sprite.visible) {
        sprite.render(ctx, transform);
      }
    });
  }
}

/**
 * Input System - Handles input for entities with Input component
 */
export class InputSystem extends System {
  constructor(inputManager) {
    super();
    this.inputManager = inputManager;
    this.priority = 5; // Process input early
  }

  update(deltaTime, entities) {
    if (!this.active) return;

    entities.forEach(entity => {
      if (entity.hasComponent('Input') && entity.isActive()) {
        const input = entity.getComponent('Input');
        input.update(deltaTime, this.inputManager);
      }
    });
  }
}

/**
 * Collision System - Handles collision detection and response
 */
export class CollisionSystem extends System {
  constructor() {
    super();
    this.priority = 20; // After movement, before rendering
  }

  update(deltaTime, entities) {
    if (!this.active) return;

    // Get all entities with collision components
    const collidableEntities = Array.from(entities.values()).filter(entity => 
      entity.hasComponents(['Transform', 'Collider']) && entity.isActive()
    );

    // Check collisions between entities
    for (let i = 0; i < collidableEntities.length; i++) {
      for (let j = i + 1; j < collidableEntities.length; j++) {
        this.checkCollision(collidableEntities[i], collidableEntities[j]);
      }
    }
  }

  /**
   * Check collision between two entities
   * @param {Entity} entityA 
   * @param {Entity} entityB 
   */
  checkCollision(entityA, entityB) {
    const transformA = entityA.getComponent('Transform');
    const colliderA = entityA.getComponent('Collider');
    const transformB = entityB.getComponent('Transform');
    const colliderB = entityB.getComponent('Collider');

    // Simple AABB collision detection
    const boundsA = {
      left: transformA.position.x - colliderA.width / 2,
      right: transformA.position.x + colliderA.width / 2,
      top: transformA.position.y - colliderA.height / 2,
      bottom: transformA.position.y + colliderA.height / 2
    };

    const boundsB = {
      left: transformB.position.x - colliderB.width / 2,
      right: transformB.position.x + colliderB.width / 2,
      top: transformB.position.y - colliderB.height / 2,
      bottom: transformB.position.y + colliderB.height / 2
    };

    const isColliding = !(
      boundsA.right < boundsB.left ||
      boundsA.left > boundsB.right ||
      boundsA.bottom < boundsB.top ||
      boundsA.top > boundsB.bottom
    );

    if (isColliding) {
      this.handleCollision(entityA, entityB);
    }
  }

  /**
   * Handle collision response
   * @param {Entity} entityA 
   * @param {Entity} entityB 
   */
  handleCollision(entityA, entityB) {
    // Trigger collision events
    const colliderA = entityA.getComponent('Collider');
    const colliderB = entityB.getComponent('Collider');

    if (colliderA.onCollision) {
      colliderA.onCollision(entityB);
    }

    if (colliderB.onCollision) {
      colliderB.onCollision(entityA);
    }
  }
}