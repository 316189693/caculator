

// 1. 相同级别的运算符的优先级， 右边低于左边
// 2. 单目运算符的优先级要高于其他运算符，除了(,[,?
// 3. 先乘，除，取余，后加，减
// 4. 大小比较
// 5. 与或运算
// 6. 三目运算
var op = ['[', ']', '(', ')', '!', '++', '--', '/', '*', '%', '+', '-', '>', '>=', '<', '<=', '==', '!=', '&&', '||', '?:', '=' ];
// if left_pri higer than right_pri, then dataStack pop a op 
var left_pri = [{'op':'=', 'pri': 0}, {'op':'[', 'pri': 2}, {'op':']', 'pri': 300}, {'op':'(', 'pri': 10}, {'op':')', 'pri': 290},
	           {'op':'!', 'pri': 280}, {'op':'++', 'pri': 280},{'op':'--', 'pri': 280}, 
			   {'op':'*', 'pri': 260}, {'op':'/', 'pri': 260},{'op':'%', 'pri': 260},
               {'op':'+', 'pri': 240}, {'op':'-', 'pri': 240}, 
			   {'op':'>', 'pri': 220}, {'op':'<', 'pri': 220}, {'op':'>=', 'pri': 220}, {'op':'<=', 'pri': 220}, {'op':'!=', 'pri': 220}, {'op':'==', 'pri': 220},
               {'op':'&&', 'pri': 200}, {'op':'||', 'pri': 200},
			   {'op':'?', 'pri': 310}
			   ];
var right_pri = [{'op':'=', 'pri': 0}, {'op':'[', 'pri': 300}, {'op':']', 'pri': 2}, {'op':'(', 'pri': 290}, {'op':')', 'pri': 10},
	           {'op':'!', 'pri': 270}, {'op':'++', 'pri': 270},{'op':'--', 'pri': 270}, 
			   {'op':'*', 'pri': 250}, {'op':'/', 'pri': 250},{'op':'%', 'pri': 250},
               {'op':'+', 'pri': 230}, {'op':'-', 'pri': 230}, 
			   {'op':'>', 'pri': 210}, {'op':'<', 'pri': 210}, {'op':'>=', 'pri': 210}, {'op':'<=', 'pri': 210}, {'op':'!=', 'pri': 210}, {'op':'==', 'pri': 210},
               {'op':'&&', 'pri': 190}, {'op':'||', 'pri': 190},
			   {'op':'?', 'pri': 1}
			   ];	
var imediateOperateBeforeTernaryOp= ['!', '<', '>', '<=', '>=', '==', '&&', '||'];
			   
var dataStack = [];
var opStack = initOpStack();
var SPLITOR = " ";
function initOpStack(){
	return ['='];
}

function evalExpression(expression) {
	if (!expression){ return expression; }
    var dataOPAry = String.prototype.split.call(expression, SPLITOR); 
    if (dataOPAry.length == 1) {
		if (containsOP(expression)) {
			throw " each character of the expression must split by '" + SPLITOR + "'";
		}
		return expression;
	}

	evalDataOPAry(dataOPAry);
	return caculateFinalValue(); 
	
}

function caculateFinalValue(){
	while(opStack.length > 0) {
		 count(opStack.pop());
	}
	var value = parseStr(dataStack.pop());
	return value;
}

function containsOP(expression){
	var op = ['[', ']', '(', ')', '!', '++', '--', '/', '*', '%', '+', '-', '>', '>=', '<', '<=', '==', '!=', '&&', '||'];
	if (expression && expression.indexOf(SPLITOR) == -1) {
		op.forEach(function(item) {if (expression.indexOf(item) != -1){return true;}});
	} 
	return false;
}

function evalDataOPAry(dataOPAry){

	for(var i = 0; i < dataOPAry.length; i++) {
	
		var item = dataOPAry[i];
		if (item == '?') {
            do{
				var op_left = opStack.pop();
				var isRunBeforeTernary = isRunBeforeTernaryOp(op_left);
				if (!isRunBeforeTernary) {
					opStack.push(op_left);
				} else {
					count(op_left);
				}
			}while(isRunBeforeTernary)
			var ternaryResult = parseStr(dataStack.pop());
			var lastSemicolonIndex = caculateTernaryValue(i, dataOPAry, ternaryResult);
			if (ternaryResult == true) {
				var tmp = opStack.pop();
				if (tmp == "[" ) {					
					var ternaryEndIndex = getClosedOP(']', (lastSemicolonIndex+1), dataOPAry);
					dataOPAry = dataOPAry.slice(ternaryEndIndex+1);
					i = -1;
				} else if (tmp == "(") {					
					var ternaryEndIndex = getClosedOP(')', (lastSemicolonIndex+1), dataOPAry);
					dataOPAry = dataOPAry.slice(ternaryEndIndex+1);
					i = -1;
				} else {
					opStack.push(tmp);
					i = dataOPAry.length;
				}
			} else {
				i = dataOPAry.length;
			}
		} else if (isOp(item)){
	
			countOP(item);
		} else {
			if (item){
				dataStack.push(item);
			}
			
		}
	}
}

