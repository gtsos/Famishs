// BEGIN InterpretLang

export class JSVM_Node {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
}

export class JSVM_DefaultNode extends JSVM_Node {
  constructor() {
    super("Node");
  }
}

export class JSVM_GotoScope extends JSVM_Node {
  scope_id: number;
  static type = "GotoScope";

  constructor(scope_id: number) {
    super(JSVM_GotoScope.type);
    this.scope_id = scope_id;
  }
}

export class JSVM_IfStatement extends JSVM_Node {
  test: JSVM_Node = null;
  consequent: JSVM_Node = null;
  alternate: JSVM_Node = null;

  static type = "IfStatement";

  constructor() {
    super(JSVM_IfStatement.type);
  }
}

export class JSVM_TryStatement extends JSVM_Node {
  body: JSVM_Node = null;
  catch: JSVM_Node = null;
  finially: JSVM_Node = null;

  static type = "TryStatement";

  constructor() {
    super(JSVM_TryStatement.type);
  }
}

export class JSVM_Catch extends JSVM_Node {
  body: JSVM_Node = null;
  param: JSVM_Identifier = null;

  static type = "Catch";

  constructor() {
    super(JSVM_Catch.type);
  }
}

export class JSVM_SwitchCase extends JSVM_Node {
  test: JSVM_Node = null;
  consequent: JSVM_Node[] = [];

  static type = "SwitchCase";

  constructor() {
    super(JSVM_SwitchCase.type);
  }
}

export class JSVM_SwitchStatement extends JSVM_Node {
  discriminant: JSVM_Node = null;
  cases: JSVM_SwitchCase[] = [];

  static type = "SwitchStatement";

  constructor() {
    super(JSVM_SwitchStatement.type);
  }
}

export class JSVM_ForLoop extends JSVM_Node {
  init: JSVM_Node = null;
  test: JSVM_Node = null;
  update: JSVM_Node = null;
  body: JSVM_Node = null;

  static type = "ForLoop";

  constructor() {
    super(JSVM_ForLoop.type);
  }
}

export class JSVM_Throw extends JSVM_Node {
  argument: JSVM_Node;
  static type = "Throw";

  constructor(argument: JSVM_Node) {
    super(JSVM_Throw.type);
    this.argument = argument;
  }
}

export class JSVM_WhileLoop extends JSVM_Node {
  test: JSVM_Node = null;
  body: JSVM_Node = null;

  static type = "WhileLoop";

  constructor() {
    super(JSVM_WhileLoop.type);
  }
}

export class JSVM_Array extends JSVM_Node {
  elements: JSVM_Node[] = [];
  static type = "Array"

  constructor() {
    super(JSVM_Array.type);
  }
}

export class JSVM_LogicalAnd extends JSVM_Node {
  left: JSVM_Node;
  right: JSVM_Node;
  static type: string = "LogicalAnd";

  constructor(left: JSVM_Node, right: JSVM_Node) {
    super(JSVM_LogicalAnd.type);
    this.left = left;
    this.right = right;
  }
}

export class JSVM_LogicalOr extends JSVM_Node {
  left: JSVM_Node;
  right: JSVM_Node;
  static type: string = "LogicalOr";

  constructor(left: JSVM_Node, right: JSVM_Node) {
    super(JSVM_LogicalOr.type);
    this.left = left;
    this.right = right;
  }
}

export class JSVM_Object extends JSVM_Node {
  properties: JSVM_Property[] = [];
  static type = "Object";

  constructor() {
    super(JSVM_Object.type);
  }
}

export class JSVM_Sequence extends JSVM_Node {
  sequence: JSVM_Node[] = [];
  static type = "Sequence";

  constructor() {
    super(JSVM_Sequence.type);
  }
}

export class JSVM_Property extends JSVM_Node {
  kind: string;
  keyStringId: number;
  value: JSVM_Node;
  static type: string = "Property";

  constructor(kind: string, keyStringId: number, value: JSVM_Node) {
    super(JSVM_Property.type);
    this.kind = kind;
    this.keyStringId = keyStringId;
    this.value = value;
  }
}

export class JSVM_DoWhileLoop extends JSVM_Node {
  test: JSVM_Node = null;
  body: JSVM_Node = null;

  static type = "DoWhileLoop";

  constructor() {
    super(JSVM_DoWhileLoop.type);
  }
}

