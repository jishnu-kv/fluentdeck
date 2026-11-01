import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

/**
 * High-performance public asset sync plugin.
 * Avoids Vite's slow recursive deletion and 37,000+ file copying on every single build.
 * Uses zero-cost filesystem junctions/symlinks for `icons` and `emoji`, while copying
 * lightweight assets (data, fonts, manifests) in milliseconds.
 */
function fastPublicSyncPlugin() {
	return {
		name: "fast-public-sync",
		buildStart() {
			// Clean only old hashed JS/CSS chunks in dist/assets to avoid stale assets
			const assetsDir = path.resolve(import.meta.dirname, "./dist/assets");
			if (fs.existsSync(assetsDir)) {
				try {
					fs.rmSync(assetsDir, { recursive: true, force: true });
				} catch (e) {
					console.warn("Could not remove dist/assets:", e);
				}
			}
		},
		closeBundle() {
			const dist = path.resolve(import.meta.dirname, "./dist");
			const pub = path.resolve(import.meta.dirname, "./public");
			if (!fs.existsSync(dist)) fs.mkdirSync(dist, { recursive: true });

			for (const item of fs.readdirSync(pub)) {
				const src = path.join(pub, item);
				const dest = path.join(dist, item);

				if (item === "icons" || item === "emoji") {
					// Use zero-cost filesystem junction/symlink for static icons & emojis
					if (!fs.existsSync(dest)) {
						try {
							const symlinkType = process.platform === "win32" ? "junction" : "dir";
							fs.symlinkSync(src, dest, symlinkType);
						} catch (e) {
							// Graceful fallback to copy if permissions prevent junction
							if (!fs.existsSync(dest)) {
								fs.cpSync(src, dest, { recursive: true });
							}
						}
					}
				} else {
					// Lightweight public assets (data, assets, manifest, robots, sw)
					try {
						fs.cpSync(src, dest, { recursive: true });
					} catch (e) {
						// Ignore if already copied
					}
				}
			}
		},
	};
}

export default defineConfig({
	plugins: [react(), fastPublicSyncPlugin()],
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "./src"),
		},
		// Ensures only one version of React is loaded, preventing hook errors
		dedupe: ["react", "react-dom"],
	},
	build: {
		// Disable Vite's default slow wipe and re-copy of all 37,000+ files
		emptyOutDir: false,
		copyPublicDir: false,

		// 1. Faster Transpilation: Target modern browsers
		target: "esnext",
		minify: "esbuild",
		cssMinify: true,

		// 2. Performance: Disable heavy calculation tasks
		reportCompressedSize: false,
		sourcemap: false,

		rollupOptions: {
			output: {
				// 3. Smart Chunking: Automatically splits node_modules into a separate file
				manualChunks(id) {
					if (id.includes("node_modules")) {
						return "vendor";
					}
				},
			},
		},
		// 4. Cleanup: Prevents build failure on large bundles
		chunkSizeWarningLimit: 1000,
	},
});