import type { Ticker } from 'pixi.js';
import { Vector, Angle, Degrees } from './Vector';

/**
 * Abstract base class for all game objects to inherit from
 */
export default abstract class GameObject {
	private static register = new Set<GameObject>();

	position: Vector;
	angle: Angle;
	scale: Vector;
	name: string;
	tags: Set<string>;

	constructor(name = '', tags: Set<string> | string[] = []) {
		this.position = new Vector();
		this.scale = new Vector();
		this.angle = new Degrees(0);
		this.name = name;
		this.tags = new Set(tags);
		GameObject.register.add(this);
	}

	abstract Update(ticker: Ticker): void;
	abstract Render(ticker: Ticker): void;
	Destroy() {
		GameObject.register.delete(this);
	}

	toString() {
		return this.name;
	}

	/**
	 * Find an object by name
	 * @param name name to search for
	 * @returns an object matching the name, or null
	 */
	static Find(name: string) {
		return [...GameObject.register.values()].find((object) => object.name === name);
	}

	/**
	 * Find all objects by tag
	 * @param tag tag to search for
	 * @returns all objects matching the tag
	 */
	static FindAllWithTag(tag: string) {
		return [...GameObject.register.values()].filter((object) => object.tags.has(tag));
	}

	/**
	 * Get all game objects
	 * @returns all objects in the register
	 */
	static All() {
		return [...GameObject.register.values()];
	}
}
