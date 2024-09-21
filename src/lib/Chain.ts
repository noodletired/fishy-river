import { Angle, Radians, Vector } from './Vector';

/**
 * Enforces a vector cannot exceed maximum distance from an anchor point.
 * @param vector vector to constrain
 * @param anchor anchor position to compare
 * @param constraint distance limit
 * @returns new limited vector
 */
export function ConstrainDistance(vector: Vector, anchor: Vector, constraint: number) {
	if (anchor.Distance(vector) <= constraint) {
		return vector.Copy();
	} else {
		return vector.Copy().Normalise().Multiply(constraint);
	}
}

/**
 * Enforces an angle cannot exceed maximum distance from an anchor angle.
 * @param angle angle to constrain
 * @param anchor angle to compare
 * @param constraint angle difference limit
 * @returns new Radians limited angle
 */
export function ConstrainAngle(angle: Angle, anchor: Angle, constraint: Angle) {
	const differenceRads = angle.Difference(anchor).radians;
	const constraintRads = constraint.radians;
	if (Math.abs(differenceRads) <= constraintRads) {
		return new Radians(angle.radians);
	} else if (differenceRads > constraintRads) {
		return new Radians(angle.radians - constraintRads);
	} else {
		return new Radians(angle.radians + constraintRads);
	}
}

/**
 * Chain to represent a constrained chain body.
 * Translated from Java example here: https://github.com/argonautcode/animal-proc-anim/
 */
export default class Chain {
	joints: Vector[] = [];
	jointDistance: number; // space between joints
	angles: Angle[] = [];
	angleLimit: Angle; // max angle difference between joints

	constructor(
		origin: Vector,
		jointCount: number,
		jointDistance: number,
		angleLimit = new Radians(Math.PI * 2)
	) {
		this.jointDistance = jointDistance;
		this.angleLimit = angleLimit;

		// Create joints
		this.joints.push(origin.Copy());
		this.angles.push(new Radians(0));
		for (let i = 1; i < jointCount; i++) {
			this.joints.push(this.joints[i - 1].Copy().Add({ x: 0, y: jointDistance }));
			this.angles.push(new Radians(0));
		}
	}

	Resolve(position: Vector) {
		this.angles[0] = position.Copy().Subtract(this.joints[0]).angle;
		this.joints[0] = position.Copy();
		for (let i = 0; i < this.joints.length - 1; i++) {
			const currentAngle = this.joints[i - 1].Copy().Subtract(this.joints[i]).angle;
			this.angles[i] = ConstrainAngle(currentAngle, this.angles[i - 1], this.angleLimit);
			this.joints[i].Set(
				this.joints[i - 1].Copy().Subtract(Vector.FromAngle(this.angles[i], this.jointDistance))
			);
		}
	}

	ResolveFABRIK(position: Vector, anchor: Vector) {
		// Forward pass
		this.joints[0] = position.Copy();
		for (let i = 1; i < this.joints.length - 1; i++) {
			this.joints[i] = ConstrainDistance(this.joints[i], this.joints[i - 1], this.jointDistance);
		}

		// Backward pass
		this.joints[this.joints.length - 1] = anchor.Copy();
		for (let i = this.joints.length - 2; i >= 0; i--) {
			this.joints[i] = ConstrainDistance(this.joints[i], this.joints[i + 1], this.jointDistance);
		}
	}
}
