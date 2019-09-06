

// 1. 相同级别的运算符的优先级， 右边低于左边
// 2. 单目运算符的优先级要高于其他运算符，除了(,[,?
// 3. 先乘，除，取余，后加，减
// 4. 大小比较
// 5. 与或运算
// 6. 三目运算

var left_pri = [{'op':'=', 'pri': 0}, {'op':'[', 'pri': 2}, {'op':']', 'pri': 300}, {'op':'(', 'pri': 10}, {'op':')', 'pri': 290},
	           {'op':'!', 'pri': 280}, {'op':'++', 'pri': 280}, {'op':'--', 'pri': 280}, 
			   {'op':'*', 'pri': 260}, {'op':'/', 'pri': 260}, {'op':'%', 'pri': 260},
               {'op':'+', 'pri': 240}, {'op':'-', 'pri': 240}, 
			   {'op':'>', 'pri': 220}, {'op':'<', 'pri': 220}, {'op':'>=', 'pri': 220}, {'op':'<=', 'pri': 220}, {'op':'!=', 'pri': 220}, {'op':'==', 'pri': 220},
               {'op':'&&', 'pri': 200}, {'op':'||', 'pri': 200},
			   {'op':'?', 'pri': 310}
			   ];
var right_pri = [{'op':'=', 'pri': 0}, {'op':'[', 'pri': 300}, {'op':']', 'pri': 2}, {'op':'(', 'pri': 290}, {'op':')', 'pri': 10},
	           {'op':'!', 'pri': 270}, {'op':'++', 'pri': 270}, {'op':'--', 'pri': 270}, 
			   {'op':'*', 'pri': 250}, {'op':'/', 'pri': 250}, {'op':'%', 'pri': 250},
               {'op':'+', 'pri': 230}, {'op':'-', 'pri': 230}, 
			   {'op':'>', 'pri': 210}, {'op':'<', 'pri': 210}, {'op':'>=', 'pri': 210}, {'op':'<=', 'pri': 210}, {'op':'!=', 'pri': 210}, {'op':'==', 'pri': 210},
               {'op':'&&', 'pri': 190}, {'op':'||', 'pri': 190},
			   {'op':'?', 'pri': 1}
			   ];	
var imediateOperateBeforeTernaryOp= ['!', '<', '>', '<=', '>=', '==', '&&', '||']; // 三目运算时需要先运行的操作符

var ignoreValidateOP = ['$.']; // 如果表达式的元素包含 ignoreValidateOP 的一个项， 就默认这是个正常的元素， 不在校验格式
var normalOP = ['++', '--', '>=', '<=', '==', '!=', '&&', '||'] // 如果表达式的元素和normalOP的任意一个项相同， 也认为是正确格式
var supportOP = ['[', ']', '(', ')', '!', '++', '--', '/', '*', '%', '+', '-', '>', '>=', '<', '<=', '==', '!=', '&&', '||', '=' ];//支持的操作符， 包括三目?:
			   
var dataStack = []; // 数据栈
var opStack = []; // 操作符栈
var SPLITOR = " ";// 表达式数据项和操作符的分隔符

function isOp(ch) {
	var matchs = supportOP.filter(function(item) { return item == ch});
	if (matchs && matchs.length > 0) {
		return true;
	}
	return false;
}

function initStack() {
	dataStack = [];
	opStack = ["="];
}

function validateExpressionElementFormat(expressionItems) {
    if (expressionItems.length == 1) {
		if (containsOP(expressionItems)) {
			throw " each item of the expression must split by '" + SPLITOR + "'";
		}
	}
	
	var illeagalItems = fetchIllegalFormatItems(expressionItems);
	if (illeagalItems.length > 0) {
		throw  JSON.stringify(illeagalItems) + " contains operator, they should spliter by '" + SPLITOR + "'";
	}
}

function fetchIllegalFormatItems(expressionItems) {
	var illeagalItems = [];
	for (var i = 0; i < expressionItems.length; i++) {
		var item = expressionItems[i];
		if (containsOP(item)) {
			illeagalItems.push(item);
		}
	}
	return illeagalItems;
}

function containsOP(expressionItem) {
	if (expressionItem && expressionItem.length > 1 && expressionItem.indexOf(SPLITOR) == -1 
	    && !isNormalOP(expressionItem) && !hasIgnoreOp(expressionItem)) {
		for (var i = 0; i < supportOP.length; i++) {
		  var operator = supportOP[i];
		  if (expressionItem.indexOf(operator) != -1) {
			  return true;
		  }
	    }
	} 
	return false;
}


function isNormalOP(expressionItem) {
	for (var i = 0; i < normalOP.length; i++) {
		 var operator = normalOP[i];
		 if (expressionItem == operator) {
			 return true;
		 }
	}
	return false;
}

