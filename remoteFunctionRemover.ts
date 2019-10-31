import { readFileSync } from 'fs';
import * as ts from 'typescript';

export function removeRemotes(sourceFile: ts.SourceFile) {
    findRemotes(sourceFile);

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

                    // logs
                    reportRemoval(node, 'remote function has been removed');

                    // ts give us access to the start and end position of the method declaration. strip it out.
                    let updatedSource = sourceFile.text.substring(0, methodDeclaration.getStart() + 1) + sourceFile.text.substring(methodDeclaration.getStart() + methodDeclaration.getWidth() - 1);

                    // use `update` api to replace our typescript source file with the stripped out version
                    let newSource = sourceFile.update(updatedSource, {
                        newLength: updatedSource.length,
                        span: {
                            start: 0,
                            length: sourceFile.text.length
                        }
                    });

                    // new source code, without the function innards!
                    console.log('new source!', newSource.text);
                }
                break;
        }

        // traverse the ast
        ts.forEachChild(node, findRemotes);
    }

    function reportRemoval(node: ts.Node, message: string) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
            node.getStart()
        );

        console.log(
            `${sourceFile.fileName} (${line + 1},${character + 1}): ${message}`
        );
    }
}

// use files from cmd line args
const fileNames = process.argv.slice(2);

// go through the files and parse them
fileNames.forEach(fileName => {
    const sourceFile = ts.createSourceFile(
        fileName,
        readFileSync(fileName).toString(),
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true
    );

    // find and remove the remotes
    removeRemotes(sourceFile);
});