import * as THREE from 'three';
import { ParticleVertexShader, ParticleFragmentShader } from '../shaders/postprocessing.js';

/**
 * Particles Component
 * Floating particles around the orb
 */
export class Particles {
    constructor(count = 150, pixelRatio = 1) {
        this.count = count;
        this.points = null;
        this.material = null;
        this.uniforms = null;

        this._createParticles(pixelRatio);
    }

    _createParticles(pixelRatio) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.count * 3);
        const sizes = new Float32Array(this.count);
        const offsets = new Float32Array(this.count);

        for (let i = 0; i < this.count; i++) {
            // Spherical distribution around the orb
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 1.3 + Math.random() * 0.7;

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            sizes[i] = Math.random() * 0.5 + 0.5;
            offsets[i] = Math.random() * Math.PI * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));

        this.uniforms = {
            uTime: { value: 0 },
            uActivity: { value: 0 },
            uPixelRatio: { value: pixelRatio }
        };

        this.material = new THREE.ShaderMaterial({
            vertexShader: ParticleVertexShader,
            fragmentShader: ParticleFragmentShader,
            uniforms: this.uniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.points = new THREE.Points(geometry, this.material);
    }

    /**
     * Update particle uniforms
     * @param {number} time - Elapsed time
     * @param {number} activity - Activity level (0-1)
     */
    update(time, activity) {
        this.uniforms.uTime.value = time;
        this.uniforms.uActivity.value = activity;
    }

    /**
     * Update pixel ratio (for resize handling)
     * @param {number} pixelRatio
     */
    setPixelRatio(pixelRatio) {
        this.uniforms.uPixelRatio.value = pixelRatio;
    }

    /**
     * Add to scene
     * @param {THREE.Scene} scene
     */
    addTo(scene) {
        scene.add(this.points);
    }

    /**
     * Dispose resources
     */
    dispose() {
        this.points.geometry.dispose();
        this.material.dispose();
    }
}
