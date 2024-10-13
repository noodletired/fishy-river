import { nanoid } from 'nanoid';
import { Application, Assets, MeshRope, Point, type Texture, type Ticker } from 'pixi.js';
import GameObject from 'lib/GameObject';
import Chain from 'lib/Chain';
import { Angle, Degrees, Vector } from 'lib/Vector';
import textureURI from 'assets/fish.png';

type TrackTarget = GameObject | Vector;

/**
 * Fish object that moves with constrained spine.
 * Simplified from https://github.com/argonautcode/animal-proc-anim/blob/main/Fish.pde
 */
export class Fish extends GameObject {
	private spine: Chain;
	private texture: Promise<Texture>; // TODO: use bundles and named thingos
	private graphics?: MeshRope;
	private mesh: Point[];
	trackTowards?: TrackTarget | (() => TrackTarget);
	maxVelocity = 20 / 1000; // pixels per millisecond

	constructor(app: Application, name = `fish-${nanoid(10)}`) {
		super(app, name, ['fish']);

		// 10 segments
		this.spine = new Chain(new Vector(), 10, 64, new Degrees(22.5));
		this.mesh = this.spine.joints.map(({ x, y }) => new Point(x, y));

		this.texture = Assets.load(textureURI);
		this.texture.then((texture) => {
			this.graphics = new MeshRope({ texture, points: this.mesh });
			this.app.stage.addChild(this.graphics);
			// this.container.addChild(this.graphics);
		});
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
}
