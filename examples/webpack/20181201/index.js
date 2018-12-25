import { use, nouse, } from './ESModule';
// import * as CommonJSModule from './CommonJSModule';
import CommonJSModule from './CommonJSModule';
// const CommonJSModule = require('./CommonJSModule');


// with babel-transform-runtime , CommonJSModule only track like ESModule(harmony modlue)


console.log(use);
CommonJSModule.promise().then(() => {
    console.log('promise in CommonJSModule');
});
