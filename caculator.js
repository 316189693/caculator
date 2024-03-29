
/*
* 1. 要配置带 supportOP 符号的字符串为值， 则需要在前后加上&， 例如 sd%/we, 配置成 &sd%/we&
* 2. 每个项之间用空格隔开， 例如  ( 4 + 5 ) < 10 || ( 3 + 6 ) < 10 ? true : false 
* 3. 每个项都会校验， 除非项包含 ignoreValidateOP 的项， 或者是normalOP的项， 或者是#1的情况， 否则都会认为非法的项
* 4. 已入栈的元素当成左操作符， 当前操作符为右操作符， 比较两者的优先级， 优先级高的可以入栈， 否则就要将栈操作符弹出进行运算；
* 5. 方法[validateExpressionElementFormat, evalExpression] 存在的异常消息:
    1. 每个表达式元素必须用逗号分隔: " each item of the expression must split by '" + SPLITOR + "'";
	2. 表达式的括号要配对:" expression has mismatch bracket pairs.";
	3. 两个相同类型的元素不能放在一起， 比如: '+ -': 'expression has same operate type items linked:'+JSON.stringify(sameItemLinksAry);
	4. 表达式元素里面不能包含操作符， 如果是个常量， 请前后加上'&':JSON.stringify(illeagalItems) + " contains operator, they should spliter by '" + SPLITOR + "'";
    5. 表达式不能为空: " Bad expression:" + expression ;
	6. 三目运算符必须配对: "'?:' operator not found match ':' ";
	7. 不能除以0:  "caculate expression error, divide by 0." 
*/


    /*
    * 1. 要配置带 supportOP 符号的字符串为值， 则需要在前后加上&， 例如 sd%/we, 配置成 &sd%/we&
    * 2. 每个项之间用空格隔开， 例如  ( 4 + 5 ) < 10 || ( 3 + 6 ) < 10 ? true : false
    * 3. 每个项都会校验， 除非项包含 ignoreValidateOP 的项， 或者是normalOP的项， 或者是#1的情况， 否则都会认为非法的项
    * 4. 已入栈的元素当成左操作符， 当前操作符为右操作符， 比较两者的优先级， 优先级高的可以入栈， 否则就要将栈操作符弹出进行运算；
    * 5. 方法[validateExpressionElementFormat, evalExpression] 存在的异常消息:
        1. 每个表达式元素必须用逗号分隔: " each item of the expression must split by '" + SPLITOR + "'";
        2. 表达式的括号要配对:" expression has mismatch bracket pairs.";
        3. 两个相同类型的元素不能放在一起， 比如: '+ -': 'expression has same operate type items linked:'+JSON.stringify(sameItemLinksAry);
        4. 表达式元素里面不能包含操作符， 如果是个常量， 请前后加上'&':JSON.stringify(illeagalItems) + " contains operator, they should spliter by '" + SPLITOR + "'";
        5. 表达式不能为空: " Bad expression:" + expression ;
        6. 三目运算符必须配对: "'?:' operator not found match ':' ";
        7. 不能除以0:  "caculate expression error, divide by 0."
    */

    var left_pri = [{'op':'=', 'pri': 50}, {'op':'[', 'pri': 150}, {'op':']', 'pri': 300}, {'op':'(', 'pri': 180}, {'op':')', 'pri': 290},
        {'op':'!', 'pri': 280}, {'op':'++', 'pri': 280}, {'op':'--', 'pri': 280},  {'op':'timeDiff', 'pri': 280},
        {'op':'*', 'pri': 260}, {'op':'/', 'pri': 260}, {'op':'%', 'pri': 260},
        {'op':'+', 'pri': 240}, {'op':'-', 'pri': 240},
        {'op':'>', 'pri': 220}, {'op':'<', 'pri': 220}, {'op':'>=', 'pri': 220}, {'op':'<=', 'pri': 220}, {'op':'!=', 'pri': 220}, {'op':'==', 'pri': 220},
        {'op':'&&', 'pri': 200}, {'op':'||', 'pri': 200},
        {'op':'?', 'pri': 310},
        {'op':',', 'pri': 285},
    ];
    var right_pri = [{'op':'=', 'pri': 50}, {'op':'[', 'pri': 300}, {'op':']', 'pri': 150}, {'op':'(', 'pri': 290}, {'op':')', 'pri': 180},
        {'op':'!', 'pri': 270}, {'op':'++', 'pri': 270}, {'op':'--', 'pri': 270},  {'op':'timeDiff', 'pri': 270},
        {'op':'*', 'pri': 250}, {'op':'/', 'pri': 250}, {'op':'%', 'pri': 250},
        {'op':'+', 'pri': 230}, {'op':'-', 'pri': 230},
        {'op':'>', 'pri': 210}, {'op':'<', 'pri': 210}, {'op':'>=', 'pri': 210}, {'op':'<=', 'pri': 210}, {'op':'!=', 'pri': 210}, {'op':'==', 'pri': 210},
        {'op':'&&', 'pri': 190}, {'op':'||', 'pri': 190},
        {'op':'?', 'pri': 100},
        {'op':',', 'pri': 285},
    ];
    var imediateOperateBeforeTernaryOp= ['!', '<', '>', '<=', '>=', '==', '&&', '||']; // 三目运算时需要先运行的操作符

    var ignoreValidateOP = ['$.']; // 如果表达式的元素包含 ignoreValidateOP 的一个项， 就默认这是个正常的元素， 不在校验格式
    var normalOP = ['++', '--', '>=', '<=', '==', '!=', '&&', '||', 'timeDiff']; // 如果表达式的元素和normalOP的任意一个项相同， 也认为是正确格式
    var supportOP = ['[', ']', '(', ')', '!', '++', '--', '/', '*', '%', '+', '-', '>', '>=', '<', '<=', '==', '!=', '&&', '||', '=', '?', ":", "timeDiff", ','];//支持的操作符， 包括三目?:
