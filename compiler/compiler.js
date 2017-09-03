"use strict"

// First add the reserved tokens
let reserved = {
    "::": {
        type: "MethodDec",
        value: "::"
    },
    ":": {
        type: "Colon",
        value: ":"
    },
    ";": {
        type: "Semicolon",
        value: ";"
    },
    ",": {
        type:  "Comma",
        value: ",",
    },
    "\n": {
        type:  "Newline",
        value: "\n",
    },
    "|": {
        type:  "Pipe",
        value: "|",
    },
    "|>": {
        type:  "Cascade",
        value: "|>",
    },
    "^": {
        type:  "Return",
        value: "^",
    },
    "==": {
        type:  "Eq",
        value: "==",
    },
    "=": {
        type:  "Assign",
        value: "=",
    },
    "(": {
        type:  "Lparen",
        value: "(",
    },
    ")": {
        type:  "Rparen",
        value: ")",
    },
    "[": {
        type:  "Lbracket",
        value: "[",
    },
    "]": {
        type:  "Rbracket",
        value: "]",
    },
    "{": {
        type: "Lbrace",
        value: "{"
    },
    "}": {
        type: "Rbrace",
        value: "}"
    },
    "\t": {
        type:  "Tab",
        value: "\t",
    },
    "->": {
        type: "Func",
        value: "func"
    },
}

let reservedWords = {
    'return': {
        type: "Return",
        value: "return"
    },
    'if': {
        type: 'If',
        value: 'if'
    },
    'then': {
        type: 'Then',
        value: 'then'
    },
    'else': {
        type: 'Else',
        value: 'else'
    }
}

class Compiler {
    constructor(input) {
        this.tokens = [];
        this.tokenPos = 0;
        this.ast = Object.create(null);
        this.input = input;
    }

    clear() {
        this.tokens = []
        this.ast = Object.create(null);
        this.tokenPos = 0;
    }

    compile() {
        this.lexer();
        console.log(this.tokens);
        this.parser();
        console.log(JSON.stringify(this.ast));
    }

    lexer() {

        // Index of input
        let current = 0;

        // Total length of inputh
        let len = this.input.length;

        // Handy delimiters
        let NUMBERS = /[0-9]/;
        let WHITESPACE = ' ';

        // Test for delimeters that require some closure
        let testDelim = (char) => {
            if (NUMBERS.test(char)) {
                return {
                    fn: (char) => NUMBERS.test(char),
                    type: 'Number',
                    pre: (c) => c,
                    post: (c) => c,
                };
            }
            else if (char === "\"") {
                return {
                    fn: (char) => char !== "\"",
                    type: "Comment",
                    pre: (c) => c + 1,
                    post: (c) => c + 1
                };
            }
            else if  (char === "'") {
                return {
                    fn: (char) => char !== "'",
                    type: "String",
                    pre: (c) => c + 1,
                    post: (c) => c + 1
                };
            }
            else { return false; }
        }

        let checkReserved = (char) => {
            let peek = char + this.input[current + 1];
            if (reserved[char] !== undefined) {
                return true;
            }
            else if (reserved[peek !== undefined]) {
                return true;
            }
            else {
                return false;
            }
        }

        // Loop over input until finished
        while (current < len) {
            let char = this.input[current]

            if (current + 1 < len) {
                let peek = reserved[char + this.input[current + 1]];
                if (peek !== undefined) {
                    this.tokens.push(peek);
                    current += 2;
                    continue;
                }
            }

            let peek = reserved[char];
            if (peek !== undefined) {
                this.tokens.push(peek);
                current++;
                continue;
            }

            let val = testDelim(char);

            if (val !== false) {
                let value = "";
                current = val.pre(current);
                char = this.input[current]

                while (val.fn(char)) {
                    value += char;
                    current++;
                    char = this.input[current];
                }

                this.tokens.push({
                    type: val.type,
                    value: value
                });

                current = val.post(current);
                continue;
            }

            // If there is a space after a newline treat it as a tab
            if (char === WHITESPACE && current > 1) {
                // if (this.tokens[this.tokens.length-1].type === "Newline") {
                    this.tokens.push({
                        type: "Tab",
                        value: "\t"
                    });
                    current++;
                    continue;
                // }
            }

            if (char !== WHITESPACE) {
                let value = "";
                while (char !== WHITESPACE && char !== "\t") {
                    if (checkReserved(char)) {
                        current --
                        break;
                    }
                    value += char;
                    current++;
                    char = this.input[current];
                }
                if (reservedWords[value] !== undefined) {
                    this.tokens.push({
                        type: reservedWords[value].type,
                        value: reservedWords[value].value
                    });
                }
                else {
                    this.tokens.push({
                        type: "Ident",
                        value: value
                    });
                }
                current++;
                continue;
            }
            current++;
        }

        this.tokens.push({
            type: "EOF",
            value: ""
        });
    }

