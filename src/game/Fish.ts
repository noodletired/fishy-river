import { nanoid } from 'nanoid';
import { Graphics, type Ticker } from 'pixi.js';
import GameObject from 'lib/GameObject';
import Chain from 'lib/Chain';
import { Angle, Degrees, Vector } from 'lib/Vector';

type TrackTarget = GameObject | Vector;

/**
 * Fish object that moves with constrained spine.
 * Simplified from https://github.com/argonautcode/animal-proc-anim/blob/main/Fish.pde
 */
export class Fish extends GameObject {
	private spine: Chain;
	private bodyWidth = [68, 81, 84, 83, 77, 64, 51, 38, 32, 19];
	private graphics: Graphics;
	trackTowards?: TrackTarget | (() => TrackTarget);
	maxVelocity = 20 / 1000; // pixels per millisecond

	constructor(name = `fish-${nanoid(10)}`) {
		super(name, ['fish']);

		// 12 segments, first 10 for body, last 2 for caudal fin
		this.spine = new Chain(new Vector(), 12, 64, new Degrees(22.5));
	}

	/**
	 * Move the fish (and its controlling spine) to a new location.
	 * @param position head position
	 * @param angle angle between head and next joint
	 */
	Move(position: Vector, angle: Angle) {
		this.spine.joints[0].Set(position);
		this.spine.angles[0] = angle;
		this.position = position;
		this.angle = angle;
	}

	Update(ticker: Ticker): void {
		// Move a little bit towards the target location
		const trackTarget =
			typeof this.trackTowards === 'function' ? this.trackTowards() : this.trackTowards;
		const trackPosition = trackTarget instanceof GameObject ? trackTarget.position : trackTarget;
		if (trackPosition) {
			// Cap the displacement by max velocity
			const displacement = trackPosition.Copy().Subtract(this.position);
			const velocity = displacement.Copy().Divide(ticker.deltaMS);
			if (velocity.magnitude > this.maxVelocity) {
				displacement.magnitude = this.maxVelocity * ticker.deltaMS;
			}

			this.spine.Resolve(displacement.Add(this.position));
			this.position = this.spine.joints[0].Copy();
			this.angle = this.spine.angles[0];
		}
	}

	Render(ticker: Ticker) {}

	Destroy() {
		this.graphics.destroy();
	}
}
