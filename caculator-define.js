'use strict';

define([
    'jquery'
], function($){

    var _this;

    var ignoreValidateOP = ['$.']; // 如果表达式的元素包含 ignoreValidateOP 的一个项， 就默认这是个正常的元素， 不在校验格式
    var normalOP = ['++', '--', '>=', '<=', '==', '!=', '&&', '||', 'timeDiff'];  // 如果表达式的元素和normalOP的任意一个项相同， 也认为是正确格式
    var supportOP = ['[', ']', '(', ')', '!', '++', '--', '/', '*', '%', '+', '-', '>', '>=', '<', '<=', '==', '!=', '&&', '||', '=', '?', ":", "timeDiff", ','];//支持的操作符， 包括三目?:
   // 如果要定义一个字符串， 并且字符串包含supportOP的字符， 那么需要用	constant_value_spliter 把数据包围起来, 例如 &chek%mg&, 这样表示设置值check%mg
    var constant_value_spliter = "&";

    var unaryOP = ['++', '--', '!'];//单目运算符
    var brackets = ['[', ']', '(', ')'];

    var dataStack = []; // 数据栈
    var opStack = []; // 操作符栈
    var SPLITOR = "~";// 表达式数据项和操作符的分隔符
    var TIME_DIFF = "timeDiff";
    var TIME_DIFF_TYPES = ['diffDay', 'day', 'hour', 'minute', 'second'];// diffDay 忽略掉时分秒的数据计算相差多少日； day 不忽略时分秒， 按一天24小时算。

    function Caculator() {
        _this = this;
        this.SPLITOR = SPLITOR;
        this.CONSTANT_VALUE_SPLITOR = constant_value_spliter;
        this.TIME_DIFF_TYPES = TIME_DIFF_TYPES;
        this.TIME_DIFF = TIME_DIFF;
    }

    /*

    * 1. 方法[validateExpressionElementFormat] 存在的异常消息：
        1. 每个表达式元素必须用逗号分隔： " each item of the expression must split by '" + SPLITOR + "'";
        2. 表达式的括号要配对：" expression has mismatch bracket pairs.";
        3. 两个相同类型的元素不能放在一起， 比如: '+ -': 'expression has same operate type items linked:'+JSON.stringify(sameItemLinksAry);
        4. 表达式元素里面不能包含操作符， 如果是个常量， 请前后加上'&':JSON.stringify(illeagalItems) + " contains operator, they should spliter by '" + SPLITOR + "'";
        5. 表达式不能为空： " Bad expression:" + expression ;
        6. 三目运算符必须配对： "'?:' operator not found match ':' ";
    */
    Caculator.prototype.validate = function(expression){
        if (!expression) { throw " Bad expression:" + expression ; } // 表达式不能为空
        var expressionItems = String.prototype.split.call(expression, SPLITOR);
        validateExpressionElementFormat(expressionItems); // 校验表达式的每个项是否格式正确，不能包含操作符， 应该用分隔符分隔；
    };

    function isOp(expressionItem) {
        return isInArray(supportOP, expressionItem);
    }

    function isInArray(array, searchItem) {
        return Array.prototype.findIndex.call(array, function(item){return item == searchItem}) != -1;
    }

    function validateExpressionElementFormat(expressionItems) {
        if (expressionItems.length == 1) {
            if (containsOP(expressionItems)) {
                throw " each item of the expression must split by '" + SPLITOR + "'";
            }
        }
        var isBracketsMatch = validateBrackets(expressionItems);
        if (!isBracketsMatch) {
            throw  "expression has mismatch bracket pairs.";
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
            SPLITOR +'('+SPLITOR+'startTime'+SPLITOR+','+SPLITOR+'endTime'+SPLITOR+','+SPLITOR+constant_value_spliter+'diffType'+constant_value_spliter+SPLITOR+')';
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

    function containsOP(expressionItem) {
        if (expressionItem && expressionItem.length > 1 && expressionItem.indexOf(SPLITOR) == -1
            && !isNormalOP(expressionItem) && !hasIgnoreOp(expressionItem) && !surroundWithConstantSpliter(expressionItem)) {
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

    function surroundWithConstantSpliter(expressionItem) {
        if (expressionItem.indexOf(constant_value_spliter) == 0 && expressionItem.lastIndexOf(constant_value_spliter) == (expressionItem.length-1)) {
            return true;
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


    return new Caculator();
});