export class JSVM_ConditionalIfStatement extends JSVM_Node {
  test: JSVM_Node = null;
  consequent: JSVM_Node = null;
  alternate: JSVM_Node = null;

  static type = "ConditionalIfStatement";

  constructor() {
    super(JSVM_ConditionalIfStatement.type);
  }
}

export class JSVM_NewCall extends JSVM_Node {
  callee: JSVM_Node;
  arguments: JSVM_Node[] = [];
  static type = "NewCall";

  constructor(callee: JSVM_Node) {
    super(JSVM_NewCall.type);
    this.callee = callee;
  }
}

export class JSVM_FuncCall extends JSVM_Node {
  callee: JSVM_Node;
  arguments: JSVM_Node[] = [];
  static type = "FuncCall";

  constructor(callee: JSVM_Node) {
    super(JSVM_FuncCall.type);
    this.callee = callee;
  }
}

export class JSVM_PropertyFuncCall extends JSVM_Node {
  callee: JSVM_MemberExpression;
  arguments: JSVM_Node[] = [];
  static type = "PropertyFuncCall";

  constructor(callee: JSVM_MemberExpression) {
    super(JSVM_PropertyFuncCall.type);
    this.callee = callee;
  }
}

export class JSVM_MemberExpression extends JSVM_Node {
  object: JSVM_Node;
  property: JSVM_Node;
  static type = "MemberExpression";

  constructor(object: JSVM_Node, property: JSVM_Node) {
    super(JSVM_MemberExpression.type);
    this.object = object;
    this.property = property;
  }
}

export class JSVM_Collection extends JSVM_Node {
  nodes: JSVM_Node[] = [];
  static type = "Collection";

  constructor() {
    super(JSVM_Collection.type);
  }
}

export class JSVM_AssignVariable extends JSVM_Node {
  variable: JSVM_Identifier;
  value: JSVM_Node;
  static type = "AssignVariable";
  constructor(variable: JSVM_Identifier, value: JSVM_Node) {
    super(JSVM_AssignVariable.type);
    this.variable = variable;
    this.value = value;
  }
}

export class JSVM_AssignVariablePipe extends JSVM_Node {
  variable: JSVM_Identifier;
  value: JSVM_Node;
  static type = "AssignVariablePipe";
  constructor(variable: JSVM_Identifier, value: JSVM_Node) {
    super(JSVM_AssignVariablePipe.type);
    this.variable = variable;
    this.value = value;
  }
}

export class JSVM_AssignVariableMul extends JSVM_Node {
  variable: JSVM_Identifier;
  value: JSVM_Node;
  static type = "AssignVariableMul";
  constructor(variable: JSVM_Identifier, value: JSVM_Node) {
    super(JSVM_AssignVariableMul.type);
    this.variable = variable;
    this.value = value;
  }
}

export class JSVM_AssignVariableDiv extends JSVM_Node {
  variable: JSVM_Identifier;
  value: JSVM_Node;
  static type = "AssignVariableDiv";
  constructor(variable: JSVM_Identifier, value: JSVM_Node) {
    super(JSVM_AssignVariableDiv.type);
    this.variable = variable;
    this.value = value;
  }
}

export class JSVM_AssignVariablePlus extends JSVM_Node {
  variable: JSVM_Identifier;
  value: JSVM_Node;
  static type = "AssignVariablePlus";

  constructor(variable: JSVM_Identifier, value: JSVM_Node) {
    super(JSVM_AssignVariablePlus.type);
    this.variable = variable;
    this.value = value;
  }
}

export class JSVM_AssignVariableRemainder extends JSVM_Node {
  variable: JSVM_Identifier;
  value: JSVM_Node;
  static type = "AssignVariableRemainder";

  constructor(variable: JSVM_Identifier, value: JSVM_Node) {
    super(JSVM_AssignVariableRemainder.type);
    this.variable = variable;
    this.value = value;
  }
}

export class JSVM_AssignVariableMinus extends JSVM_Node {
  variable: JSVM_Identifier;
  value: JSVM_Node;
  static type = "AssignVariableMinus";

  constructor(variable: JSVM_Identifier, value: JSVM_Node) {
    super(JSVM_AssignVariableMinus.type);
    this.variable = variable;
    this.value = value;
  }
}

export class JSVM_AssignVariableZeroRightShiftFill extends JSVM_Node {
  variable: JSVM_Identifier;
  value: JSVM_Node;
  static type = "AssignVariableZeroRightShiftFill";

