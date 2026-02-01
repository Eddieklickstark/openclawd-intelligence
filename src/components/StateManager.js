/**
 * StateManager
 * Handles activity states and smooth transitions
 */

export const STATES = {
    IDLE: 'idle',
    LISTENING: 'listening',
    PROCESSING: 'processing',
    SPEAKING: 'speaking'
};

export const STATE_CONFIGS = {
    [STATES.IDLE]: {
        activity: 0,
        morphSpeed: 0.4,
        morphIntensity: 0.12,
        bloom: 0.4
    },
    [STATES.LISTENING]: {
        activity: 0.5,
        morphSpeed: 0.8,
        morphIntensity: 0.18,
        bloom: 0.55
    },
    [STATES.PROCESSING]: {
        activity: 0.85,
        morphSpeed: 1.4,
        morphIntensity: 0.24,
        bloom: 0.75
    },
    [STATES.SPEAKING]: {
        activity: 1.0,
        morphSpeed: 1.1,
        morphIntensity: 0.2,
        bloom: 0.85
    }
};

export class StateManager {
    constructor(initialState = STATES.IDLE) {
        this.currentState = initialState;
        this.targetActivity = STATE_CONFIGS[initialState].activity;
        this.currentActivity = 0;

        this._stateIndex = 0;
        this._stateOrder = [STATES.IDLE, STATES.LISTENING, STATES.PROCESSING, STATES.SPEAKING];
        this._listeners = [];
    }

    /**
     * Get current state configuration
     * @returns {Object}
     */
    getConfig() {
        return STATE_CONFIGS[this.currentState];
    }

    /**
     * Set a specific state
     * @param {string} state - One of STATES values
     */
    setState(state) {
        if (!STATE_CONFIGS[state]) {
            console.warn(`Unknown state: ${state}`);
            return;
        }

        this.currentState = state;
        this.targetActivity = STATE_CONFIGS[state].activity;
        this._stateIndex = this._stateOrder.indexOf(state);

        this._notifyListeners();
    }

    /**
     * Cycle to next state
     */
    nextState() {
        this._stateIndex = (this._stateIndex + 1) % this._stateOrder.length;
        this.setState(this._stateOrder[this._stateIndex]);
    }

    /**
     * Update activity with smooth interpolation
     * @param {number} lerpFactor - Interpolation factor (default 0.05)
     * @returns {number} Current interpolated activity
     */
    update(lerpFactor = 0.05) {
        this.currentActivity += (this.targetActivity - this.currentActivity) * lerpFactor;
        return this.currentActivity;
    }

    /**
     * Add state change listener
     * @param {Function} callback
     */
    onStateChange(callback) {
        this._listeners.push(callback);
    }

    /**
     * Remove state change listener
     * @param {Function} callback
     */
    offStateChange(callback) {
        this._listeners = this._listeners.filter(cb => cb !== callback);
    }

    _notifyListeners() {
        const config = this.getConfig();
        this._listeners.forEach(cb => cb(this.currentState, config));
    }
}
