# Augmented compileShader
Augmented WebGLRenderingContext.prototype.compileShader

[![npm](https://img.shields.io/npm/v/augmented-compile-shader.svg)](https://www.npmjs.com/package/augmented-compile-shader)

Small library to augment compileShader and provide an output of the errors directly in the DOM, instead of dumping all data in the console.

#### Demo ####
- **[Live shader editor](https://spite.github.io/AugmentedCompileShader.js/demo/)**: a fragment shader compiled as you type, with its errors reported at the top of the page

![working](https://www.clicktorelease.com/blog/shader-error-log/dom-report.jpg)

You can read more about this in [Using hooks to make development of shaders a bit easier](https://www.clicktorelease.com/blog/using-hooks-for-easier-development-webgl-glsl)

#### 2026 update ####
**Disclaimer:** this library is from 2015. It's a development aid: it asks for the result of every compilation right away, which is slower than letting the browser compile in the background, so don't ship it

If you use three.js, it has had `renderer.debug.onShaderError` since r151 (2023), a callback that receives the program and the shaders that failed, to report them your own way. Without it three.js prints the error to the console, with the lines around it. Neither puts the error in the page, and neither works outside of three.js, which is what this library is for.

The library has been updated. What changed from the 2015 version:

- it's an ES module
- it works with WebGL 2, which is what three.js and most of the current code use. It used to hook WebGL 1 only
- the report says if the error is in the vertex or in the fragment shader
- errors that only show up when linking the program are reported too, like a varying that the vertex shader doesn't write
- the code of the shader is shown as text. It used to be added as HTML, so a line with a ```<``` could break the report
- there's one report in the page, and an error is listed once. Each shader that failed used to add another report with the same id
- an error log without line numbers is shown whole, and a line number outside of the source doesn't throw anymore
- a lost context is not reported as an error
- there's ```clear()``` to remove the report, and ```uninstall()``` to remove the hooks

#### How to use ####
Use npm to install it
```
npm i augmented-compile-shader
```
and import it in your code, before any shader is compiled
```js
import 'augmented-compile-shader';
```
That's all: from then on, the shaders that fail to compile in any WebGL context of the page are listed at the top of it. It's a plain ES module, so it also works without a bundler (see [demo/index.html](demo/index.html)).

It works with anything that ends up calling ```compileShader```, three.js included.

The report stays in the page. To remove it, for instance before compiling a new version of a shader:
```js
import { clear } from 'augmented-compile-shader';

clear();
```
To stop reporting, and to start again:
```js
import { install, uninstall } from 'augmented-compile-shader';

uninstall();
install();
```

As always: forks, pull requests and code critiques are welcome!

#### License ####

MIT licensed

Copyright (C) 2015 Jaume Sanchez Elias, http://www.clicktorelease.com
