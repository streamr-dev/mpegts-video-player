export class MovingAverageCalculator {
    constructor(maxLength) {
        this.maxLength = maxLength;
        this.numbers = [];
    }

    addNumber(number) {
        this.numbers.push(number);
        if (this.numbers.length > this.maxLength) {
            this.numbers.shift(); // Remove the oldest number
        }
    }

    calculateAverage() {
        const sum = this.numbers.reduce((acc, val) => acc + val, 0);
        return sum / this.numbers.length;
    }
}

