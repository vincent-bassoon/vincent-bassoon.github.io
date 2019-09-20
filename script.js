var display = document.getElementById("display");
var button = document.getElementById("startButton");

var CHARACTERS = "qwertyuiopasdfghjklzxcvbnm";

var poem = [];

function accessURL(code, function_of_data){
	var x = new XMLHttpRequest();
	x.open("GET", 'https://api.datamuse.com/words?' + code);
	x.onreadystatechange = function(){
		if(x.readyState == 4 && x.status == 200){
  			var data = JSON.parse(x.responseText);
			setTimeout(function_of_data(data), 1);
 		}
	};
	x.send(null);
}

function generateFollowing(word){
	var code = 'lc=' + word;
	accessURL(code, generateFollowingPost);
}

function generateFollowingPost(data){
	word = data[0].word;
	poem.push(word);
	console.log(poem);
	generateFollowing(word);
}

function buildRhymeList(rhyme){
	var order = getRandomOrder(rhyme.length);
	var rhyme_list = [];
	for(var i = 0; i < rhyme.length; i++){
		rhyme_list.append({"word":rhyme[order[i]].word,"syllables":rhyme[order[i]].numSyllables,"pre":[],"post":[]});
	}
	return rhyme_list;
}

function generatePoem(rhyme_list){
	rhyme_list = buildRhymeList(rhyme_list);
	for(var i = 0; i < rhyme_list.length; i++){
		display.innerText += "\n" + rhyme_list[i].word;
	}
	var order_counter = 0;
	var finished = false;
	var filler_words_indices = {};
	var filler_words = [];
	while(order_counter < order.length && !finished){
		
	}
	button.disabled = false;
}

function run(){
	button.disabled = true;
	poem = [];
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
	return parseFloat(data_element.tags[1].replace("f:", "")) > .5;
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