  constructor(variable: JSVM_Identifier, value: JSVM_Node) {
    super(JSVM_AssignVariableZeroRightShiftFill.type);
    this.variable = variable;
    this.value = value;
  }
}

export class JSVM_AssignVariableXor extends JSVM_Node {
  variable: JSVM_Identifier;
  value: JSVM_Node;
  static type = "AssignVariableXor";

  constructor(variable: JSVM_Identifier, value: JSVM_Node) {
    super(JSVM_AssignVariableXor.type);
    this.variable = variable;
    this.value = value;
  }
}

export class JSVM_AssignVariableBitShiftLeft extends JSVM_Node {
  variable: JSVM_Identifier;
  value: JSVM_Node;
  static type = "AssignVariableBitShiftLeft";

  constructor(variable: JSVM_Identifier, value: JSVM_Node) {
    super(JSVM_AssignVariableBitShiftLeft.type);
    this.variable = variable;
    this.value = value;
  }
}

export class JSVM_AssignVariableBitShiftRight extends JSVM_Node {
  variable: JSVM_Identifier;
  value: JSVM_Node;
  static type = "AssignVariableBitShiftRight";

  constructor(variable: JSVM_Identifier, value: JSVM_Node) {
    super(JSVM_AssignVariableBitShiftRight.type);
    this.variable = variable;
    this.value = value;
  }
}

export class JSVM_AssignVariableRaisePower extends JSVM_Node {
  variable: JSVM_Identifier;
  value: JSVM_Node;
  static type = "AssignVariableRaisePower";

  constructor(variable: JSVM_Identifier, value: JSVM_Node) {
    super(JSVM_AssignVariableRaisePower.type);
    this.variable = variable;
    this.value = value;
  }
}

export class JSVM_AssignVariableBitwiseAnd extends JSVM_Node {
  variable: JSVM_Identifier;
  value: JSVM_Node;
  static type = "AssignVariableBitwiseAnd";

  constructor(variable: JSVM_Identifier, value: JSVM_Node) {
    super(JSVM_AssignVariableBitwiseAnd.type);
    this.variable = variable;
    this.value = value;
  }
}

export class JSVM_AssignProperty extends JSVM_Node {
  obj: JSVM_Node;
  prop: JSVM_Node;
  value: JSVM_Node;
  static type = "AssignProperty";

  constructor(obj: JSVM_Node, prop: JSVM_Node, value: JSVM_Node) {
    super(JSVM_AssignProperty.type);
    this.obj = obj;
    this.prop = prop;
    this.value = value;
  }
}

export class JSVM_Global extends JSVM_Node {
  static type = "Global";

  constructor() {
    super(JSVM_Global.type);
  }
}

export class JSVM_AssignPropertyPlus extends JSVM_Node {
  obj: JSVM_Node;
  prop: JSVM_Node;
  value: JSVM_Node;
  static type = "AssignPropertyPlus";

  constructor(obj: JSVM_Node, prop: JSVM_Node, value: JSVM_Node) {
    super(JSVM_AssignPropertyPlus.type);
    this.obj = obj;
    this.prop = prop;
    this.value = value;
  }
}

export class JSVM_AssignPropertyMinus extends JSVM_Node {
  obj: JSVM_Node;
  prop: JSVM_Node;
  value: JSVM_Node;
  static type = "AssignPropertyMinus";

  constructor(obj: JSVM_Node, prop: JSVM_Node, value: JSVM_Node) {
    super(JSVM_AssignPropertyMinus.type);
    this.obj = obj;
    this.prop = prop;
    this.value = value;
  }
}

export class JSVM_AssignPropertyMul extends JSVM_Node {
  obj: JSVM_Node;
  prop: JSVM_Node;
  value: JSVM_Node;
  static type = "AssignPropertyMul";

  constructor(obj: JSVM_Node, prop: JSVM_Node, value: JSVM_Node) {
    super(JSVM_AssignPropertyMul.type);
    this.obj = obj;
    this.prop = prop;
    this.value = value;
  }
}

export class JSVM_AssignPropertyDiv extends JSVM_Node {
  obj: JSVM_Node;
  prop: JSVM_Node;
  value: JSVM_Node;
  static type = "AssignPropertyDiv";

