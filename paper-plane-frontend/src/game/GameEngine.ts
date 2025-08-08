import * as THREE from 'three';
import { PaperPlane } from './entities/PaperPlane';
import type { PlaneProperties } from './entities/PaperPlane';
import { Environment } from './Environment.ts';
import { InputController } from './InputController.ts';

export interface GameConfig {
  planeSpeed: number;
  sensitivity: number;
  fieldOfView: number;
  renderDistance: number;
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
  
  public config: GameConfig = {
    planeSpeed: 0.05,
    sensitivity: 0.002,
    fieldOfView: 75,
    renderDistance: 1000
  };

  constructor(canvas: HTMLCanvasElement) {
    this.clock = new THREE.Clock();
    
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
    
    this.clock.start();
    this.animate();
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    
    const deltaTime = this.clock.getDelta();
    
    // Update game entities
    this.paperPlane.update(deltaTime, this.config.planeSpeed);
    this.environment.update(deltaTime, this.paperPlane.getPosition());
    
    // Update camera to follow plane (first-person view)
    this.updateCamera();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
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

  public dispose(): void {
    this.stop();
    this.inputController.dispose();
    this.renderer.dispose();
    this.scene.clear();
  }
}
