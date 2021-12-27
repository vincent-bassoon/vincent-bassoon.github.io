var start_button = document.getElementById("start_button");
var words = [];
var real_words = {};
var LAYERS = 5;
var markov = {};

function set(location, substring){
	if(substring.length > 1){
		if(typeof location[substring.substring(0, 1)] === 'undefined'){
			location[substring.substring(0, 1)] = {};
		}
		set(location[substring.substring(0, 1)], substring.substring(1));
	}
	else{
		if(typeof location[substring.substring(0, 1)] === 'undefined'){
			location[substring.substring(0, 1)] = 1;
		}
		else{
			location[substring.substring(0, 1)] += 1;
		}
	}
}

function initialize(){
	var x = new XMLHttpRequest();
	x.open("GET", "words.txt");
	x.onreadystatechange = function(){
		if(x.readyState == 4 && x.status == 200){
  			words = x.responseText.split("\n");
  			for(var i = 0; i < words.length; i++){
  				real_words[words[i]] = true;
  			}
  			for(var layer = 1; layer <= LAYERS; layer++){
  				markov[layer] = {};
  				var prefix = "";
  				for(var i = 0; i < layer; i++){
  					prefix += "<";
  				}
  				for(var i = 0; i < words.length; i++){
  					var word = prefix + words[i] + ">";
  					for(var j = 0; j < word.length - layer; j++){
  						set(markov[layer], word.substring(j, j + layer + 1));
  					}
  				}
  			}
  			console.log("Markov");
  			console.log(markov);
  			generate();
  		}
  	}
  	x.send(null);
}

function get(location, string){
	if(string.length > 1){
		return get(location[string.substring(0, 1)], string.substring(1));
	}
	else{
		return location[string];
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
	if(final_string in real_words){
		return final_string + "*";
	}
	return final_string;
}

function get_mean(word_list){
	var mean = 0;
    for(var j = 0; j < word_list.length; j++){
        mean += word_list[j].length;
    }
    return mean / word_list.length;
}

function get_std_dev(word_list){
	var mean = get_mean(word_list);
    var dev = 0;
    for(var j = 0; j < word_list.length; j++){
        dev += Math.pow(word_list[j].length - mean, 2);
    }
    return Math.sqrt(dev / word_list.length);
}

function generate(){
	var output = "";
	for(var layer = 1; layer <= LAYERS; layer++){
		output += "Words generated with markov depth of " + layer + "\n\n";
		var prefix = "";
		for(var j = 0; j < layer; j++){
			prefix += "<";
		}
		for(var j = 0; j < 10; j++){
			output += generate_word(layer, prefix) + "\n";
		}
		output += "\n";
	}
	output += "* indicates a real word\n\n\n----------------------\n\n\n";
	var mean = get_mean(words);
    var dev = get_std_dev(words);
    for(var layer = 1; layer <= LAYERS; layer++){
		output += "Words generated with markov depth of " + layer + ", filtered to an appropriate standard deviation\n\n";
		var prefix = "";
		for(var j = 0; j < layer; j++){
			prefix += "<";
		}
        var word_list = [];
		for(var j = 0; j < 10; j++){
			word_list[j] = generate_word(layer, prefix);
		}
        var count = 0;
		while(Math.abs(get_std_dev(word_list) - dev) > 0.5 || Math.abs(get_mean(word_list) - mean) > 0.5){
			var index = Math.floor(Math.random() * 10);
			if(count % 3 == 0){
				for(var j = 0; j < 10; j++){
					if(Math.abs(word_list[index].length - mean) > dev){
						j = 10;
					}
					else{
						index = Math.floor(Math.random() * 10);
					}
				}
			}
			word_list[index] = generate_word(layer, prefix);
            count++;
		}
        console.log("layer " + layer + " has count " + count + " and std dev " + get_std_dev(word_list) + " and mean " + get_mean(word_list));
        for(var j = 0; j < 10; j++){
			output += word_list[j] + "\n";
		}
		output += "\n";
	}
	output += "* indicates a real word";
	document.getElementById("message").innerText = output;
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