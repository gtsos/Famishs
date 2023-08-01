import { parse } from "acorn";
import { Node } from "estree";
import { JSVM_ArgumentsRef, JSVM_Array, JSVM_AssignProperty, JSVM_AssignPropertyBitShiftLeft, JSVM_AssignPropertyBitShiftRight, JSVM_AssignPropertyBitwiseAnd, JSVM_AssignPropertyDiv, JSVM_AssignPropertyMinus, JSVM_AssignPropertyMul, JSVM_AssignPropertyPipe, JSVM_AssignPropertyPlus, JSVM_AssignPropertyPowerOf, JSVM_AssignPropertyRemainder, JSVM_AssignPropertyXor, JSVM_AssignPropertyZeroRightShiftFill, JSVM_AssignVariable, JSVM_AssignVariableBitShiftLeft, JSVM_AssignVariableBitShiftRight, JSVM_AssignVariableBitwiseAnd, JSVM_AssignVariableDiv, JSVM_AssignVariableMinus, JSVM_AssignVariableMul, JSVM_AssignVariablePipe, JSVM_AssignVariablePlus, JSVM_AssignVariableRaisePower, JSVM_AssignVariableRemainder, JSVM_AssignVariableXor, JSVM_AssignVariableZeroRightShiftFill, JSVM_BinaryExpression, JSVM_Boolean, JSVM_Break, JSVM_Catch, JSVM_Collection, JSVM_ConditionalIfStatement, JSVM_ContinueStatement, JSVM_CreateFunc, JSVM_Declare, JSVM_DoWhileLoop, JSVM_ForLoop, JSVM_FuncCall, JSVM_Global, JSVM_Identifier, JSVM_IfStatement, JSVM_LoadInt, JSVM_LoadNull, JSVM_LoadUndefined, JSVM_LogicalAnd, JSVM_LogicalOr, JSVM_MemberExpression, JSVM_MinusMinus, JSVM_MoveArgToVar, JSVM_NewCall, JSVM_Node, JSVM_Object, JSVM_ObjectMinusMinus, JSVM_ObjectPlusPlus, JSVM_PlusPlus, JSVM_Property, JSVM_PropertyFuncCall, JSVM_Regex, JSVM_Return, JSVM_SelfFnRef, JSVM_Sequence, JSVM_StringLiteral, JSVM_SwitchCase, JSVM_SwitchStatement, JSVM_This, JSVM_Throw, JSVM_TryStatement, JSVM_UnaryDelete, JSVM_UnaryDeleteMemberExpression, JSVM_UnaryInvert, JSVM_UnaryNegate, JSVM_UnaryNot, JSVM_UnaryPlus, JSVM_UnaryTypeof, JSVM_UnaryVoid, JSVM_WhileLoop } from "./ASTInterfaces";
import { isInt } from "./Utils";
import escodegen from "escodegen"

type VariableMap = Map<string, Definition>;

export class Parser {
  functionScopes: FunctionScope[] = [];
  funcScopeIdCounter = 0;

  stringIdCounter = 0;
  strings: Map<string, number> = new Map();

  stash(str: string) {
    if (typeof str !== "string") throw new Error("Invalid string stashed! " + str);
    if (this.strings.has(str)) return this.strings.get(str);
    const id = this.stringIdCounter++;
    this.strings.set(str, id);
    return id;
  }

  getStringId(str: string) {
    if (!this.strings.has(str)) throw "String pool does not contain: " + str;
    return this.strings.get(str);
  }

  parse(code: string) {
    const ast = parse(code, { ecmaVersion: "latest" }) as Node;
    new FunctionScope(this).parse(ast);
  }
}

export class Definition {
  from: FunctionScope;
  varId: number;
  global: boolean = false;
  stringId: number = -1;

  constructor(from: FunctionScope, varId: number) {
    this.from = from;
    this.varId = varId;
  }
}

class Scope {
  scopeId: number = -1;
  functionScope: FunctionScope;
  topNode: Node = null;
  JSVM_ROOT = new JSVM_Collection();

  constructor(functionScope: FunctionScope) {
    this.functionScope = functionScope;
    this.scopeId = this.functionScope.scopeIdCtr++;
  }

  addVariable(name: string) {
    const variables = this.functionScope.variables;
    if (variables.has(name)) {
      const def = variables.get(name);
      if (def.from === this.functionScope) return; // dont re-add same function scope declared variables
    }

    const variable_definition = new Definition(this.functionScope, this.functionScope.variableIdCtr++);

    this.functionScope.variables.set(name, variable_definition);
  }

