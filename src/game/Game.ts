import { Application, type ApplicationOptions } from 'pixi.js';
import GameObject from 'lib/GameObject';
import { Fish } from './Fish';
import { Vector } from 'lib/Vector';

/**
 * Create a new PixiJS App
 * @param options Application creation options
 * @returns application
 */
export async function CreateGame(options?: Partial<ApplicationOptions>) {
	const app = new Application();
	await app.init(options ?? {});
	app.ticker.add((ticker) => {
		const objects = GameObject.All();
		objects.forEach((object) => object.Update(ticker));
		objects.forEach((object) => object.Render(ticker));
	});

	// FIXME: DEBUG
	const mouse = new Vector();
	app.stage.eventMode = 'static';
	app.stage.hitArea = app.screen;
	app.stage.on('mousemove', (event) => {
		mouse.x = event.global.x;
		mouse.y = event.global.y;
	});

	const fish = new Fish(app);
	fish.trackTowards = mouse;

	return app;
}