    parser() {

        // Create the index
        let current = 0;

        // A couple of parsing flags
        let expressionStack = []

        let checkWhiteSpace = () => {
            // First check if there are extraneous new lines
            while (this.tokens[current + 1].type === "Newline") {
                current++;
            }

            // Now check if we are still in the body
            let wsCount = 0;
            let tabCount = expressionStack[expressionStack.length - 1]
            current++;
            let token = this.tokens[current];
            while (token.type === "Tab") {
                wsCount++;
                current++;
                token = this.tokens[current];
            }

            console.log(token);

            // If we are no longer inside the body set the flag to false
            if (wsCount !== tabCount) {
                return false;
            }
            else {
                return true;
            }
        }

        let getWhiteSpaceCount = () => {
            let wsCount = 0;
            let token = this.tokens[current];
            if (token.type === "Tab") {
                while (token.type === "Tab") {
                    wsCount++;
                    current++;
                    token = this.tokens[current];
                }
            }
            else if (token.type === "Space") {
                while (token.type === "Space") {
                    wsCount++;
                    current++;
                    token = this.tokens[current];
                }
            }
            return wsCount;
        }

        // Traversing function
        let walk = () => {

            // Get the token
            let token = this.tokens[current];
            if (token == null) {
                console.log(this.ast);
                throw("EOF Exception");
            }

            if (token.type === "EOF") {
                current++;
                return null;
            }

            if (token.type === "Func") {

                // Create the node without a type initially
                let newNode = {
                    type: "",
                    body: []
                };

                // We need to determine whether this is a top level
                // function definition because they are different in Go
                if (expressionStack.length === 0) {
                    newNode.type = "topLevelFuncDef";
                }
                else {
                    newNode.type = "funcDef";
                }
                // You can have single line functions so we'll handle them here
                if (this.tokens[current + 1].type !== "Newline") {

                    expressionStack.push(0);
                    current++;
                    token = this.tokens[current];

                    while (token.type !== "Newline") {
                        newNode.body.push(walk());
                        token = this.tokens[current];
                    }
                    expressionStack.pop();
                    return newNode;
                }

                // This is for multiline function defs
                else {

                    // Get past the newline
                    current += 2;
                    token = this.tokens[current];

                    // We'll have to keep track of indentation levels
                    let wsCount = getWhiteSpaceCount();

                    // We push the white space count to the expression array
                    // so that we can keep track of indentation of each func def
                    // TODO: ignore newlines immediately proceeded by newlines
                    expressionStack.push(wsCount);

                    // Set a flag for checking if we're still in the func body
                    let inBody = true;
                    while (inBody) {

                        // First add expressions
                        while (token.type !== "Newline") {
                            newNode.body.push(walk());
                            token = this.tokens[current]
                        }

                        inBody = checkWhiteSpace()
                    }

                    expressionStack.pop();
                    return newNode;
                }
            }

            if (token.type === "Newline" && this.tokens[current + 1].type === "Newline") {
                while (token.type === "Newline" && this.tokens[current + 1].type === "Newline") {
                    current++;
                    token = this.tokens[current];
                }
            }

            // Return expression
            if (token.type === "Return") {
                let newNode = {
                    type: "ReturnExpression",
                    body: []
                }

                current++;
                token = this.tokens[current];
                while (token.type !== "Newline") {
                    newNode.body.push(walk());
                    token = this.tokens[current];
                }
                current++;
                return newNode;
            }

            // Assign Statement
            if (this.tokens[current+1].type === "Assign") {

                let newNode = {
                    type: "AssignExpression",
                    name: token.value,
                    body: []
                };

                current += 2;

                token = this.tokens[current];
                while (token.type !== "Newline" && token.type !== "EOF") {
                    newNode.body.push(walk());
                    token = this.tokens[current];
                }
                current++;
                return newNode;
            }

            // Arrays
            if (token.type === "Lbracket") {
                current++;
                let newNode = {
                    type: "Array",
                    body: []
                };

                while (token.type !== "Rbracket") {
                    newNode.body.push(walk());
                    token = this.tokens[current];

                    // while (token.type === "Tab" || token.type === "Newline") {
                    //     current++;
                    //     token = this.tokens[current];
                    // }
                }

                return newNode;
            }

            // Paren blocks
            if (token.type === "Lparen") {
                current++;
                let newNode = {
                    type: "ParenBlock",
                    body: []
                };
                token = this.tokens[current];

                while (token.type !== "Rparen") {
                    newNode.body.push(walk());
                    token = this.tokens[current];

                    // while (token.type === "Tab" || token.type === "Newline") {
                    //     current++;
                    //     token = this.tokens[current];
                    // }
                }
                return newNode;
            }

            // Array literals
            if (token.type === "LBrace") {
                current++;
                let newNode = {
                    type: "ArrayLiteral",
                    body: []
                };

                while (token.type !== "Rbrace") {
                    newNode.body.push(walk());
                    token = this.tokens[current];
                    current++;

                    // while (token.type === "Tab" || token.type === "Newline") {
                    //     current++;
                    //     token = this.tokens[current];
                    // }
                }

                return newNode;
            }

            // Strings
            if (token.type === "String") {
                current++;
                return {
                    type: "StringObj",
                    value: token.value
                };
            }

            // Numbers
            if (token.type === "Number") {
                current++;
                return {
                    type: "NumberObj",
                    value: token.value
                };
            }


            // Special operators
            if (["+", "-", "*", "/", "^"].indexOf(token.value) !== -1) {
                current++;
                return {
                    type: "Operator",
                    value: token.value,
                    param: walk()
                };
            }

            // Identifiers
            if (token.type === "Ident") {
                current++;
                return {
                    type: "Ident",
                    value: token.value
                };
            }

            // If expressions
            console.log(token.type);
            if (token.type === "If") {
                console.log(token);
                current++;
                token = this.tokens[current];
                let newNode = {
                    type: 'IfStatement',
                    condition: [],
                    body: []
                };
                while (token.type !== 'Newline' && token.type !== "Then") {
                    newNode.condition.push(walk());
                    token = this.tokens[current];
                }
                if (token.type === 'Then') {
                    current++;
                    token = this.tokens[current];
                    while (token.type !== 'Newline' && token.type !== 'Else') {
                        newNode.body.push(walk());
                        token = this.tokens[current];
                    }
                }
                else {
                    let wsCount = getWhiteSpaceCount();
                    expressionStack.push(wsCount);

                    let inBody = true;
                    while (inBody) {
                        while (token.type !== 'Newline') {
                            newNode.body.push(walk());
                            token = this.tokens[current];
                        }

                        inBody = checkWhiteSpace();
                    }
                    expressionStack.pop();
                    return newNode;
                }
            }

            if (token.type === 'Else') {
                current++;
                token = this.tokens[current];
                let newNode = {
                    type: 'ElseStatement',
                    body: []
                };
                if (this.tokens[current + 1].type !== 'Newline') {
                    while (token.type !== 'Newline') {
                        newNode.body.push(walk());
                    }
                }
                else {
                    let wsCount = getWhiteSpaceCount();
                    expressionStack.push(wsCount);

                    let inBody = true;
                    while (inBody) {
                        while(token.type !== 'Newline') {
                            newNode.body.push(walk());
                            token = this.tokens[current];
                        }
                        inBody = checkWhiteSpace();
                    }

                    expressionStack.pop();
                    return newNode;
                }
            }

            current++;
        }

        this.ast = {
            type: "Program",
            body: []
        };

        while (current < this.tokens.length) {
            this.ast.body.push(walk());
        }

        let reduceFn = (acc, x) => {
            if (x != null) {
                if (x.body) {
                    x.body = x.body.reduce(reduceFn, []);
                }
                acc.push(x);
            }
            return acc;
        }

        this.ast.body = this.ast.body.reduce(reduceFn, [])
    }

}

module.exports.Compiler = Compiler;