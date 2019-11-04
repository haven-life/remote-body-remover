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

    let allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);

    allDiagnostics.forEach(diagnostic => {
        if (diagnostic.file) {
            let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
                diagnostic.start!
            );
            let message = ts.flattenDiagnosticMessageText(
                diagnostic.messageText,
                "\n"
            );
            console.log(
                `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
            );
        } else {
            console.log(
                `${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`
            );
        }
    });

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

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (node: ts.SourceFile): ts.SourceFile => visitNodeAndChildren(node, program, context);
    }
}

function visitNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile {
    findRemotes(node);
    return node;

    // action for each node in the ast
    function findRemotes(node: ts.Node) {
        // filter by what kind of nodes we come across
        switch (node.kind) {
            // handle decorator case
            case ts.SyntaxKind.Decorator:
                // check to see if we have a remote function match
                if(node.getFullText().match('remote')) {
                    // we want to access the method body, which is the decorators sibling.
                    // go up to parent, then back down to the `body` (actual function code)
                    let methodDeclaration = (node.parent as ts.MethodDeclaration).body;

                    console.log("!!!", methodDeclaration.getFullText());
                }
                break;
        }

        // traverse the ast
        ts.forEachChild(node, findRemotes);
    }
}