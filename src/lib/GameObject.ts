import { Container, Matrix, type Application, type Ticker } from 'pixi.js';
import { Vector, Angle, Degrees } from './Vector';

/**
 * Abstract base class for all game objects to inherit from
 */
export default abstract class GameObject {
	private static register = new Set<GameObject>();

	protected app: Application;
	container = new Container();
	position: Vector;
	angle: Angle;
	scale: Vector;
	name: string;
	tags: Set<string>;
	disposed = false; // marked for removal

	constructor(app: Application, name = '', tags: Set<string> | string[] = []) {
		this.app = app;
		this.position = new Vector();
		this.scale = new Vector(1.0);
		this.angle = new Degrees(0);
		this.name = name;
		this.tags = new Set(tags);
		GameObject.register.add(this);
	}

	abstract Update(ticker: Ticker): void;

	/**
	 * Default render
	 */
	Render(ticker: Ticker /* eslint-disable-line */) {
		// FIXME: this calculation can be cached lol
		const matrix = Matrix.IDENTITY;
		matrix
			.scale(this.scale.x, this.scale.y)
			.rotate(this.angle.radians)
			.translate(this.position.x, this.position.y);
		this.container.setFromMatrix(matrix);
	}

	Dispose() {
		this.disposed = true;
	}

	Destroy() {
		GameObject.register.delete(this);
		this.container.destroy();
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
