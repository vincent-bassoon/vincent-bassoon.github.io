class Poem {
	constructor(){
		this.display = document.getElementById("display");
		this.button = document.getElementById("startButton");
		this.opposite_code = {"lc":"rc", "rc":"lc"};
		this.characters = "qwertyuiopasdfghjklzxcvbnm";
		this.numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

		this.rhymes = {};
		this.scheme = [[0, 2], [1, 3], [4, 6], [5, 7], [8, 10], [9, 11], [12, 13]];
		this.scheme_index = 0;

		this.queue = [];
		this.line_index = 0;
		this.lines = {};
	}

	accessURL(code, function_of_data){
		var x = new XMLHttpRequest();
		var poem = this;
		x.open("GET", 'https://api.datamuse.com/words?' + code);
		x.onreadystatechange = function(){
			if(x.readyState == 4 && x.status == 200){
	 			var data = JSON.parse(x.responseText);
				setTimeout(function(){function_of_data(poem, data)}, 1);
			}
		};
		x.send(null);
	}

	getRandomOrder(length){
		var order = [];
		for(var i = 0; i < length; i++){
			order.push(i);
		}
		var current_index = order.length, temp_value, random_index;
		while (current_index != 0) {
			random_index = Math.floor(Math.random() * current_index);
			current_index -= 1;
			temp_value = order[current_index];
			order[current_index] = order[random_index];
			order[random_index] = temp_value;
		}
		return order;
	}

	generateSeed(){
		this.accessURL('sp=' + this.characters.charAt(Math.floor(Math.random() * this.characters.length)) + '*&md=r', function(poem, data){
			var seed = null;
			var order = poem.getRandomOrder(data.length);
			for(var i = 0; i < order.length; i++){
				if(poem.isIambicEnd(data[order[i]].tags[0])){
					seed = data[order[i]].word;
					i = order.length
				}
			}
			if(seed == null){
				poem.generateSeed();
			}
			else{
				poem.findRhymes(seed);
			}
		});
	}

	findRhymes(seed){
		this.accessURL('rel_rhy=' + seed + '&md=rfs', function(poem, data){
			for(var i = 0; i < data.length; i++){
				if(poem.invalidRhyme(data[i])){
					data.splice(i, 1);
					i--;
				}
			}
			if(data.length > 10){
				for(var i = 0; i < 2; i++){
					var index = poem.chooseWordIndex(data);
					poem.rhymes[poem.scheme[poem.scheme_index][i]] = {"word": data[index].word, "syllables": data[index].numSyllables};
					data.splice(index, 1);
				}
				poem.scheme_index++;
			}
			if(poem.scheme_index < poem.scheme.length){
				poem.generateSeed();
			}
			else{
				poem.generatePoem();
			}
		});
	}

	invalidRhyme(d){
		if(d.score === undefined || d.score < 20 || !this.isIambicEnd(d.tags[0])){
			return true;
		}
		return parseFloat(d.tags[1].replace("f:", "")) < .5;
	}

	generateRhyme(){
		this.rhymes = {};
		this.scheme_index = 0;
		this.generateSeed();
	}

	
	chooseWordIndex(data){
		var sum = 0;
		for(var i = 0; i < data.length; i++){
			sum += data[i].score;
		}
		var num = Math.random() * sum;
		sum = 0;
		for(var i = 0; i < data.length; i++){
			sum += data[i].score;
			if(sum > num){
				return i;
			}
		}
		return null;
	}




	generatePoem(){
		this.queue = [];
		this.lines = {};
		this.line_index = 0;
		this.generateLine();
	}

	generateLine(){
		this.word_dict = {};
		this.queue.push({"word": this.rhymes[this.line_index].word, "syllables": this.rhymes[this.line_index].syllables, "code": "rc"});
		if(this.line_index != 0){
			this.queue.push({"word": this.rhymes[this.line_index - 1].word, "syllables": 0, "code": "lc"});
		}
		for(var i = 0; i < this.queue.length; i++){
			this.word_dict[this.queue[i].word] = {"syllables":this.queue[i].syllables};
		}
		this.buildTree();
	}

	buildTree(){
		if(this.queue.length == 0){
			console.log("empty queue");
			return;
		}
		this.accessURL(this.queue[0].code + "=" + this.queue[0].word + "&md=rfs", function(poem, data){
			var word = poem.queue[0].word;
			var syllables = poem.queue[0].syllables;
			var code = poem.queue[0].code;
			poem.queue.shift();
			var sum_syllables;
			var new_counter = 0;
			var dict_temp;
			while(data.length > 0 && new_counter < 2){
				var index = poem.chooseWordIndex(data);
				var d = data[index];
				data.splice(index, 1);
				if(poem.validMeter(d, syllables, poem.opposite_code[code])){
					new_counter++;
					sum_syllables = syllables + d.numSyllables;
				}
				if(poem.updateWordDict(d.word, d.numSyllables, sum_syllables, word, poem.opposite_code[code])){
					if(code in poem.word_dict[d.word] && 10 + d.numSyllables - sum_syllables in poem.word_dict[d.word][code]){
						poem.finalizeLine(d.word, d.numSyllables, sum_syllables, poem.opposite_code[code]);
						new_counter = 3;
					}
					else if(poem.line_index == 0 && 10 + d.numSyllables - sum_syllables == 0){
						poem.finalizeLine(d.word, d.numSyllables, sum_syllables, poem.opposite_code[code]);
						new_counter = 3;
					}
					else if(sum_syllables < 10){//SHOULD THERE BE A - 2 AFTeR THE 10??????????????????????????????????????????????????????????????????????????????????
						queue.push({"word": d.word, "syllables": sum_syllables, "code": code});
					}
				}
			}
			if(new_counter != 3){
				poem.buildTree();
			}
		});
	}

	updateWordDict(new_word, new_syllables, sum_syllables, word, code){
		if(new_word in this.word_dict){
			if(code in this.word_dict[new_word]){
				if(!(sum_syllables in this.word_dict[new_word][code])){
					this.word_dict[new_word][code][sum_syllables] = word;
					return true;
				}
				else{
					return false;
				}
			}
			else{
				this.word_dict[new_word][code] = {};
				this.word_dict[new_word][code][sum_syllables] = word;
				return true;
			}
		}
		else{
			this.word_dict[new_word] = {"syllables":new_syllables};
			this.word_dict[new_word][code] = {};
			this.word_dict[new_word][code][sum_syllables] = word;
			return true;
		}
	}

	getStress(d){
		d = d.replace("pron:", "").replace(/[^01]/g, "");
		return d.split("");
	}
		
	isIambicEnd(d){
		d = d.replace("pron:", "").replace(/[^01]/g, "");
		d = d.split("");
		for(var i = 0; i < d.length; i++){
			if(d[i] === "1"){
				return (d.length - i - 1) % 2 == 0;
			}
		}
	}

	isIambicStart(d){
		d = d.replace("pron:", "").replace(/[^01]/g, "");
		d = d.split("");
		for(var i = 0; i < d.length; i++){
			if(d[i] === "1"){
				return i % 2 != 0;
			}
		}
	}

	validMeter(data, syllables, code){
		for(var i = 0; i < 10; i++){
			if(data.word.includes(this.numbers[i])){
				return false;
			}
		}
		if(data.word.length == 1 && data.word != "a" && data.word != "i"){
			return false;
		}
		else if(parseFloat(data.tags[1].replace("f:", "")) < .5){
			return false;
		}
		else if(data.numSyllables == 1){
			return true;
		}
		else if(code == "lc"){
			return this.isIambicEnd(data.tags[0]) == (syllables % 2 == 0)
		}
		else{
			return this.isIambicStart(data.tags[0]) == (syllables % 2 == 0)
		}
	}

	finalizeLine(word_start, syllable_start, syllable_sum, code){
		var line = [word_start];
		var syllable_values = [this.word_dict[word_start].syllables];
		this.addToLine(line, syllable_values, word_start, syllable_sum, code);
		this.addToLine(line, syllable_values, word_start, 10 + syllable_start - syllable_sum, this.opposite_code[code]);
		/*var score = 0;
		var consecutive = 0;
		var sum = 0;
		for(var i = 0; i < line.length; i++){
			sum += syllable_values[i];
			if(syllable_values[i] == 1){
				if(sum % 2 == 0){
					score += 2;
				}
				consecutive++;
			}
			else{
				consecutive = 0;
			}
			if(consecutive > 2){
				score += consecutive;
			}
			if(syllable_values[i] > 4){
				score += syllable_values[i];
			}
		}*/
		this.lines[this.line_index] = line;
		this.queue = [];
		this.line_index++;
		if(this.line_index == 14){
			button.disabled = false;
		}
		else{
			display.innerText += line.join(" ") + "\n";
			this.generateLine();
		}
	}

	addToLine(line, syllable_values, word_dict, word, syllable, code){
		var temp;
		while(syllable != this.word_dict[word].syllables){
			temp = this.word_dict[word][code][syllable];
			syllable -= this.word_dict[word].syllables;
			word = temp;
			if(code == "lc"){
				line.push(word);
				syllable_values.push(word_dict[word].syllables);
			}
			else{
				line.unshift(word);
				syllable_values.unshift(word_dict[word].syllables);
			}
		}
		if(code == "rc"){
			word = word_dict[word][code][word_dict[word].syllables];
			line.unshift(word);
		}
	}
}

function run(){
	document.getElementById("startButton").disabled = true;
	display.innerText = "";
	setTimeout(function(){
		var poem = new Poem();
		poem.generateRhyme();
	}, 3);
}