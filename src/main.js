/**
 * OpenClawd Intelligence - Ultimate Edition
 * Main Entry Point
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

import { Orb } from './components/Orb.js';
import { Particles } from './components/Particles.js';
import { Shadow } from './components/Shadow.js';
import { StateManager, STATES } from './components/StateManager.js';
import { ACESShader, FilmShader } from './shaders/postprocessing.js';

class OpenClawdIntelligence {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.stateIndicator = document.getElementById('state-indicator');

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.clock = null;

        // Components
        this.orb = null;
        this.particles = null;
        this.shadow = null;
        this.stateManager = null;

        // Post-processing passes
        this.bloomPass = null;
        this.filmPass = null;
        this.fxaaPass = null;

        this._init();
    }

    _init() {
        this._setupScene();
        this._setupRenderer();
        this._setupPostProcessing();
        this._setupComponents();
        this._setupEventListeners();
        this._animate();

        console.log('OpenClawd Intelligence - Ultimate Edition initialized');
    }

    _setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf2f2f7);

        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.z = 4.5;

        this.clock = new THREE.Clock();
    }

    _setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        this.container.appendChild(this.renderer.domElement);
    }

    _setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);

        // 1. Render Pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // 2. Unreal Bloom
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.4,   // strength
            0.4,   // radius
            0.85   // threshold
        );
        this.composer.addPass(this.bloomPass);

        // 3. ACES Tonemapping
        const acesPass = new ShaderPass(ACESShader);
        this.composer.addPass(acesPass);

        // 4. Film Effects (grain + chromatic aberration)
        this.filmPass = new ShaderPass(FilmShader);
        this.composer.addPass(this.filmPass);

        // 5. FXAA Anti-aliasing
        this.fxaaPass = new ShaderPass(FXAAShader);
        this._updateFXAAResolution();
        this.composer.addPass(this.fxaaPass);
    }

    _setupComponents() {
        // Create orb
        this.orb = new Orb();
        this.orb.addTo(this.scene);

        // Create particles
        this.particles = new Particles(150, this.renderer.getPixelRatio());
        this.particles.addTo(this.scene);

        // Create shadow
        this.shadow = new Shadow();
        this.shadow.addTo(this.scene);

        // Setup state manager
        this.stateManager = new StateManager(STATES.IDLE);
        this.stateManager.onStateChange((state, config) => {
            this._onStateChange(state, config);
        });

        // Apply initial state
        this._onStateChange(STATES.IDLE, this.stateManager.getConfig());
    }

    _setupEventListeners() {
        // Click to cycle states
        this.container.addEventListener('click', () => {
            this.stateManager.nextState();
        });

        // Resize handler
        window.addEventListener('resize', () => this._onResize());

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case '1': this.stateManager.setState(STATES.IDLE); break;
                case '2': this.stateManager.setState(STATES.LISTENING); break;
                case '3': this.stateManager.setState(STATES.PROCESSING); break;
                case '4': this.stateManager.setState(STATES.SPEAKING); break;
            }
        });
    }

    _onStateChange(state, config) {
        // Update UI
        if (this.stateIndicator) {
            this.stateIndicator.textContent = state.charAt(0).toUpperCase() + state.slice(1);
        }

        // Update orb morph parameters
        this.orb.setMorphParams(config.morphSpeed, config.morphIntensity);

        // Update bloom strength
        this.bloomPass.strength = config.bloom;
    }

    _onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);

        this._updateFXAAResolution();

        // Update particle pixel ratio
        this.particles.setPixelRatio(this.renderer.getPixelRatio());
    }

    _updateFXAAResolution() {
        const pixelRatio = this.renderer.getPixelRatio();
        this.fxaaPass.uniforms['resolution'].value.set(
            1 / (window.innerWidth * pixelRatio),
            1 / (window.innerHeight * pixelRatio)
        );
    }

    _animate() {
        requestAnimationFrame(() => this._animate());

        const time = this.clock.getElapsedTime();

        // Update state manager and get interpolated activity
        const activity = this.stateManager.update();

        // Update components
        this.orb.update(time, activity);
        this.particles.update(time, activity);
        this.shadow.update(activity);

        // Update film shader time
        this.filmPass.uniforms.time.value = time;

        // Camera breathing
        this.camera.position.x = Math.sin(time * 0.08) * 0.08;
        this.camera.position.y = Math.cos(time * 0.06) * 0.04;
        this.camera.lookAt(0, 0, 0);

        // Render with post-processing
        this.composer.render();
    }

    /**
     * Public API: Set state programmatically
     * @param {string} state - 'idle', 'listening', 'processing', or 'speaking'
     */
    setState(state) {
        this.stateManager.setState(state);
    }

    /**
     * Public API: Get current state
     * @returns {string}
     */
    getState() {
        return this.stateManager.currentState;
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.orb.dispose();
        this.particles.dispose();
        this.shadow.dispose();
        this.renderer.dispose();
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.openClawd = new OpenClawdIntelligence();
});

// Export for external use
export { OpenClawdIntelligence, STATES };
