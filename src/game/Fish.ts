import { nanoid } from 'nanoid';
import { Application, Assets, MeshRope, Point, type Texture, type Ticker } from 'pixi.js';
import GameObject from 'lib/GameObject';
import Chain from 'lib/Chain';
import { Angle, Degrees, Radians, Vector } from 'lib/Vector';
import textureURI from 'assets/fish.png';
import { EnergizedState, State, StateMachine } from 'lib/State';

type TrackTarget = GameObject | Vector;

/**
 * Possible states for the fish to be in.
 */
type States =
	| 'explore' // swimming in a random direction
	| 'rush' // zooms towards target
	| 'feed' // kisses target
	| 'flee'; // runs from target

class ExploringState extends EnergizedState {
	private startPosition = new Vector();
	private direction = new Vector(); // random spot to explore
	private maxDistance = 10;

	constructor(private parent: Fish) {
		const minEnergy = 1 * 1000;
		const maxEnergy = 5 * 1000;
		super(minEnergy, maxEnergy);
	}

	Enter(): void {
		this.direction = new Vector(Math.random() - 0.5, Math.random() - 0.5).Normalise().Multiply(10);
		this.startPosition.Set(this.parent.position);
		super.Enter();
	}

	Update(ticker: Ticker): void {
		// Check if max distance has been reached
		const distance = this.parent.position.Distance(this.startPosition);
		if (distance > this.maxDistance) {
			// Decelerate naturally, then explore again
			if (this.parent.velocity < this.parent.maxVelocity / 100) {
				this.Tired();
			}
		} else {
			// Rush but... slowish!
			this.parent.RushTo(this.parent.position.Copy().Add(this.direction), ticker);
			this.parent.velocity = Math.min(this.parent.velocity, this.parent.maxVelocity) / 2;
			this.parent.angularVelocity =
				Math.min(this.parent.angularVelocity, this.parent.maxAngularVelocity) / 2;
		}

		// TODO: look for areas of interest with raycasts

		super.Update(ticker);
	}

	Tired(): void {
		this.parent.stateMachine.Change('explore');
	}
}

class RushingState extends EnergizedState {
	// energy is measured in milliseconds, when depleted we change state
	private minVelocity = 0;
	private slowRadius = 150; // pixels, when fish is inside this radius it slows and homes in directly on target
	private stopRadius = 10; // pixels, when fish is close enough it stops to feed
	private noiseOffsetRadius = 100; // pixels, should be smaller than slowRadius
	private noiseOffset = new Vector();

	constructor(private parent: Fish) {
		const minEnergy = 3 * 1000;
		const maxEnergy = 10 * 1000;
		super(minEnergy, maxEnergy);
	}

	Enter(): void {
		this.minVelocity = this.parent.maxVelocity / 5;
		this.noiseOffset = new Vector(Math.random(), Math.random())
			.Normalise()
			.Multiply(this.noiseOffsetRadius);
		super.Enter();
	}

	Update(ticker: Ticker): void {
		// If we have no target, just explore randomly!
		if (!this.parent.trackTowards) {
			this.parent.stateMachine.Change('explore');
			return;
		}

		// Move a little bit towards the target location
		const trackTarget =
			typeof this.parent.trackTowards === 'function'
				? this.parent.trackTowards.call(this.parent)
				: this.parent.trackTowards;
		const trackPosition = (
			trackTarget instanceof GameObject ? trackTarget.position : trackTarget
		).Copy();

		// Transition to feeding state if close
		const trackDistance = trackPosition.Distance(this.parent.position);
		if (trackDistance < this.stopRadius) {
			this.parent.stateMachine.Change('feed');
			return;
		}

		// Add random noise so not all fish converge
		// TODO: do something a little more sophisticated so fish don't overlap
		if (trackDistance > this.slowRadius) {
			trackPosition.Add(this.noiseOffset);
		}

		// Try to move the fish
		this.parent.RushTo(trackPosition, ticker);

		if (trackDistance <= this.slowRadius) {
			// Scale that velocity down based on distance
			const t = trackDistance / this.slowRadius;
			this.parent.velocity = Math.min(this.parent.velocity, this.parent.maxVelocity) * t;
			// TODO: transition to fleeing if too many nearby fish
		}

		if (this.parent.velocity < this.minVelocity) {
			// Ensure the fishy keeps moving around
			this.parent.velocity = this.minVelocity;
		}
		super.Update(ticker);
	}

	Tired() {
		this.parent.stateMachine.Change('explore');
	}
}

class FeedingState extends EnergizedState {
	constructor(private parent: Fish) {
		const minEnergy = 2 * 1000;
		const maxEnergy = 5 * 1000;
		super(minEnergy, maxEnergy);
	}

	Update(ticker: Ticker): void {
		// Rapidly decrease velocity (80% / sec)
		this.parent.velocity *= Math.max(1 - (ticker.deltaMS / 1000) * 0.8, 0);
		this.parent.angularVelocity *= Math.max(1 - (ticker.deltaMS / 1000) * 0.8, 0);

		super.Update(ticker);
	}

