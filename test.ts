function remote(value: any): any {
    return function (value: any) {}
}

class Person {
    @remote({on: 'server'})
    doSomething(): string {
        return 'yeah';
    }
}