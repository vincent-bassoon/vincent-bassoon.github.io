var field = document.getElementById("searchField");
var button = document.getElementById("searchButton");
var searchResults = document.getElementById("searchResults");

var CHARACTERS = "qwertyuiopasdfghjklzxcvbnm";

var poem = [];

function accessURL(code, function_of_data){
	var x = new XMLHttpRequest();
	x.open("GET", 'https://cors-anywhere.herokuapp.com/https://api.datamuse.com/words?' + code);
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
	console.log(rhyme);
	var order = getRandomOrder(rhyme.length);
	getStress(rhyme[0].tags[0]);
}

function generateRandom(){
	var code = 'sp=' + CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length)) + '*&md=r';
	accessURL(code, generateRandomPost);
}

function generateRandomPost(data){
	var word = data[Math.floor(Math.random() * data.length)];
	while(!isIambic(word.tags[0])){
		console.log("RETRYING:", word.word);
		word = data[Math.floor(Math.random() * data.length)];
	}
	console.log("RANDOM WORD:", word.word);
	findRhymes(word.word);
}

function findRhymes(word){
	var code = 'rel_rhy=' + word + '&md=r';
	accessURL(code, findRhymesPost);
}

function findRhymesPost(data){
	console.log("ATTEMPT:", data);
	if(data.length > 10 && !(data[9].score === undefined)){
		//maybe remove items that don't have a score at all
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
