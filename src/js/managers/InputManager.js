/**
 * InputManager - Centralized input handling system
 * Manages keyboard and mouse input, with configurable key mappings
 */
export class InputManager {
  constructor() {
    this.keys = new Map(); // Current key states
    this.previousKeys = new Map(); // Previous frame key states
    this.keyMappings = new Map(); // Action -> key code mappings
    this.actionStates = new Map(); // Action -> state mappings
    
    // Mouse state
    this.mouse = {
      x: 0,
      y: 0,
      buttons: new Map(),
      previousButtons: new Map()
    };

    // Bind event handlers to preserve 'this' context
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);

    this.isEnabled = false;
  }

  /**
   * Initialize the input manager and start listening for events
   * @param {HTMLElement} element - Element to attach events to (usually canvas or window)
   */
  init(element = window) {
    if (this.isEnabled) {
      console.warn('InputManager is already initialized');
      return;
    }

    this.element = element;
    
    // Add keyboard event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    // Add mouse event listeners
    this.element.addEventListener('mousemove', this.handleMouseMove);
    this.element.addEventListener('mousedown', this.handleMouseDown);
    this.element.addEventListener('mouseup', this.handleMouseUp);
    this.element.addEventListener('contextmenu', this.handleContextMenu);

    this.isEnabled = true;
    console.log('InputManager initialized');
  }

  /**
   * Cleanup input manager and remove event listeners
   */
  cleanup() {
    if (!this.isEnabled) return;

    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    
    if (this.element) {
      this.element.removeEventListener('mousemove', this.handleMouseMove);
      this.element.removeEventListener('mousedown', this.handleMouseDown);
      this.element.removeEventListener('mouseup', this.handleMouseUp);
      this.element.removeEventListener('contextmenu', this.handleContextMenu);
    }

    this.isEnabled = false;
    console.log('InputManager cleaned up');
  }

  /**
   * Update input manager (call once per frame)
   */
  update() {
    // Update previous key states
    this.previousKeys.clear();
    this.keys.forEach((value, key) => {
      this.previousKeys.set(key, value);
    });

    // Update previous mouse button states
    this.mouse.previousButtons.clear();
    this.mouse.buttons.forEach((value, key) => {
      this.mouse.previousButtons.set(key, value);
    });

    // Update action states based on current key mappings
    this.actionStates.clear();
    this.keyMappings.forEach((keyCode, action) => {
      this.actionStates.set(action, this.isKeyDown(keyCode));
    });
  }

  /**
   * Handle key down event
   * @param {KeyboardEvent} event 
   */
  handleKeyDown(event) {
    this.keys.set(event.code, true);
    
    // Prevent default behavior for game keys
    if (this.isGameKey(event.code)) {
      event.preventDefault();
    }
  }

  /**
   * Handle key up event
   * @param {KeyboardEvent} event 
   */
  handleKeyUp(event) {
    this.keys.set(event.code, false);
    
    // Prevent default behavior for game keys
    if (this.isGameKey(event.code)) {
      event.preventDefault();
    }
  }

  /**
   * Handle mouse move event
   * @param {MouseEvent} event 
   */
  handleMouseMove(event) {
    const rect = this.element.getBoundingClientRect();
    this.mouse.x = event.clientX - rect.left;
    this.mouse.y = event.clientY - rect.top;
  }

  /**
   * Handle mouse down event
   * @param {MouseEvent} event 
   */
  handleMouseDown(event) {
    this.mouse.buttons.set(event.button, true);
    event.preventDefault();
  }

  /**
   * Handle mouse up event
   * @param {MouseEvent} event 
   */
  handleMouseUp(event) {
    this.mouse.buttons.set(event.button, false);
    event.preventDefault();
  }

  /**
   * Handle context menu event (prevent right-click menu)
   * @param {Event} event 
   */
  handleContextMenu(event) {
    event.preventDefault();
  }

  /**
   * Map an action to a key
   * @param {string} action - Action name (e.g., 'moveUp', 'shoot')
   * @param {string} keyCode - Key code (e.g., 'KeyW', 'Space', 'ArrowUp')
   */
  mapAction(action, keyCode) {
    this.keyMappings.set(action, keyCode);
  }

  /**
   * Map multiple actions to keys
   * @param {Object} mappings - Object with action -> keyCode mappings
   */
  mapActions(mappings) {
    Object.entries(mappings).forEach(([action, keyCode]) => {
      this.mapAction(action, keyCode);
    });
  }

  /**
   * Check if a key is currently pressed
   * @param {string} keyCode - Key code to check
   * @returns {boolean} True if key is pressed
   */
  isKeyDown(keyCode) {
    return this.keys.get(keyCode) === true;
  }

  /**
   * Check if a key was just pressed (down this frame, up previous frame)
   * @param {string} keyCode - Key code to check
   * @returns {boolean} True if key was just pressed
   */
  isKeyPressed(keyCode) {
    return this.keys.get(keyCode) === true && this.previousKeys.get(keyCode) !== true;
  }

  /**
   * Check if a key was just released (up this frame, down previous frame)
   * @param {string} keyCode - Key code to check
   * @returns {boolean} True if key was just released
   */
  isKeyReleased(keyCode) {
    return this.keys.get(keyCode) !== true && this.previousKeys.get(keyCode) === true;
  }

  /**
   * Check if an action is currently active
   * @param {string} action - Action name
   * @returns {boolean} True if action is active
   */
  isActionDown(action) {
    return this.actionStates.get(action) === true;
  }

  /**
   * Check if an action was just activated
   * @param {string} action - Action name
   * @returns {boolean} True if action was just activated
   */
  isActionPressed(action) {
    const keyCode = this.keyMappings.get(action);
    return keyCode ? this.isKeyPressed(keyCode) : false;
  }

  /**
   * Check if an action was just deactivated
   * @param {string} action - Action name
   * @returns {boolean} True if action was just deactivated
   */
  isActionReleased(action) {
    const keyCode = this.keyMappings.get(action);
    return keyCode ? this.isKeyReleased(keyCode) : false;
  }

  /**
   * Check if a mouse button is currently pressed
   * @param {number} button - Mouse button (0=left, 1=middle, 2=right)
   * @returns {boolean} True if button is pressed
   */
  isMouseButtonDown(button) {
    return this.mouse.buttons.get(button) === true;
  }

  /**
   * Check if a mouse button was just pressed
   * @param {number} button - Mouse button
   * @returns {boolean} True if button was just pressed
   */
  isMouseButtonPressed(button) {
    return this.mouse.buttons.get(button) === true && 
           this.mouse.previousButtons.get(button) !== true;
  }

  /**
   * Check if a mouse button was just released
   * @param {number} button - Mouse button
   * @returns {boolean} True if button was just released
   */
  isMouseButtonReleased(button) {
    return this.mouse.buttons.get(button) !== true && 
           this.mouse.previousButtons.get(button) === true;
  }

  /**
   * Get current mouse position
   * @returns {Object} Mouse position {x, y}
   */
  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  /**
   * Check if a key code is considered a game key (to prevent default behavior)
   * @param {string} keyCode - Key code to check
   * @returns {boolean} True if it's a game key
   */
  isGameKey(keyCode) {
    // Check if the key is mapped to any action
    const mappedActions = Array.from(this.keyMappings.values());
    return mappedActions.includes(keyCode);
  }

  /**
   * Get all currently pressed keys
   * @returns {Array<string>} Array of pressed key codes
   */
  getPressedKeys() {
    const pressed = [];
    this.keys.forEach((isPressed, keyCode) => {
      if (isPressed) {
        pressed.push(keyCode);
      }
    });
    return pressed;
  }

  /**
   * Clear all input states (useful for scene transitions)
   */
  clearInputs() {
    this.keys.clear();
    this.previousKeys.clear();
    this.actionStates.clear();
    this.mouse.buttons.clear();
    this.mouse.previousButtons.clear();
  }

  /**
   * Get debug info about current input state
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      pressedKeys: this.getPressedKeys(),
      activeActions: Array.from(this.actionStates.entries()).filter(([_, active]) => active).map(([action, _]) => action),
      mousePosition: this.getMousePosition(),
      pressedMouseButtons: Array.from(this.mouse.buttons.entries()).filter(([_, pressed]) => pressed).map(([button, _]) => button)
    };
  }
}

// Create singleton instance
export const inputManager = new InputManager();