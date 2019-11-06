// supertype decorator stub
function supertypeClass(): any {
    return function () {}
}

// remote decorator stub
function remote(value: any): any {
    return function (value: any) {}
}

@supertypeClass()
class Person {

    @remote({on: 'server'})
    doSomethingOnServer(): string {
        return 'yeah';
    }

    @remote({on: 'client'})
    doSomethingOnClient(): string {
        return 'nah';
    }

    doSomethingLocally(): string {
        return 'sure';
    }
}