function hasIgnoreOp(expressionItem) {
	for (var i = 0; i < ignoreValidateOP.length; i++) {
		 var operator = ignoreValidateOP[i];
		 if (expressionItem.indexOf(operator) != -1) {
			 return true;
		 }
	}
	return false;
}

function isRunBeforeTernaryOp(op) {
	var matchs = imediateOperateBeforeTernaryOp.filter(function(item) { return item == op});
	if (matchs && matchs.length > 0) {
		return true;
	}
	return false;
}

//获取闭括号的位置
function getClosedBracketIndex(closedOP, start_index, expressionItems) {
	var bracket_count = 0; 
	for(var i = start_index; i < expressionItems.length; i++) {
		var item = expressionItems[i];
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

function caculateTernaryValue(currentIndex, lastSemicolonIndex, expressionItems, ternaryResult) {
	if (ternaryResult == true) {
		evalDataOPAry(expressionItems.slice(currentIndex + 1 , lastSemicolonIndex));
	} else {
		evalDataOPAry(expressionItems.slice(lastSemicolonIndex + 1));
	}
}

function getLastSemicolonIndex(currentIndex, expressionItems) {
	var bracket_count = 0;
	for(var i = currentIndex; i < expressionItems.length; i++) {
		var item = expressionItems[i];
		if (item == '[' || item == '(') {
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

function parseStr(str) {
     if (typeof str == 'string' && String.prototype.toLowerCase.call(str) == 'true') {
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

function getData(item) {
	return parseStr(item);
}

function fetchOpPri(op, opPriAry) {
	var matchs = opPriAry.filter(function(item) { return item['op'] == op});
	if (matchs && matchs.length > 0) {
		return matchs[0].pri;
	}
	return -1;
}

function judgePri(left_op, right_op) {
	if (!left_op || !right_op) {
		return -1;
	}
	var rst = fetchOpPri(left_op, left_pri) -  fetchOpPri(right_op, right_pri);
	if (rst < 0) {
		opStack.push(left_op);
	}
	return rst;
}

function countOP(right_op) {
	do {    
	    var left_op = opStack.pop(); 
	    var priCompare = judgePri(left_op, right_op);
		if (priCompare >= 0 && !((left_op == '(' && right_op == ')') || (left_op == '[' && right_op == ']'))) {
		    count(left_op);
		} else if (priCompare == 0 && ((left_op == '(' && right_op == ')') || (left_op == '[' && right_op == ']'))) {
			priCompare = -1;
		} else {
		    opStack.push(right_op);
		    priCompare = -1;
		}
	} while (priCompare >= 0);	
}

function count(op) {
	var num = 0.0;
	switch(op) {
		case '+' :  dataStack.push(dataStack.pop() + dataStack.pop()); break;
		case '-' : num = dataStack.pop(); dataStack.push(dataStack.pop()-num); break;
		case '%' : num = dataStack.pop(); dataStack.push((dataStack.pop() % num)); break;
		case '*' :  dataStack.push(dataStack.pop()*dataStack.pop()); break;
		case '/' :  num = dataStack.pop(); if (num == 0) {throw "caculate expression error, divide by 0." } dataStack.push(dataStack.pop()/num); break;
		case '!' :  num = dataStack.pop(); dataStack.push(!num); break;
		case '++' :  num = dataStack.pop() + 1; dataStack.push(num); break;
		case '--' :  num = dataStack.pop() - 1; dataStack.push(num); break;
		case '>' :  num = dataStack.pop(); num = dataStack.pop() > num; dataStack.push(num); break;
		case '>=' :  num = dataStack.pop(); num = dataStack.pop() >= num; dataStack.push(num); break;
		case '<' :  num = dataStack.pop(); num = dataStack.pop() < num; dataStack.push(num); break;
		case '<=' :  num = dataStack.pop(); num = dataStack.pop() <= num; dataStack.push(num); break;
		case '==' :  num = dataStack.pop(); num = dataStack.pop() == num; dataStack.push(num); break;
		case '!=' :  num = dataStack.pop(); num = dataStack.pop() != num; dataStack.push(num); break;
		case '&&' : dataStack.push(dataStack.pop() && dataStack.pop()); break;
		case '||' :  dataStack.push(dataStack.pop() || dataStack.pop()); break;
	    default: break;
	}
}

function runBeforeTernary() {
	do {
	    var op_left = opStack.pop();
		var isRunBeforeTernary = isRunBeforeTernaryOp(op_left);
		if (!isRunBeforeTernary) {
			opStack.push(op_left);
		} else {
			count(op_left);
		}
	} while (isRunBeforeTernary); // 如果是问号, 则要先将问号之前的表达式计算出一个结果, 看是false还是true;
}

function countTernary(index, expressionItems) {
	var rst = {index: index, expressionItems: expressionItems};
	runBeforeTernary(); // 如果是问号, 则要先将问号之前的表达式计算出一个结果, 看是false还是true;
	var ternaryResult = dataStack.pop();// 取出三目运算符问号操作符之前的运算结果;
	// 获取三目运算符分号的位置
	var lastSemicolonIndex = getLastSemicolonIndex(rst.index + 1 , expressionItems);
	if (lastSemicolonIndex == -1) {
		throw "'?:' operator not found match ':' ";
	}
	//根据问号之前的true, false 执行三目运算符对应的表达式
	caculateTernaryValue(rst.index, lastSemicolonIndex, expressionItems, ternaryResult);	
	if (ternaryResult == true) {
		// 如果三目运算符问号之前的结果是true, 那么我们还要获取三目运算符之后的表达式, 例如:[(3+4)>5 ? 12: 14]+30+40, 
		//当我们运算完'[(3+4)>5 ? 12: 14]'之后,还需要继续计算'+30+40'
		var tmp = opStack.pop();
		if (tmp == "[" ) {					
			var ternaryEndIndex = getClosedBracketIndex(']', (lastSemicolonIndex+1), expressionItems);
			rst.expressionItems = expressionItems.slice(ternaryEndIndex+1);
			rst.index = -1;
		} else if (tmp == "(") {					
			var ternaryEndIndex = getClosedBracketIndex(')', (lastSemicolonIndex+1), expressionItems);
			rst.expressionItems = expressionItems.slice(ternaryEndIndex+1);
			rst.index= -1;
		} else {
			opStack.push(tmp);
			rst.index = expressionItems.length;
		}
	} else {
		// 如果三目运算符问号之前的结果是false, 例如:[(3+4)<5 ? 12: 14]+30+40, 那么我们在执行caculateTernaryValue()方法的时候，
		// 会截取'14]+30+40'作为子运算符集合循环调用evalDataOPAry()方法得到结果,因此，这个循环就结束了。
		rst.index = expressionItems.length;
	}
	return rst;
}

function evalDataOPAry(expressionItems) {
	for(var i = 0; i < expressionItems.length; i++) {
		var item = expressionItems[i];
		if (item == '?') {
			//三目运算符?:特殊处理
           var rst = countTernary(i, expressionItems);
		   i = rst.index;
		   expressionItems = rst.expressionItems;
		} else if (isOp(item)) {
	        // 如果是运算符， 我们就要从opStack堆栈取出一个操作符来和它比较， 看谁的优先级比较高， 如果item的优先级高，则入栈；
			// 小于等于就运行取出的操作符。
			countOP(item);
		} else {
			//剩下的非操作符的项都会入数据栈dataStack
			if (item) {
				dataStack.push(getData(item));
			}
		}
	}
}

function caculateFinalValue() {
	while(opStack.length > 0) {
		 count(opStack.pop());
	}
	return dataStack.pop();
}

function evalExpression(expression) {	
	if (!expression) { throw " Bad expression:" + expression ; } // 表达式不能为空
    var expressionItems = String.prototype.split.call(expression, SPLITOR); 
	validateExpressionElementFormat(expressionItems); // 校验表达式的每个项是否格式正确，不能包含操作符， 应该用分隔符分隔；
    initStack(); //初始化数据栈和操作符堆栈；
	evalDataOPAry(expressionItems); // 计算所有的表达式
	var finalValue = caculateFinalValue(); // 最终操作符栈opStack会剩下一些操作符， 需要从右往左依次执行.
	return finalValue;
}

/*
4 + [ ( ( 3 -5 ) < 20 ) ? 30 : 40 ] + 6
计算逻辑：
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
 {expression: " ! ( 4 + 5 < 6 ) ? 20 : 30 ", expected: 20},
 {expression: " ! ( ++ 4 + -- 5 < 6 ) ? 20 : 30 ", expected: 20},
 {expression: " ! ( ++ 4 + -- 5 <= 6 ) ? 20 : 30 ", expected: 20},
 {expression: " ! ( ++ 4 + -- 5 == 6 ) ? 20 : 30 ", expected: 20},
 {expression: " ! ( ++ 4 + -- 5 > 6 ) ? 20 : 30 ", expected: 30},
 {expression: " ! ( ++ 4 + -- 5 >= 6 ) ? 20 : 30 ", expected: 30},
 {expression: " ! ( ++ 4 + -- 5 != 6 ) ? 20 : 30 ", expected: 30},
// {expression: " 2 / 0 ", expected: "throw error"},
];


function testCalucator(testAry) {
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

testCalucator(testAry);