  constructor(obj: JSVM_Node, prop: JSVM_Node, value: JSVM_Node) {
    super(JSVM_AssignPropertyDiv.type);
    this.obj = obj;
    this.prop = prop;
    this.value = value;
  }
}

export class JSVM_AssignPropertyZeroRightShiftFill extends JSVM_Node {
  obj: JSVM_Node;
  prop: JSVM_Node;
  value: JSVM_Node;
  static type = "AssignPropertyZeroRightShiftFill";

  constructor(obj: JSVM_Node, prop: JSVM_Node, value: JSVM_Node) {
    super(JSVM_AssignPropertyZeroRightShiftFill.type);
    this.obj = obj;
    this.prop = prop;
    this.value = value;
  }
}

export class JSVM_AssignPropertyPipe extends JSVM_Node {
  obj: JSVM_Node;
  prop: JSVM_Node;
  value: JSVM_Node;
  static type = "AssignPropertyPipe";

  constructor(obj: JSVM_Node, prop: JSVM_Node, value: JSVM_Node) {
    super(JSVM_AssignPropertyPipe.type);
    this.obj = obj;
    this.prop = prop;
    this.value = value;
  }
}

export class JSVM_AssignPropertyXor extends JSVM_Node {
  obj: JSVM_Node;
  prop: JSVM_Node;
  value: JSVM_Node;
  static type = "AssignPropertyXor";

  constructor(obj: JSVM_Node, prop: JSVM_Node, value: JSVM_Node) {
    super(JSVM_AssignPropertyXor.type);
    this.obj = obj;
    this.prop = prop;
    this.value = value;
  }
}

export class JSVM_AssignPropertyBitwiseAnd extends JSVM_Node {
  obj: JSVM_Node;
  prop: JSVM_Node;
  value: JSVM_Node;
  static type = "AssignPropertyBitwiseAnd";

  constructor(obj: JSVM_Node, prop: JSVM_Node, value: JSVM_Node) {
    super(JSVM_AssignPropertyBitwiseAnd.type);
    this.obj = obj;
    this.prop = prop;
    this.value = value;
  }
}

export class JSVM_AssignPropertyBitShiftLeft extends JSVM_Node {
  obj: JSVM_Node;
  prop: JSVM_Node;
  value: JSVM_Node;
  static type = "AssignPropertyBitShiftLeft";

  constructor(obj: JSVM_Node, prop: JSVM_Node, value: JSVM_Node) {
    super(JSVM_AssignPropertyBitShiftLeft.type);
    this.obj = obj;
    this.prop = prop;
    this.value = value;
  }
}

export class JSVM_AssignPropertyBitShiftRight extends JSVM_Node {
  obj: JSVM_Node;
  prop: JSVM_Node;
  value: JSVM_Node;
  static type = "AssignPropertyBitShiftRight";

  constructor(obj: JSVM_Node, prop: JSVM_Node, value: JSVM_Node) {
    super(JSVM_AssignPropertyBitShiftRight.type);
    this.obj = obj;
    this.prop = prop;
    this.value = value;
  }
}


export class JSVM_AssignPropertyPowerOf extends JSVM_Node {
  obj: JSVM_Node;
  prop: JSVM_Node;
  value: JSVM_Node;
  static type = "AssignPropertyPowerOf";

  constructor(obj: JSVM_Node, prop: JSVM_Node, value: JSVM_Node) {
    super(JSVM_AssignPropertyPowerOf.type);
    this.obj = obj;
    this.prop = prop;
    this.value = value;
  }
}

export class JSVM_AssignPropertyRemainder extends JSVM_Node {
  obj: JSVM_Node;
  prop: JSVM_Node;
  value: JSVM_Node;
  static type = "AssignPropertyRemainder";

  constructor(obj: JSVM_Node, prop: JSVM_Node, value: JSVM_Node) {
    super(JSVM_AssignPropertyRemainder.type);
    this.obj = obj;
    this.prop = prop;
    this.value = value;
  }
}

export class JSVM_ExpressionStatement extends JSVM_Node {
  expression: JSVM_Node;
  static type = "ExpressionStatement";
  constructor(expression: JSVM_Node) {
    super(JSVM_ExpressionStatement.type);
    this.expression = expression;
  }
}

export class JSVM_BinaryExpression extends JSVM_Node {
  left: JSVM_Node;
  right: JSVM_Node;
  operator: string;
  static type = "BinaryExpression";

