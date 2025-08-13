import {
	Application,
	Container,
	defaultFilterVert,
	Filter,
	GlProgram,
	RenderTexture,
	Sprite,
	type ApplicationOptions
} from 'pixi.js';
import GameObject from 'lib/GameObject';
import { Fish } from './Fish';
import { Vector } from 'lib/Vector';
import xbrzFilterFrag from 'assets/xbrzFilter.frag?raw';

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

		app.renderer.render({
			container: renderContainer,
			target: renderTexture,
			clear: true,
			clearColor: options?.background
		});
	});

	// Put everything in one top-level container "renderContainer"
	// which gets rendered to "renderTexture" at a lower resolution,
	// then upscaled for crunchy pixels
	const renderScale = 0.15;
	const renderContainer = new Container();
	renderContainer.scale = renderScale;
	renderContainer.filters = [
		new Filter({
			// Post-processing for fish pixels
			// e.g. Rim lighting
			glProgram: new GlProgram({
				fragment: `
					in vec2 vTextureCoord;
					uniform sampler2D uTexture;
					uniform highp vec4 uInputSize;
					uniform mediump vec4 uRimLightColor;

					void main()
					{
						// One texel size
						vec2 tx = vec2(1.0, 1.0) / uInputSize.xy;

						// Sample current texel
						vec4 cTx = texture2D(uTexture, vTextureCoord);

						// Sample the texel above
						vec4 tTx = texture2D(uTexture, vTextureCoord + tx * vec2(0.0, -1.0));

						// Highlight if top or right has 0 alpha and we aren't
						if (tTx.a < 0.1 && cTx.a >= 0.1) {
							gl_FragColor = uRimLightColor;
						} else {
							gl_FragColor = cTx;
						}
					}
				`,
				vertex: defaultFilterVert
			}),
			resources: {
				uniforms: {
					uRimLightColor: {
						type: 'vec4<f32>',
						value: [0.5, 1.0, 0.8, 1.0]
					}
				}
			}
		})
	];

	const renderTexture = RenderTexture.create({
		width: app.screen.width * renderScale, // FIXME: this does not resize with window size
		height: app.screen.height * renderScale,
		scaleMode: 'nearest',
		antialias: false,
		autoGenerateMipmaps: false
	});
	const renderSprite = new Sprite(renderTexture);
	renderSprite.scale = 1 / renderScale; // scale back up!
	renderSprite.filters = [
		new Filter({
			// Screen shader
			glProgram: new GlProgram({
				fragment: xbrzFilterFrag,
				vertex: defaultFilterVert
			}),
			resources: {
				uniforms: {
					uInputScale: {
						type: 'f32',
						value: renderScale
					}
				}
			}
		})
	];
	app.stage.addChild(renderSprite);

	// FIXME: DEBUG
	const mouse = new Vector();
	app.stage.eventMode = 'static';
	app.stage.hitArea = app.screen;
	app.stage.on('mousemove', (event) => {
		mouse.x = event.global.x;
		mouse.y = event.global.y;
	});

	const fish = new Fish(app);
	renderContainer.addChild(fish.container);
	fish.trackTowards = mouse;

	return app;
}
