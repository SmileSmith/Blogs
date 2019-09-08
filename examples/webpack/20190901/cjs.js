
// class cause polyfill
class Class {}

module.exports = {
    sum(a, b) {
        if (typeof a === 'number' && typeof b === 'number') {
            return a + b;
        }
        return 0;
    },
    promise() {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, 3000);
        });
    },
    Class
}
