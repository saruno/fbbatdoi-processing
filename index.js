var vntk = require('vntk');
var fs = require('fs');
var consts = require('./consts.js');
var utils = require('./utils.js');
var moment = require('moment');
// Require `PhoneNumberFormat`.
const PNF = require('google-libphonenumber').PhoneNumberFormat;
// Get an instance of `PhoneNumberUtil`.
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const Hapi=require('hapi');

// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:3000
});

fs.readFile('test.txt', 'utf8', function(err, data) {
	data = data.replace(consts.SPECIAL_CHARACTER, ' ');
	var x;
	for(x = 0; x < consts.STOP_WORDS.length; x++)
	{
		data = data.replace(consts.STOP_WORDS[x], ' ');
	}
	processing(data);
})

// Add the route
server.route({
    method:'POST',
    path:'/batdoi/fbpost_process',
    handler:function(request,h) {
		var obj = request.payload;
		console.log(obj.content);
		var parserObj = processing(obj.content);
        return parserObj;
    }
});

// Start the server
async function start() {

    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();

//Data Info need to parse
//Time : Hour + Day
//Location : Field + Address
//Club : Ten doi bong
//Phone : SDT lien he
//Level : Trinh do
//Type : Loai tin
function processing(text_data) {
	var tokenizer = vntk.wordTokenizer();
	var tags = tokenizer.tag(text_data);
	console.log(tags);
	var phone = parser_phone(text_data, tags);
	var time = parser_time(text_data, tags);
	var location = parser_location(text_data, tags);
	var type = parser_type(text_data, tags);
	var result = {};
	result['type'] = type;
	result['phone'] = phone;
	result['time'] = time;
	result['location'] = location;
	console.log(result);
	return result;
}

function parser_time(o_text_data, o_tags) {
	var text_data = o_text_data.slice(0);
	var tags = o_tags.slice(0);
	text_data = text_data.toLowerCase();
	for (var i = 0; i < tags.length; i++) {
		tags[i] = tags[i].toLowerCase();
	}
	//
	var now = moment();
	var origin_week = '';
	var origin_day = '';
	//Parse Week
	for (var i = 0; i < consts.NEXTWEEK_WORDS.length; i++) {
		if (text_data.indexOf(consts.NEXTWEEK_WORDS[i]) > -1) {
			now.add(7, 'day');
			origin_week = consts.NEXTWEEK_WORDS[i];
		}
	}
	//Parse Tomorrow
	for (var i = 0; i < consts.TOMORROW_WORDS.length; i++) {
		if (text_data.indexOf(consts.TOMORROW_WORDS[i]) > -1) {
			now.add(1, 'day');
			origin_week = consts.NEXTWEEK_WORDS[i];
		}
	}
	//Parse After Tomorrow
	for (var i = 0; i < consts.AFTER_TOMORROW_WORDS.length; i++) {
		if (text_data.indexOf(consts.AFTER_TOMORROW_WORDS[i]) > -1) {
			now.add(2, 'day');
			origin_week = consts.NEXTWEEK_WORDS[i];
		}
	}
	//Parse Day Of Week
	for (var i = 0; i < consts.MONDAY_WORDS.length; i++) {
		if (text_data.indexOf(consts.MONDAY_WORDS[i]) > -1) {
			now.day(1);
			origin_day = consts.MONDAY_WORDS[i];
		}
	}
	for (var i = 0; i < consts.TUESDAY_WORDS.length; i++) {
		if (text_data.indexOf(consts.TUESDAY_WORDS[i]) > -1) {
			now.day(2);
			origin_day = consts.TUESDAY_WORDS[i];
		}
	}
	for (var i = 0; i < consts.WED_WORDS.length; i++) {
		if (text_data.indexOf(consts.WED_WORDS[i]) > -1) {
			now.day(3);
			origin_day = consts.WED_WORDS[i];
		}
	}
	for (var i = 0; i < consts.THURSDAY_WORDS.length; i++) {
		if (text_data.indexOf(consts.THURSDAY_WORDS[i]) > -1) {
			now.day(4);
			origin_day = consts.THURSDAY_WORDS[i];
		}
	}
	for (var i = 0; i < consts.FRIDAY_WORDS.length; i++) {
		if (text_data.indexOf(consts.FRIDAY_WORDS[i]) > -1) {
			now.day(5);
			origin_day = consts.FRIDAY_WORDS[i];
		}
	}
	for (var i = 0; i < consts.SATURDAY_WORDS.length; i++) {
		if (text_data.indexOf(consts.SATURDAY_WORDS[i]) > -1) {
			now.day(6);
			origin_day = consts.SATURDAY_WORDS[i];
		}
	}
	for (var i = 0; i < consts.SUNDAY_WORDS.length; i++) {
		if (text_data.indexOf(consts.SUNDAY_WORDS[i]) > -1) {
			now.day(0);
			origin_day = consts.SUNDAY_WORDS[i];
		}
	}
	var day = now.format('YYYY-MM-DD');
	//Parse Time
	var times_in_tags = [];
	for (var i = 0; i < tags.length; i++) {
		if (tags[i].match(/\b\d{1,2}[h:][\d{1,2}]*/g)) {
			times_in_tags.push(tags[i]);
		}
	}
	var times = [];
	for (var i = 0; i < times_in_tags.length; i++) {
		var s = times_in_tags[i];
		var split_string = 'h';
		if (s.indexOf(':') >= 0) {			
			split_string = ':';
		}
		var splits = s.split(split_string);
		var onetime = '';
		for (var j = 0; j < splits.length; j++) {
			if (splits[j].length == 1) {
				splits[j] = '0' + splits[j];
			} else if (splits[j].length == 0) {
				splits[j] = '00';
			}
		}
		onetime = splits[0] + ':' + splits[1];
		times.push(onetime);
	}
	//
	var result = {};
	result['day'] = day;
	result['times'] = times;
	result['origin'] = {'origin_week' : origin_week, 'origin_day' : origin_day, 'origin_time' : times_in_tags};
	console.log(result);
	return result;	
}

function parser_location(o_text_data, o_tags) {
	var text_data = o_text_data.slice(0);
	var tags = o_tags.slice(0);
	var lowercase_text_data = text_data.toLowerCase();
	for (var i = 0; i < tags.length; i++) {
		tags[i] = tags[i].toLowerCase();
	}
	var min_index_start_word = -1;
	var min_start_word;
	var list_start_word = [];
	for (var i = 0; i < consts.LOCATION_START_WORDS.length; i++) {		
		var start_word = consts.LOCATION_START_WORDS[i];
		var index_start_word = lowercase_text_data.indexOf(start_word);
		if (start_word.trim() === 'khu' && (utils.isStringInArray('khu vuc', list_start_word) || utils.isStringInArray('khu vực', list_start_word))) {
			continue;
		}
		if (min_index_start_word === -1 && index_start_word >= 0) {
			min_index_start_word = index_start_word;
			min_start_word = start_word;
			list_start_word.push(start_word);
		} else if (index_start_word >= 0 && index_start_word < min_index_start_word) {
			min_index_start_word = index_start_word;
			min_start_word = start_word;
			list_start_word.push(start_word);
		}
	}
	var index_end_word = text_data.length;
	consts.LOCATION_END_WORDS = consts.LOCATION_END_WORDS.concat(consts.TODAY_WORDS, consts.TOMORROW_WORDS, consts.AFTER_TOMORROW_WORDS, consts.THISWEEK_WORDS, consts.NEXTWEEK_WORDS,
			consts.MONDAY_WORDS, consts.TUESDAY_WORDS, consts.WED_WORDS, consts.THURSDAY_WORDS, consts.FRIDAY_WORDS, consts.SATURDAY_WORDS, consts.SUNDAY_WORDS);
	if (min_index_start_word >= 0) {
		for (var i = 0; i < consts.LOCATION_END_WORDS.length; i++) {
			var index = lowercase_text_data.indexOf(consts.LOCATION_END_WORDS[i], min_index_start_word);
			if (index >= 0 && index < index_end_word) {
				index_end_word = index;
			}
		}
	}
	var result = {};
	var location;
	if (min_index_start_word >= 0 && index_end_word >= 0) {
		location = text_data.substring(min_index_start_word, index_end_word);
		result['address'] = location.trim();
		result['key_word'] = start_word;
	}
	return result;
}

function parser_club(o_text_data, o_tags) {

}

function parser_phone(o_text_data, o_tags) {
	var text_data = o_text_data.slice(0);
	var tags = o_tags.slice(0);
	var phones = [];
	//Xoa bo cac ki tu '.' va '-'
	for (var i = 0; i < tags.length; i++) {
		if (tags[i] === '.' || tags[i] === '-') {
			tags.splice(i, 1);
		}
	}
	//Gom cac so dang lien tiep voi nhau thanh 1. VD: Dang mobile 0125 7523333
	var merge_continuos_number_tags = merge_number_tags(tags);
	merge_continuos_number_tags = merge_number_tags(merge_continuos_number_tags);
	//Loc cac so dien thoai
	tags = merge_continuos_number_tags;
	for (var i = 0; i < tags.length; i++) {
		var tag_i = tags[i];
		if (tag_i.match(/^\d/) && tag_i.length >= 10) {
			var number = phoneUtil.parseAndKeepRawInput(tag_i, 'VN');
			var format_number = phoneUtil.format(number, PNF.E164);
			phones.push({'origin' : tag_i, 'phone' : format_number});
		}
	}
	console.log(phones);
	return phones;
}

function parser_level(text_data, tags) {

}

function parser_type(o_text_data, o_tags) {
	var text_data = o_text_data.slice(0);
	var tags = o_tags.slice(0);
	var lowercase_text_data = text_data.toLowerCase();
	for (var i = 0; i < tags.length; i++) {
		tags[i] = tags[i].toLowerCase();
	}
	var type = 0;
	var DI_KHACH = 1, BAO_CHAY = 2, TIM_DOI = 3, TUYEN_THANH_VIEN = 4;
	for (var i = 0; i < consts.TYPE_DI_KHACH.length; i++) {
		var word = consts.TYPE_DI_KHACH[i];
		if (lowercase_text_data.indexOf(word) >= 0) {
			type = DI_KHACH;
			return type;
		}
	}
	for (var i = 0; i < consts.TYPE_BAO_CHAY.length; i++) {
		var word = consts.TYPE_BAO_CHAY[i];
		if (lowercase_text_data.indexOf(word) >= 0) {
			type = BAO_CHAY;
			return type;
		}
	}
	for (var i = 0; i < consts.TYPE_TIM_DOI.length; i++) {
		var word = consts.TYPE_TIM_DOI[i];
		if (lowercase_text_data.indexOf(word) >= 0) {
			type = TIM_DOI;
			return type;
		}
	}
	for (var i = 0; i < consts.TYPE_TUYEN_THANH_VIEN.length; i++) {
		var word = consts.TYPE_TUYEN_THANH_VIEN[i];
		if (lowercase_text_data.indexOf(word) >= 0) {
			type = TUYEN_THANH_VIEN;
			return type;
		}
	}
}

//==========================================
// PRIVATE METHODS
//==========================================

function merge_number_tags(o_tags) {
	var tags = o_tags.slice(0);
	var merge_continuos_number_tags = [];
	for (var i = 0; i < tags.length; i++) {
		var tag_i = tags[i];
		if (tag_i.match(/^\d/)) {
			if (i + 1 <= tags.length - 1) {
				var tag_i1 = tags[i + 1];
				if (tag_i1.match(/^\d/)) {
					tag_i = tag_i + tag_i1;
					tags.splice(i + 1, 1);
					merge_continuos_number_tags.push(tag_i);
				} else {
					merge_continuos_number_tags.push(tag_i);
				}
			} else {
				merge_continuos_number_tags.push(tag_i);
			}
		} else {
			merge_continuos_number_tags.push(tag_i);
		}
	}
	return merge_continuos_number_tags;
}