// 如果要定义一个字符串， 并且字符串包含supportOP的字符， 那么需要用	constant_value_spliter 把数据包围起来, 例如 &chek%mg&, 这样表示设置值check%mg
    var constant_value_spliter = "&";

    var unaryOP = ['++', '--', '!', 'timeDiff'];//单目运算符
    var brackets = ['[', ']', '(', ')'];

    var dataStack = []; // 数据栈
    var opStack = []; // 操作符栈
    var SPLITOR = "~";// 表达式数据项和操作符的分隔符
     var TIME_DIFF_TYPE = ['diffDay', 'day', 'hour', 'minute', 'second'];// diffDay 忽略掉时分秒的数据计算相差多少日； day 不忽略时分秒， 按一天24小时算。
    function isOp(expressionItem) {
        return isInArray(supportOP, expressionItem);
    }

    function isInArray(array, searchItem) {
        return Array.prototype.findIndex.call(array, function(item){return item == searchItem;}) != -1;
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
        var isBracketsMatch = validateBrackets(expressionItems);
        if (!isBracketsMatch) {
            throw  " expression has mismatch bracket pairs.";
        }

        var sameItemLinksAry = sameTypeExpressionItemsLinked(expressionItems);
        if (sameItemLinksAry && sameItemLinksAry.length > 0) {
            throw 'expression has same operate type items linked:'+JSON.stringify(sameItemLinksAry);
        }

        var illeagalItems = fetchIllegalFormatItems(expressionItems);
        if (illeagalItems.length > 0) {
            throw  JSON.stringify(illeagalItems) + " contains operator, they should spliter by '" + SPLITOR + "'";
        }

        var timeDiffError = hasTimeDiffError(expressionItems);
        if (timeDiffError) {
            throw " timeDiff format error, acceptable format: timeDiff" +
            SPLITOR + '(' + SPLITOR + 'startTime' + SPLITOR + ',' + SPLITOR + 'endTime' + SPLITOR + ',' + SPLITOR + constant_value_spliter + 'diffType' + constant_value_spliter + SPLITOR + ')';
        }
    }

    function  hasTimeDiffError(expressionItems){
        for (var i = 0; i < expressionItems.length; i++) {
            var item = expressionItems[i];
            if (item == 'timeDiff') {
                if (expressionItems.length <= (i+7)) {
                    return true;
                }
                if (expressionItems[i+1] != '(' || expressionItems[i+3] != ',' || expressionItems[i+5] != ',' || expressionItems[i+7] != ')' ) {
                    return true;
                }
            }
        }
        return false;
    }

    function validateBrackets(expressionItems) {
        var square_bracket = []; //中括号
        var bracket = []; //小括号
        var item = null;
        for (var i = 0; i < expressionItems.length; i++) {
            item = expressionItems[i];
            if (item == "[") {
                square_bracket.push(item);
            } else if(item == "]") {
                if (square_bracket.length <= 0) {
                    return false;
                }
                square_bracket.pop();
            } else if(item == '(') {
                bracket.push(item);
            } else if(item == ")") {
                if (bracket.length <= 0) {
                    return false;
                }
                bracket.pop();
            }
        }
        if (square_bracket.length == 0 && bracket.length == 0) {
            return true;
        }
        return false;
    }

    function isBracket(expressionItem){
        return isInArray(brackets, expressionItem);
    }

    function isUnaryOP(expressionItem) {
        return isInArray(unaryOP, expressionItem);
    }

    function sameTypeExpressionItemsLinked(expressionItems) {
        var isOpLastItem = null;
        var isOpCurrentItem = null;
        var item = null;
        var lastItem = null;
        var isLastBracket = null;
        var isCurrentBracket = null;
        var isCurrentUnaryOP = null;
        var sameItemLinksAry = [];
        for (var i = 0; i < expressionItems.length; i++) {
            item = expressionItems[i];
            if (!item) continue;
            isOpCurrentItem = isOp(item);
            isCurrentBracket = isBracket(item);
            isCurrentUnaryOP = isUnaryOP(item);
            if (isCurrentUnaryOP) {
                isOpLastItem = null;
                isOpCurrentItem = null;
                item = null;
                lastItem = null;
                isLastBracket = null;
                isCurrentBracket = null;
                isCurrentUnaryOP = null;
                continue;
            }
            if ((isOpCurrentItem && !isCurrentBracket && !isLastBracket && isOpLastItem == true) || (!isOpCurrentItem && isOpLastItem == false)) {
                sameItemLinksAry.push(lastItem + " " + item);
            }
            isOpLastItem = isOpCurrentItem;
            lastItem = item;
            isLastBracket = isCurrentBracket;
        }

        return sameItemLinksAry;
    }

    function fetchIllegalFormatItems(expressionItems) {
        var illeagalItems = [];
        var bracket_count = 0;
        for (var i = 0; i < expressionItems.length; i++) {
            var item = expressionItems[i];
            if (containsOP(item)) {
                illeagalItems.push(item);
            }
            if (item == "[" || item == "(") {
                ++bracket_count;
            }
            if (item == "]" || item == ")") {
                --bracket_count;
            }
        }
        if (bracket_count != 0) {

        }
        return illeagalItems;
    }

    function containsOP(expressionItem) {
        if (expressionItem && expressionItem.length > 1 && expressionItem.indexOf(SPLITOR) == -1 &&
            !isNormalOP(expressionItem) && !hasIgnoreOp(expressionItem) && !surroundWithConstantSpliter(expressionItem)) {
            for (var i = 0; i < supportOP.length; i++) {
                var operator = supportOP[i];
                if (expressionItem.indexOf(operator) != -1) {
                    return true;
                }
            }
        }
        return false;
    }

    function surroundWithConstantSpliter(expressionItem) {
        if (expressionItem.indexOf(constant_value_spliter) == 0 && expressionItem.lastIndexOf(constant_value_spliter) == (expressionItem.length-1)) {
            return true;
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
        var matchs = imediateOperateBeforeTernaryOp.filter(function(item) { return item == op;});
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
            return parseData(str);
        }
        if (typeof str == 'string' && surroundWithConstantSpliter(str)) {
            return str.substr(1,str.length-2);
        }
     
        return str;

    }

    function getData(item) {
        return parseStr(item);
    }

    function fetchOpPri(op, opPriAry) {
        var matchs = opPriAry.filter(function(item) { return item.op == op;});
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
        var priCompare = null;
        do {
            var left_op = opStack.pop();
            priCompare = judgePri(left_op, right_op);
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
            case '+' :  num = parseData(dataStack.pop()) + parseData(dataStack.pop()); dataStack.push(num); break;
            case '-' : num = parseData(dataStack.pop()); num = parseData(dataStack.pop())-num; dataStack.push(num); break;
            case '%' : num = parseData(dataStack.pop()); num = (parseData(dataStack.pop()) % num); dataStack.push(num); break;
            case '*' : num = parseData(dataStack.pop())*parseData(dataStack.pop()); dataStack.push(num); break;
            case '/' :  num = parseData(dataStack.pop()); if (num == 0) {throw "caculate expression error, divide by 0."; }  num = parseData(dataStack.pop())/num; dataStack.push(num); break;
            case '!' :  num = !parseStr(dataStack.pop()); dataStack.push(num); break;
            case '++' :  num = parseData(dataStack.pop()) + 1; dataStack.push(num); break;
            case '--' :  num = parseData(dataStack.pop()) - 1; dataStack.push(num); break;
            case '>' :  num = parseStr(dataStack.pop()); num = parseStr(dataStack.pop()) > num; dataStack.push(num); break;
            case '>=' :  num = parseStr(dataStack.pop()); num = parseStr(dataStack.pop()) >= num; dataStack.push(num); break;
            case '<' :  num = parseStr(dataStack.pop()); num = parseStr(dataStack.pop()) < num; dataStack.push(num); break;
            case '<=' :  num = parseStr(dataStack.pop()); num = parseStr(dataStack.pop()) <= num; dataStack.push(num); break;
            case '==' :  num = parseStr(dataStack.pop()); num = parseStr(dataStack.pop()) == num; dataStack.push(num); break;
            case '!=' :  num = parseStr(dataStack.pop());  num = parseStr(dataStack.pop()) != num; dataStack.push(num); break;
            case '&&' : num = parseStr(dataStack.pop()); var tmp = parseStr(dataStack.pop()); num = num && tmp; dataStack.push(num); break;
            case '||' : num = parseStr(dataStack.pop()); var tmp = parseStr(dataStack.pop()); num = num || tmp; dataStack.push(num); break;
            case "timeDiff" : var diffType = dataStack.pop(), endTime  = dataStack.pop(), startTime = dataStack.pop(); dataStack.push(timeDiff(startTime, endTime, diffType)); break; // timeDiff(start, end, unit)
            default: break;
        }
    }
	
	function parseData(data) {
	    try {
		   var parseData = parseFloat(data);
		   return parseFloat(parseData.toFixed(2));
		} catch(e) {
		  var msg = e.message ? e.message : e;	
	      throw "Parse Float error:" + data + " message:" + msg; 		
		}
	}

    function timeDiff(startTime, endTime, diffType) {
        //将计算间隔类性字符转换为小写
        diffType = diffType.toLowerCase();
        var sTime =new Date(startTime); //开始时间
        if (!sTime) {
            throw startTime + " invalid date format";
        }
        var eTime =new Date(endTime); //结束时间
        if (!eTime) {
            throw eTime + " invalid date format";
        }
        //作为除数的数字
        var timeType =1;
        switch (diffType) {
            case "second":
                timeType =1000;
                break;
            case "minute":
                timeType =1000*60;
                break;
            case "hour":
                timeType =1000*3600;
                break;
            case "day":
                timeType =1000*3600*24;
                break;
            case "diffday":
                startTime = dateFormat(sTime, 'yyyy-MM-dd');
                endTime = dateFormat(eTime, 'yyyy-MM-dd');
                sTime = new Date(startTime),
                    eTime = new Date(endTime);
                timeType =1000*3600*24;
                break;
            default:
                break;
        }
        return parseInt((eTime.getTime() - sTime.getTime()) / parseInt(timeType));
    }


   function dateFormat(date, fmt)
    {
        var o = {
            "M+" : date.getMonth()+1,                 //月份
            "d+" : date.getDate(),                    //日
            "h+" : date.getHours(),                   //小时
            "m+" : date.getMinutes(),                 //分
            "s+" : date.getSeconds(),                 //秒
            "q+" : Math.floor((date.getMonth()+3)/3), //季度
            "S"  : date.getMilliseconds()             //毫秒
        };
        if(/(y+)/.test(fmt))
            fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
        for(var k in o)
            if(new RegExp("("+ k +")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        return fmt;
    }

    function runBeforeTernary() {
        var isRunBeforeTernary = null;
        do {
            var op_left = opStack.pop();
            isRunBeforeTernary = isRunBeforeTernaryOp(op_left);
            if (!isRunBeforeTernary) {
                opStack.push(op_left);
            } else {
                count(op_left);
            }
        } while (isRunBeforeTernary); // 如果是问号, 则要先将问号之前的表达式计算出一个结果, 看是false还是true;
    }

    function countTernary(index, expressionItems) {
        var rst = {index: index, expressionItems: expressionItems};
        var ternaryEndIndex = null;
        runBeforeTernary(); // 如果是问号, 则要先将问号之前的表达式计算出一个结果, 看是false还是true;
        var ternaryResult = dataStack.pop();// 取出三目运算符问号操作符之前的运算结果;
        if (typeof ternaryResult != 'boolean') {
            ternaryResult = !!ternaryResult;
        }
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
                ternaryEndIndex = getClosedBracketIndex(']', (lastSemicolonIndex+1), expressionItems);
                rst.expressionItems = expressionItems.slice(ternaryEndIndex+1);
                rst.index = -1;
            } else if (tmp == "(") {
                ternaryEndIndex = getClosedBracketIndex(')', (lastSemicolonIndex + 1), expressionItems);
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

    function evalExpressionItems(expressionItems) {
        initStack(); //初始化数据栈和操作符堆栈；
        evalDataOPAry(expressionItems); // 计算所有的表达式
        var finalValue = caculateFinalValue(); // 最终操作符栈opStack会剩下一些操作符， 需要从右往左依次执行.
        return finalValue;
    }

    function evalExpression(expression) {
        if (!expression) { throw " Bad expression:" + expression ; } // 表达式不能为空
        var expressionItems = String.prototype.split.call(expression, SPLITOR);
        validateExpressionElementFormat(expressionItems); // 校验表达式的每个项是否格式正确，不能包含操作符， 应该用分隔符分隔；
        return evalExpressionItems(expressionItems);
    }

/*
4 + [ ( ( 3 -5 ) < 20 ) ? 30 : 40 ] + 6
计算逻辑:
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
//{expression: "4~+~[~(~(~3~-~5~)~<~20~)~?~30~:~40~]~+~6",expected:40},
//{expression: "4~+~7~*~5~-~10~+~16",expected:45},
//{expression: "4~+~(~7~<~5~?~10~:~20~)",expected:24},
//{expression: "~4~+~7~<~5~?~10~:~20~",expected:20},
//{expression:"~5~+~4~%~2~*~3~+~6~", expected: 11},
//{expression: "~5~-~4~%~2~*~3~+~6~", expected: 11},
//{expression: "~40~+~[~(~4~-~3~==~1~)~?~(~12~*~5~<=~50~?~(~8~-~4~>~5~?~12~:~14~)~:~75~)~:~(~85~-~64~>~40~?~35~:~45~)~]~+~2~*~10~", expected: 135},
//{expression: "~40~+~(~(~4~-~3~==~1~)~?~(~12~*~5~<=~50~?~(~8~-~4~>~5~?~12~:~14~)~:~75~)~:~(~85~-~64~>~40~?~35~:~45~)~)~+~2~*~10~", expected: 135},
//{expression: "~40~+~[~(~2~-~3~==~1~)~?~(~12~*~5~<=~50~?~(~8~-~4~>~5~?~12~:~14~)~:~75~)~:~(~85~-~64~>~40~?~35~:~45~)~]~+~2~*~10~", expected: 105},
//{expression: "~10~+~20~+~50~*~2~+~100~/~10~+~40~+~(~40~-~30~)~+~(~60~*~2~)~", expected: 310},
//{expression: "~(~4~+~5~)~>~10~&&~(~3~+~6~)~<~10~?~true~:~false~", expected: false},
{expression: "~(~4~+~5~)~>~10~||~(~3~+~6~)~<~10~?~true~:~false~", expected: true},
{expression: "~(~4~+~5~)~<~10~&&~(~3~+~6~)~<~10~?~true~:~false~", expected: true},
{expression: "~(~4~+~5~)~<~10~||~(~3~+~6~)~<~10~?~true~:~false~", expected: true},
{expression: "~(~(~4~+~5~)~<~10~&&~(~3~+~6~)~<~10~)~?~true~:~false~", expected: true},
{expression: "~!~(~4~+~5~<~6~)~?~20~:~30~", expected: 20},
{expression: "~!~(~++~4~+~--~5~<~6~)~?~20~:~30~", expected: 20},
{expression: "~!~(~++~4~+~--~5~<=~6~)~?~20~:~30~", expected: 20},
{expression: "~!~(~++~4~+~--~5~==~6~)~?~20~:~30~", expected: 20},
{expression: "~!~(~++~4~+~--~5~>~6~)~?~20~:~30~", expected: 30},
{expression: "~!~(~++~4~+~--~5~>=~6~)~?~20~:~30~", expected: 30},
{expression: "~!~(~++~4~+~--~5~!=~6~)~?~20~:~30~", expected: 30},
{expression: "~[~(~4~)~]~>~5~?~3~:~2~", expected: 2},
{expression: "~[~(~&lisi&~)~]~?~&zhangshan&~:~&wangwu&~", expected: 'zhangshan'},
{expression: "~!~(~++~4~+~--~5~!=~6~)~?~&23%34/34&~:~&sd#$sd&~",expected: 'sd#$sd'},
{expression: "~timeDiff~(~&2019-02-28 23:10:10&~,~&2019-03-02 12:10:10&~,~&day&~)", expected: '1'},
{expression: "~timeDiff~(~&2019-02-28 23:10:10&~,~&2019-03-02 12:10:10&~,~&hour&~)", expected: '37'},
{expression: "~timeDiff~(~&2019-02-28 23:10:10&~,~&2019-03-02 12:10:10&~,~&diffDay&~)", expected: '2'},
//{expression: "~timeDiff~(~&2019-02-28T23:10:10&~,~&2019-03-02T12:10:10&~,~&diffDay&~)", expected: '2'},
// {expression: "~2~/~0~", expected: "throw error"},
// {type: "请假时长",expression: "(~$.fields[?(@.id=='start-field')].properties.year~==~$.fields[?(@.id=='end-field')].properties.year~&&~$.fields[?(@.id=='start-field')].properties.month~==~$.fields[?(@.id=='end-field')].properties.month~&&~$.fields[?(@.id=='start-field')].properties.day~==~$.fields[?(@.id=='end-field')].properties.day~)~?~[~(~$.fields[?(@.id=='start-field')].properties.hour~>~$.fields[?(@.id=='end-field')].properties.hour~||~$.fields[?(@.id=='start-field')].properties.hour~>=~&18&~||~$.fields[?(@.id=='end-field')].properties.hour~<=~&8&~)~?~&0&~:~(~(~$.fields[?(@.id=='end-field')].properties.hour~>=~&14&~&&~$.fields[?(@.id=='start-field')].properties.hour~<~&12&~)~?~&1&~:~&0.5&~)~]~:~[~(~timeDiff~(~$.fields[?(@.id=='start-field')].properties.value~,~$.fields[?(@.id=='end-field')].properties.value~,~&diffDay&~)~-~&1&~)~+~(~(~$.fields[?(@.id=='start-field')].properties.hour~>=~&18&~)~?~&0&~:~(~(~$.fields[?(@.id=='start-field')].properties.hour~>=~&12&~)~?~&0.5&~:~&1&~)~)~+~(~(~$.fields[?(@.id=='end-field')].properties.hour~<=~&8&~)~?~&0&~:~(~(~$.fields[?(@.id=='end-field')].properties.hour~<~&14&~)~?~&0.5&~:~&1&~)~)~]", expected: "throw error"},
 {expression: "(~&2019&~==~&2019&~&&~&9&~==~&9&~&&~&16&~==~&17&~)~?~[~&10&~<~&12&~?~(~&09&~<~&14&~?~&0.5&~:~&1&~)~:~(~&10&~>=~&12&~?~&0.5&~:~&0&~)~]~:~[~(~timeDiff~(~&2019-09-16T10:22:30&~,~&2019-09-17T09:22:30&~,~&diffDay&~)~-~&1&~)~+~(~(~&10&~>~&18&~)~?~&0&~:~(~(~&10&~>~&14&~)~?~&0.5&~:~&1&~)~)~+~(~(~&09&~<~&8&~)~?~&0&~:~(~(~&09&~<~&14&~)~?~&0.5&~:~&1&~)~)~]", expected: "1.5"},
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



