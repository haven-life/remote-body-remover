function remote(value): any {
    return function (value) {}
}

class Person {
    @remote({on: 'server'})
    doSomething(): string {
        return 'yeah';
    }
}