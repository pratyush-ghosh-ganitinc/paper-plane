import * as THREE from 'three';
import { PaperPlane } from './entities/PaperPlane';
import type { PlaneProperties } from './entities/PaperPlane';
import { Environment } from './Environment';
import { InputController } from './InputController';

export interface GameConfig {
  planeSpeed: number;
  sensitivity: number;
  fieldOfView: number;
  renderDistance: number;
}

export interface GameState {
  isRunning: boolean;
  isGameOver: boolean;
  score: number;
  hoopsPassed: number;
  lastHoopBonus: number;
  collisionMessage?: string;
}

export class GameEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private paperPlane: PaperPlane;
  private environment: Environment;
  private inputController: InputController;
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private gameState: GameState;
  private onGameOver?: (state: GameState) => void;
  
  public config: GameConfig = {
    planeSpeed: 0.15,  // Increased from 0.05 for faster movement
    sensitivity: 0.002,
    fieldOfView: 75,
    renderDistance: 1000
  };

  constructor(canvas: HTMLCanvasElement, onGameOver?: (state: GameState) => void) {
    this.clock = new THREE.Clock();
    this.onGameOver = onGameOver;
    this.gameState = {
      isRunning: false,
      isGameOver: false,
      score: 0,
      hoopsPassed: 0,
      lastHoopBonus: 0
    };
    
    // Initialize Three.js core components
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.config.fieldOfView,
      window.innerWidth / window.innerHeight,
      0.1,
      this.config.renderDistance
    );
    
    this.renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87CEEB, 1); // Sky blue background
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize game entities
    this.paperPlane = new PaperPlane();
    this.environment = new Environment();
    this.inputController = new InputController(canvas);

    this.setupScene();
    this.setupEventListeners();
  }

  private setupScene(): void {
    // Add paper plane to scene
    this.scene.add(this.paperPlane.getMesh());
    
    // Add environment elements
    this.environment.addToScene(this.scene);
    
    // Position camera slightly behind and above the plane
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);
  }

  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Handle mouse movement for plane control
    this.inputController.onMouseMove((deltaX: number, deltaY: number) => {
      this.paperPlane.updateRotation(deltaX * this.config.sensitivity, deltaY * this.config.sensitivity);
    });
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public start(): void {
    if (this.animationId !== null) return;
    
    this.gameState.isRunning = true;
    this.gameState.isGameOver = false;
    this.gameState.score = 0;
    this.gameState.hoopsPassed = 0;
    this.gameState.lastHoopBonus = 0;
    this.clock.start();
    this.animate();
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.gameState.isRunning = false;
  }

  public restart(): void {
    this.gameState.isGameOver = false;
    this.gameState.score = 0;
    this.gameState.hoopsPassed = 0;
    this.gameState.lastHoopBonus = 0;
    this.gameState.collisionMessage = undefined;
    
    // Reset plane position
    this.paperPlane.setPosition(new THREE.Vector3(0, 0, 0));
    
    // Reset obstacles (remove them from scene and regenerate)
    this.environment.getObstacles().forEach(obstacle => {
      this.scene.remove(obstacle);
    });
    this.environment.resetObstacles();
    this.environment.getObstacles().forEach(obstacle => {
      this.scene.add(obstacle);
    });
    
    this.start();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    
    if (this.gameState.isGameOver) {
      return; // Stop game loop if game is over
    }
    
    const deltaTime = this.clock.getDelta();
    
    // Update game entities
    this.paperPlane.update(deltaTime, this.config.planeSpeed);
    this.environment.update(deltaTime, this.paperPlane.getPosition());
    
    // Check for collisions
    this.checkCollisions();
    
    // Update score based on distance traveled
    this.gameState.score += deltaTime * 10;
    
    // Update camera to follow plane (first-person view)
    this.updateCamera();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  private checkCollisions(): void {
    const planePosition = this.paperPlane.getPosition();
    
    // Check ground collision
    if (planePosition.y < -45) {
      this.handleGameOver('Crashed into the ground!');
      return;
    }
    
    // Check obstacle collisions
    const obstacles = this.environment.getObstacles();
    for (const obstacle of obstacles) {
      const obstaclePosition = obstacle.position;
      const distance = planePosition.distanceTo(obstaclePosition);
      
      // Different collision radii for different obstacle types
      let collisionRadius = 5; // Default
      
      if (obstacle.userData.type === 'tower') {
        collisionRadius = 4;
      } else if (obstacle.userData.type === 'ring') {
        // For rings, check if we're inside the ring
        const ringDistance = planePosition.distanceTo(obstaclePosition);
        if (ringDistance < 8 && ringDistance > 6) {
          // Inside the ring - award bonus points if not already passed
          if (!obstacle.userData.passed) {
            obstacle.userData.passed = true;
            this.awardHoopBonus();
          }
          continue;
        } else if (ringDistance < 6) {
          collisionRadius = 2;
        }
      } else if (obstacle.userData.type === 'building') {
        collisionRadius = 6;
      }
      
      if (distance < collisionRadius) {
        this.handleGameOver(`Crashed into ${obstacle.userData.type || 'obstacle'}!`);
        return;
      }
    }
  }

  private handleGameOver(message: string): void {
    this.gameState.isGameOver = true;
    this.gameState.isRunning = false;
    this.gameState.collisionMessage = message;
    
    if (this.onGameOver) {
      this.onGameOver(this.gameState);
    }
    
    this.stop();
  }

  private awardHoopBonus(): void {
    const bonusPoints = 100 + (this.gameState.hoopsPassed * 25); // Increasing bonus
    this.gameState.score += bonusPoints;
    this.gameState.hoopsPassed += 1;
    this.gameState.lastHoopBonus = bonusPoints;
    
    console.log(`🎯 Hoop passed! +${bonusPoints} points (Total hoops: ${this.gameState.hoopsPassed})`);
  }

  private updateCamera(): void {
    const planePosition = this.paperPlane.getPosition();
    const planeRotation = this.paperPlane.getRotation();
    
    // Position camera slightly behind the plane
    const offset = new THREE.Vector3(0, 1, 3);
    offset.applyQuaternion(planeRotation);
    
    this.camera.position.copy(planePosition).add(offset);
    
    // Look in the direction the plane is facing
    const lookDirection = new THREE.Vector3(0, 0, -1);
    lookDirection.applyQuaternion(planeRotation);
    this.camera.lookAt(planePosition.clone().add(lookDirection));
  }

  public updateConfig(newConfig: Partial<GameConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.fieldOfView) {
      this.camera.fov = newConfig.fieldOfView;
      this.camera.updateProjectionMatrix();
    }
    
    if (newConfig.renderDistance) {
      this.camera.far = newConfig.renderDistance;
      this.camera.updateProjectionMatrix();
    }
  }

  public switchPlane(planeProperties: PlaneProperties): void {
    // Remove old plane from scene
    this.scene.remove(this.paperPlane.getMesh());
    
    // Create new plane with updated properties
    const currentPosition = this.paperPlane.getPosition();
    this.paperPlane = new PaperPlane(planeProperties);
    this.paperPlane.setPosition(currentPosition);
    
    // Add new plane to scene
    this.scene.add(this.paperPlane.getMesh());
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public isGameOver(): boolean {
    return this.gameState.isGameOver;
  }

  public getScore(): number {
    return Math.floor(this.gameState.score);
  }

  public getHoopsPassed(): number {
    return this.gameState.hoopsPassed;
  }

  public getLastHoopBonus(): number {
    return this.gameState.lastHoopBonus;
  }

  public dispose(): void {
    this.stop();
    this.inputController.dispose();
    this.renderer.dispose();
    this.scene.clear();
  }
}