function isRunBeforeTernaryOp(op) {
	var matchs = imediateOperateBeforeTernaryOp.filter(function(item) { return item == op});
	if (matchs && matchs.length > 0) {
		return true;
	}
	return false;
}

function getClosedOP(closedOP, start_index, dataOPAry) {
	var bracket_count = 0; //括号数目
	for(var i = start_index; i < dataOPAry.length; i++) {
		var item = dataOPAry[i];
		if (item == '(' || item == '[') {
			++bracket_count;
		} else if(bracket_count != 0 && (item == ')' || item == ']')) {
			--bracket_count;
		} else if (bracket_count == 0 && item == closedOP) {
			return i;
		}

	}
	return -1;
}

function caculateTernaryValue(currentIndex, dataOPAry, ternaryResult) {
	var lastSemicolonIndex = getLastSemicolonIndex(currentIndex + 1 , dataOPAry);
	if (lastSemicolonIndex == -1) {
		throw "'?:' operator not found match ':' ";
	}
	var ternaryCaculateResuslt = null;
	if (ternaryResult == true) {
		evalDataOPAry(dataOPAry.slice(currentIndex+1 , lastSemicolonIndex));
	} else {
		evalDataOPAry(dataOPAry.slice(lastSemicolonIndex+1));
	}
	return lastSemicolonIndex;
}

function getLastSemicolonIndex(currentIndex, dataOPAry) {
	var bracket_count = 0;
	for(var i = currentIndex; i < dataOPAry.length; i++) {
		var item = dataOPAry[i];
		if (item == '[' || item == '('){
			++bracket_count;
		}
		
		if (item == ']' || item == ')') {
			--bracket_count;
		}
		
		if (bracket_count == 0 && item == ':') {
			return i;
		}
	}
	return -1;
}

function count(op) {
	var num = 0.0;
	  switch(op) {
		case '+' :  dataStack.push(parseStr(dataStack.pop())+parseStr(dataStack.pop()));break;
		case '-' : num = parseStr(dataStack.pop()); dataStack.push(parseStr(dataStack.pop())-num);break;
		case '%' : num = parseStr(dataStack.pop()); dataStack.push((parseStr(dataStack.pop()) % num));break;
		case '*' :  dataStack.push(parseStr(dataStack.pop())*parseStr(dataStack.pop()));break;
		case '/' :  num = parseStr(dataStack.pop());if(num == 0) {throw "caculate expression error, divide by 0." } dataStack.push(parseStr(dataStack.pop())/num);break;
		case '!' :  num = parseStr(dataStack.pop()); dataStack.push(!parseStr(dataStack.pop()));break;
		case '++' :  num = ++parseStr(dataStack.pop()); dataStack.push(!parseStr(dataStack.pop()));break;
		case '--' :  num = --parseStr(dataStack.pop()); dataStack.push(!parseStr(dataStack.pop()));break;
		case '>' :  num = parseStr(dataStack.pop());num = parseStr(dataStack.pop()) > num; dataStack.push(num);break;
		case '>=' :  num = parseStr(dataStack.pop());num = parseStr(dataStack.pop()) >= num; dataStack.push(num);break;
		case '<' :  num = parseStr(dataStack.pop());num = parseStr(dataStack.pop()) < num; dataStack.push(num);break;
		case '<=' :  num = parseStr(dataStack.pop());num = parseStr(dataStack.pop()) <= num; dataStack.push(num);break;
		case '==' :  num = parseStr(dataStack.pop());num = parseStr(dataStack.pop()) == num; dataStack.push(num);break;
		case '&&' : dataStack.push(parseStr(dataStack.pop()) && parseStr(dataStack.pop()));break;
		case '||' :  dataStack.push(parseStr(dataStack.pop()) || parseStr(dataStack.pop()));break;
	    default: break;
	  }
}

function countOP(right_op) {
	do {    
	        var left_op = opStack.pop(); 
	        var priCompare = judgePri(left_op, right_op);
		    if (priCompare >= 0 && !((left_op == '(' && right_op == ')') || (left_op == '[' && right_op == ']'))) {
				count(left_op);
			} else if (priCompare == 0 && ((left_op == '(' && right_op == ')') || (left_op == '[' && right_op == ']')) ) {
				priCompare = -1;
			}
			else {
		        opStack.push(right_op);
				priCompare = -1;
			}
			
	} while(priCompare >= 0);	
}

