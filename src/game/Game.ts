import { Application, type ApplicationOptions } from 'pixi.js';
import GameObject from 'lib/GameObject';

/**
 * Create a new PixiJS App
 * @param options
 * @returns
 */
export async function CreateGame(options: Partial<ApplicationOptions>) {
	const app = new Application();
	await app.init(options);
	app.ticker.add((ticker) => {
		const objects = GameObject.All();
		objects.forEach((object) => object.Update(ticker));
		objects.forEach((object) => object.Render(ticker));
	});
	return app;
}
