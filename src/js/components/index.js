/**
 * Base Component class
 * All components should extend this class
 */
export class Component {
  constructor() {
    this.entity = null; // Will be set when added to an entity
  }

  /**
   * Initialize the component
   * Called when the component is first added to an entity
   */
  init() {
    // Override in derived classes
  }

  /**
   * Update the component
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  update(deltaTime) {
    // Override in derived classes
  }

  /**
   * Cleanup the component
   * Called when the component is removed from an entity
   */
  cleanup() {
    // Override in derived classes
  }
}

/**
 * Transform Component - handles position, rotation, and scale
 */
export class Transform extends Component {
  constructor(x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1) {
    super();
    this.position = { x, y };
    this.rotation = rotation; // in radians
    this.scale = { x: scaleX, y: scaleY };
    this.velocity = { x: 0, y: 0 }; // for movement
  }

  /**
   * Set position
   * @param {number} x 
   * @param {number} y 
   */
  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
  }

  /**
   * Move by offset
   * @param {number} dx 
   * @param {number} dy 
   */
  move(dx, dy) {
    this.position.x += dx;
    this.position.y += dy;
  }

  /**
   * Set rotation in radians
   * @param {number} rotation 
   */
  setRotation(rotation) {
    this.rotation = rotation;
  }

  /**
   * Rotate by angle in radians
   * @param {number} angle 
   */
  rotate(angle) {
    this.rotation += angle;
  }

  /**
   * Set scale
   * @param {number} x 
   * @param {number} y 
   */
  setScale(x, y = x) {
    this.scale.x = x;
    this.scale.y = y;
  }

  /**
   * Update position based on velocity
   * @param {number} deltaTime 
   */
  update(deltaTime) {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }
}

/**
 * Physics Component - handles movement and collision properties
 */
export class Physics extends Component {
  constructor(speed = 0, maxSpeed = 100, acceleration = 0, friction = 0.9) {
    super();
    this.speed = speed;
    this.maxSpeed = maxSpeed;
    this.acceleration = acceleration;
    this.friction = friction; // multiplier applied to speed each frame
    
    // Direction vector (normalized)
    this.direction = { x: 1, y: 0 };
    
    // Physics properties
    this.mass = 1;
    this.bounce = 0.5; // how much energy is retained on collision
    this.isStatic = false; // static objects don't move
  }

  /**
   * Apply force in a direction
   * @param {number} forceX 
   * @param {number} forceY 
   */
  applyForce(forceX, forceY) {
    if (!this.isStatic) {
      const magnitude = Math.sqrt(forceX * forceX + forceY * forceY);
      if (magnitude > 0) {
        // Don't change direction here, just accumulate acceleration
        this.acceleration += magnitude / this.mass;
      }
    }
  }

  /**
   * Set direction vector
   * @param {number} x 
   * @param {number} y 
   */
  setDirection(x, y) {
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude > 0) {
      this.direction.x = x / magnitude;
      this.direction.y = y / magnitude;
    }
  }

  /**
   * Update physics
   * @param {number} deltaTime 
   */
  update(deltaTime) {
    if (this.isStatic) return;

    // Apply acceleration
    this.speed += this.acceleration * deltaTime;
    
    // Apply friction
    this.speed *= this.friction;
    
    // Clamp to max speed
    this.speed = Math.min(this.speed, this.maxSpeed);
    
    // Update transform velocity if entity has transform component
    if (this.entity && this.entity.hasComponent('Transform')) {
      const transform = this.entity.getComponent('Transform');
      transform.velocity.x = this.direction.x * this.speed;
      transform.velocity.y = this.direction.y * this.speed;
    }
    
    // Reset acceleration for next frame
    this.acceleration = 0;
  }
}

/**
 * Sprite Component - handles rendering of images
 */
export class Sprite extends Component {
  constructor(image = null, width = 32, height = 32, offsetX = 0, offsetY = 0) {
    super();
    this.image = image;
    this.width = width;
    this.height = height;
    this.offset = { x: offsetX, y: offsetY }; // offset from entity position
    
    // Visual properties
    this.visible = true;
    this.opacity = 1;
    this.tint = null; // color tint to apply
    
    // Animation properties (for sprite sheets)
    this.frameX = 0;
    this.frameY = 0;
    this.frameWidth = width;
    this.frameHeight = height;
  }

  /**
   * Set the image to render
   * @param {HTMLImageElement} image 
   */
  setImage(image) {
    this.image = image;
  }

  /**
   * Set visibility
   * @param {boolean} visible 
   */
  setVisible(visible) {
    this.visible = visible;
  }

  /**
   * Set opacity (0-1)
   * @param {number} opacity 
   */
  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }

  /**
   * Set frame for sprite sheet animation
   * @param {number} frameX 
   * @param {number} frameY 
   */
  setFrame(frameX, frameY) {
    this.frameX = frameX;
    this.frameY = frameY;
  }

  /**
   * Render the sprite
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Transform} transform 
   */
  render(ctx, transform) {
    if (!this.visible || !this.image || this.opacity <= 0) {
      return;
    }

    ctx.save();
    
    // Apply opacity
    ctx.globalAlpha = this.opacity;
    
    // Transform to entity position
    ctx.translate(
      transform.position.x + this.offset.x, 
      transform.position.y + this.offset.y
    );
    
    // Apply rotation
    ctx.rotate(transform.rotation);
    
    // Apply scale
    ctx.scale(transform.scale.x, transform.scale.y);
    
    // Draw image centered on entity position
    if (this.frameWidth === this.width && this.frameHeight === this.height) {
      // Simple image draw
      ctx.drawImage(
        this.image,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    } else {
      // Sprite sheet draw
      ctx.drawImage(
        this.image,
        this.frameX * this.frameWidth,
        this.frameY * this.frameHeight,
        this.frameWidth,
        this.frameHeight,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    }
    
    ctx.restore();
  }
}