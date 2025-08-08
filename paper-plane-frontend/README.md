# Paper Plane 3D Game

A 3D paper plane flying game built with React, TypeScript, and Three.js where players control a paper plane using mouse movements.

## Features

### Core Gameplay
- **Mouse-controlled flight**: Move your mouse to control the paper plane's direction
- **First-person perspective**: Camera follows behind the plane for immersive flying
- **3D environment**: Clouds, ground, obstacles, and dynamic skybox
- **Realistic physics**: Banking turns and smooth flight dynamics

### Extensible Design
- **Plane Database**: Multiple plane types with different properties
- **Customizable planes**: Different colors, speeds, and handling characteristics
- **Configuration system**: Adjustable game settings (speed, sensitivity, FOV)
- **Modular architecture**: Easy to add new features

## Project Structure

```
src/
├── components/
│   ├── PaperPlaneGame.tsx       # Main game component
│   ├── PaperPlaneGame.css       # Game UI styles
│   ├── PlaneSelector.tsx        # Plane selection interface
│   └── PlaneSelector.css        # Plane selector styles
├── game/
│   ├── GameEngine.ts            # Core game engine
│   ├── Environment.ts           # 3D environment (clouds, ground, obstacles)
│   ├── InputController.ts       # Mouse and keyboard input handling
│   ├── PlaneDatabase.ts         # Plane configurations and management
│   └── entities/
│       └── PaperPlane.ts        # Paper plane 3D model and physics
└── App.tsx                      # Main application entry point
```

## Extensibility Examples

### Adding New Plane Types

1. **Add to PlaneDatabase.ts**:
```typescript
{
  id: 'custom-plane',
  name: 'Custom Flyer',
  type: 'custom',
  properties: {
    color: 0xff0000,      // Red color
    scale: 1.3,           // 30% larger
    maxSpeed: 18.0,       // Faster than default
    turnRate: 3.5         // More agile
  },
  gameSettings: {
    planeSpeed: 0.07,     // Custom speed
    sensitivity: 0.003    // Custom sensitivity
  },
  description: 'A custom plane with unique characteristics',
  unlocked: true
}
```

2. **The plane will automatically appear in the plane selector with:**
   - Visual preview with the specified color
   - Performance stats bars
   - Custom game settings when selected

## Controls

- **Click**: Lock mouse cursor for plane control
- **Mouse movement**: Control plane direction
  - Left/Right: Turn left/right
  - Up/Down: Pitch up/down
- **ESC**: Release mouse lock
- **Select Plane button**: Choose different aircraft

## Development

```bash
npm install
npm run dev
```

## Technical Implementation

The architecture is designed to be highly extensible for future enhancements like database integration, advanced physics, and multiplayer features.