	Tired() {
		this.parent.stateMachine.Change('explore');
	}
}

class FleeingState extends State {
	constructor(private parent: Fish) {
		super();
	}

	Update(ticker: Ticker): void {}
}

/**
 * Fish object that moves with constrained spine.
 * Simplified from https://github.com/argonautcode/animal-proc-anim/blob/main/Fish.pde
 */
export class Fish extends GameObject {
	private spine: Chain;
	private texture: Promise<Texture>; // TODO: use bundles and named thingos
	private graphics?: MeshRope;
	private mesh: Point[];
	lifetime = 0; // seconds
	stateMachine: StateMachine<States>;

	trackTowards?: TrackTarget | ((this: Fish) => TrackTarget);

	velocity = 0;
	angularVelocity = 0;
	maxVelocity = 200 / 1000; // pixels per millisecond
	maxAngularVelocity = (1.5 * Math.PI) / 1000; // radians per millisecond

	maxSpineAngle = new Degrees(22); // max angle between segments
	spineSegmentLength = 10;

	constructor(app: Application, name = `fish-${nanoid(10)}`) {
		super(app, name, ['fish']);

		// 10 segments
		this.spine = new Chain(new Vector(), 10, this.spineSegmentLength, this.maxSpineAngle);
		this.mesh = this.spine.joints.map(({ x, y }) => new Point(x, y));

		this.texture = Assets.load(textureURI);
		this.texture.then((texture) => {
			this.graphics = new MeshRope({ texture, points: this.mesh });
			this.container.addChild(this.graphics);
		});

		this.stateMachine = new StateMachine<States>(
			[
				['explore', new ExploringState(this)],
				['rush', new RushingState(this)],
				['feed', new FeedingState(this)],
				['flee', new FleeingState(this)]
			],
			'rush'
		);
	}

	/**
	 * Set the position of the fish (and its controlling spine) to a new location.
	 * @param position head position
	 * @param angle angle between head and next joint
	 */
	SetPosition(position: Vector, angle: Angle) {
		this.spine.joints[0].Set(position);
		this.spine.angles[0] = angle;
		this.position = position;
		this.angle = angle;
	}

	Render() {
		// override default renderer
	}

	Update(ticker: Ticker): void {
		this.lifetime += ticker.deltaMS / 1000;
		this.stateMachine.Update(ticker);
		this.ApplyConstraints();
		this.Wiggle();
		this.ApplyPhysics(ticker);
		// TODO: add collision checks with raycasts to other fish

		// Update the mesh
		for (let i = 0; i < this.mesh.length; i++) {
			this.mesh[i].copyFrom(this.spine.joints[i]);
		}
	}

	Destroy() {
		if (this.graphics) {
			this.graphics?.destroy();
		} else {
			this.texture.finally(() => {
				this.graphics!.destroy();
			});
		}

		super.Destroy();
	}

	ApplyConstraints() {
		// Apply constraints to velocity and angular velocity
		if (this.velocity > this.maxVelocity) {
			this.velocity = this.maxVelocity;
		}
		if (Math.abs(this.angularVelocity) > this.maxAngularVelocity) {
			const sign = this.angularVelocity > 0 ? 1 : -1;
			this.angularVelocity = sign * this.maxAngularVelocity;
		}
	}

	ApplyPhysics(ticker: Ticker) {
		// Compute displacement vector from velocities
		const displacement = new Vector(1, 0)
			.Multiply(this.velocity * ticker.deltaMS)
			.Rotate(new Radians(this.angle.radians + this.angularVelocity * ticker.deltaMS));

		// Apply to spine
		this.spine.Resolve(displacement.Add(this.position));
		this.position = this.spine.joints[0].Copy();
		this.angle = this.spine.angles[0];

		// Apply friction
		// Just a basic %/sec decay
		this.velocity *= 1.0 - (ticker.deltaMS / 1000) * 0.4; // 40%
		this.angularVelocity *= 1.0 - (ticker.deltaMS / 1000) * 0.7; // 70%
	}

	RushTo(targetPosition: Vector, ticker: Ticker): void {
		if (targetPosition) {
			// Cap the displacement by max velocity
			const displacement = targetPosition.Copy().Subtract(this.position);
			this.velocity = displacement.magnitude / ticker.deltaMS;

			// Cap the difference between the target angle and current angle to max angle
			const angleDelta = displacement.angle.Difference(this.angle);
			this.angularVelocity = angleDelta.radians / ticker.deltaMS;
		}
	}

	Wiggle(): void {
		// Move the midjoint back and forth, scaled in intensity and frequency by velocity
		this.spine.joints[5].Rotate(
			new Radians(
				((((this.velocity / this.maxVelocity) ** 2 * this.maxSpineAngle.radians) / 20) *
					Math.sin(this.velocity * 150 * this.lifetime)) /
					Math.PI
			)
		);
	}
}
