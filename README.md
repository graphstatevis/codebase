# GraphVis Application

[![GraphStateVis](https://github.com/GraphStateVis/codebase/blob/main/app/assets/gifs/graphvis_app.gif?raw=true)](https://graphstatevis.github.io/app)

## Installation

_Hint: the following installation commands assume you have [Node.js](https://nodejs.org/en/download/) and npm (included in Node.js) installed and have it available through PATH (when using Windows)._

```bash
git clone https://github.com/graphstatevis/codebase.git
cd codebase
cd app
npm install
```

## Run application development environment

GraphStateVis is a frontend-only application and does not use a database or require a backend at this point.

```bash
npm run development
```

The default URL of the project after running the app is typically `http://localhost:8082/`.  
The actual location on your machine will be printed to the console after running the above command.

## How to create a deployable version (e.g., on a server [as here](https://graphstatevis.github.io/app))

The following command must be executed in folder `./app/` to transpile all TypeScript files into a deployment version which will be available in the `./build` folder.

```bash
npm run production
```

By default, the app is reachable from the root folder of a domain: e.g., `https://anydomain.xyz/`

To change the folder (domain) to e.g. `https://anydomain.xyz/graphstatevis/`, the following code must be changed in the repository:

1. Open file `./app/webpack.config.ts`
2. Change variable `publicPath: '/'` to desired path (line 73 of this commit!) to `publicPath: '/graphstatevis/'`
3. Change variable `template: 'public/index.html'` to desired path (line 85 of this commit!) to `template: 'public/graphstatevis/index.html'`
4. To use this subfolder in development, all fles in folder `./public` must be copied to the resp. subfolder, here: `./public/graphstatevis`
5. Run `npm run production` (again)
6. Copy content of folder `./build/` on the webserver into the folder `https://anydomain.xyz/graphstatevis/`
7. DONE!
