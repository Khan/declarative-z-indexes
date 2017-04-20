# Declarative z-indexes _(declarative-z-indexes)_

> Prevent z-index conflicts by generating them from declarative constraints

Have you ever struggled with exponential z-index wars? Have you ever changed a
z-index only to find that you now need to change several others? Then
declarative z-indexes are for you.

Instead of writing each z-index separately, you write out all of the different
relationships between your z-index layers. Then, suitable z-indexes are
generated for each of the layers. Easy as pie!

## Table of Contents

 - [Background](#background)
 - [Install](#install)
 - [Usage](#usage)
 - [API](#api)
   - [`LayerSolver`](#layersolver)
   - [`Layer`](#layer)
 - [Contribute](#contribute)
 - [License](#license)

## Background

The idea for this library originally came from UIKit's Auto Layout constraints.

## Install

Install using npm:

```
npm install declarative-z-indexes
```

## Usage

First, create a solver using the exported `LayerSolver` class

```js
const solver = new LayerSolver();
```

Then, create some layers to be solved for

```js
const body = solver.addLayer("body");
const header = solver.addLayer("header");
const modal = solver.addLayer("modal");
```

Add constraints between your layers

```js
header.isAbove(body);

modal.isAbove(body);
modal.isAbove(header);
```

And finally, generate your z-indexes!

```js
const solution = solver.solve(); // {body: 1, header: 2, modal: 3}
```

Note: Don't depend on the actual z-index values that are produced! The
generated z-indexes will always satisfy the constraints but the literal values
might change in future versions of this library. For instance, in the future
`solver.solve()` might return something else like `{body: 100, header: 150, modal: 200}`
if the generating algorithm is changed.

Use the generated z-indexes in inline styles

```jsx
<body>
  <header style={{ position: "absolute", zIndex: solution.header }}>
  </header>

  <article style={{ zIndex: solution.body }}>
  </article>
</body>
```

## API

### `LayerSolver`

`LayerSolver` is the default export of `declarative-z-indexes`.

 - `addLayer(name: string): Layer`  
   The `addLayer` method returns a new dynamic layer to be solved for. The same
   name cannot be reused for multiple layers.

 - `addStaticLayer(name: string, index: number): Layer`  
   The `addStaticLayer` method returns a new static layer. Static layers have a
   static z-index that will be used when solving the constraints for the
   dynamic layers.

   Example uses cases for static layers might be external library z-indexes
   that cannot be modified.

   ```js
   const solver = new LayerSolver();

   const modal = solver.addStaticLayer('bootstrapModal', 1000);
   const modalDecoration = solver.addLayer('modalDecoration');

   modalDecoration.isAbove(modal);

   solver.solve(); // {bootstrapModal: 1000, modalDecoration: 1001}
   ```

   (Note again: the resulting value of `bootstrapModal` will always be `1000`,
   but don't depend on `modalDecoration` being `1001`! Its value will be above
   `1000` but the literal value might change in a future version of the
   library)

 - `solve(): {[layer: string]: number}`  
  The `solve` method solves the current constraints on the dynamic layers and
  returns a map-like object from each layer's name to the generated z-index
  value.

   `solve` is idempotent: every time you call it, `solve` generates a brand new
   solution based on the constraints currently stored in the solver. It's safe
   to call solve multiple times and even add new constraints between calls
   without affecting past solutions.

### `Layer`

A `Layer` is the object that is used to specify constraints in the system. It
is returned from a `LayerSolver`'s `addLayer` and `addStaticLayer` methods.

 - `isAbove(layer: Layer)`  
   The `isAbove` method adds a constraint that the current layer should be
   above the passed in layer.

 - `isBelow(layer: Layer)`  
   The `isBelow` method adds a constraint that the current layer should be
   below the passed in layer.

## Contribute

The initial design and API of this library is still being created! Once that is
done, we'll start taking contributions. Until then, hold tight!

## License

[MIT](./LICENSE)