  constructor(left: JSVM_Node, right: JSVM_Node, operator: string) {
    super(JSVM_BinaryExpression.type);
    this.operator = operator;
    this.left = left;
    this.right = right;
  }
}

export class JSVM_Literal extends JSVM_Node {
  raw: any;
  value: any;
  string_id: number;
  static type = "Literal";

  constructor(raw: any, value: any, string_id = -1) {
    super(JSVM_Literal.type);
    this.string_id = string_id;
    this.raw = raw;
    this.value = value;
  }
}

export class JSVM_StringLiteral extends JSVM_Node {
  string_id: number;
  static type = "StringLiteral";

  constructor(string_id = -1) {
    super(JSVM_StringLiteral.type);
    this.string_id = string_id;
  }
}

export class JSVM_Regex extends JSVM_Node {
  patternId: number;
  flagsId: number;
  static type = "Regex";

  constructor(patternId = -1, flagsId = -1) {
    super(JSVM_Regex.type);
    this.patternId = patternId;
    this.flagsId = flagsId
  }
}

export class JSVM_Boolean extends JSVM_Node {
  val: boolean;
  static type = "Boolean";

  constructor(val: boolean) {
    super(JSVM_Boolean.type);
    this.val = val;
  }
}

export class JSVM_Declaration extends JSVM_Node {
  declarations: JSVM_Node[] = [];
  static type = "VariableDeclaration";

  constructor() {
    super(JSVM_Declaration.type);
  }
}

export class JSVM_Return extends JSVM_Node {
  static type = "Return";
  arg: JSVM_Node | null;

  constructor(arg: JSVM_Node | null) {
    super(JSVM_Return.type);
    this.arg = arg;
  }
}

export class JSVM_UnaryNot extends JSVM_Node {
  static type = "UnaryNot";
  argument: JSVM_Node;

  constructor(argument: JSVM_Node) {
    super(JSVM_UnaryNot.type);
    this.argument = argument;
  }
}

export class JSVM_UnaryPlus extends JSVM_Node {
  static type = "UnaryPlus";
  argument: JSVM_Node;

  constructor(argument: JSVM_Node) {
    super(JSVM_UnaryPlus.type);
    this.argument = argument;
  }
}

export class JSVM_UnaryTypeof extends JSVM_Node {
  static type = "UnaryTypeof";
  argument: JSVM_Node;

  constructor(argument: JSVM_Node) {
    super(JSVM_UnaryTypeof.type);
    
    // dont throw a reference error when loading a global variable from typeof(varName)
    if(argument.type === JSVM_Identifier.type){
      const arg = <JSVM_Identifier>argument;
      if(arg.global){
        arg.throwReferenceError = false;
      }
    }

    this.argument = argument;
  }
}

export class JSVM_UnaryNegate extends JSVM_Node {
  static type = "UnaryNegate";
  argument: JSVM_Node;

  constructor(argument: JSVM_Node) {
    super(JSVM_UnaryNegate.type);
    this.argument = argument;
  }
}

export class JSVM_UnaryInvert extends JSVM_Node {
  static type = "UnaryInvert";
  argument: JSVM_Node;

  constructor(argument: JSVM_Node) {
    super(JSVM_UnaryInvert.type);
    this.argument = argument;
  }
}

export class JSVM_UnaryVoid extends JSVM_Node {
  static type = "UnaryVoid";
  argument: JSVM_Node;

  constructor(argument: JSVM_Node) {
    super(JSVM_UnaryVoid.type);
    this.argument = argument;
  }
}

export class JSVM_UnaryDelete extends JSVM_Node {
  static type = "UnaryDelete";
  argument: JSVM_Node;

  constructor(argument: JSVM_Node) {
    super(JSVM_UnaryDelete.type);
    this.argument = argument;
  }
}

export class JSVM_UnaryDeleteMemberExpression extends JSVM_Node {
  static type = "UnaryDeleteMemberExpression";
  argument: JSVM_MemberExpression;

  constructor(argument: JSVM_MemberExpression) {
    super(JSVM_UnaryDeleteMemberExpression.type);
    this.argument = argument;
  }
}

export class JSVM_CreateFunc extends JSVM_Node {
  scope_id: number;
  static type = "CreateFunc";

  constructor(scope_id: number) {
    super(JSVM_CreateFunc.type);
    this.scope_id = scope_id;
  }
}

