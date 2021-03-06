# Project 3

To view this project, open `dist/index.html`. Alternatively, it may be viewed
online [here](https://jirassimok.github.io/fictional-giggle/). If it is not
online, send me an email.

To build this project, use `npm run build`. The project will build as
`index.html` in `dist`.

To run this project as a local web server, use `npm run dev`. It will be visible
at `http://localhost:1234`.

## Source Structure

Most of the functions in the source code are documented in their files.

The following files are of particular note:

## `model.js`

The mobile model is constructed in this file. Editing it would allow arbitrary
mobiles to be made easily.

## `Mobile.js`

This file contains the `Mobile` class, which contains and draws the meshes and
arms of a Mobile.

## `setup.js`

This file contains initial WebGL setup.

## `main.js`

This file sets up the world to draw, and renders it.

It contains the code that provides the light, and allows drawing of the light
source.

## `shader.vert`

The vertex shader allows for either drawing with a cosntant color or
vertex-based shading, and can pass data to the fragment shader for fragment
shading.

## `shader.frag`

The fragment shader can use a constant color or a color provided by the vertex
shader, or it can perform lighting calculations for fragment (Phong) shading.

## JSON files

The included JSON files represent the data of various meshes in a format similar
to that found in PLY files. They essentially represent a JSON serialization of
the mesh from a PLY file.
