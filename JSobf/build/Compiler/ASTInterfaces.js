"use strict";
// BEGIN InterpretLang
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSVM_AssignPropertyPowerOf = exports.JSVM_AssignPropertyBitShiftRight = exports.JSVM_AssignPropertyBitShiftLeft = exports.JSVM_AssignPropertyBitwiseAnd = exports.JSVM_AssignPropertyXor = exports.JSVM_AssignPropertyPipe = exports.JSVM_AssignPropertyZeroRightShiftFill = exports.JSVM_AssignPropertyDiv = exports.JSVM_AssignPropertyMul = exports.JSVM_AssignPropertyMinus = exports.JSVM_AssignPropertyPlus = exports.JSVM_Global = exports.JSVM_AssignProperty = exports.JSVM_AssignVariableBitwiseAnd = exports.JSVM_AssignVariableRaisePower = exports.JSVM_AssignVariableBitShiftRight = exports.JSVM_AssignVariableBitShiftLeft = exports.JSVM_AssignVariableXor = exports.JSVM_AssignVariableZeroRightShiftFill = exports.JSVM_AssignVariableMinus = exports.JSVM_AssignVariableRemainder = exports.JSVM_AssignVariablePlus = exports.JSVM_AssignVariableDiv = exports.JSVM_AssignVariableMul = exports.JSVM_AssignVariablePipe = exports.JSVM_AssignVariable = exports.JSVM_Collection = exports.JSVM_MemberExpression = exports.JSVM_PropertyFuncCall = exports.JSVM_FuncCall = exports.JSVM_NewCall = exports.JSVM_ConditionalIfStatement = exports.JSVM_DoWhileLoop = exports.JSVM_Property = exports.JSVM_Sequence = exports.JSVM_Object = exports.JSVM_LogicalOr = exports.JSVM_LogicalAnd = exports.JSVM_Array = exports.JSVM_WhileLoop = exports.JSVM_Throw = exports.JSVM_ForLoop = exports.JSVM_SwitchStatement = exports.JSVM_SwitchCase = exports.JSVM_Catch = exports.JSVM_TryStatement = exports.JSVM_IfStatement = exports.JSVM_GotoScope = exports.JSVM_DefaultNode = exports.JSVM_Node = void 0;
exports.JSVM_ContinueStatement = exports.JSVM_Break = exports.JSVM_This = exports.JSVM_ArgumentsRef = exports.JSVM_SelfFnRef = exports.JSVM_Identifier = exports.JSVM_LoadUndefined = exports.JSVM_LoadNull = exports.JSVM_LoadInt = exports.JSVM_Declare = exports.JSVM_MinusMinus = exports.JSVM_PlusPlus = exports.JSVM_ObjectMinusMinus = exports.JSVM_ObjectPlusPlus = exports.JSVM_MoveArgToVar = exports.JSVM_CreateFunc = exports.JSVM_UnaryDeleteMemberExpression = exports.JSVM_UnaryDelete = exports.JSVM_UnaryVoid = exports.JSVM_UnaryInvert = exports.JSVM_UnaryNegate = exports.JSVM_UnaryTypeof = exports.JSVM_UnaryPlus = exports.JSVM_UnaryNot = exports.JSVM_Return = exports.JSVM_Declaration = exports.JSVM_Boolean = exports.JSVM_Regex = exports.JSVM_StringLiteral = exports.JSVM_Literal = exports.JSVM_BinaryExpression = exports.JSVM_ExpressionStatement = exports.JSVM_AssignPropertyRemainder = void 0;
class JSVM_Node {
    constructor(type) {
        this.type = type;
    }
}
exports.JSVM_Node = JSVM_Node;
class JSVM_DefaultNode extends JSVM_Node {
    constructor() {
        super("Node");
    }
}
exports.JSVM_DefaultNode = JSVM_DefaultNode;
class JSVM_GotoScope extends JSVM_Node {
    constructor(scope_id) {
        super(JSVM_GotoScope.type);
        this.scope_id = scope_id;
    }
}
JSVM_GotoScope.type = "GotoScope";
exports.JSVM_GotoScope = JSVM_GotoScope;
class JSVM_IfStatement extends JSVM_Node {
    constructor() {
        super(JSVM_IfStatement.type);
        this.test = null;
        this.consequent = null;
        this.alternate = null;
    }
}
JSVM_IfStatement.type = "IfStatement";
exports.JSVM_IfStatement = JSVM_IfStatement;
class JSVM_TryStatement extends JSVM_Node {
    constructor() {
        super(JSVM_TryStatement.type);
        this.body = null;
        this.catch = null;
        this.finially = null;
    }
}
JSVM_TryStatement.type = "TryStatement";
exports.JSVM_TryStatement = JSVM_TryStatement;
class JSVM_Catch extends JSVM_Node {
    constructor() {
        super(JSVM_Catch.type);
        this.body = null;
        this.param = null;
    }
}
JSVM_Catch.type = "Catch";
exports.JSVM_Catch = JSVM_Catch;
class JSVM_SwitchCase extends JSVM_Node {
    constructor() {
        super(JSVM_SwitchCase.type);
        this.test = null;
        this.consequent = [];
    }
}
JSVM_SwitchCase.type = "SwitchCase";
exports.JSVM_SwitchCase = JSVM_SwitchCase;
class JSVM_SwitchStatement extends JSVM_Node {
    constructor() {
        super(JSVM_SwitchStatement.type);
        this.discriminant = null;
        this.cases = [];
    }
}
JSVM_SwitchStatement.type = "SwitchStatement";
exports.JSVM_SwitchStatement = JSVM_SwitchStatement;
class JSVM_ForLoop extends JSVM_Node {
    constructor() {
        super(JSVM_ForLoop.type);
        this.init = null;
        this.test = null;
        this.update = null;
        this.body = null;
    }
}
JSVM_ForLoop.type = "ForLoop";
exports.JSVM_ForLoop = JSVM_ForLoop;
class JSVM_Throw extends JSVM_Node {
    constructor(argument) {
        super(JSVM_Throw.type);
        this.argument = argument;
    }
}
JSVM_Throw.type = "Throw";
exports.JSVM_Throw = JSVM_Throw;
class JSVM_WhileLoop extends JSVM_Node {
    constructor() {
        super(JSVM_WhileLoop.type);
        this.test = null;
        this.body = null;
    }
}
JSVM_WhileLoop.type = "WhileLoop";
exports.JSVM_WhileLoop = JSVM_WhileLoop;
class JSVM_Array extends JSVM_Node {
    constructor() {
        super(JSVM_Array.type);
        this.elements = [];
    }
}
JSVM_Array.type = "Array";
exports.JSVM_Array = JSVM_Array;
class JSVM_LogicalAnd extends JSVM_Node {
    constructor(left, right) {
        super(JSVM_LogicalAnd.type);
        this.left = left;
        this.right = right;
    }
}
JSVM_LogicalAnd.type = "LogicalAnd";
exports.JSVM_LogicalAnd = JSVM_LogicalAnd;
class JSVM_LogicalOr extends JSVM_Node {
    constructor(left, right) {
        super(JSVM_LogicalOr.type);
        this.left = left;
        this.right = right;
    }
}
JSVM_LogicalOr.type = "LogicalOr";
exports.JSVM_LogicalOr = JSVM_LogicalOr;
class JSVM_Object extends JSVM_Node {
    constructor() {
        super(JSVM_Object.type);
        this.properties = [];
    }
}
JSVM_Object.type = "Object";
exports.JSVM_Object = JSVM_Object;
class JSVM_Sequence extends JSVM_Node {
    constructor() {
        super(JSVM_Sequence.type);
        this.sequence = [];
    }
}
JSVM_Sequence.type = "Sequence";
exports.JSVM_Sequence = JSVM_Sequence;
class JSVM_Property extends JSVM_Node {
    constructor(kind, keyStringId, value) {
        super(JSVM_Property.type);
        this.kind = kind;
        this.keyStringId = keyStringId;
        this.value = value;
    }
}
JSVM_Property.type = "Property";
exports.JSVM_Property = JSVM_Property;
class JSVM_DoWhileLoop extends JSVM_Node {
    constructor() {
        super(JSVM_DoWhileLoop.type);
        this.test = null;
        this.body = null;
    }
}
JSVM_DoWhileLoop.type = "DoWhileLoop";
exports.JSVM_DoWhileLoop = JSVM_DoWhileLoop;
class JSVM_ConditionalIfStatement extends JSVM_Node {
    constructor() {
        super(JSVM_ConditionalIfStatement.type);
        this.test = null;
        this.consequent = null;
        this.alternate = null;
    }
}
JSVM_ConditionalIfStatement.type = "ConditionalIfStatement";
exports.JSVM_ConditionalIfStatement = JSVM_ConditionalIfStatement;
class JSVM_NewCall extends JSVM_Node {
    constructor(callee) {
        super(JSVM_NewCall.type);
        this.arguments = [];
        this.callee = callee;
    }
}
JSVM_NewCall.type = "NewCall";
exports.JSVM_NewCall = JSVM_NewCall;
class JSVM_FuncCall extends JSVM_Node {
    constructor(callee) {
        super(JSVM_FuncCall.type);
        this.arguments = [];
        this.callee = callee;
    }
}
JSVM_FuncCall.type = "FuncCall";
exports.JSVM_FuncCall = JSVM_FuncCall;
class JSVM_PropertyFuncCall extends JSVM_Node {
    constructor(callee) {
        super(JSVM_PropertyFuncCall.type);
        this.arguments = [];
        this.callee = callee;
    }
}
JSVM_PropertyFuncCall.type = "PropertyFuncCall";
exports.JSVM_PropertyFuncCall = JSVM_PropertyFuncCall;
class JSVM_MemberExpression extends JSVM_Node {
    constructor(object, property) {
        super(JSVM_MemberExpression.type);
        this.object = object;
        this.property = property;
    }
}
JSVM_MemberExpression.type = "MemberExpression";
exports.JSVM_MemberExpression = JSVM_MemberExpression;
class JSVM_Collection extends JSVM_Node {
    constructor() {
        super(JSVM_Collection.type);
        this.nodes = [];
    }
}
JSVM_Collection.type = "Collection";
exports.JSVM_Collection = JSVM_Collection;
class JSVM_AssignVariable extends JSVM_Node {
    constructor(variable, value) {
        super(JSVM_AssignVariable.type);
        this.variable = variable;
        this.value = value;
    }
}
JSVM_AssignVariable.type = "AssignVariable";
exports.JSVM_AssignVariable = JSVM_AssignVariable;
class JSVM_AssignVariablePipe extends JSVM_Node {
    constructor(variable, value) {
        super(JSVM_AssignVariablePipe.type);
        this.variable = variable;
        this.value = value;
    }
}
JSVM_AssignVariablePipe.type = "AssignVariablePipe";
exports.JSVM_AssignVariablePipe = JSVM_AssignVariablePipe;
class JSVM_AssignVariableMul extends JSVM_Node {
    constructor(variable, value) {
        super(JSVM_AssignVariableMul.type);
        this.variable = variable;
        this.value = value;
    }
}
JSVM_AssignVariableMul.type = "AssignVariableMul";
exports.JSVM_AssignVariableMul = JSVM_AssignVariableMul;
class JSVM_AssignVariableDiv extends JSVM_Node {
    constructor(variable, value) {
        super(JSVM_AssignVariableDiv.type);
        this.variable = variable;
        this.value = value;
    }
}
JSVM_AssignVariableDiv.type = "AssignVariableDiv";
exports.JSVM_AssignVariableDiv = JSVM_AssignVariableDiv;
class JSVM_AssignVariablePlus extends JSVM_Node {
    constructor(variable, value) {
        super(JSVM_AssignVariablePlus.type);
        this.variable = variable;
        this.value = value;
    }
}
JSVM_AssignVariablePlus.type = "AssignVariablePlus";
exports.JSVM_AssignVariablePlus = JSVM_AssignVariablePlus;
class JSVM_AssignVariableRemainder extends JSVM_Node {
    constructor(variable, value) {
        super(JSVM_AssignVariableRemainder.type);
        this.variable = variable;
        this.value = value;
    }
}
JSVM_AssignVariableRemainder.type = "AssignVariableRemainder";
exports.JSVM_AssignVariableRemainder = JSVM_AssignVariableRemainder;
class JSVM_AssignVariableMinus extends JSVM_Node {
    constructor(variable, value) {
        super(JSVM_AssignVariableMinus.type);
        this.variable = variable;
        this.value = value;
    }
}
JSVM_AssignVariableMinus.type = "AssignVariableMinus";
exports.JSVM_AssignVariableMinus = JSVM_AssignVariableMinus;
class JSVM_AssignVariableZeroRightShiftFill extends JSVM_Node {
    constructor(variable, value) {
        super(JSVM_AssignVariableZeroRightShiftFill.type);
        this.variable = variable;
        this.value = value;
    }
}
JSVM_AssignVariableZeroRightShiftFill.type = "AssignVariableZeroRightShiftFill";
exports.JSVM_AssignVariableZeroRightShiftFill = JSVM_AssignVariableZeroRightShiftFill;
class JSVM_AssignVariableXor extends JSVM_Node {
    constructor(variable, value) {
        super(JSVM_AssignVariableXor.type);
        this.variable = variable;
        this.value = value;
    }
}
JSVM_AssignVariableXor.type = "AssignVariableXor";
exports.JSVM_AssignVariableXor = JSVM_AssignVariableXor;
class JSVM_AssignVariableBitShiftLeft extends JSVM_Node {
    constructor(variable, value) {
        super(JSVM_AssignVariableBitShiftLeft.type);
        this.variable = variable;
        this.value = value;
    }
}
JSVM_AssignVariableBitShiftLeft.type = "AssignVariableBitShiftLeft";
exports.JSVM_AssignVariableBitShiftLeft = JSVM_AssignVariableBitShiftLeft;
class JSVM_AssignVariableBitShiftRight extends JSVM_Node {
    constructor(variable, value) {
        super(JSVM_AssignVariableBitShiftRight.type);
        this.variable = variable;
        this.value = value;
    }
}
JSVM_AssignVariableBitShiftRight.type = "AssignVariableBitShiftRight";
exports.JSVM_AssignVariableBitShiftRight = JSVM_AssignVariableBitShiftRight;
class JSVM_AssignVariableRaisePower extends JSVM_Node {
    constructor(variable, value) {
        super(JSVM_AssignVariableRaisePower.type);
        this.variable = variable;
        this.value = value;
    }
}
JSVM_AssignVariableRaisePower.type = "AssignVariableRaisePower";
exports.JSVM_AssignVariableRaisePower = JSVM_AssignVariableRaisePower;
class JSVM_AssignVariableBitwiseAnd extends JSVM_Node {
    constructor(variable, value) {
        super(JSVM_AssignVariableBitwiseAnd.type);
        this.variable = variable;
        this.value = value;
    }
}
JSVM_AssignVariableBitwiseAnd.type = "AssignVariableBitwiseAnd";
exports.JSVM_AssignVariableBitwiseAnd = JSVM_AssignVariableBitwiseAnd;
class JSVM_AssignProperty extends JSVM_Node {
    constructor(obj, prop, value) {
        super(JSVM_AssignProperty.type);
        this.obj = obj;
        this.prop = prop;
        this.value = value;
    }
}
JSVM_AssignProperty.type = "AssignProperty";
exports.JSVM_AssignProperty = JSVM_AssignProperty;
class JSVM_Global extends JSVM_Node {
    constructor() {
        super(JSVM_Global.type);
    }
}
JSVM_Global.type = "Global";
exports.JSVM_Global = JSVM_Global;
class JSVM_AssignPropertyPlus extends JSVM_Node {
    constructor(obj, prop, value) {
        super(JSVM_AssignPropertyPlus.type);
        this.obj = obj;
        this.prop = prop;
        this.value = value;
    }
}
JSVM_AssignPropertyPlus.type = "AssignPropertyPlus";
exports.JSVM_AssignPropertyPlus = JSVM_AssignPropertyPlus;
class JSVM_AssignPropertyMinus extends JSVM_Node {
    constructor(obj, prop, value) {
        super(JSVM_AssignPropertyMinus.type);
        this.obj = obj;
        this.prop = prop;
        this.value = value;
    }
}
JSVM_AssignPropertyMinus.type = "AssignPropertyMinus";
exports.JSVM_AssignPropertyMinus = JSVM_AssignPropertyMinus;
class JSVM_AssignPropertyMul extends JSVM_Node {
    constructor(obj, prop, value) {
        super(JSVM_AssignPropertyMul.type);
        this.obj = obj;
        this.prop = prop;
        this.value = value;
    }
}
JSVM_AssignPropertyMul.type = "AssignPropertyMul";
exports.JSVM_AssignPropertyMul = JSVM_AssignPropertyMul;
class JSVM_AssignPropertyDiv extends JSVM_Node {
    constructor(obj, prop, value) {
        super(JSVM_AssignPropertyDiv.type);
        this.obj = obj;
        this.prop = prop;
        this.value = value;
    }
}
JSVM_AssignPropertyDiv.type = "AssignPropertyDiv";
exports.JSVM_AssignPropertyDiv = JSVM_AssignPropertyDiv;
class JSVM_AssignPropertyZeroRightShiftFill extends JSVM_Node {
    constructor(obj, prop, value) {
        super(JSVM_AssignPropertyZeroRightShiftFill.type);
        this.obj = obj;
        this.prop = prop;
        this.value = value;
    }
}
JSVM_AssignPropertyZeroRightShiftFill.type = "AssignPropertyZeroRightShiftFill";
exports.JSVM_AssignPropertyZeroRightShiftFill = JSVM_AssignPropertyZeroRightShiftFill;
class JSVM_AssignPropertyPipe extends JSVM_Node {
    constructor(obj, prop, value) {
        super(JSVM_AssignPropertyPipe.type);
        this.obj = obj;
        this.prop = prop;
        this.value = value;
    }
}
JSVM_AssignPropertyPipe.type = "AssignPropertyPipe";
exports.JSVM_AssignPropertyPipe = JSVM_AssignPropertyPipe;
class JSVM_AssignPropertyXor extends JSVM_Node {
    constructor(obj, prop, value) {
        super(JSVM_AssignPropertyXor.type);
        this.obj = obj;
        this.prop = prop;
        this.value = value;
    }
}
JSVM_AssignPropertyXor.type = "AssignPropertyXor";
exports.JSVM_AssignPropertyXor = JSVM_AssignPropertyXor;
class JSVM_AssignPropertyBitwiseAnd extends JSVM_Node {
    constructor(obj, prop, value) {
        super(JSVM_AssignPropertyBitwiseAnd.type);
        this.obj = obj;
        this.prop = prop;
        this.value = value;
    }
}
JSVM_AssignPropertyBitwiseAnd.type = "AssignPropertyBitwiseAnd";
exports.JSVM_AssignPropertyBitwiseAnd = JSVM_AssignPropertyBitwiseAnd;
class JSVM_AssignPropertyBitShiftLeft extends JSVM_Node {
    constructor(obj, prop, value) {
        super(JSVM_AssignPropertyBitShiftLeft.type);
        this.obj = obj;
        this.prop = prop;
        this.value = value;
    }
}
JSVM_AssignPropertyBitShiftLeft.type = "AssignPropertyBitShiftLeft";
exports.JSVM_AssignPropertyBitShiftLeft = JSVM_AssignPropertyBitShiftLeft;
class JSVM_AssignPropertyBitShiftRight extends JSVM_Node {
    constructor(obj, prop, value) {
        super(JSVM_AssignPropertyBitShiftRight.type);
        this.obj = obj;
        this.prop = prop;
        this.value = value;
    }
}
JSVM_AssignPropertyBitShiftRight.type = "AssignPropertyBitShiftRight";
exports.JSVM_AssignPropertyBitShiftRight = JSVM_AssignPropertyBitShiftRight;
class JSVM_AssignPropertyPowerOf extends JSVM_Node {
    constructor(obj, prop, value) {
        super(JSVM_AssignPropertyPowerOf.type);
        this.obj = obj;
        this.prop = prop;
        this.value = value;
    }
}
JSVM_AssignPropertyPowerOf.type = "AssignPropertyPowerOf";
exports.JSVM_AssignPropertyPowerOf = JSVM_AssignPropertyPowerOf;
class JSVM_AssignPropertyRemainder extends JSVM_Node {
    constructor(obj, prop, value) {
        super(JSVM_AssignPropertyRemainder.type);
        this.obj = obj;
        this.prop = prop;
        this.value = value;
    }
}
JSVM_AssignPropertyRemainder.type = "AssignPropertyRemainder";
exports.JSVM_AssignPropertyRemainder = JSVM_AssignPropertyRemainder;
class JSVM_ExpressionStatement extends JSVM_Node {
    constructor(expression) {
        super(JSVM_ExpressionStatement.type);
        this.expression = expression;
    }
}
JSVM_ExpressionStatement.type = "ExpressionStatement";
exports.JSVM_ExpressionStatement = JSVM_ExpressionStatement;
class JSVM_BinaryExpression extends JSVM_Node {
    constructor(left, right, operator) {
        super(JSVM_BinaryExpression.type);
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
}
JSVM_BinaryExpression.type = "BinaryExpression";
exports.JSVM_BinaryExpression = JSVM_BinaryExpression;
class JSVM_Literal extends JSVM_Node {
    constructor(raw, value, string_id = -1) {
        super(JSVM_Literal.type);
        this.string_id = string_id;
        this.raw = raw;
        this.value = value;
    }
}
JSVM_Literal.type = "Literal";
exports.JSVM_Literal = JSVM_Literal;
class JSVM_StringLiteral extends JSVM_Node {
    constructor(string_id = -1) {
        super(JSVM_StringLiteral.type);
        this.string_id = string_id;
    }
}
JSVM_StringLiteral.type = "StringLiteral";
exports.JSVM_StringLiteral = JSVM_StringLiteral;
class JSVM_Regex extends JSVM_Node {
    constructor(patternId = -1, flagsId = -1) {
        super(JSVM_Regex.type);
        this.patternId = patternId;
        this.flagsId = flagsId;
    }
}
JSVM_Regex.type = "Regex";
exports.JSVM_Regex = JSVM_Regex;
class JSVM_Boolean extends JSVM_Node {
    constructor(val) {
        super(JSVM_Boolean.type);
        this.val = val;
    }
}
JSVM_Boolean.type = "Boolean";
exports.JSVM_Boolean = JSVM_Boolean;
class JSVM_Declaration extends JSVM_Node {
    constructor() {
        super(JSVM_Declaration.type);
        this.declarations = [];
    }
}
JSVM_Declaration.type = "VariableDeclaration";
exports.JSVM_Declaration = JSVM_Declaration;
class JSVM_Return extends JSVM_Node {
    constructor(arg) {
        super(JSVM_Return.type);
        this.arg = arg;
    }
}
JSVM_Return.type = "Return";
exports.JSVM_Return = JSVM_Return;
class JSVM_UnaryNot extends JSVM_Node {
    constructor(argument) {
        super(JSVM_UnaryNot.type);
        this.argument = argument;
    }
}
JSVM_UnaryNot.type = "UnaryNot";
exports.JSVM_UnaryNot = JSVM_UnaryNot;
class JSVM_UnaryPlus extends JSVM_Node {
    constructor(argument) {
        super(JSVM_UnaryPlus.type);
        this.argument = argument;
    }
}
JSVM_UnaryPlus.type = "UnaryPlus";
exports.JSVM_UnaryPlus = JSVM_UnaryPlus;
class JSVM_UnaryTypeof extends JSVM_Node {
    constructor(argument) {
        super(JSVM_UnaryTypeof.type);
        // dont throw a reference error when loading a global variable from typeof(varName)
        if (argument.type === JSVM_Identifier.type) {
            const arg = argument;
            if (arg.global) {
                arg.throwReferenceError = false;
            }
        }
        this.argument = argument;
    }
}
JSVM_UnaryTypeof.type = "UnaryTypeof";
exports.JSVM_UnaryTypeof = JSVM_UnaryTypeof;
class JSVM_UnaryNegate extends JSVM_Node {
    constructor(argument) {
        super(JSVM_UnaryNegate.type);
        this.argument = argument;
    }
}
JSVM_UnaryNegate.type = "UnaryNegate";
exports.JSVM_UnaryNegate = JSVM_UnaryNegate;
class JSVM_UnaryInvert extends JSVM_Node {
    constructor(argument) {
        super(JSVM_UnaryInvert.type);
        this.argument = argument;
    }
}
JSVM_UnaryInvert.type = "UnaryInvert";
exports.JSVM_UnaryInvert = JSVM_UnaryInvert;
class JSVM_UnaryVoid extends JSVM_Node {
    constructor(argument) {
        super(JSVM_UnaryVoid.type);
        this.argument = argument;
    }
}
JSVM_UnaryVoid.type = "UnaryVoid";
exports.JSVM_UnaryVoid = JSVM_UnaryVoid;
class JSVM_UnaryDelete extends JSVM_Node {
    constructor(argument) {
        super(JSVM_UnaryDelete.type);
        this.argument = argument;
    }
}
JSVM_UnaryDelete.type = "UnaryDelete";
exports.JSVM_UnaryDelete = JSVM_UnaryDelete;
class JSVM_UnaryDeleteMemberExpression extends JSVM_Node {
    constructor(argument) {
        super(JSVM_UnaryDeleteMemberExpression.type);
        this.argument = argument;
    }
}
JSVM_UnaryDeleteMemberExpression.type = "UnaryDeleteMemberExpression";
exports.JSVM_UnaryDeleteMemberExpression = JSVM_UnaryDeleteMemberExpression;
class JSVM_CreateFunc extends JSVM_Node {
    constructor(scope_id) {
        super(JSVM_CreateFunc.type);
        this.scope_id = scope_id;
    }
}
JSVM_CreateFunc.type = "CreateFunc";
exports.JSVM_CreateFunc = JSVM_CreateFunc;
class JSVM_MoveArgToVar extends JSVM_Node {
    constructor(arg_index, var_id) {
        super(JSVM_MoveArgToVar.type);
        this.arg_index = -1;
        this.var_id = -1;
        this.arg_index = arg_index;
        this.var_id = var_id;
    }
}
JSVM_MoveArgToVar.type = "MoveArgToVar";
exports.JSVM_MoveArgToVar = JSVM_MoveArgToVar;
class JSVM_ObjectPlusPlus extends JSVM_Node {
    constructor(prefix, object, property) {
        super(JSVM_ObjectPlusPlus.type);
        this.prefix = prefix;
        this.object = object;
        this.property = property;
    }
}
JSVM_ObjectPlusPlus.type = "ObjectPlusPlus";
exports.JSVM_ObjectPlusPlus = JSVM_ObjectPlusPlus;
class JSVM_ObjectMinusMinus extends JSVM_Node {
    constructor(prefix, object, property) {
        super(JSVM_ObjectMinusMinus.type);
        this.prefix = prefix;
        this.object = object;
        this.property = property;
    }
}
JSVM_ObjectMinusMinus.type = "ObjectMinusMinus";
exports.JSVM_ObjectMinusMinus = JSVM_ObjectMinusMinus;
class JSVM_PlusPlus extends JSVM_Node {
    constructor(prefix, varId, funcScopeId) {
        super(JSVM_PlusPlus.type);
        this.prefix = prefix;
        this.varId = varId;
        this.funcScopeId = funcScopeId;
    }
}
JSVM_PlusPlus.type = "PlusPlus";
exports.JSVM_PlusPlus = JSVM_PlusPlus;
class JSVM_MinusMinus extends JSVM_Node {
    constructor(prefix, varId, funcScopeId) {
        super(JSVM_MinusMinus.type);
        this.prefix = prefix;
        this.varId = varId;
        this.funcScopeId = funcScopeId;
    }
}
JSVM_MinusMinus.type = "MinusMinus";
exports.JSVM_MinusMinus = JSVM_MinusMinus;
class JSVM_Declare extends JSVM_Node {
    constructor(varId, funcScopeId, init) {
        super(JSVM_Declare.type);
        this.varId = varId;
        this.funcScopeId = funcScopeId;
        this.init = init;
    }
}
JSVM_Declare.type = "Declare";
exports.JSVM_Declare = JSVM_Declare;
class JSVM_LoadInt extends JSVM_Node {
    constructor(value) {
        if (value === undefined)
            throw "Needs defined int!";
        super(JSVM_LoadInt.type);
        this.value = value;
    }
}
JSVM_LoadInt.type = "LoadInt";
exports.JSVM_LoadInt = JSVM_LoadInt;
class JSVM_LoadNull extends JSVM_Node {
    constructor() {
        super(JSVM_LoadNull.type);
    }
}
JSVM_LoadNull.type = "LoadNull";
exports.JSVM_LoadNull = JSVM_LoadNull;
class JSVM_LoadUndefined extends JSVM_Node {
    constructor() {
        super(JSVM_LoadUndefined.type);
    }
}
JSVM_LoadUndefined.type = "LoadUndefined";
exports.JSVM_LoadUndefined = JSVM_LoadUndefined;
class JSVM_Identifier extends JSVM_Node {
    constructor(global, scope_id, var_id, string_id) {
        super(JSVM_Identifier.type);
        this.throwReferenceError = true;
        this.global = global;
        this.scope_id = scope_id;
        this.var_id = var_id;
        this.string_id = string_id;
    }
}
JSVM_Identifier.type = "Identifier";
exports.JSVM_Identifier = JSVM_Identifier;
class JSVM_SelfFnRef extends JSVM_Node {
    constructor(varId, scopeId) {
        super(JSVM_SelfFnRef.type);
        this.varId = varId;
        this.scopeId = scopeId;
    }
}
JSVM_SelfFnRef.type = "SelfFnRef";
exports.JSVM_SelfFnRef = JSVM_SelfFnRef;
class JSVM_ArgumentsRef extends JSVM_Node {
    constructor(varId) {
        super(JSVM_ArgumentsRef.type);
        this.varId = varId;
    }
}
JSVM_ArgumentsRef.type = "ArgumentsRef";
exports.JSVM_ArgumentsRef = JSVM_ArgumentsRef;
class JSVM_This extends JSVM_Node {
    constructor() {
        super(JSVM_This.type);
    }
}
JSVM_This.type = "This";
exports.JSVM_This = JSVM_This;
class JSVM_Break extends JSVM_Node {
    constructor() {
        super(JSVM_Break.type);
    }
}
JSVM_Break.type = "Break";
exports.JSVM_Break = JSVM_Break;
class JSVM_ContinueStatement extends JSVM_Node {
    constructor() {
        super(JSVM_ContinueStatement.type);
    }
}
JSVM_ContinueStatement.type = "Continue";
exports.JSVM_ContinueStatement = JSVM_ContinueStatement;