export class JSVM_MoveArgToVar extends JSVM_Node {
  arg_index: number = -1;
  var_id: number = -1;
  static type = "MoveArgToVar";

  constructor(arg_index: number, var_id: number) {
    super(JSVM_MoveArgToVar.type);
    this.arg_index = arg_index;
    this.var_id = var_id;
  }
}

export class JSVM_ObjectPlusPlus extends JSVM_Node {
  object: JSVM_Node;
  property: JSVM_Node;
  prefix: boolean;
  static type = "ObjectPlusPlus";

  constructor(prefix: boolean, object: JSVM_Node, property: JSVM_Node) {
    super(JSVM_ObjectPlusPlus.type);
    this.prefix = prefix;
    this.object = object;
    this.property = property;
  }
}

export class JSVM_ObjectMinusMinus extends JSVM_Node {
  object: JSVM_Node;
  property: JSVM_Node;
  prefix: boolean;
  static type = "ObjectMinusMinus";

  constructor(prefix: boolean, object: JSVM_Node, property: JSVM_Node) {
    super(JSVM_ObjectMinusMinus.type);
    this.prefix = prefix;
    this.object = object;
    this.property = property;
  }
}

export class JSVM_PlusPlus extends JSVM_Node {
  prefix: boolean;
  varId: number;
  funcScopeId: number;
  static type = "PlusPlus";

  constructor(prefix: boolean, varId: number, funcScopeId: number) {
    super(JSVM_PlusPlus.type);
    this.prefix = prefix;
    this.varId = varId;
    this.funcScopeId = funcScopeId;
  }
}

export class JSVM_MinusMinus extends JSVM_Node {
  prefix: boolean;
  varId: number;
  funcScopeId: number;
  static type = "MinusMinus";

  constructor(prefix: boolean, varId: number, funcScopeId: number) {
    super(JSVM_MinusMinus.type);
    this.prefix = prefix;
    this.varId = varId;
    this.funcScopeId = funcScopeId;
  }
}

export class JSVM_Declare extends JSVM_Node {
  varId: number;
  funcScopeId: number;
  init: JSVM_Node;
  id: JSVM_Node;
  static type = "Declare";

  constructor(varId: number, funcScopeId: number, init: JSVM_Node) {
    super(JSVM_Declare.type);
    this.varId = varId;
    this.funcScopeId = funcScopeId;
    this.init = init;
  }
}

export class JSVM_LoadInt extends JSVM_Node {
  value: number;
  static type = "LoadInt";

  constructor(value: number) {
    if(value === undefined) throw "Needs defined int!";
    super(JSVM_LoadInt.type);
    this.value = value;
  }
}

export class JSVM_LoadNull extends JSVM_Node {
  static type = "LoadNull";

  constructor() {
    super(JSVM_LoadNull.type);
  }
}

export class JSVM_LoadUndefined extends JSVM_Node {
  static type = "LoadUndefined";

  constructor() {
    super(JSVM_LoadUndefined.type);
  }
}

export class JSVM_Identifier extends JSVM_Node {
  global: boolean;
  scope_id: number;
  var_id: number;
  string_id: number;
  throwReferenceError: boolean = true;
  static type = "Identifier";

  constructor(global: boolean, scope_id: number, var_id: number, string_id: number) {
    super(JSVM_Identifier.type);
    this.global = global;
    this.scope_id = scope_id;
    this.var_id = var_id;
    this.string_id = string_id;
  }
}

export class JSVM_SelfFnRef extends JSVM_Node {
  varId: number;
  scopeId: number;
  static type = "SelfFnRef";

  constructor(varId: number, scopeId: number) {
    super(JSVM_SelfFnRef.type);
    this.varId = varId;
    this.scopeId = scopeId;
  }
}

export class JSVM_ArgumentsRef extends JSVM_Node {
  varId: number;
  static type = "ArgumentsRef";

  constructor(varId: number) {
    super(JSVM_ArgumentsRef.type);
    this.varId = varId;
  }
}

export class JSVM_This extends JSVM_Node {
  static type = "This";

  constructor() {
    super(JSVM_This.type);
  }
}

export class JSVM_Break extends JSVM_Node {
  static type = "Break";

  constructor() {
    super(JSVM_Break.type);
  }
}

export class JSVM_ContinueStatement extends JSVM_Node {
  static type = "Continue";

  constructor() {
    super(JSVM_ContinueStatement.type);
  }
}