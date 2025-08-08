import type { PlaneProperties } from './entities/PaperPlane';
import type { GameConfig } from './GameEngine';

export interface PlaneDatabase {
  planes: PlaneConfiguration[];
  getPlaneByType(type: string): PlaneConfiguration | null;
  getAllPlanes(): PlaneConfiguration[];
}

export interface PlaneConfiguration {
  id: string;
  name: string;
  type: string;
  properties: PlaneProperties;
  gameSettings?: Partial<GameConfig>;
  description: string;
  unlocked: boolean;
}

export class PaperPlaneDatabase implements PlaneDatabase {
  public planes: PlaneConfiguration[] = [
    {
      id: 'basic-white',
      name: 'Classic Paper Plane',
      type: 'basic',
      properties: {
        color: 0xffffff,
        scale: 1.0,
        maxSpeed: 10.0,
        turnRate: 2.0
      },
      gameSettings: {
        planeSpeed: 0.15,  // Increased from 0.05
        sensitivity: 0.002
      },
      description: 'The traditional white paper plane. Simple and reliable.',
      unlocked: true
    },
    {
      id: 'speed-blue',
      name: 'Blue Lightning',
      type: 'speed',
      properties: {
        color: 0x0066ff,
        scale: 1.2,
        maxSpeed: 15.0,
        turnRate: 3.0
      },
      gameSettings: {
        planeSpeed: 0.22,  // Increased for speed variant
        sensitivity: 0.003
      },
      description: 'A faster blue plane with enhanced maneuverability.',
      unlocked: true
    },
    {
      id: 'stealth-black',
      name: 'Shadow Glider',
      type: 'stealth',
      properties: {
        color: 0x333333,
        scale: 0.8,
        maxSpeed: 8.0,
        turnRate: 4.0
      },
      gameSettings: {
        planeSpeed: 0.04,
        sensitivity: 0.004
      },
      description: 'A stealthy black plane that\'s harder to spot but highly maneuverable.',
      unlocked: false
    },
    {
      id: 'gold-premium',
      name: 'Golden Eagle',
      type: 'premium',
      properties: {
        color: 0xffcc00,
        scale: 1.5,
        maxSpeed: 12.0,
        turnRate: 2.5
      },
      gameSettings: {
        planeSpeed: 0.06,
        sensitivity: 0.0025
      },
      description: 'A premium golden plane with balanced performance.',
      unlocked: false
    },
    {
      id: 'neon-green',
      name: 'Toxic Dart',
      type: 'experimental',
      properties: {
        color: 0x00ff00,
        scale: 0.9,
        maxSpeed: 20.0,
        turnRate: 5.0
      },
      gameSettings: {
        planeSpeed: 0.1,
        sensitivity: 0.005
      },
      description: 'An experimental high-speed plane with extreme agility.',
      unlocked: false
    }
  ];

  public getPlaneByType(type: string): PlaneConfiguration | null {
    return this.planes.find(plane => plane.type === type) || null;
  }

  public getPlaneById(id: string): PlaneConfiguration | null {
    return this.planes.find(plane => plane.id === id) || null;
  }

  public getAllPlanes(): PlaneConfiguration[] {
    return [...this.planes];
  }

  public getUnlockedPlanes(): PlaneConfiguration[] {
    return this.planes.filter(plane => plane.unlocked);
  }

  public unlockPlane(id: string): boolean {
    const plane = this.getPlaneById(id);
    if (plane) {
      plane.unlocked = true;
      return true;
    }
    return false;
  }

  public addCustomPlane(config: Omit<PlaneConfiguration, 'id'>): string {
    const id = `custom-${Date.now()}`;
    const newPlane: PlaneConfiguration = {
      id,
      ...config
    };
    this.planes.push(newPlane);
    return id;
  }

  public updatePlane(id: string, updates: Partial<PlaneConfiguration>): boolean {
    const planeIndex = this.planes.findIndex(plane => plane.id === id);
    if (planeIndex !== -1) {
      this.planes[planeIndex] = { ...this.planes[planeIndex], ...updates };
      return true;
    }
    return false;
  }

  public deletePlane(id: string): boolean {
    const initialLength = this.planes.length;
    this.planes = this.planes.filter(plane => plane.id !== id);
    return this.planes.length < initialLength;
  }

  // Persistence methods (could be connected to localStorage, API, etc.)
  public saveToStorage(): void {
    try {
      localStorage.setItem('paperPlaneDatabase', JSON.stringify(this.planes));
    } catch (error) {
      console.warn('Failed to save plane database to localStorage:', error);
    }
  }

  public loadFromStorage(): boolean {
    try {
      const stored = localStorage.getItem('paperPlaneDatabase');
      if (stored) {
        const loadedPlanes = JSON.parse(stored);
        // Merge with default planes, preserving any custom additions
        this.planes = this.mergeWithDefaults(loadedPlanes);
        return true;
      }
    } catch (error) {
      console.warn('Failed to load plane database from localStorage:', error);
    }
    return false;
  }

  private mergeWithDefaults(loadedPlanes: PlaneConfiguration[]): PlaneConfiguration[] {
    const merged = [...this.planes];
    
    // Update existing planes with loaded data
    loadedPlanes.forEach(loadedPlane => {
      const existingIndex = merged.findIndex(plane => plane.id === loadedPlane.id);
      if (existingIndex !== -1) {
        // Update existing plane while preserving structure
        merged[existingIndex] = { ...merged[existingIndex], ...loadedPlane };
      } else {
        // Add custom planes that don't exist in defaults
        merged.push(loadedPlane);
      }
    });
    
    return merged;
  }
}