function fetchOpPri(op, opPriAry) {
	var matchs = opPriAry.filter(function(item) { return item['op'] == op});
	if (matchs && matchs.length > 0) {
		return matchs[0].pri;
	}
	return -1;
}

function isOp(ch) {
	var matchs = op.filter(function(item) { return item == ch});
	if (matchs && matchs.length > 0) {
		return true;
	}
	return false;
}

function judgePri(left_op, right_op) {
	if (!left_op || !right_op) {
		return -1;
	}
	var rst = fetchOpPri(left_op, left_pri) -  fetchOpPri(right_op, right_pri);
	if (rst < 0){
		opStack.push(left_op);
	}
	return rst;
}

function parseStr(str){
     if (typeof str == 'string' && String.prototype.toLowerCase.call(str) == 'true'){
		 return true;
	 } 
     if(typeof str == 'string' && String.prototype.toLowerCase.call(str) == 'false') {
		return false; 
	 }
	 if (/^-?\d+(\.\d+)?$/.test(str)) {
		 return parseFloat(str);
	 }
	 return str;
     
}

/*
/*
4 + [ ( ( 3 -5 ) < 20 ) ? 30 : 40 ] + 6
dataStack   opStack
4           
            +
	        +[		
            +[(
			+[((
4,3         
            +[((- 
4,3,5      
4, -2       +[(
4, -2       +[(<
4,-2,20 
4,true      +[
4           +[
4,30        +[
4,30        +
4,30,6      ++
40

*/

var testAry = [
 {expression: "4 + [ ( ( 3 - 5 ) < 20 ) ? 30 : 40 ] + 6", expected: 40},
 {expression: "4 + 7 * 5 - 10 + 16", expected: 45},
 {expression: "4 + ( 7 < 5 ? 10 : 20 )", expected: 24},
 {expression: " 4 + 7 < 5 ? 10 : 20 ", expected: 20},
 {expression: " 5 + 4 % 2 * 3 + 6 ", expected: 11},
 {expression: " 5 - 4 % 2 * 3 + 6 ", expected: 11},
 {expression: " 40 + [ ( 4 - 3 == 1 ) ? ( 12 * 5 <= 50 ? ( 8 - 4 > 5 ? 12 : 14 ) : 75 ) : ( 85 - 64 > 40 ? 35 : 45 ) ] + 2 * 10 ", expected: 135},
 {expression: " 40 + ( ( 4 - 3 == 1 ) ? ( 12 * 5 <= 50 ? ( 8 - 4 > 5 ? 12 : 14 ) : 75 ) : ( 85 - 64 > 40 ? 35 : 45 ) ) + 2 * 10 ", expected: 135},
 {expression: " 40 + [ ( 2 - 3 == 1 ) ? ( 12 * 5 <= 50 ? ( 8 - 4 > 5 ? 12 : 14 ) : 75 ) : ( 85 - 64 > 40 ? 35 : 45 ) ] + 2 * 10 ", expected: 105},
 {expression: " 10 + 20 + 50 * 2 + 100 / 10 + 40 + ( 40 - 30 ) + ( 60 * 2 ) ", expected: 310},
 {expression: " ( 4 + 5 ) > 10 && ( 3 + 6 ) < 10 ? true : false ", expected: false},
 {expression: " ( 4 + 5 ) > 10 || ( 3 + 6 ) < 10 ? true : false ", expected: true},
 {expression: " ( 4 + 5 ) < 10 && ( 3 + 6 ) < 10 ? true : false ", expected: true},
 {expression: " ( 4 + 5 ) < 10 || ( 3 + 6 ) < 10 ? true : false ", expected: true},
 {expression: " ( ( 4 + 5 ) < 10 && ( 3 + 6 ) < 10 ) ? true : false ", expected: true},
// {expression: " 2 / 0 ", expected: "throw error"},
];
testCalucator(testAry);

function testCalucator(testAry){
	var newItem = [];
	var failCount = 0;
	testAry.forEach(function(item) {
		var real = evalExpression(item.expression);
		var rst = {error: false, expression: item.expression, expected: item.expected, real: real};
		if (real != rst.expected) {
			rst.error = true;
			failCount++;
		}
		newItem.push(rst);
	});
	console.log("error:"+failCount+"\n");
	console.log("detail:"+"\n");
	console.log(JSON.stringify(newItem));
}

*/



