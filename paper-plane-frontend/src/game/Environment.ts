import * as THREE from 'three';

export class Environment {
  private clouds: THREE.Group[] = [];
  private ground: THREE.Mesh;
  private skybox: THREE.Mesh;
  private lights: THREE.Light[] = [];
  private obstacles: THREE.Group[] = [];

  constructor() {
    this.ground = this.createGround();
    this.skybox = this.createSkybox();
    this.setupLights();
    this.generateClouds();
    this.generateObstacles();
  }

  private createGround(): THREE.Mesh {
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x90EE90,
      transparent: true,
      opacity: 0.8
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -50;
    ground.receiveShadow = true;
    
    // Add some variation to the ground
    const vertices = groundGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 2] = Math.random() * 2; // Small height variations
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();
    
    return ground;
  }

  private createSkybox(): THREE.Mesh {
    const skyGeometry = new THREE.SphereGeometry(800, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x87CEEB,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.9
    });
    
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    return sky;
  }

  private setupLights(): void {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.lights.push(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.lights.push(directionalLight);
  }

  private generateClouds(): void {
    const cloudCount = 20;
    
    for (let i = 0; i < cloudCount; i++) {
      const cloud = this.createCloud();
      
      // Random positioning
      cloud.position.set(
        (Math.random() - 0.5) * 400,
        Math.random() * 30 + 10,
        (Math.random() - 0.5) * 400
      );
      
      this.clouds.push(cloud);
    }
  }

  private createCloud(): THREE.Group {
    const cloudGroup = new THREE.Group();
    const puffCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < puffCount; i++) {
      const puffGeometry = new THREE.SphereGeometry(
        2 + Math.random() * 3,
        8,
        6
      );
      const puffMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
      });
      
      const puff = new THREE.Mesh(puffGeometry, puffMaterial);
      puff.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 8
      );
      
      cloudGroup.add(puff);
    }
    
    return cloudGroup;
  }

  private generateObstacles(): void {
    const obstacleCount = 15;
    
    for (let i = 0; i < obstacleCount; i++) {
      const obstacle = this.createObstacle();
      
      // Position obstacles in a scattered pattern ahead of the starting position
      obstacle.position.set(
        (Math.random() - 0.5) * 200,
        Math.random() * 40 + 5,
        -Math.random() * 300 - 50
      );
      
      this.obstacles.push(obstacle);
    }
  }

  private createObstacle(): THREE.Group {
    const obstacleGroup = new THREE.Group();
    
    // Random obstacle type
    const type = Math.floor(Math.random() * 3);
    
    switch (type) {
      case 0: // Tower
        const towerGeometry = new THREE.CylinderGeometry(2, 3, 20, 8);
        const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.castShadow = true;
        obstacleGroup.add(tower);
        break;
        
      case 1: // Ring
        const ringGeometry = new THREE.TorusGeometry(8, 1, 8, 16);
        const ringMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.castShadow = true;
        obstacleGroup.add(ring);
        break;
        
      case 2: // Building
        const buildingGeometry = new THREE.BoxGeometry(6, 15, 4);
        const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.castShadow = true;
        obstacleGroup.add(building);
        break;
    }
    
    return obstacleGroup;
  }

  public addToScene(scene: THREE.Scene): void {
    scene.add(this.ground);
    scene.add(this.skybox);
    
    this.lights.forEach(light => scene.add(light));
    this.clouds.forEach(cloud => scene.add(cloud));
    this.obstacles.forEach(obstacle => scene.add(obstacle));
  }

  public update(deltaTime: number, planePosition: THREE.Vector3): void {
    // Animate clouds (slow drift)
    this.clouds.forEach(cloud => {
      cloud.position.x += deltaTime * 2;
      cloud.rotation.y += deltaTime * 0.1;
      
      // Reset cloud position when it gets too far
      if (cloud.position.x > planePosition.x + 200) {
        cloud.position.x = planePosition.x - 200;
        cloud.position.z = (Math.random() - 0.5) * 400;
      }
    });
    
    // Generate new obstacles ahead of the plane
    this.manageObstacles(planePosition);
  }

  private manageObstacles(planePosition: THREE.Vector3): void {
    // Remove obstacles that are far behind the plane
    this.obstacles = this.obstacles.filter(obstacle => {
      if (obstacle.position.z > planePosition.z + 100) {
        obstacle.parent?.remove(obstacle);
        return false;
      }
      return true;
    });
    
    // Add new obstacles ahead if needed
    if (this.obstacles.length < 10) {
      const obstacle = this.createObstacle();
      obstacle.position.set(
        (Math.random() - 0.5) * 200,
        Math.random() * 40 + 5,
        planePosition.z - Math.random() * 200 - 100
      );
      this.obstacles.push(obstacle);
      
      // Add to scene (assuming we have access to it)
      // This would need to be handled by the GameEngine
    }
  }

  public getObstacles(): THREE.Group[] {
    return this.obstacles;
  }

  public getClouds(): THREE.Group[] {
    return this.clouds;
  }
}
