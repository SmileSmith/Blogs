module.exports = {
    sum(a, b) {
        // see typeof pollfill  import
        if (typeof a === 'number' && typeof b === 'number') {
            return a + b;
        }
        return 0;
    },
    promise() {
        // Promise case polyfill
        return new Promise((resolve, reject) => {
            setTimeout(resolve, 3000);
        });
    }
}