import GameObject from 'lib/GameObject';
import { nanoid } from 'nanoid';
import { Graphics, type Application, type Ticker } from 'pixi.js';

const MIN_BASE_SIZE = 20;
const MAX_BASE_SIZE = 50;
const BOUNCE_EFFECT = 0.15;
const WIGGLE_EFFECT = 0.05;

export class Plant extends GameObject {
	initialSize = 0;
	size = 0;
	bounce = 0;
	wiggleFrequency = 1; // 1 wiggle / second
	wigglePhase = 0;
	lifetime = 0;
	lastResizeTime = 0;
	growInterval = 0;
	deadSize = 10;

	constructor(app: Application, name = `plant-${nanoid(10)}`) {
		super(app, name, ['plant']);
		this.size = Math.random() * (MAX_BASE_SIZE - MIN_BASE_SIZE) + MIN_BASE_SIZE;
		this.growInterval = Math.random() * 500 + 500; // 0.5-1 second
		this.initialSize = this.size;
		this.container = new Graphics().circle(0, 0, this.size / 2).fill('#204526');
		this.wiggleFrequency = 2.0 * Math.random() + 1.0;
		this.wigglePhase = Math.random() * Math.PI;
	}

	Eat() {
		this.lastResizeTime = this.lifetime;
		this.size--;
		if (this.size <= this.deadSize) {
			console.debug('Plant eaten', this);
			this.Dispose();
			return;
		}

		// Make it bounce
		if (this.bounce <= 0) {
			this.bounce = BOUNCE_EFFECT;
		}
	}

	Grow() {
		this.lastResizeTime = this.lifetime;
		if (this.size < this.initialSize) {
			this.size++;
		}
	}

	Update(ticker: Ticker): void {
		this.lifetime += ticker.deltaMS;

		if (this.size > this.deadSize && this.lifetime > this.lastResizeTime + this.growInterval) {
			this.Grow();
		}

		if (this.bounce > 0) {
			this.bounce = Math.max(0, this.bounce - (0.5 * ticker.deltaMS) / 1000); // scale down linearly by 50%/sec
		}

		const wiggle =
			WIGGLE_EFFECT * Math.sin((this.wiggleFrequency * this.lifetime) / 1000 + this.wigglePhase);

		this.scale.Set(Math.max(this.size / this.initialSize + this.bounce + wiggle, 0));
	}
}
