var display = document.getElementById("searchResults");

var CHARACTERS = "qwertyuiopasdfghjklzxcvbnm";

var poem = [];

function accessURL(code, function_of_data){
	var x = new XMLHttpRequest();
	x.open("GET", 'https://api.datamuse.com/words?' + code);
	x.onreadystatechange = function(){
		if(x.readyState == 4 && x.status == 200){
  			var data = JSON.parse(x.responseText);
			setTimeout(function_of_data(data), 100);
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

function generatePoem(rhyme){
	for(var i = 0; i < rhyme.length; i++){
		display.innerText += "\n" + rhyme[i].word;
	}
	var order = getRandomOrder(rhyme.length);
	getStress(rhyme[0].tags[0]);
}

function run(){
	display.innerText = "Initializing...";
	generateRandom();
}

function generateRandom(){
	var code = 'sp=' + CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length)) + '*&md=r';
	accessURL(code, generateRandomPost);
}

function generateRandomPost(data){
	var word = data[Math.floor(Math.random() * data.length)];
	while(!isStrictlyIambic(word.tags[0])){
		word = data[Math.floor(Math.random() * data.length)];
	}
	display.innerText += "\nTesting root rhyme word: " + word.word;
	findRhymes(word.word);
}

function findRhymes(word){
	var code = 'rel_rhy=' + word + '&md=r';
	accessURL(code, findRhymesPost);
}

function findRhymesPost(data){
	for(var i = 0; i < data.length; i++){
		if(data[i].score === undefined || !isIambic(data[i].tags[0])){
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

function isStrictlyIambic(d){
	d = d.replace("pron:", "").replace(/[^01]/g, "");
	d = d.split("");
	return d.length > 1 && d[d.length - 1] == 1
}

function getRandomOrder(length){
	var order = [];
	for(var i = 0; i < length; i++){
		order.splice(Math.floor(Math.random() * order.length), 0, i);
	}
	return order;
}
