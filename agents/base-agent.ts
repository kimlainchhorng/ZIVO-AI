class BaseAgent {
    constructor(name) {
        this.name = name;
    }
    start() {
        console.log(`${this.name} is starting.`);
    }
}

module.exports = BaseAgent;