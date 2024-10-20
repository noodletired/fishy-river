/**
 * Utility class to easily manage angles in radians and degrees.
 */
export abstract class Angle {
	static PI = Math.PI;
	protected value = 0; // store in degrees

	/**
	 * Normalises degrees to [0, 360), radians to (-pi, pi]
	 */
	private Normalise(value: number, degrees: boolean): number {
		if (degrees) {
			value %= 360;
			if (value < 0) {
				value += 360;
			}
		} else {
			while (value < -Angle.PI) {
				value += 2 * Angle.PI;
			}
			while (value >= Angle.PI) {
				value -= 2 * Angle.PI;
			}
		}
		return value;
	}

	/**
	 * Gets difference to an anchor, i.e. how many degrees/radians to turn to match the anchor
	 * @param anchor anchor angle to compare to
	 */
	Difference(anchor: Angle) {
		return new Radians(this.radians - anchor.radians);
	}

	/**
	 * Gets angle in degrees from 0 to 360.
	 */
	get degrees(): number {
		return this.Normalise(this.value, true);
	}

	set degrees(degrees: number) {
		this.value = degrees;
	}

	/**
	 * Gets angle in radians from -pi to pi.
	 */
	get radians(): number {
		return this.Normalise((this.value / 180.0) * Angle.PI, false);
	}

	set radians(radians: number) {
		const degrees = (radians * 180.0) / Angle.PI;
		this.value = degrees;
	}
}

/**
 * Semantic helper class to construct Angle with degrees.
 */
export class Degrees extends Angle {
	constructor(value: number) {
		super();
		this.degrees = value;
	}
}

/**
 * Semantic helper class to construct Angle with radians.
 */
export class Radians extends Angle {
	constructor(value: number) {
		super();
		this.radians = value;
	}
}
