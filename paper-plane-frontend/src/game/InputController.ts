export class InputController {
  private canvas: HTMLCanvasElement;
  private mouseLockedState = false;
  private mouseMoveCallbacks: ((deltaX: number, deltaY: number) => void)[] = [];
  private keyStates: { [key: string]: boolean } = {};
  private keyCallbacks: { [key: string]: (() => void)[] } = {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
    this.requestPointerLock();
  }

  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
    document.addEventListener('pointerlockerror', this.handlePointerLockError.bind(this));
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private requestPointerLock(): void {
    this.canvas.requestPointerLock();
  }

  private handleCanvasClick(): void {
    if (!this.mouseLockedState) {
      this.requestPointerLock();
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.mouseLockedState) return;

    const deltaX = event.movementX || 0;
    const deltaY = event.movementY || 0;

    // Notify all registered callbacks
    this.mouseMoveCallbacks.forEach(callback => {
      callback(deltaX, deltaY);
    });
  }

  private handlePointerLockChange(): void {
    this.mouseLockedState = document.pointerLockElement === this.canvas;
    
    if (this.mouseLockedState) {
      console.log('Pointer locked - use mouse to control the plane!');
    } else {
      console.log('Pointer lock lost - click canvas to regain control');
    }
  }

  private handlePointerLockError(): void {
    console.error('Pointer lock failed');
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.code.toLowerCase();
    
    if (!this.keyStates[key]) {
      this.keyStates[key] = true;
      
      // Trigger callbacks for this key
      if (this.keyCallbacks[key]) {
        this.keyCallbacks[key].forEach(callback => callback());
      }
    }
    
    // Prevent default behavior for game keys
    if (this.isGameKey(key)) {
      event.preventDefault();
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.code.toLowerCase();
    this.keyStates[key] = false;
    
    if (this.isGameKey(key)) {
      event.preventDefault();
    }
  }

  private isGameKey(key: string): boolean {
    const gameKeys = [
      'keyw', 'keya', 'keys', 'keyd', // WASD
      'arrowup', 'arrowdown', 'arrowleft', 'arrowright', // Arrow keys
      'space', 'escape'
    ];
    return gameKeys.includes(key);
  }

  // Public API methods
  public onMouseMove(callback: (deltaX: number, deltaY: number) => void): void {
    this.mouseMoveCallbacks.push(callback);
  }

  public removeMouseMoveCallback(callback: (deltaX: number, deltaY: number) => void): void {
    const index = this.mouseMoveCallbacks.indexOf(callback);
    if (index > -1) {
      this.mouseMoveCallbacks.splice(index, 1);
    }
  }

  public onKeyPress(key: string, callback: () => void): void {
    const normalizedKey = key.toLowerCase();
    if (!this.keyCallbacks[normalizedKey]) {
      this.keyCallbacks[normalizedKey] = [];
    }
    this.keyCallbacks[normalizedKey].push(callback);
  }

  public removeKeyCallback(key: string, callback: () => void): void {
    const normalizedKey = key.toLowerCase();
    if (this.keyCallbacks[normalizedKey]) {
      const index = this.keyCallbacks[normalizedKey].indexOf(callback);
      if (index > -1) {
        this.keyCallbacks[normalizedKey].splice(index, 1);
      }
    }
  }

  public isKeyPressed(key: string): boolean {
    return this.keyStates[key.toLowerCase()] || false;
  }

  public isMouseLocked(): boolean {
    return this.mouseLockedState;
  }

  public releaseLock(): void {
    if (this.mouseLockedState) {
      document.exitPointerLock();
    }
  }

  public dispose(): void {
    // Remove all event listeners
    this.canvas.removeEventListener('click', this.handleCanvasClick.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
    document.removeEventListener('pointerlockerror', this.handlePointerLockError.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Clear callbacks
    this.mouseMoveCallbacks = [];
    this.keyCallbacks = {};
    
    // Release pointer lock
    this.releaseLock();
  }
}
