var display = document.getElementById("display");
var button = document.getElementById("startButton");

var LINE = 10;
var CHARACTERS = "qwertyuiopasdfghjklzxcvbnm";

function accessURL(code, function_of_data){
	var x = new XMLHttpRequest();
	x.open("GET", 'https://api.datamuse.com/words?' + code);
	x.onreadystatechange = accessURLPost(x, function_of_data);
	x.send(null);
}

function accessURLPost(x, function_of_data){
	if(x.readyState == 4 && x.status == 200){
  		var data = JSON.parse(x.responseText);
		setTimeout(function_of_data(data), 1);
 	}
}

function accessTreeURL(code, function_of_data, word_dict, word, syllables){
	var x = new XMLHttpRequest();
	x.open("GET", 'https://api.datamuse.com/words?' + code);
	x.onreadystatechange = accessTreeURLPost(x, function_of_data, word_dict, word, syllables, code);
	x.send(null);
}

function accessTreeURLPost(x, function_of_data, word_dict, word, syllables, code){
	if(x.readyState == 4 && x.status == 200){
  		var data = JSON.parse(x.responseText);
		setTimeout(function_of_data(data, word_dict, word, syllables, code), 1);
 	}
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

function buildTree(word_dict, word, syllables, code){
	var code = code + "=" + word + '*&md=rfs';
	accessTreeURL(code, buildTreePost, word_dict, word, syllables);
}

function buildTreePost(data, word_dict, word, syllables, code){
	var new_word, new_syllables;
	for(var i = 0; i < data.length / 2; i++){
		new_word = data[i].word;
		if(isIambic(data[i].tags[0]) == (syllables % 2 == 0)){
			new_syllables = syllables + data[i].numSyllables
			if(new_word in word_dict){
				if(code in word_dict[new_word]){
					if(!(new_syllables in word_dict[new_word][code])){
						word_dict[new_word][code][new_syllables] = word;
					}
				}
				else{
					word_dict[new_word][code] = {new_syllables:word};
				}
			}
			else{
				word_dict[new_word] = {code:{new_syllables:word}};
			}
		}
	}
}

function generatePoem(rhyme_list){
	rhyme_list = buildRhymeList(rhyme_list);
	for(var i = 0; i < rhyme_list.length; i++){
		display.innerText += "\n" + rhyme_list[i].word;
	}
	var word_dict = startDict(rhyme_list);
	buildTree(word_dict, rhyme_list[0].word, rhyme_list[0].syllables, "lc");
	buildTree(word_dict, rhyme_list[0].word, rhyme_list[0].syllables, "rc");
	//dictionary with keys being number of syllables away from beginning/end of line, value being the word to go to in order to move
	//towards that end of the sentence.
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
	display.innerText += "\nTesting root rhyme word: " + word.word;
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
		display.innerText += "\nTest successful, generating poem...";
		generatePoem(data);
	}
	else{
		display.innerText += "\nTest failed, searching for new root rhyme word...";
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
