function create_byte_pairs(){
	var x = new XMLHttpRequest();
	x.open("GET", "https://cors-anywhere.herokuapp.com/https://raw.githubusercontent.com/earonesty/dotfiles/master/frequent.js");
	x.onreadystatechange = function(){
		if(x.readyState == 4 && x.status == 200){
 			var response = JSON.parse(x.responseText);
			var word_list = [];
			for(var word in response){
				word_list.push({"word":("." + word + ".").split(""), freq:response[word]});
			}
			var byte_pairs = [];
			var counter = 0;
			var json_string = "[";
			for(var i = 0; i < 10000; i++){
				var pairs = {};
				for(var j = 0; j < word_list.length; j++){
					var word = word_list[j].word;
					for(var k = 0; k < word.length - 1; k++){
						var pair = word[k] + word[k + 1];
						if(pair in pairs){
							pairs[pair] += word_list[j].freq;
						}
						else{
							pairs[pair] = word_list[j].freq;
						}
					}
				}
				var best_pair = null;
				var best_pair_freq = -1;
				for(pair in pairs){
					if(pairs[pair] > best_pair_freq){
						best_pair = pair;
						best_pair_freq = pairs[pair];
					}
				}
				counter++;
				console.log("  ", counter);
				console.log("New Pair: ", best_pair);
				json_string += "'" + best_pair + "'";
				if(i < 10000 - 1){
					json_string += ",";
				}
				byte_pairs.push(best_pair);
				for(var j = 0; j < word_list.length; j++){
					var word = word_list[j].word;
					for(var k = 0; k < word.length - 1; k++){
						if(word[k] + word[k + 1] == best_pair){
							word[k] = word[k] + word.splice(k + 1, 1);
						}
					}
				}
			}
			json_string += "]";
			console.log(byte_pairs);
			var div = document.createElement("div");
			div.innerText = json_string;
			document.body.appendChild(div);
		}
	};
	x.send(null);
}

$.getJSON("https://vincent-bassoon.github.io/corruptordata.json", function(json) {
    initialize(JSON.parse(json));
});

function initialize(byte_pairs){
	console.log(byte_pairs);
}
