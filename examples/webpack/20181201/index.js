import { use, nouse, } from './ESModule';
import * as CommonJSModule from './CommonJSModule';
// const CommonJSModule = require('./CommonJSModule'); // also Good

// import CommonJSModule from './CommonJSModule'; // Bad，new babel dosen't export default


// with babel-transform-runtime , CommonJSModule default treated like ESModule(harmony modlue)


console.log(use);
CommonJSModule.promise().then(() => {
    console.log('promise in CommonJSModule');
});
