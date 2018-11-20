var DateFormat = require('./date_format.js');

var exports = module.exports;

exports.fomatDate = function (date) {
	return DateFormat.asString('yyyy-MM-dd hh:mm:ss', date);
};

exports.fomatDateSimple = function (date) {
	return DateFormat.asString('yyyy-MM-dd', date);
};

exports.formatDateLienTuc = function (date) {
	return DateFormat.asString("yyyyMMddHHmmssSS", date);
};

exports.isStringInArray = function (content, array) {
	var bl = false;
	for (var i = 0; i < array.length; i++) {
		if (content === array[i]) {
			bl = true;
			break;
		}
	}
	return bl;
};