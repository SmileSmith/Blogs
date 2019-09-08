import { use, unuseFunc, } from './es.js';
import * as CommonJSModule from './cjs.js';
// const CommonJSModule = require('./CommonJSModule'); // also Good

// import CommonJSModule from './CommonJSModule'; // Bad，new babel dosen't export default


// with babel-transform-runtime , CommonJSModule default treated like ESModule(harmony modlue)


console.log(use);
CommonJSModule.promise().then(() => {
    console.log('promise in CommonJSModule');
});
