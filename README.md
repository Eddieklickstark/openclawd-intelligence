# OpenClawd Intelligence - Ultimate Edition

Premium AI Assistant UI with Apple Siri Intelligence-style opalescent orb visualization.

![OpenClawd Intelligence](https://via.placeholder.com/800x400/f2f2f7/667eea?text=OpenClawd+Intelligence)

## Features

- 🎨 **Opalescent Orb** - Organic blob deformation with 6-octave FBM noise
- ✨ **Thin-Film Iridescence** - Physically-based rainbow interference
- 🌟 **UnrealBloom** - Cinematic glow post-processing
- 🎬 **ACES Tonemapping** - Hollywood-grade color response
- 🔮 **Internal Light Rays** - 20-ray caustic simulation
- 💫 **150 Floating Particles** - Additive blending atmosphere
- 📽️ **Film Grain & Chromatic Aberration** - Analog character
- 🖱️ **4 Activity States** - Idle, Listening, Processing, Speaking

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: GitHub Integration

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Vercel auto-detects Vite and deploys!

### Option 3: Drag & Drop

1. Run `npm run build`
2. Go to [vercel.com](https://vercel.com)
3. Drag the `dist` folder to the deployment area

## Controls

| Input | Action |
|-------|--------|
| Click | Cycle through states |
| Key 1 | Set to Idle |
| Key 2 | Set to Listening |
| Key 3 | Set to Processing |
| Key 4 | Set to Speaking |

## API Usage

```javascript
// Access the instance
const clawd = window.openClawd;

// Set state programmatically
clawd.setState('listening');
clawd.setState('processing');
clawd.setState('speaking');
clawd.setState('idle');

// Get current state
console.log(clawd.getState());
```

## Project Structure

```
openclawd-ultimate/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js                 # Entry point
│   ├── styles/
│   │   └── main.css            # Global styles
│   ├── components/
│   │   ├── Orb.js              # Main orb mesh
│   │   ├── Particles.js        # Floating particles
│   │   ├── Shadow.js           # Ground shadow
│   │   └── StateManager.js     # Activity state machine
│   └── shaders/
│       ├── orb.vert.glsl       # Orb vertex shader
│       ├── orb.frag.glsl       # Orb fragment shader
│       └── postprocessing.js   # Post-processing shaders
└── README.md
```

## Tech Stack

- **Three.js** - 3D rendering
- **GLSL** - Custom shaders
- **Vite** - Build tool
- **vite-plugin-glsl** - GLSL import support

## Performance

- 128 subdivision icosahedron
- 6-octave FBM for smooth deformation
- Optimized post-processing pipeline
- 60 FPS on modern hardware

## License

MIT - Feel free to use in your projects!

---

Built with 💜 for OpenClawd
