class ChordFunctions {
	constructor(key_generator){
		this.key_generator = key_generator;
		// 0 is I, 1 is V or vii, 2 ii, 3 IV, 4 vi, 5 iii
		//{2: 0.65, 4: 0.35}
		// 3-6-4/2-5-1
		
		this.cadence_lengths = {"pac": 3, "pac/iac": 2, "hc": 2, "dc": 3, "pc": 2, "pacm": 3};
		this.cadences = {"pac": [5, 1], "pac/iac": [1], "hc": [5], "dc": [5, 6], "pc": [4, 1], "pacm": [5, 1]};
		
		this.addition_freqs = {1: 5, 2: 15, 3: 46, 4: 37, 5: 6, 6: 1};
		this.class_chances = {1: 1, 2: 0.6, 3: 0.2, 4: 0.02};
		
		this.phrase_attempts = 5;
	}
	generateChord(roman_num, key, inversion){
		return new Chord(roman_num, key, this.key_generator.qualities[key.modality][roman_num], inversion);
	}
	numToClass(num){
		switch(num){
			case 1:
				return 0;
			case 2:
				return 2;
			case 3:
				return 4;
			case 4:
				return 2;
			case 5:
				return 1;
			case 6:
				return 3;
			case 7:
				return 1;
		}
	}
	classToNum(chord_class){
		switch(chord_class){
			case 0:
				return 1;
			case 1:
				return chooseInt({5: 90, 7: 10});
			case 2:
				return chooseInt({4: 35, 2: 65});
			case 3:
				return 6;
			case 4:
				return 3;
		}
	}
	connectNums(prev_num, mod_num, additions){
		console.log("trying to connect nums");
		var nums = [];
		
		var prev_class = this.numToClass(mod_num);
		var mod_class;
		if(mod_num == 6 && prev_class > 0){
			mod_class = 0;
		}
		else{
			mod_class = this.numToClass(mod_num);
		}
		var end_class;
		if(mod_class >= prev_class){
			end_class = 0;
		}
		else{
			end_class = mod_class + 1;
			if(additions != 0){
				return null;
			}
		}
		for(var i = prev_class - 1; i >= end_class; i--){
			nums.push(this.classToNum(i));
		}
		
		var extra_nums = [];
		if(additions > 0 && mod_num == 2 && chooseInt({0: 35, 1: 65}) == 0){
			extra_nums.push(4);
			additions--;
		}
		while(additions > 0 && mod_class < 3 && Math.random() < this.class_chances[mod_class + 1]){
			extra_nums.unshift(this.classToNum(mod_class + 1));
			mod_class++;
			additions--;
		}
		if(additions == 1){
			if(extra_nums.length > 0){
				extra_nums.shift();
				additions++;
			}
			else{
				return null;
			}
		}
		if(additions > 0){
			for(var i = 0; i < additions; i++){
				extra_nums.unshift(this.classToNum(i));
				if(extra_nums[0] == 2 && i < additions - 1 && chooseInt({0: 35, 1: 65}) == 0){
					extra_nums.unshift(4);
					additions--;
				}
			}
		}
		return nums;
	}
	finalizeModulations(mods, mod_index, phrase_length){
		console.log("finalizing modulations at mod index ", mod_index);
		var spaces = phrase_length - this.getLength(mods);
		if(mod_index == mods.length || spaces == 0){
			return true;
		}
		var choices = [];
		if(mod_index == mods.length - 1){
			choices.push(spaces);
		}
		else{
			for(var j = 1; j <= 6; j++){
				if(j <= spaces){
					choices.push(j);
				}
			}
		}
		while(choices.length > 0){
			var nums_temp = this.connectNums(mods[mod_index - 1].nums[1], mods[mod_index].nums[0], chooseIntFromFreqsRemove(this.addition_freqs, choices));
			if(nums_temp != null){
				mods[mod_index].connect_nums = nums_temp;
				if(this.finalizeModulations(mods, mod_index + 1, phrase_length)){
					return true;
				}
			}
		}
		return false;
	}
	addToChords(mods, chords, chord_index, prev_key, cad){
		console.log("adding to chords");
		for(var i = 0; i < mods.length; i++){
			for(var j = 0; j < mods[i].connect_nums.length; j++){
				chords[chord_index] = this.generateChord(mods[i].connect_nums[j], prev_key, null);
				chord_index++;
			}
			if(mods[i].type == "cadence"){
				for(var j = 0; j < mods[i].nums.length; j++){
					var inversion = null;
					if(j + this.cadences[cad].length >= mods[i].nums.length){
						inversion = 1;
					}
					else if(mods[i].nums[j] == 1){
						inversion = 2;
					}
					
					if(cad == "pacm" && j == mods[i].nums.length - 1){
						chords[chord_index] = this.generateChord(1, this.key_generator.getKey(prev_key.pitch, "major"), 0);
					}
					else{
						chords[chord_index] = this.generateChord(mods[i].nums[j], prev_key, inversion);
					}
					chord_index++;
				}
			}
			else{
				var start = 0;
				if(mods[i].type == "pivot"){
					start = 1;
				}
				for(var j = start; j < 2; j++){
					chords[chord_index] = this.generateChord(mods[i].nums[j], mods[i].keys[j], null);
					chord_index++;
				}
				prev_key = mods[i].keys[1];
			}
		}
	}
	generateCadence(cadence, length){
		console.log("generating cadence");
		var nums = [];
		nums.push(...this.cadences[cadence]);
		var next_class = this.numToClass(nums[0]);
		if(length == 4){
			nums.unshift(1);
		}
		for(var i = nums.length; i < length; i++){
			next_class++;
			nums.unshift(this.classToNum(next_class));
		}
		return {"type": "cadence", "nums": nums, "connect_nums": []};
	}
	getLength(mods){
		var sum = 0;
		for(var i = 0; i < mods.length; i++){
			sum += mods[i].connect_nums.length;
			if(mods[i].type == "pivot"){
				sum += 1;
			}
			else{
				sum += mods[i].nums.length;
			}
		}
		return sum;
	}
	generatePhrase(key, chords, phrase_data, index){
		if(index == phrase_data.length){
			return true;
		}
		
		var prev_num;
		var prev_key;
		if(index == 0){
			prev_num = null;
			prev_key = key;
		}
		else{
			var prev_chord = chords[phrase_data[index].chord_index - 1];
			prev_num = prev_chord.roman_num;
			prev_key = prev_chord.key;
		}
		
		var min_modulations = 0;
		var probs;
		if(index == phrase_data.length - 1){
			if(prev_key.equals(key)){
				probs = {0: 90, 2: 10};
			}
			else{
				min_modulations = 1;
				probs = {1: 90, 2: 10};
			}
		}
		else if(index == 0){
			probs = {0: 70, 1: 20, 2: 10};
		}
		else{
			probs = {0: 40, 1: 40, 2: 15, 3: 5};
		}
		
		var num_mods = chooseInt(probs);
		
		var mods = null;
		while(mods == null){
			mods = this.generateModulations(key, prev_key, num_mods, index == phrase_data.length - 1);
		}
		mods.push(this.generateCadence(phrase_data[index].cadence, phrase_data[index].cadence_length));
		min_modulations += 1;
		
		//!(prev_num != null && mods[0].nums[0] == prev_num && mods[0].type == "mediant")
		var probs;
		switch(prev_num){
			case 1:
				probs = {1: 60, 2: 40};
				break;
			case 5:
				probs = {1: 85, 2: 15};
				break;
			case 6:
				probs = {1: 90, 2: 10};
				break;
			default:
				probs = {1: 40, 2: 60};
		}
		mods.unshift({"connect_nums": [], "keys": [null, prev_key], "nums": [null, this.classToNum(chooseInt(probs) - 1)], "type": "pivot"});
		min_modulations += 1;
		
		for(var i = 1; i < mods.length; i++){
			mods[i].connect_nums = this.connectNums(mods[i - 1].nums[1], mods[i].nums[0], 0);
		}
		
		var valid = this.getLength(mods) == phrase_data[index].length;
		if(!valid){
			valid = this.getLength(mods) < phrase_data[index].length && this.finalizeModulations(mods, 1, phrase_data[index].length);
		}
		while(mods.length > min_modulations && !valid){
			mods.splice(mods.length - 2, 1);
			mods[mods.length - 1].connect_nums = this.connectNums(mods[mods.length - 2].nums[1], mods[mods.length - 1].nums[0], 0);
			if(this.getLength(mods) == phrase_data[index].length){
				valid = true;
			}
			else if(this.getLength(mods) < phrase_data[index].length && !(index == phrase_data.length - 1 && !mods[mods.length - 2].keys[1].equals(key))){
				if(this.finalizeModulations(mods, 1, phrase_data[index].length)){
					valid = true;
				}
			}
		}
		if(valid){
			this.addToChords(mods, chords, phrase_data[index].chord_index, prev_key, phrase_data[index].cadence);
			for(var i = 0; i < this.phrase_attempts; i++){
				if(this.generatePhrase(key, chords, phrase_data, index + 1)){
					return true;
				}
			}
			return false;
		}
		return false;
	}
	generateModulations(key, prev_key, num_mods, is_last){
		console.log("generating modulations");
		var mods = [];
		for(var i = 0; i < num_mods; i++){
			if(is_last && i == num_mods - 1){
				var type = choose({"mediant": 0, "pivot": 100});
				mods.push({"connect_nums": [], "keys": [prev_key, key], "nums": prev_key.getModulationNums(key, type), "type": type});
			}
			else{
				mods.push(key.getModulation(prev_key, choose({"mediant": 0, "pivot": 100})));
				prev_key = mods[i].keys[1];
			}
		}
		return mods;
	}
	generatePhraseData(key, phrase_lengths){
		var phrase_data = [];
		var sum = 0;
		for(var i = 0; i < phrase_lengths.length; i++){
			var cadence;
			if(i == phrase_lengths.length - 1){
				if(key.modality == "minor"){
					cadence = choose({"pac": 30, "pacm": 70});
				}
				else{
					cadence = "pac";
				}
			}
			else if(i == 0){
				cadence = choose({"pac": 39, "pac/iac": 37, "hc": 24});
			}
			else{
				var probs = {"pac": 37, "pac/iac": 34, "hc": 21, "dc": 7, "pc": 1};
				if(i == 0){
					cadence = chooseFromFreqs(probs, ["pac", "pac/iac", "hc"]);
				}
				else if(i + 1 == phrase_lengths.length - 1){
					cadence = chooseFromFreqs(probs, ["hc", "dc", "pc"]);
				}
				else{
					cadence = choose(probs);
				}
			}
			
			var cadence_length = this.cadence_lengths[cadence];
			// 4 beat cadence includes a 64 tonic
			if(cadence != "pac/iac" && cadence_length == 3 && chooseInt({0: 80, 1: 20}) == 0){
				cadence_length++;
			}
			
			phrase_data.push({"length": phrase_lengths[i], "chord_index": sum, "cadence": cadence, "cadence_length": cadence_length});
			sum += phrase_lengths[i];
		}
		return phrase_data;
	}
	generateChords(key, phrase_lengths){
		var phrase_data = this.generatePhraseData(key, phrase_lengths);
		var chords = [];
		for(var i = 0; i < this.phrase_attempts; i++){
			if(this.generatePhrase(key, chords, phrase_data, 0)){
				return chords;
			}
		}
		console.log("FAILED TO GENERATE CHORDS");
		return null;
	}
}
