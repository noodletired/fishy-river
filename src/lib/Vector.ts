import { Angle, Degrees, Radians } from './Angle';

export type VectorLike = { x: number; y: number };
export type ScalarOrVectorLike = number | VectorLike;

export { Angle, Degrees, Radians };

/**
 * A 2D numeric vector.
 */
export class Vector implements VectorLike {
	x: number;
	y: number;

	constructor(x: number, y: number);
	constructor(scalar: number);
	constructor(vector: VectorLike);
	constructor(); // zeros vector
	constructor(...args: [VectorLike | number] | [number, number] | []) {
		let x: number, y: number;
		if (args.length === 0) {
			x = 0;
			y = 0;
		} else if (args.length === 2) {
			[x, y] = args;
		} else if (typeof args[0] === 'number') {
			y = x = args[0] as number;
		} else {
			({ x, y } = args[0] as VectorLike);
		}

		this.x = x;
		this.y = y;
	}

	get magnitude(): number {
		return Math.sqrt(this.x ** 2 + this.y ** 2);
	}

	get angle(): Angle {
		return new Radians(Math.atan2(this.y, this.x));
	}

	toString(): string {
		return `Vector(${this.x}, ${this.y})`;
	}

	toArray(): [number, number] {
		return [this.x, this.y];
	}

	toPlainObject(): VectorLike {
		return { x: this.x, y: this.y };
	}

	/**
	 * Vectorise
	 * Helper to turn any argument into a vector.
	 */
	private Vectorise(arg: ScalarOrVectorLike): Vector {
		if (arg instanceof Vector) {
			return arg;
		} else if (typeof arg === 'number') {
			return new Vector(arg);
		} else {
			return new Vector(arg.x, arg.y);
		}
	}

	Set(arg: ScalarOrVectorLike): this {
		const { x, y } = this.Vectorise(arg);
		this.x = x;
		this.y = y;
		return this;
	}

	SetX(x: number): this {
		this.x = x;
		return this;
	}

	SetY(y: number): this {
		this.y = y;
		return this;
	}

	Add(arg: ScalarOrVectorLike): this {
		const { x, y } = this.Vectorise(arg);
		this.x += x;
		this.y += y;
		return this;
	}

	Subtract(arg: ScalarOrVectorLike): this {
		const { x, y } = this.Vectorise(arg);
		this.x -= x;
		this.y -= y;
		return this;
	}

	Multiply(arg: ScalarOrVectorLike): this {
		const { x, y } = this.Vectorise(arg);
		this.x *= x;
		this.y *= y;
		return this;
	}

	Divide(arg: ScalarOrVectorLike): this {
		const { x, y } = this.Vectorise(arg);
		this.x /= x;
		this.y /= y;
		return this;
	}

	Equals(arg: ScalarOrVectorLike): boolean {
		const { x, y } = this.Vectorise(arg);
		return this.x === x && this.y === y;
	}

	Greater(arg: ScalarOrVectorLike): boolean {
		const { x, y } = this.Vectorise(arg);
		return this.x > x && this.y > y;
	}

	GreaterOrEqual(arg: ScalarOrVectorLike): boolean {
		const { x, y } = this.Vectorise(arg);
		return this.x >= x && this.y >= y;
	}

	Less(arg: ScalarOrVectorLike): boolean {
		const { x, y } = this.Vectorise(arg);
		return this.x < x && this.y < y;
	}

	LessOrEqual(arg: ScalarOrVectorLike): boolean {
		const { x, y } = this.Vectorise(arg);
		return this.x <= x && this.y <= y;
	}

	Normalise(): this {
		const { magnitude } = this;
		if (magnitude === 0) {
			this.x = 1;
			this.y = 0;
			return this;
		}
		return this.Divide(magnitude);
	}

	Cardinalise(): this {
		this.x = Math.sign(this.x);
		this.y = Math.sign(this.y);
		return this;
	}

	Dot({ x, y }: VectorLike): number {
		return this.x * x + this.y * y;
	}

	Cross({ x, y }: VectorLike): number {
		return this.x * y - this.y * x;
	}

	Reverse(): this {
		return this.Multiply(-1);
	}

	ReverseX(): this {
		this.x *= -1;
		return this;
	}

	ReverseY(): this {
		this.y *= -1;
		return this;
	}

	Inverse(): this {
		this.x = 1 / this.x;
		this.y = 1 / this.y;
		return this;
	}

	Abs(): this {
		this.x = Math.abs(this.x);
		this.y = Math.abs(this.y);
		return this;
	}

	Zero(): this {
		this.x = this.y = 0;
		return this;
	}

	Distance({ x, y }: VectorLike): number {
		return Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
	}

	Rotate(angle: Angle): this {
		const { radians } = angle;
		const { x, y } = this;
		const cos = Math.cos(radians);
		const sin = Math.sin(radians);

		this.x = x * cos - y * sin;
		this.y = x * sin + y * cos;

		return this;
	}

	Round(n = 0): this {
		const precision = 10 ** n;

		// http://www.dynamicguru.com/javascript/round-numbers-with-precision/
		this.x = ((0.5 + this.x * precision) << 0) / precision;
		this.y = ((0.5 + this.y * precision) << 0) / precision;

		return this;
	}

	Floor(): this {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		return this;
	}

	Ceil(): this {
		this.x = Math.ceil(this.x);
		this.y = Math.ceil(this.y);
		return this;
	}

	Trunc(): this {
		this.x = Math.trunc(this.x);
		this.y = Math.trunc(this.y);
		return this;
	}

	Fract(): this {
		return this.Subtract(this.Copy().Trunc());
	}

	Copy(): Vector {
		return new Vector(this.x, this.y);
	}

	Clamp(min: VectorLike, max: VectorLike): this {
		if (this.x < min.x) {
			this.x = min.x;
		} else if (this.x > max.x) {
			this.x = max.x;
		}
		if (this.y < min.y) {
			this.y = min.y;
		} else if (this.y > max.y) {
			this.y = max.y;
		}

		return this;
	}

	static FromAngle(angle: Angle, distance = 1.0) {
		return new Vector({ x: 1, y: 0 }).Multiply(distance).Rotate(angle);
	}
}
