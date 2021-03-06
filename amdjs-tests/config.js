//Map the configure({}) call to loader-specific call.
var config = require.config,

    //Map the top-level entry point to start loading to loader-specific call.
    go = require,

    //Indicate what levels of the API are implemented by this loader,
    //and therefore which tests to run.
    implemented = {
        basic: true,
        anon: true,
        funcString: true,
        namedWrapped: true,
        require: true,
        pathsConfig: true,
        plugins: true,
        // dumber-module-loader feature
        namedSpacedBundle: true
    };

//Remove the global require, to make sure a global require is not assumed
//in the tests
require = undefined;
