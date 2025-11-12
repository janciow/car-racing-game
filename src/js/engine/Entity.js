/**
 * Base Entity class for the Entity-Component System
 * Entities are containers that hold components
 */
export class Entity {
  constructor() {
    this.id = null; // Will be set by the Game engine
    this.components = new Map();
    this.active = true;
    this.tags = new Set();
  }

  /**
   * Add a component to this entity
   * @param {string} componentName - The name/type of the component
   * @param {Object} component - The component instance
   * @returns {Entity} This entity for method chaining
   */
  addComponent(componentName, component) {
    this.components.set(componentName, component);
    
    // Set reference to parent entity in component if it doesn't exist
    if (!component.entity) {
      component.entity = this;
    }
    
    return this;
  }

  /**
   * Remove a component from this entity
   * @param {string} componentName - The name/type of the component to remove
   * @returns {Entity} This entity for method chaining
   */
  removeComponent(componentName) {
    const component = this.components.get(componentName);
    
    if (component) {
      // Clean up component if it has a cleanup method
      if (component.cleanup) {
        component.cleanup();
      }
      
      this.components.delete(componentName);
    }
    
    return this;
  }

  /**
   * Get a component from this entity
   * @param {string} componentName - The name/type of the component
   * @returns {Object|undefined} The component or undefined if not found
   */
  getComponent(componentName) {
    return this.components.get(componentName);
  }

  /**
   * Check if this entity has a specific component
   * @param {string} componentName - The name/type of the component
   * @returns {boolean} True if the entity has the component
   */
  hasComponent(componentName) {
    return this.components.has(componentName);
  }

  /**
   * Check if this entity has all specified components
   * @param {Array<string>} componentNames - Array of component names
   * @returns {boolean} True if the entity has all components
   */
  hasComponents(componentNames) {
    return componentNames.every(name => this.hasComponent(name));
  }

  /**
   * Get all component names for this entity
   * @returns {Array<string>} Array of component names
   */
  getComponentNames() {
    return Array.from(this.components.keys());
  }

  /**
   * Add a tag to this entity
   * @param {string} tag - The tag to add
   * @returns {Entity} This entity for method chaining
   */
  addTag(tag) {
    this.tags.add(tag);
    return this;
  }

  /**
   * Remove a tag from this entity
   * @param {string} tag - The tag to remove
   * @returns {Entity} This entity for method chaining
   */
  removeTag(tag) {
    this.tags.delete(tag);
    return this;
  }

  /**
   * Check if this entity has a specific tag
   * @param {string} tag - The tag to check for
   * @returns {boolean} True if the entity has the tag
   */
  hasTag(tag) {
    return this.tags.has(tag);
  }

  /**
   * Get all tags for this entity
   * @returns {Array<string>} Array of tags
   */
  getTags() {
    return Array.from(this.tags);
  }

  /**
   * Set the active state of this entity
   * @param {boolean} active - Whether the entity should be active
   */
  setActive(active) {
    this.active = active;
  }

  /**
   * Check if this entity is active
   * @returns {boolean} True if the entity is active
   */
  isActive() {
    return this.active;
  }

  /**
   * Update method called by systems
   * Override in derived classes if needed
   * @param {number} deltaTime - Time elapsed since last frame
   */
  update(deltaTime) {
    // Update all components that have an update method
    this.components.forEach(component => {
      if (component.update && typeof component.update === 'function') {
        component.update(deltaTime);
      }
    });
  }

  /**
   * Cleanup method for when entity is destroyed
   * Override in derived classes if needed
   */
  cleanup() {
    // Cleanup all components
    this.components.forEach(component => {
      if (component.cleanup && typeof component.cleanup === 'function') {
        component.cleanup();
      }
    });
    
    // Clear all references
    this.components.clear();
    this.tags.clear();
  }

  /**
   * Create a string representation of this entity
   * Useful for debugging
   * @returns {string} String representation
   */
  toString() {
    const componentNames = this.getComponentNames();
    const tags = this.getTags();
    
    return `Entity(id: ${this.id}, components: [${componentNames.join(', ')}], tags: [${tags.join(', ')}], active: ${this.active})`;
  }
}

/**
 * Factory function to create entities with specific components
 * @param {Object} componentConfig - Configuration object with component definitions
 * @returns {Entity} The created entity
 * 
 * Example usage:
 * const car = createEntity({
 *   Transform: { x: 100, y: 100, rotation: 0 },
 *   Physics: { velocity: { x: 0, y: 0 }, speed: 0 },
 *   Sprite: { image: carImage, width: 32, height: 32 }
 * });
 */
export function createEntity(componentConfig = {}) {
  const entity = new Entity();
  
  // Add components based on configuration
  Object.entries(componentConfig).forEach(([componentName, componentData]) => {
    // Import and create component dynamically if needed
    // For now, we'll just add the data as the component
    entity.addComponent(componentName, componentData);
  });
  
  return entity;
}