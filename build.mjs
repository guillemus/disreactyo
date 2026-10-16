import * as esbuild from "esbuild"

const watch = process.argv.includes("--watch")

const ctx = await esbuild.context({
  entryPoints: ["frontend/src/main.ts"],
  outfile: "public/static/app.js",
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: !watch,
  sourcemap: watch ? "inline" : "linked",
  loader: { ".css": "text" },
  jsx: "automatic",
  define: { "process.env.NODE_ENV": JSON.stringify(watch ? "development" : "production") },
  logLevel: "info",
})

if (watch) {
  await ctx.watch()
} else {
  await ctx.rebuild()
  await ctx.dispose()
}
