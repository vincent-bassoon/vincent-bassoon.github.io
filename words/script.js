var start_button = document.getElementById("start_button");
var words = [];
var LAYERS = 1;
var markov = {};

function set(location, substring){
	if(substring.length > 1){
		if(typeof location[substring[0]] === 'undefined'){
			location[substring[0]] = {};
		}
		set(location[substring[0]], substring.substring(1));
	}
	else{
		if(typeof location[substring[0]] === 'undefined'){
			location[substring[0]] = 1;
		}
		else{
			location[substring[0]] += 1;
		}
	}
}

function initialize(){
	var x = new XMLHttpRequest();
	x.open("GET", "words.txt");
	x.onreadystatechange = function(){
		if(x.readyState == 4 && x.status == 200){
  			words = x.responseText.split("\n");
  			for(var layer = 1; layer <= LAYERS; layer++){
  				markov[layer] = {};
  				var prefix = "";
  				for(var i = 0; i < layer; i++){
  					prefix += "<";
  				}
  				for(var i = 0; i++; i < words.length){
  					var word = prefix + words[i] + ">";
  					for(var j = 0; j <= word.length - layer; j++){
  						set(markov[layer], word.substring(j, j + layer));
  					}
  				}
  			}
  			generate();
  		}
  	}
  	x.send(null);
}

function get(location, string){
	if(string.length > 1){
		return get(location[string[0]], string.subset(1));
	}
	else{
		return location[string[0]];
	}
}

function next_letter(depth, string){
	var options = get(markov[depth], string);
	var sum = 0;
	for(var key in options){
		sum += options[key];
	}
	var choice = Math.floor(Math.random() * sum);
	sum = 0;
	for(var key in options){
		sum += options[key];
		if(sum > choice){
			return key;
		}
	}
}

function generate_word(depth, string){
	var letter = next_letter(depth, string);
	var final_string = "";
	var counter = 0;
	while(letter != ">" && counter < 30){
		final_string += letter;
		string = string.substring(1) + letter;
		letter = next_letter(depth, string);
		counter += 1;
	}
	return final_string;
}

function generate(){
	var output = "";
	for(var i = 0; i < LAYERS; i++){
		output += "Words generated with markov depth of " + (i + 1) + "\n\n";
		var prefix = "";
		for(var j = 0; j < i; j++){
			prefix += "<";
		}
		for(var j = 0; j < 10; j++){
			output += generate_word(i + 1, prefix) + "\n";
		}
		output += "\n";
	}
	start_button.innerText = "Generate new words";
	start_button.classList.toggle("running");
	start_button.onclick = button;
}

function button(){
	start_button.innerText = "Generating...";
	start_button.classList.toggle("running");
	start_button.onclick = "";
	generate();
}

initialize();