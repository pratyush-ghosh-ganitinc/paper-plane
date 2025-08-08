import * as THREE from 'three';

export interface PlaneProperties {
  color: number;
  scale: number;
  maxSpeed: number;
  turnRate: number;
}

export class PaperPlane {
  private mesh: THREE.Group;
  private targetRotation: THREE.Euler;
  private currentRotation: THREE.Euler;
  private velocity: THREE.Vector3;
  private position: THREE.Vector3;
  
  public properties: PlaneProperties = {
    color: 0xffffff,
    scale: 1.0,
    maxSpeed: 10.0,
    turnRate: 2.0
  };

  constructor(properties?: Partial<PlaneProperties>) {
    this.properties = { ...this.properties, ...properties };
    
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.targetRotation = new THREE.Euler(0, 0, 0);
    this.currentRotation = new THREE.Euler(0, 0, 0);
    
    this.mesh = this.createPaperPlaneMesh();
    this.mesh.position.copy(this.position);
  }

  private createPaperPlaneMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // Create paper plane geometry using basic shapes
    const bodyGeometry = new THREE.ConeGeometry(0.1, 1.5, 4);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: this.properties.color,
      transparent: true,
      opacity: 0.9
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    body.castShadow = true;
    
    // Wings
    const wingGeometry = new THREE.PlaneGeometry(1.2, 0.6);
    const wingMaterial = new THREE.MeshLambertMaterial({ 
      color: this.properties.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.6, 0, 0.2);
    leftWing.rotation.set(0.1, 0, 0.3);
    leftWing.castShadow = true;
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.6, 0, 0.2);
    rightWing.rotation.set(0.1, 0, -0.3);
    rightWing.castShadow = true;
    
    // Tail fins
    const tailGeometry = new THREE.PlaneGeometry(0.4, 0.3);
    const tailMaterial = new THREE.MeshLambertMaterial({ 
      color: this.properties.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    
    const leftTail = new THREE.Mesh(tailGeometry, tailMaterial);
    leftTail.position.set(-0.15, 0.1, 0.6);
    leftTail.rotation.set(0, 0, 0.5);
    
    const rightTail = new THREE.Mesh(tailGeometry, tailMaterial);
    rightTail.position.set(0.15, 0.1, 0.6);
    rightTail.rotation.set(0, 0, -0.5);
    
    group.add(body, leftWing, rightWing, leftTail, rightTail);
    group.scale.setScalar(this.properties.scale);
    
    return group;
  }

  public updateRotation(deltaX: number, deltaY: number): void {
    // Update target rotation based on mouse input
    this.targetRotation.y -= deltaX; // Yaw (left/right) - inverted so right mouse = right turn
    this.targetRotation.x += deltaY; // Pitch (up/down)
    
    // Clamp pitch to prevent over-rotation
    this.targetRotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.targetRotation.x));
    
    // Add banking effect based on turn rate
    this.targetRotation.z = deltaX * 2; // Bank in the direction of turn - also inverted
    this.targetRotation.z = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.targetRotation.z));
  }

  public update(deltaTime: number, speed: number): void {
    // Smoothly interpolate current rotation towards target
    this.currentRotation.x = THREE.MathUtils.lerp(
      this.currentRotation.x, 
      this.targetRotation.x, 
      this.properties.turnRate * deltaTime
    );
    this.currentRotation.y = THREE.MathUtils.lerp(
      this.currentRotation.y, 
      this.targetRotation.y, 
      this.properties.turnRate * deltaTime
    );
    this.currentRotation.z = THREE.MathUtils.lerp(
      this.currentRotation.z, 
      this.targetRotation.z, 
      this.properties.turnRate * deltaTime * 0.5
    );
    
    // Apply rotation to mesh
    this.mesh.rotation.copy(this.currentRotation);
    
    // Calculate velocity based on current orientation
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyEuler(this.currentRotation);
    
    this.velocity.copy(direction).multiplyScalar(speed);
    
    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    this.mesh.position.copy(this.position);
    
    // Reduce banking over time when not turning
    this.targetRotation.z *= 0.95;
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getRotation(): THREE.Quaternion {
    return this.mesh.quaternion.clone();
  }

  public setPosition(position: THREE.Vector3): void {
    this.position.copy(position);
    this.mesh.position.copy(position);
  }

  public updateProperties(newProperties: Partial<PlaneProperties>): void {
    this.properties = { ...this.properties, ...newProperties };
    
    // Update mesh if color changed
    if (newProperties.color !== undefined) {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
          child.material.color.setHex(newProperties.color!);
        }
      });
    }
    
    // Update scale if changed
    if (newProperties.scale !== undefined) {
      this.mesh.scale.setScalar(newProperties.scale);
    }
  }
}