  getVariable(name: string): Definition {
    if (!this.functionScope.variables.has(name)) {
      const def = new Definition(this.functionScope, -1);
      def.global = true;
      def.stringId = this.functionScope.parser.stash(name);
      return def;
    }

    return this.functionScope.variables.get(name);
  }


  parse(node: Node) {
    this.topNode = node;
    this.scan(node);
    this.walk(node);
  }

  /*
  * Move declerations around inside of the scope
  */
  hoistFuncDecleration(body: acorn.Node[]) {
    const weights = {
      "FunctionDeclaration": -2,
      //"VariableDeclaration": -1,
    }
    body.sort((a, b) => (a.type in weights ? weights[a.type] : 0) - (b.type in weights ? weights[b.type] : 0));
  }

  /*
  * Pre-scans the tree for variable definitions
  */
  scan(node: Node) {
    switch (node.type) {
      case 'Program': {
        node.body.forEach(child => this.scan.bind(this)(child));
        break;
      }
      case 'VariableDeclaration': {
        node.declarations.forEach(child => this.scan.bind(this)(child));
        break;
      }
      case 'ExpressionStatement': {
        this.scan(node.expression);
        break;
      }
      case 'VariableDeclarator': {
        const id = node.id;
        if (id.type != "Identifier") throw "Parser::scan unknown VariableDeclarator type";
        this.addVariable(id.name);
        if (node.init) this.scan(node.init);
        break;
      }
      case 'ConditionalExpression': {
        this.scan(node.test);
        this.scan(node.consequent);
        this.scan(node.alternate);
        break;
      }
      case 'ForOfStatement': {

        let left = node.left;
        let right = node.right;
        let body = node.body;
        const itrVarName = "itrVarName";
        const nextVarName = "nextVarName";

        const code = `
          for(var ${itrVarName} = obj[Symbol.iterator]()${left.type === "VariableDeclaration" ? ", " + ((left.declarations[0].id as any).name) : ""}; ${nextVarName} = ${itrVarName}.next(), !${nextVarName}.done;){
            ${left.type === "Identifier" ? (
            `${left.name} = ${nextVarName}.value`
          ) :
            left.type === "VariableDeclaration" ? (
              `${(left.declarations[0].id as any).name} = ${nextVarName}.value`
            ) :
              (
                `${escodegen.generate(left)} = ${nextVarName}.value`
              )
          }
          }
        `;


        const newAST = (parse(code, {
          ecmaVersion: "latest",
        }) as any).body[0];

        newAST.init.declarations[0].init.callee.object = right;


        //newAST.init.declarations[0].init.arguments[0] = right;
        if (body.type === "BlockStatement") {
          newAST.body.body.push(...body.body);
        } else {
          newAST.body.body.push(body);
        }

        this.scan(newAST);
        Object.assign(node, newAST);
        break;
      }
      case 'ForInStatement': {


        /*
        for(let keys = Object.keys(obj), key, counter = 0; counter < keys.length; counter++){
          key = keys[counter];
	
          // rest of shit goes here
        }
        */

        let left = node.left;
        let right = node.right;
        let body = node.body;

        const cntrVarName = "$0_cntr";
        const keysVarName = "$0_keys";

        const code = `for(var ${keysVarName} = Object.keys(obj)${left.type === "VariableDeclaration" ? ", " + ((left.declarations[0].id as any).name) : ""}, ${cntrVarName} = 0; ${cntrVarName} < ${keysVarName}.length; ${cntrVarName}++){
          ${left.type === "Identifier" ? (
            `${left.name} = ${keysVarName}[${cntrVarName}]`
          ) :
            left.type === "VariableDeclaration" ? (
              `${(left.declarations[0].id as any).name} = ${keysVarName}[${cntrVarName}]`
            ) :
              (
                "Well fuck"
              )
          }
	
	        // rest of shit goes here
        }`;

        const newAST = (parse(code, {
          ecmaVersion: "latest",
        }) as any).body[0];

        // set the object to be targetted
        newAST.init.declarations[0].init.arguments[0] = right;
        if (node.body.type === "BlockStatement") {
          newAST.body.body.push(...node.body.body);
        } else {
          newAST.body.body.push(node.body);
        }

        this.scan(newAST);
        Object.assign(node, newAST);
        break;
      }
      case 'CatchClause': {
        const param = node.param;
        if (param.type !== "Identifier") throw "Parser::scan catch expects identifer, got: " + node.param.type;
        this.addVariable(param.name);
        break;
      }
      case 'LogicalExpression': {
        this.scan(node.left);
        this.scan(node.right);
        break;
      }
      case 'SequenceExpression': {
        node.expressions.forEach(exp => this.scan.bind(this)(exp));
        break;
      }
      case 'SwitchCase': {
        if (node.test) this.scan(node.test);
        node.consequent.forEach(body => {
          if (body.type !== "BlockStatement") {
            this.scan(body);
          }
        });
        break;
      }
      case 'SwitchStatement': {
        if (node !== this.topNode) break;
        this.scan(node.discriminant);
        node.cases.forEach(body => {
          this.scan(body);
        });
        break;
      }
      case 'TryStatement': {
        break;
      }
      case 'ThrowStatement': {
        this.scan(node.argument);
        break;
      }
      case 'ReturnStatement': {
        if (node.argument) this.scan(node.argument);
        break;
      }
      case 'ObjectExpression': {
        node.properties.forEach(prop => {
          this.scan(prop);
        });
        break;
      }
      case 'Property': {
        this.scan(node.value);
        break;
      }
      case 'BreakStatement': {
        if (node.label) throw "Parser::scan break statement cannot have a label";
        break;
      }
      case 'ContinueStatement': {
        if (node.label) throw "Parser::scan continue statement cannot have a label";
        break;
      }
      case 'BlockStatement': {
        if (node !== this.topNode) break;
        node.body.forEach(child => this.scan.bind(this)(child));
        break;
      }
      case 'UnaryExpression': {
        this.scan(node.argument);
        break;
      }
      case 'UpdateExpression': {
        this.scan(node.argument);
        break;
      }
      case 'ForStatement': {
        if (node === this.topNode) {
          if (node.init) this.scan(node.init);
          if (node.test) this.scan(node.test);
          if (node.update) this.scan(node.update);

          const body = node.body;
          if (body.type !== "BlockStatement") this.scan(body);
        }
        break;
      }
      case 'ArrayExpression': {
        node.elements.forEach(elem => {
          if (elem) this.scan(elem);
        });
        break;
      }
      case 'IfStatement': {
        this.scan(node.test);
        if (node.consequent.type !== "BlockStatement") this.scan(node.consequent);
        if (node.alternate && node.alternate.type !== "BlockStatement") this.scan(node.alternate);
        break;
      }
      case 'ThisExpression': {
        break;
      }
      case 'DoWhileStatement': {
        if (node === this.topNode) {
          this.scan(node.test);
          const body = node.body;
          if (body.type !== "BlockStatement") this.scan(body);
        }
      }
      case 'WhileStatement': {
        if (node === this.topNode) {
          this.scan(node.test);
          const body = node.body;
          if (body.type !== "BlockStatement") this.scan(body);
        }
        break;
      }
      case 'BinaryExpression': {
        this.scan(node.left);
        this.scan(node.right);
        break;
      }
      case 'Literal': {
        break;
      }
      case 'CallExpression': {
        this.scan(node.callee);
        node.arguments.forEach(arg => this.scan.bind(this)(arg));
        break;
      }
      case 'Identifier': {
        break;
      }
      case 'EmptyStatement': {
        break;
      }
      case 'NewExpression': {
        this.scan(node.callee);
        node.arguments.forEach(arg => this.scan.bind(this)(arg));
        break;
      }
      case 'FunctionDeclaration': {
        if (node === this.topNode) {

          this.addVariable("arguments");

          node.params.forEach(param => {
            if (param.type !== "Identifier") throw "Parser::scan expects params to be identifiers, got: " + param.type;
            this.addVariable(param.name);
          });

          node.body.body.forEach(child => this.scan.bind(this)(child));
        } else {
          this.addVariable(node.id.name);
        }
        break;
      }
      case 'FunctionExpression': {
        if (node === this.topNode) {

          this.addVariable("arguments");

          node.params.forEach(param => {
            if (param.type !== "Identifier") throw "Parser::scan expects params to be identifiers, got: " + param.type;
            this.addVariable(param.name);
          });

          if (node.id) this.addVariable(node.id.name);
          node.body.body.forEach(child => this.scan.bind(this)(child));
        }
        break;
      }
      case 'AssignmentExpression': {
        this.scan(node.left);
        this.scan(node.right);
        break;
      }
      case 'MemberExpression': {
        const computed = node.computed;
        const obj = node.object;
        const prop = node.property;

        if (!computed) {
          if (prop.type === "Identifier") {
            const name = prop.name;
            (prop as any).type = "Literal";
            (prop as any).value = name;
            (prop as any).raw = JSON.stringify(name);
            (prop as any).computed = true;
          }
        }

        this.scan(obj);
        this.scan(prop);
        break;
      }
      default:
        throw "Parser::scan unknown node type: " + node.type;
    }
  }

