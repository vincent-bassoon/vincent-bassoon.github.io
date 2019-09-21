var display = document.getElementById("display");
var button = document.getElementById("startButton");

var LINE = 10;
var OPPOSITE_CODE = {"lc":"rc", "rc":"lc"};
var CHARACTERS = "qwertyuiopasdfghjklzxcvbnm";

function accessURL(code, function_of_data){
	var x = new XMLHttpRequest();
	x.open("GET", 'https://api.datamuse.com/words?' + code);
	x.onreadystatechange = function(){
		if(x.readyState == 4 && x.status == 200){
  			var data = JSON.parse(x.responseText);
			setTimeout(function(){function_of_data(data)}, 1);
 		}
	};
	x.send(null);
}

function accessTreeURL(code, function_of_data, lines, word_dict, word, syllables){
	var x = new XMLHttpRequest();
	x.open("GET", 'https://api.datamuse.com/words?' + code + "=" + word + '&md=rfs');
	x.onreadystatechange = function(){
		if(x.readyState == 4 && x.status == 200){
  			var data = JSON.parse(x.responseText);
			setTimeout(function(){function_of_data(data, lines, word_dict, word, syllables, code)}, 1);
 		}
	}
	x.send(null);
}

function buildRhymeList(rhyme){
	var order = getRandomOrder(rhyme.length);
	var rhyme_list = [];
	for(var i = 0; i < rhyme.length; i++){
		rhyme_list.push({"word":rhyme[order[i]].word,"syllables":rhyme[order[i]].numSyllables});
	}
	return rhyme_list;
}

function startDict(rhyme){
	var rhyme_dict = {};
	for(var i = 0; i < rhyme.length; i++){
		rhyme_dict[rhyme[i].word] = {"syllables":rhyme[i].syllables,"rhyme":true};
	}
	return rhyme_dict;
}

function buildTree(lines, word_dict, word, syllables, code){
	accessTreeURL(code, buildTreePost, lines, word_dict, word, syllables);
}

function updateWordDict(new_word, new_syllables, sum_syllables, word, word_dict, code){
	if(new_word in word_dict){
		if(code in word_dict[new_word]){
			if(!(sum_syllables in word_dict[new_word][code])){
				word_dict[new_word][code][sum_syllables] = word;
				return true;
			}
			else{
				return false;
			}
		}
		else{
			word_dict[new_word][code] = {};
			word_dict[new_word][code][sum_syllables] = word;
			return true;
		}
	}
	else{
		word_dict[new_word] = {"syllables":new_syllables};
		word_dict[new_word][code] = {};
		word_dict[new_word][code][sum_syllables] = word;
		return true;
	}
}

function addToLine(line, word_dict, word, syllable, code){
	var temp;
	while(syllable != word_dict[word].syllables){
		temp = word_dict[word][code][syllable];
		syllable -= word_dict[word].syllables;
		word = temp;
		if(code == "lc"){
			line.push(word);
		}
		else{
			line.unshift(word);
		}
	}
	if(code == "rc"){
		line.unshift(word_dict[word][code][word_dict[word].syllables]);
	}
}

function addToLines(lines, word_dict, word_start, syllable_start, syllable_sum, code){
	var line = [word_start];
	addToLine(line, word_dict, word_start, syllable_sum, code);
	addToLine(line, word_dict, word_start, LINE + syllable_start - syllable_sum, OPPOSITE_CODE[code]);
	lines.push(line);
	console.log(line);
}

function buildTreePost(data, lines, word_dict, word, syllables, code){
	var sum_syllables;
	var new_counter = 0;
	var dict_temp;
	for(var i = 0; i < data.length; i++){
		if(data[i].numSyllables == 1 || isIambic(data[i].tags[0]) == (syllables % 2 == 0)){
			new_counter++;
			sum_syllables = syllables + data[i].numSyllables;
			if(updateWordDict(data[i].word, data[i].numSyllables, sum_syllables, word, word_dict, OPPOSITE_CODE[code])){
				dict_temp = word_dict[data[i].word];
				if(code in dict_temp && LINE + data[i].numSyllables - sum_syllables in dict_temp[code]){
					addToLines(lines, word_dict, data[i].word, data[i].numSyllables, sum_syllables, OPPOSITE_CODE[code]);
					console.log("MATCH");
				}
				if(sum_syllables < LINE){
					buildTree(lines, word_dict, data[i].word, sum_syllables, code);
				}
			}
		}
		if(new_counter > 5){
			i = data.length;
		}
	}
}

function generatePoem(rhyme_list){
	rhyme_list = buildRhymeList(rhyme_list);
	console.log(rhyme_list);
	var word_dict = startDict(rhyme_list);
	var lines = {};
	for(var i = 0; i < 10/*rhyme_list.length*/; i++){
		buildTree(lines, word_dict, rhyme_list[i].word, 0, "lc");
		buildTree(lines, word_dict, rhyme_list[i].word, rhyme_list[i].syllables, "rc");
	}
	button.disabled = false;
}

function run(){
	button.disabled = true;
	display.innerText = "Initializing...";
	generateRandom();
}

function generateRandom(){
	var code = 'sp=' + CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length)) + '*&md=r';
	accessURL(code, generateRandomPost);
}

function generateRandomPost(data){
	var word = data[Math.floor(Math.random() * data.length)];
	while(!isIambic(word.tags[0])){
		word = data[Math.floor(Math.random() * data.length)];
	}
	findRhymes(word.word);
}

function findRhymes(word){
	var code = 'rel_rhy=' + word + '&md=rfs';
	accessURL(code, findRhymesPost);
}

function invalid(data_element){
	if(data_element.score === undefined || data_element.score < 20 || !isIambic(data_element.tags[0])){
		return true;
	}
	return parseFloat(data_element.tags[1].replace("f:", "")) < .5;
}

function findRhymesPost(data){
	for(var i = 0; i < data.length; i++){
		if(invalid(data[i])){
			data.splice(i, 1);
			i--;
		}
	}
	if(data.length > 10){
		display.innerText += "\nRhyme scheme found, generating poem...";
		generatePoem(data);
	}
	else{
		generateRandom();
	}
}

function getStress(d){
	d = d.replace("pron:", "").replace(/[^01]/g, "");
	return d.split("");
}
	
function isIambic(d){
	d = d.replace("pron:", "").replace(/[^01]/g, "");
	d = d.split("");
	for(var i = 0; i < d.length; i++){
		if(d[i] === "1"){
			return (d.length - i - 1) % 2 == 0;
		}
	}
}

function getRandomOrder(length){
	var order = [];
	for(var i = 0; i < length; i++){
		order.splice(Math.floor(Math.random() * order.length), 0, i);
	}
	return order;
}
