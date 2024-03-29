# GraphStateVis Application

[![GraphStateVis](https://github.com/GraphStateVis/codebase/blob/main/app/assets/gifs/graphvis_app.gif?raw=true)](https://graphstatevis.github.io/app)

## Installation

_Hint: the following installation commands assume you have [Node.js](https://nodejs.org/en/download/) and npm (included in Node.js) installed and have it available through PATH (when using Windows)._

The following code can be run on windows from Git Bash Terminal:

```bash
git clone https://github.com/graphstatevis/codebase.git
cd codebase
./run-development.sh
```

## Run application development environment

GraphStateVis is a frontend-only application and does not use a database or require a backend at this point.

```bash
cd app
npm install
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

## Citing this paper that is related to this prototype

```bibtex
@inproceedings{miller2021graphstatevis,
  author    = {Matthias Miller and Daniel Miller},
  booktitle = {{IEEE} International Conference on Quantum Computing and Engineering ({QCE})},
  title     = {{GraphStateVis: Interactive Visual Analysis of Qubit Graph States and their Stabilizer Groups}}, 
  year      = {2021},
  pages     = {378--384},
  publisher = {{IEEE}},
  doi       = {10.1109/QCE52317.2021.00057}
}
```

## License
Released under MIT License. See the [LICENSE](LICENSE) file for details. The prototype was developed by Matthias Miller from the [Data Analysis and Visualization Group](https://www.vis.uni-konstanz.de/) at the University Konstanz.
