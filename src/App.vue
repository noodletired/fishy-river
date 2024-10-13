<template>
	<canvas ref="canvas"></canvas>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { CreateGame } from 'game/Game';
import type { Application } from 'pixi.js';

const app = ref<Application | null>(null);
const canvas = ref<HTMLCanvasElement>();

onMounted(async () => {
	app.value = await CreateGame({ canvas: canvas.value, resizeTo: window, background: '#1099bb' });
});
</script>
