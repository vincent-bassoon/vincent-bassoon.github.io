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

function accessTreeURL(function_of_data, lines, word_dict, queue){
	var x = new XMLHttpRequest();
	x.open("GET", 'https://api.datamuse.com/words?' + queue[0].code + "=" + queue[0].word + '&md=rfs');
	x.onreadystatechange = function(){
		if(x.readyState == 4 && x.status == 200){
  			var data = JSON.parse(x.responseText);
			setTimeout(function(){function_of_data(data, lines, word_dict, queue)}, 1);
 		}
	}
	x.send(null);
}

function buildRhymeList(rhyme){
	var order = getRandomOrder(rhyme.length);
	//this is an arbitrary order*****************************************************************************
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

function buildTree(lines, word_dict, queue){
	accessTreeURL(buildTreePost, lines, word_dict, queue);
}

function updateWordDict(new_word, new_syllables, sum_syllables, word, word_dict, code){
	if(new_word in word_dict){
		if(code in word_dict[new_word]){
			if(!(sum_syllables in word_dict[new_word][code])){
				word_dict[new_word][code][sum_syllables] = [word];
				return true;
			}
			else{
				word_dict[new_word][code][sum_syllables].push(word);
				return false;
			}
		}
		else{
			word_dict[new_word][code] = {};
			word_dict[new_word][code][sum_syllables] = [word];
			return true;
		}
	}
	else{
		word_dict[new_word] = {"syllables":new_syllables};
		word_dict[new_word][code] = {};
		word_dict[new_word][code][sum_syllables] = [word];
		return true;
	}
}

function addToLine(line, word_dict, word, syllable, code){
	var temp;
	while(syllable != word_dict[word].syllables){
		temp = word_dict[word][code][syllable];
		syllable -= word_dict[word].syllables;
		word = temp[Math.floor(Math.random() * temp.length)];
		if(code == "lc"){
			line.push(word);
		}
		else{
			line.unshift(word);
		}
	}
	if(code == "rc"){
		temp = word_dict[word][code][word_dict[word].syllables];
		line.unshift(temp[Math.floor(Math.random() * temp.length)]);
	}
}

function addToLines(lines, word_dict, word_start, syllable_start, syllable_sum, code){
	var line = [word_start];
	addToLine(line, word_dict, word_start, syllable_sum, code);
	addToLine(line, word_dict, word_start, LINE + syllable_start - syllable_sum, OPPOSITE_CODE[code]);
	previous_rhyme = line.shift();
	if(!(previous_rhyme in lines)){
		lines[previous_rhyme] = line;
		display.innerText += "\n" + line.join(" ");
		console.log("SUCCESS:", line);
	}
	else if(lines[previous_rhyme].length > line.length){
		lines[previous_rhyme] = line;
		display.innerText += "\n" + line.join(" ");
		console.log("SUCCESS:", line);
	}
	else{
		console.log("FAILED:", line);
	}
}

function valid_meter(data, syllables, code){
	if(data.numSyllables == 1){
		return true;
	}
	else if(code == "lc"){
		return isIambicEnd(data.tags[0]) == (syllables % 2 == 0)
	}
	else{
		return isIambicStart(data.tags[0]) == (syllables % 2 == 0)
	}
}

function buildTreePost(data, lines, word_dict, queue){
	var word = queue[0].word;
	var syllables = queue[0].syllables;
	var code = queue[0].code;
	queue.shift();
	var sum_syllables;
	var new_counter = 0;
	var dict_temp;
	for(var i = 0; i < data.length; i++){
		//evaluate results in some order similar to choosing a good order of rhyme_list******************
		if(valid_meter(data[i], syllables, OPPOSITE_CODE[code])){
			new_counter++;
			sum_syllables = syllables + data[i].numSyllables;
			if(updateWordDict(data[i].word, data[i].numSyllables, sum_syllables, word, word_dict, OPPOSITE_CODE[code])){
				dict_temp = word_dict[data[i].word];
				if(code in dict_temp && LINE + data[i].numSyllables - sum_syllables in dict_temp[code]){
					addToLines(lines, word_dict, data[i].word, data[i].numSyllables, sum_syllables, OPPOSITE_CODE[code]);
				}
				else if(sum_syllables < LINE){
					queue.push({"word":data[i].word, "syllables":sum_syllables, "code":code});
				}
			}
		}
		if(new_counter > 5){
			//this is an arbitrary number***************************************
			i = data.length;
		}
	}
	buildTree(lines, word_dict, queue);
}

function generatePoem(rhyme_list){
	rhyme_list = buildRhymeList(rhyme_list);
	console.log(rhyme_list);
	var word_dict = startDict(rhyme_list);
	var lines = {};
	var queue = [];
	for(var i = 0; i < rhyme_list.length; i++){
		queue.push({"word":rhyme_list[i].word, "syllables":0, "code":"lc"});
		queue.push({"word":rhyme_list[i].word, "syllables":rhyme_list[i].syllables, "code":"rc"});
	}
	buildTree(lines, word_dict, queue);
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
	while(!isIambicEnd(word.tags[0])){
		word = data[Math.floor(Math.random() * data.length)];
	}
	findRhymes(word.word);
}

function findRhymes(word){
	var code = 'rel_rhy=' + word + '&md=rfs';
	accessURL(code, findRhymesPost);
}

function invalid(data_element){
	if(data_element.score === undefined || data_element.score < 20 || !isIambicEnd(data_element.tags[0])){
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
	
function isIambicEnd(d){
	d = d.replace("pron:", "").replace(/[^01]/g, "");
	d = d.split("");
	for(var i = 0; i < d.length; i++){
		if(d[i] === "1"){
			return (d.length - i - 1) % 2 == 0;
		}
	}
}

function isIambicStart(d){
	d = d.replace("pron:", "").replace(/[^01]/g, "");
	d = d.split("");
	for(var i = 0; i < d.length; i++){
		if(d[i] === "1"){
			return i % 2 != 0;
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
