import type { Ticker } from 'pixi.js';

/**
 * Base class for state management
 */
export class State {
	Enter() {}
	Update(ticker: Ticker) {
		ticker;
	}
	Exit() {}
}

/**
 * Type of state that has random limited "energy" which depletes over time
 */
export abstract class EnergizedState extends State {
	energy: number = 0;

	constructor(
		public minEnergy: number,
		public maxEnergy: number
	) {
		super();
	}

	Enter() {
		this.energy = Math.random() * (this.maxEnergy - this.minEnergy) + this.minEnergy;
	}

	Update(ticker: Ticker) {
		this.energy -= ticker.deltaMS;
		if (this.energy < 0) {
			this.Tired();
		}
	}

	abstract Tired(): void;
}

/**
 * Machine to handle state transitions.
 * Can be strongly typed to a literal union of state names.
 */
export class StateMachine<Name = string> {
	private states: Map<Name, State> = new Map();
	private currentState: State | undefined;

	constructor(stateList?: [Name, State][], initialState?: Name) {
		if (stateList) {
			for (const [name, state] of stateList) {
				this.Add(name, state);
			}
			if (initialState) {
				this.Change(initialState);
			}
		}
	}

	Add(name: Name, state: State) {
		this.states.set(name, state);
	}

	Remove(name: Name) {
		this.states.delete(name);
	}

	Change(name: Name) {
		this.currentState?.Exit();
		this.currentState = this.states.get(name);
		this.currentState?.Enter();
	}

	Update(ticker: Ticker) {
		this.currentState?.Update(ticker);
	}
}