  walk(node: Node): JSVM_Node {
    switch (node.type) {
      case 'EmptyStatement': {
        return null;
      }
      case 'Program': {
        this.hoistFuncDecleration(node.body as any);

        node.body.forEach(child => {
          let jsvm_node = this.walk(child);
          if (jsvm_node) this.JSVM_ROOT.nodes.push(jsvm_node);
        });
        return null;
      }
      case 'ExpressionStatement': {
        return this.walk(node.expression);
      }
      case 'BreakStatement': {
        return new JSVM_Break();
      }
      case 'ContinueStatement': {
        return new JSVM_ContinueStatement();
      }
      case 'BlockStatement': {
        if (node != this.topNode) throw new Error("Parser::walk Block statement needs to be top root");

        this.hoistFuncDecleration(node.body as any);

        node.body.forEach(child => {
          if (child.type === "BlockStatement") {
            const block = new Scope(this.functionScope);
            //block.inheretFrom(this);
            block.parse(child);
            this.JSVM_ROOT.nodes.push(block.JSVM_ROOT);
          } else {
            let jsvm_node = this.walk(child);
            if (jsvm_node) this.JSVM_ROOT.nodes.push(jsvm_node);
          }
        });
        return null;
      }
      case 'ThisExpression': {
        return new JSVM_This;
      }
      case 'SwitchCase': {
        const switchCase = new JSVM_SwitchCase();
        if (node.test) switchCase.test = this.walk(node.test);
        node.consequent.forEach(con => {
          if (con.type === "BlockStatement") {
            const block = new Scope(this.functionScope);
            //block.inheretFrom(this);
            block.parse(con);
            switchCase.consequent.push(block.JSVM_ROOT);
          } else {
            switchCase.consequent.push(this.walk(con));
          }
        })

        return switchCase;
      }
      case 'SwitchStatement': {
        if (node === this.topNode) {
          const block = new JSVM_SwitchStatement();
          block.discriminant = this.walk(node.discriminant);
          const cases = node.cases;
          for (let i = 0; i < cases.length; i++) {
            const _case = cases[i];
            block.cases.push(this.walk(_case) as JSVM_SwitchCase);
          }
          this.JSVM_ROOT.nodes.push(block);
          return null;
        } else {
          const block = new Scope(this.functionScope);
          //block.inheretFrom(this);
          block.parse(node);

          return block.JSVM_ROOT;
        }
      }
      case 'UpdateExpression': {
        const arg = node.argument;
        if (arg.type === "Identifier") {
          const info = this.getVariable(arg.name);

          if (info.global) throw "Cant do update expression to global var";

          switch (node.operator) {
            case '++': return new JSVM_PlusPlus(node.prefix, info.varId, info.from.funcScopeId);
            case "--": return new JSVM_MinusMinus(node.prefix, info.varId, info.from.funcScopeId);
            default:
              throw "Parser::walk unknown update type: " + (node as any).operator;
          }
        } else if (arg.type === 'MemberExpression') {
          const obj = this.walk(arg.object);
          const prop = this.walk(arg.property);
          switch (node.operator) {
            case '++': return new JSVM_ObjectPlusPlus(node.prefix, obj, prop);
            case "--": return new JSVM_ObjectMinusMinus(node.prefix, obj, prop);
            default:
          }
        } else throw "Parser::walk Update Expression cant handle type: " + arg.type;
      }
      case 'ThrowStatement': {
        return new JSVM_Throw(this.walk(node.argument));
      }
      case 'CatchClause': {
        const catchBlock = new JSVM_Catch();
        const block = new Scope(this.functionScope);
        //block.inheretFrom(this);
        block.parse(node.body);
        catchBlock.body = block.JSVM_ROOT;

        const param = node.param;
        if (param.type != "Identifier") throw "Parser::walk expects cause param to be identifer, got: " + param.type;
        const info = this.getVariable(param.name);
        catchBlock.param = new JSVM_Identifier(false, info.from.funcScopeId, info.varId, -1);

        if (node === this.topNode) this.JSVM_ROOT.nodes.push(catchBlock);
        return catchBlock;
      }
      case 'TryStatement': {
        node.block;
        node.handler;
        node.finalizer;
        const trystatement = new JSVM_TryStatement();

        const block = new Scope(this.functionScope);
        //block.inheretFrom(this);
        block.parse(node.block);
        trystatement.body = block.JSVM_ROOT;

        if (node.handler) {
          const handler = new Scope(this.functionScope);
          //handler.inheretFrom(this);
          handler.parse(node.handler);
          trystatement.catch = handler.JSVM_ROOT;
        }

        if (node.finalizer) {
          const final = new Scope(this.functionScope);
          //final.inheretFrom(this);
          final.parse(node.finalizer);
          trystatement.finially = final.JSVM_ROOT;
        }

        return trystatement;
      }
      case 'ForStatement': {
        if (node === this.topNode) {
          const if_node = new JSVM_ForLoop();
          if (node.init) if_node.init = this.walk(node.init);
          if (node.test) if_node.test = this.walk(node.test);
          if (node.update) if_node.update = this.walk(node.update);

          const body = node.body;
          if (body.type === "BlockStatement") {
            const child_scope = new Scope(this.functionScope);
            //child_scope.inheretFrom(this);
            child_scope.parse(body);
            if_node.body = child_scope.JSVM_ROOT;
          } else {
            if_node.body = this.walk(body);
          }
          this.JSVM_ROOT.nodes.push(if_node);
          return null;
        } else {
          const child_scope = new Scope(this.functionScope);
          //child_scope.inheretFrom(this);
          child_scope.parse(node);
          return child_scope.JSVM_ROOT;
        }
      }
      case 'WhileStatement': {
        const whileLoop = new JSVM_WhileLoop();

        whileLoop.test = this.walk(node.test);

        if (node.body.type === "BlockStatement") {
          const child_scope = new Scope(this.functionScope);
          //child_scope.inheretFrom(this);
          child_scope.parse(node.body);
          whileLoop.body = child_scope.JSVM_ROOT;
        } else {
          whileLoop.body = this.walk(node.body);
        }

        return whileLoop;
      }
      case 'DoWhileStatement': {
        const doWhileLoop = new JSVM_DoWhileLoop();

        doWhileLoop.test = this.walk(node.test);

        if (node.body.type === "BlockStatement") {
          const child_scope = new Scope(this.functionScope);
          //child_scope.inheretFrom(this);
          child_scope.parse(node.body);
          doWhileLoop.body = child_scope.JSVM_ROOT;
        } else {
          doWhileLoop.body = this.walk(node.body);
        }

        return doWhileLoop;
      }
      case 'ConditionalExpression': {
        const jump_token = new JSVM_ConditionalIfStatement();
        jump_token.test = this.walk(node.test);
        jump_token.consequent = this.walk(node.consequent);
        jump_token.alternate = this.walk(node.alternate);

        return jump_token;
      }
      case 'ArrayExpression': {
        const array = new JSVM_Array();
        node.elements.forEach(elem => {
          if (elem) {
            const r = this.walk(elem);
            array.elements.push(r);
          } else array.elements.push(new JSVM_LoadUndefined());
        });
        return array;;
      }
      case 'LogicalExpression': {
        switch (node.operator) {
          case '&&': {
            return new JSVM_LogicalAnd(this.walk(node.left), this.walk(node.right));
          }
          case '||': {
            return new JSVM_LogicalOr(this.walk(node.left), this.walk(node.right));
          }
          default:
            throw "Parser::walk unknown logical expression: " + node.operator;
        }
      }
      case 'AssignmentExpression': {
        const left = node.left;
        const right = node.right;
        const operator = node.operator;

        if (left.type === "Identifier") {
          const info = this.getVariable(left.name);

          // handle global assignment
          if (info.global) {
            const jsvm_right = this.walk(right);
            const obj = new JSVM_Global();
            const prop = new JSVM_StringLiteral(info.stringId);
            switch (operator) {
              case '=': return new JSVM_AssignProperty(obj, prop, jsvm_right);
              case "+=": return new JSVM_AssignPropertyPlus(obj, prop, jsvm_right);
              case "-=": return new JSVM_AssignPropertyMinus(obj, prop, jsvm_right);
              case "*=": return new JSVM_AssignPropertyMul(obj, prop, jsvm_right);
              case "/=": return new JSVM_AssignPropertyDiv(obj, prop, jsvm_right);
              case ">>>=": return new JSVM_AssignPropertyZeroRightShiftFill(obj, prop, jsvm_right);
              case "|=": return new JSVM_AssignPropertyPipe(obj, prop, jsvm_right);
              case "^=": return new JSVM_AssignPropertyXor(obj, prop, jsvm_right);

              case "%=": return new JSVM_AssignPropertyRemainder(obj, prop, jsvm_right);
              case "**=": return new JSVM_AssignPropertyPowerOf(obj, prop, jsvm_right);
              case ">>=": return new JSVM_AssignPropertyBitShiftRight(obj, prop, jsvm_right);
              case "<<=": return new JSVM_AssignPropertyBitShiftLeft(obj, prop, jsvm_right);
              case "&=": return new JSVM_AssignPropertyBitwiseAnd(obj, prop, jsvm_right);
              default:
                throw "Parser::walk unknown global assignment type: " + operator;
            }
          }

          // handle identifier assignment
          const jsvm_right = this.walk(right);
          const jsvm_identifier = new JSVM_Identifier(info.global, info.from.funcScopeId, info.varId, info.stringId);

          if (!jsvm_right) throw 'WTF?';

          switch (operator) {
            case '=': return new JSVM_AssignVariable(jsvm_identifier, jsvm_right);
            case '|=': return new JSVM_AssignVariablePipe(jsvm_identifier, jsvm_right);
            case '*=': return new JSVM_AssignVariableMul(jsvm_identifier, jsvm_right);
            case '/=': return new JSVM_AssignVariableDiv(jsvm_identifier, jsvm_right);
            case '+=': return new JSVM_AssignVariablePlus(jsvm_identifier, jsvm_right);
            case '%=': return new JSVM_AssignVariableRemainder(jsvm_identifier, jsvm_right);
            case '-=': return new JSVM_AssignVariableMinus(jsvm_identifier, jsvm_right);
            case '>>>=': return new JSVM_AssignVariableZeroRightShiftFill(jsvm_identifier, jsvm_right);
            case '^=': return new JSVM_AssignVariableXor(jsvm_identifier, jsvm_right);

            case '>>=': return new JSVM_AssignVariableBitShiftRight(jsvm_identifier, jsvm_right);
            case '**=': return new JSVM_AssignVariableRaisePower(jsvm_identifier, jsvm_right);
            case '&=': return new JSVM_AssignVariableBitwiseAnd(jsvm_identifier, jsvm_right);
            case '<<=': return new JSVM_AssignVariableBitShiftLeft(jsvm_identifier, jsvm_right);
            default:
              throw "[Parser] Unknown Assignment type: " + operator;
          }
        } else if (left.type === "MemberExpression") {
          const obj = this.walk(left.object);
          const prop = this.walk(left.property);
          const jsvm_right = this.walk(right);
          if (!jsvm_right) throw 'WTF?';


          // todo, add bytecode support for XOR assignmnet expression to objects
          switch (operator) {
            case '=': return new JSVM_AssignProperty(obj, prop, jsvm_right);
            case "+=": return new JSVM_AssignPropertyPlus(obj, prop, jsvm_right);
            case "-=": return new JSVM_AssignPropertyMinus(obj, prop, jsvm_right);
            case "*=": return new JSVM_AssignPropertyMul(obj, prop, jsvm_right);
            case "/=": return new JSVM_AssignPropertyDiv(obj, prop, jsvm_right);
            case ">>>=": return new JSVM_AssignPropertyZeroRightShiftFill(obj, prop, jsvm_right);
            case "|=": return new JSVM_AssignPropertyPipe(obj, prop, jsvm_right);
            case "^=": return new JSVM_AssignPropertyXor(obj, prop, jsvm_right);

            case "%=": return new JSVM_AssignPropertyRemainder(obj, prop, jsvm_right);
            case "**=": return new JSVM_AssignPropertyPowerOf(obj, prop, jsvm_right);
            case ">>=": return new JSVM_AssignPropertyBitShiftRight(obj, prop, jsvm_right);
            case "<<=": return new JSVM_AssignPropertyBitShiftLeft(obj, prop, jsvm_right);
            case "&=": return new JSVM_AssignPropertyBitwiseAnd(obj, prop, jsvm_right);
            default:
              throw "Parser::walk Unknown Object Assignment type: " + operator;
          }
        } else throw "Parser::walk Unknown Assignent left type: " + left.type;
      }
      case 'Property': {
        const key = node.key;
        if (key.type !== "Identifier" && key.type !== "Literal") throw "Parser::walk PRoperty key expects string, got:" + key.type;

        const name = key.type === "Identifier" ? key.name : "" + key.value as string;
        const stringId = this.functionScope.parser.stash(name);

        return new JSVM_Property(node.kind, stringId, this.walk(node.value));
      }
      case 'ObjectExpression': {
        const obj = new JSVM_Object();

        node.properties.forEach(prop => {
          obj.properties.push(this.walk(prop) as JSVM_Property);
        });

        return obj;
      }
      case 'SequenceExpression': {
        const seq = new JSVM_Sequence();
        node.expressions.forEach(exp => {
          seq.sequence.push(this.walk(exp));
        });

        return seq;
      }
      case 'NewExpression': {
        const args = node.arguments;
        const callee = node.callee;

        const callable = this.walk(callee);
        const jsvm_node = new JSVM_NewCall(callable);

        args.forEach((arg: any) => {
          let ret = this.walk(arg)
          if (ret) jsvm_node.arguments.push(ret);
        });

        return jsvm_node;
      }
      case 'CallExpression': {
        const args = node.arguments;
        const callee = node.callee;

        const callable = this.walk(callee);
        const jsvm_node = (callable.type === JSVM_MemberExpression.type) ? new JSVM_PropertyFuncCall(callable as JSVM_MemberExpression) : new JSVM_FuncCall(callable);

        args.forEach((arg: any) => {
          let ret = this.walk(arg)
          if (ret) jsvm_node.arguments.push(ret);
        });


        return jsvm_node;
      }
      case 'ReturnStatement': {
        return new JSVM_Return(node.argument ? this.walk(node.argument) : null);
      }
      case 'UnaryExpression': {
        switch (node.operator) {
          case '!': return new JSVM_UnaryNot(this.walk(node.argument));
          case '+': return new JSVM_UnaryPlus(this.walk(node.argument));
          case 'typeof': return new JSVM_UnaryTypeof(this.walk(node.argument));
          case '-': return new JSVM_UnaryNegate(this.walk(node.argument));
          case '~': return new JSVM_UnaryInvert(this.walk(node.argument));
          case 'void': return new JSVM_UnaryVoid(this.walk(node.argument));
          case 'delete': {
            const arg = node.argument;

            if (arg.type === "MemberExpression") {
              return new JSVM_UnaryDeleteMemberExpression(this.walk(node.argument) as JSVM_MemberExpression);
            } else {
              return new JSVM_UnaryDelete(this.walk(node.argument));
            }
          }
          default:
            throw "Parser::walk unknown unary expression: " + (node as any).operator;
        }
      }
      case 'FunctionExpression': {

        if (node === this.topNode) {

          const id = node.id;
          if (id) {
            const info = this.getVariable(id.name);
            if (info.global) throw "Parser::walk Function Expression id was not found!";
            this.JSVM_ROOT.nodes.push(new JSVM_SelfFnRef(info.varId, info.from.funcScopeId));
          }

          const body = node.body;
          this.hoistFuncDecleration(body.body as any);

          const argInfo = this.getVariable("arguments");
          this.JSVM_ROOT.nodes.push(new JSVM_ArgumentsRef(argInfo.varId));

          for (let i = 0; i < node.params.length; i++) {
            const arg = node.params[i];
            if (arg.type != "Identifier") throw "Parser::walk expected arg type identifier, got: " + arg.type;
            const info = this.getVariable(arg.name);
            this.JSVM_ROOT.nodes.push(new JSVM_MoveArgToVar(i, info.varId));
          }

          body.body.forEach((child_node: any) => {
            const child_type = this.walk(child_node);
            if (child_type)
              this.JSVM_ROOT.nodes.push(child_type);
          });

          return null;
        } else {
          const newFuncScope = new FunctionScope(this.functionScope.parser, this.functionScope);
          newFuncScope.inheretFrom(this.functionScope); // cascade variables into this scope
          newFuncScope.parse(node);
          return new JSVM_CreateFunc(newFuncScope.funcScopeId);
        }
      }

      case 'FunctionDeclaration': {
        if (node === this.topNode) {

          const body = node.body;
          this.hoistFuncDecleration(body.body as any);

          const argInfo = this.getVariable("arguments");
          this.JSVM_ROOT.nodes.push(new JSVM_ArgumentsRef(argInfo.varId));

          for (let i = 0; i < node.params.length; i++) {
            const arg = node.params[i];
            if (arg.type != "Identifier") throw "Parser::walk expected arg type identifier, got: " + arg.type;
            const info = this.getVariable(arg.name);
            this.JSVM_ROOT.nodes.push(new JSVM_MoveArgToVar(i, info.varId));
          }

          body.body.forEach((child_node: any) => {
            const child_type = this.walk(child_node);
            if (child_type)
              this.JSVM_ROOT.nodes.push(child_type);
          });

          return null;
        } else {
          const info = this.getVariable(node.id.name);
          const newFuncScope = new FunctionScope(this.functionScope.parser, this.functionScope);
          newFuncScope.inheretFrom(this.functionScope); // cascade variables into this scope
          newFuncScope.parse(node);
          return new JSVM_Declare(info.varId, info.from.funcScopeId, new JSVM_CreateFunc(newFuncScope.funcScopeId));
        }
      }
      case 'MemberExpression': {
        const obj = this.walk(node.object);
        const prop = this.walk(node.property);

        if (!obj || !prop) {
          let is_prop_missing = !prop;
          let is_obj_missing = !obj;
          throw "Invalid member expression" + `prop missing: ${is_prop_missing}, obj missing: ${is_obj_missing}`;
        }

        return new JSVM_MemberExpression(obj, prop);
      }
      case 'Identifier': {
        const info = this.getVariable(node.name);
        return new JSVM_Identifier(info.global, info.from.funcScopeId, info.varId, info.stringId);
      }
      case 'BinaryExpression': {
        let left = this.walk(node.left);
        let right = this.walk(node.right);
        return new JSVM_BinaryExpression(left, right, node.operator);
      }
      case 'IfStatement': {
        const consequent = node.consequent
        const alternate = node.alternate;
        if (node === this.topNode) throw "Parser::walk cant do that ....";


        const ifstatement = new JSVM_IfStatement();
        ifstatement.test = this.walk(node.test);

        if (consequent.type === "BlockStatement") {
          const child_scope = new Scope(this.functionScope);
          // child_scope.inheretFrom(this);
          child_scope.parse(consequent);
          ifstatement.consequent = child_scope.JSVM_ROOT;
        } else {
          ifstatement.consequent = this.walk(consequent);
        }

        if (alternate) {
          if (alternate.type === "BlockStatement") {
            const child_scope = new Scope(this.functionScope);
            // child_scope.inheretFrom(this);
            child_scope.parse(alternate);
            ifstatement.alternate = child_scope.JSVM_ROOT;
          } else {
            ifstatement.alternate = this.walk(alternate);
          }
        }

        return ifstatement;
      }
      case 'VariableDeclaration': {
        const collection = new JSVM_Collection();
        node.declarations.forEach(child => {
          let jsvm_node = this.walk(child);
          if (!jsvm_node) return;
          if (!(jsvm_node instanceof JSVM_Declare)) throw "Parser::walk Not a definition!";
          collection.nodes.push(jsvm_node);
        });
        return collection;
      }
      case 'VariableDeclarator': {
        if (node.init) {
          const id = node.id;
          if (id.type != "Identifier") throw "Parser::walk Only support Identifier VariableDeclarator";
          const info = this.getVariable(id.name);
          if (info.global) throw "Parser::walk declare varaible on global!";
          return new JSVM_Declare(info.varId, info.from.funcScopeId, this.walk(node.init));
        }
        return null;
      }
      case 'Literal': {
        if (node.value === null) return new JSVM_LoadNull();

        switch (typeof (node.value)) {
          case "number": {
            if (isInt(node.value)) {
              return new JSVM_LoadInt(node.value);
            } else {
              return new JSVM_LoadInt(node.value);
            }
          }
          case "boolean": {
            return new JSVM_Boolean(node.value);
          }
          case 'string': {
            let string_id = this.functionScope.parser.stash(node.value);
            return new JSVM_StringLiteral(string_id);
          }
          case 'object': {
            if (node.value instanceof RegExp) {
              let patternId = this.functionScope.parser.stash((node as any).regex.pattern);
              let flagsId = this.functionScope.parser.stash((node as any).regex.flags);
              return new JSVM_Regex(patternId, flagsId);
            }
            throw "Parser::walk unknown literal value" + node.value;
          }
          default:
            throw "Parser::walk unknown literal type: " + node.value + " " + typeof (node.value);
        }
      }
      default:
        throw "Parser::walk unknown node type: " + node.type;
    }
  }
}

export class FunctionScope {
  funcScopeId: number;
  scopeIdCtr = 0;
  variableIdCtr = 0;
  variables: VariableMap = new Map();
  JSVM_ROOT = new JSVM_Collection();
  topScope: Scope = new Scope(this);
  parser: Parser;
  parent: FunctionScope = null;

  inheretFrom(funcScope: FunctionScope) {
    funcScope.variables.forEach((definition, name) => {
      this.variables.set(name, definition);
    });
  }

  constructor(parser: Parser, parent: FunctionScope = null) {
    this.parser = parser;
    this.parser.functionScopes.push(this);
    this.funcScopeId = this.parser.funcScopeIdCounter++;
    this.parent = parent;
  }

  parse(node: Node) {
    this.JSVM_ROOT.nodes.push(this.topScope.JSVM_ROOT);
    this.topScope.parse(node);
  }
}