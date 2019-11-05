import * as ts from 'typescript';

function compile(fileNames: string[], options: ts.CompilerOptions): void {
    options.experimentalDecorators = true;
    let program = ts.createProgram(fileNames, options);
    let emitResult = program.emit(
        undefined,
        undefined,
        undefined,
        undefined,
        {
            before: [
                transformer(program)
            ]
        }
    );

    let exitCode = emitResult.emitSkipped ? 1 : 0;
    console.log(`Process exiting with code '${exitCode}'.`);
    process.exit(exitCode);
}

compile(process.argv.slice(2), {
    noEmitOnError: true,
    noImplicitAny: true,
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS
});

/**
 * taken and modified from https://github.com/kimamula/ts-transformer-keys/blob/master/transformer.ts
 *
 * this code creates nested functions in the way that typescript expects to be able to run your actual
 * transformer function. this function executes for all of your nodes when bootstrapped from `customerTransformers` compiler plugin option
 *
 * @param program
 */
function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => (file: ts.SourceFile) => visitNodeAndChildren(file, program, context);
}

// I'm pretty sure these function declarations are just to appease the type checker...
function visitNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node;

// visits every node given a root node
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node {
    return ts.visitEachChild(visitNode(node, program), childNode => visitNodeAndChildren(childNode, program, context), context);
}

/**
 * this function is applied to all visited nodes.
 * as part of the transform functionality, any nodes that we `return` will REPLACE
 * the current node being processed.
 *
 * if there are nodes we don't care about changing, return the original node.
 * for those that we do care about changing, we have to create a new node and return it.
 *
 * @param node
 * @param program
 */
function visitNode(node: ts.Node, program: ts.Program): ts.Node {
    switch (node.kind) {
        /*
         * we have a function block e.g. for function
         *
         * doSomething() { console.log('something'); }
         *
         * this would identify the function contents
         *
         * { console.log('something'); }
         */
        case ts.SyntaxKind.Block:
            /*
             * check to see that our function block has decorators attached to its definition
             * also verify that we have the right decorator, the remote function decorator
             */
            if(node.parent.decorators && node.parent.decorators[0].getFullText().match('remote')) {
                // we know it's a block, type it as such
                let block = (node as ts.Block);

                /*
                 * when we `update` a block, we're really dealing with an immutable thing.
                 * typescript intakes the block, creates a `new` block, attaches the old block to it
                 * for historical reference, and then uses your input to define the new functionality in the block.
                 *
                 * in our case, we want to make it empty, so the `array` of `Statements` we use to create the block
                 * is an empty array.
                 */
                return ts.updateBlock(block, []);
            } else {
                // we're not interested in mutating this node. return original node.
                return node;
            }
        default:
            // we're not interested in mutating this node. return original node.
            return node;
    }
}