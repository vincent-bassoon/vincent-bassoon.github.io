class ChordFunctions {
	constructor(key_generator){
		this.key_generator = key_generator;
		// 0 is I, 1 is V or vii, 2 ii, 3 IV, 4 vi, 5 iii
		//{2: 0.65, 4: 0.35}
		// 3-6-4/2-5-1
		
		this.cadence_lengths = {"pac": 3, "pac/iac": 2, "hc": 2, "dc": 3, "pc": 2, "pacm": 3};
		this.cadences = {"pac": [5, 1], "pac/iac": [1], "hc": [5], "dc": [5, 6], "pc": [4, 1], "pacm": [5, 1]};
		
		this.num_to_string = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII"};
		this.inversion_to_string = {0: ", root position", 1: ", 1st inversion", 2: ", 2nd inversion"};
		
		this.phrase_attempts = 5;
	}
	generateNumString(num, key, inversion){
		var string = this.num_to_string[num];
		switch(this.key_generator.qualities[key.modality][num]){
			case "minor":
				string = string.toLowerCase();
				break;
			case "aug":
				string += "+";
				break;
			case "dim":
				string = string.toLowerCase() + "°";
				break;
		}
		if(key.pitch != this.key.pitch){
			string += " / ";
			var temp = this.num_to_string[this.key.valueToNum(key.pitch)];
			if(key.modality == "minor"){
				temp = temp.toLowerCase();
			}
			string += temp;
		}
		if(inversion != null){
			string += this.inversion_to_string[inversion];
		}
		return string;
	}
	generatePivotNumString(nums, keys){
		return this.generateNumString(nums[0], keys[0], null) + " -> " + this.generateNumString(nums[1], keys[1], null) + " (pivot)";
	}
	generateChord(num, key, inversion){
		return new Chord(num, key, this.key_generator.qualities[key.modality][num], inversion);
	}
	numToClass(num){
		switch(num){
			case 1:
				return 0;
			case 2:
				return 2;
			case 3:
				return 5;
			case 4:
				return 3;
			case 5:
				return 1;
			case 6:
				return 4;
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
				return 2;
			case 3:
				return 4;
			case 4:
				return 6;
			case 5:
				return 3;
		}
	}
	getModOrder(mods){
		var order = [];
		for(var i = 1; i < mods.length; i++){
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
	generateSubPhraseNums(length){
		var nums = [];
		if(length == 6){
			for(var i = 0; i < length; i++){
				nums.unshift(this.classToNum(i));
			}
		}
		else if(length <= 2){
			for(var i = 0; i < length; i++){
				nums.unshift(this.classToNum(i));
			}
		}
		else{
			var choices = [];
			for(var i = 2; i <= 3; i++){
				if(i < length){
					choices.push(i);
				}
			}
			if(length >= 4){
				choices.push(length);
			}
			// choices should be a subset of [2, 3, (4 or 5)]
			
			var freqs = {2: 20, 3: 30, 4: 30, 5: 200};
			var removed = null;
			if(choices.length > 0){
				removed = chooseIntFromFreqs(freqs, choices);
			}
			for(var i = 0; i < length + 1; i++){
				if(i != removed){
					nums.unshift(this.classToNum(i));
				}
			}
		}
		return nums;
	}
	connectNums(prev_num, mod_num){
		var nums = [];
		
		var prev_class = this.numToClass(prev_num);
		var mod_class = this.numToClass(mod_num);
		var end_class;
		if(mod_class == 0 || mod_num == 6){
			mod_class = 0;
			end_class = 1;
		}
		else{
			end_class = 0;
		}
		if(prev_class == 0 && mod_class == 0){
			prev_class = 1;
		}
		
		var omit_class;
		if(chooseInt({0: 90, 1: 10}) == 1){
			omit_class = null;
		}
		else if(prev_class == 3){
			omit_class = 2;
		}
		else{
			omit_class = chooseInt({2: 40, 3: 60});
		}
		
		for(var i = prev_class - 1; i >= end_class; i--){
			if(i != omit_class){
				nums.push(this.classToNum(i));
			}
		}
		return nums;
	}
	finalizeModulations(mods, phrase_length){
		var spaces = phrase_length - this.getLength(mods);
		if(spaces == 1){
			return false;
		}
		var mod_order = this.getModOrder(mods);
		var mod_index = 0;
		var freqs = {2: 3, 3: 50, 4: 40, 5: 6, 6: 1};
		
		while(spaces > 4){
			var choices = [];
			for(var i = Math.min(6, spaces); i >= 2; i--){
				if(i + 1 != spaces){
					choices.push(i);
				}
			}
			var length_temp = chooseIntFromFreqs(freqs, choices);
			mods[mod_order[mod_index]].additions.push(length_temp);
			mod_index++;
			if(mod_index == mod_order.length){
				mod_index = 0;
			}
			spaces -= length_temp;
		}
		if(spaces != 0){
			mods[mod_order[mod_index]].additions.push(spaces);
		}
		return true;
	}
	addToChords(mods, chords, chord_index, prev_key, cad){
		for(var i = 0; i < mods.length; i++){
			var additions = [];
			for(var j = 0; j < mods[i].additions.length; j++){
				additions.push(...this.generateSubPhraseNums(mods[i].additions[j]));
			}
			if(additions.length > 0){
				if(mods[i].nums[0] == 6 || mods[i].nums[0] == 1){
					mods[i].connect_nums.push(additions.pop());
				}
				mods[i].connect_nums.push(...additions);
			}
			for(var j = 0; j < mods[i].connect_nums.length; j++){
				chords[chord_index] = this.generateChord(mods[i].connect_nums[j], prev_key, null);
				this.chord_strings[chord_index] = this.generateNumString(mods[i].connect_nums[j], prev_key, null);
				chord_index++;
			}
			if(mods[i].type == "cadence"){
				for(var j = 0; j < mods[i].nums.length; j++){
					var inversion = null;
					if(j + this.cadences[cad].length >= mods[i].nums.length){
						inversion = 0;
					}
					else if(mods[i].nums[j] == 1){
						inversion = 2;
					}
					
					if(cad == "pacm" && j == mods[i].nums.length - 1){
						chords[chord_index] = this.generateChord(1, this.key_generator.getKey(prev_key.pitch, "major"), 0);
						this.chord_strings[chord_index] = this.generateNumString(1, this.key_generator.getKey(prev_key.pitch, "major"), 0);
					}
					else{
						chords[chord_index] = this.generateChord(mods[i].nums[j], prev_key, inversion);
						this.chord_strings[chord_index] = this.generateNumString(mods[i].nums[j], prev_key, inversion);
					}
					chord_index++;
				}
			}
			else{
				var start = 0;
				if(mods[i].type == "pivot"){
					start = 1;
					if(mods[i].nums[0] == null){
						this.chord_strings[chord_index] = this.generateNumString(mods[i].nums[1], mods[i].keys[1], null) + " pivot";
					}
					else{
						this.chord_strings[chord_index] = this.generatePivotNumString(mods[i].nums, mods[i].keys);
					}
				}
				for(var j = start; j < 2; j++){
					chords[chord_index] = this.generateChord(mods[i].nums[j], mods[i].keys[j], null);
					if(mods[i].type != "pivot"){
						this.chord_strings[chord_index] = this.generateNumString(mods[i].nums[j], mods[i].keys[j], null);
					}
					chord_index++;
				}
				prev_key = mods[i].keys[1];
			}
		}
	}
	generateCadence(cadence, length){
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
		return new Modulation("cadence", nums, null);
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
			for(var j = 0; j < mods[i].additions.length; j++){
				sum += mods[i].additions[j];
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
		var num_mods;
		if(index == phrase_data.length - 1){
			if(prev_key.equals(key)){
				num_mods = 0;
			}
			else{
				min_modulations = 1;
				num_mods = 1;
			}
		}
		else if(index == 0){
			num_mods = chooseInt({0: 70, 1: 20, 2: 10});
		}
		else{
			num_mods = chooseInt({0: 40, 1: 40, 2: 15, 3: 5});
		}
		
		var mods = null;
		var counter = 0;
		while(mods == null){
			mods = this.generateModulations(key, prev_key, prev_num, num_mods, index == phrase_data.length - 1);
			counter++;
			if(counter > 10){
				return false;
			}
		}
		mods.push(this.generateCadence(phrase_data[index].cadence, phrase_data[index].cadence_length));
		min_modulations += 2;
		//one for cadence, one for first modulation
		
		for(var i = 1; i < mods.length; i++){
			mods[i].connect_nums = this.connectNums(mods[i - 1].nums[1], mods[i].nums[0]);
		}
		
		var valid = (this.getLength(mods) == phrase_data[index].length);
		if(!valid){
			valid = (this.getLength(mods) < phrase_data[index].length) && this.finalizeModulations(mods, phrase_data[index].length);
		}
		while(mods.length > min_modulations && !valid){
			mods.splice(mods.length - 2, 1);
			mods[mods.length - 1].connect_nums = this.connectNums(mods[mods.length - 2].nums[1], mods[mods.length - 1].nums[0]);
			if(this.getLength(mods) == phrase_data[index].length){
				valid = true;
			}
			else if(this.getLength(mods) < phrase_data[index].length && !(index == phrase_data.length - 1 && !mods[mods.length - 2].keys[1].equals(key))){
				if(this.finalizeModulations(mods, phrase_data[index].length)){
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
		console.log("failed to generate phrase at index " + index + " with length " + phrase_data[index].length + " and num_mods " + num_mods);
		return false;
	}
	generateModulations(key, prev_key, prev_num, num_mods, is_last){
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
		var first_num = this.classToNum(chooseInt(probs) - 1);
		if(prev_num == null && first_num == 7){
			first_num = 5;
		}
		var done = false;
		var mods = [];
		if(!key.equals(prev_key)){
			var order = ["mediant", "pivot"];
			if(chooseInt({0: 35, 1: 65}) == 1){
				order.unshift(order.pop());
			}
			for(var i = 0; i < 2; i++){
				var mod = key.getStartModulation(prev_key, prev_num, first_num, order[i]);
				if(mod != null){
					mods.unshift(new Modulation("pivot", [null, mod.nums[1]], [null, mod.keys[1]]));
					prev_key = mod.keys[1];
					i = 2;
					done = true;
				}
			}
		}
		if(!done){
			mods.unshift(new Modulation("pivot", [null, first_num], [null, prev_key]));
		}
		for(var i = 0; i < num_mods; i++){
			var mod = key.getModulation(prev_key, choose({"mediant": 35, "pivot": 65}), (is_last && i == num_mods - 1));
			if(mod == null){
				return null;
			}
			mods.push(mod);
			prev_key = mods[i].keys[1];
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
		this.key = key;
		this.chord_strings = [];
		var phrase_data = this.generatePhraseData(key, phrase_lengths);
		var chords = [];
		for(var i = 0; i < this.phrase_attempts; i++){
			if(this.generatePhrase(key, chords, phrase_data, 0)){
				var phrase_index = 0;
				for(var j = 0; j < this.chord_strings.length; j++){
					if(phrase_index < phrase_data.length && j == phrase_data[phrase_index].chord_index){
						console.log("New phrase:");
						phrase_index++;
					}
					var num = "" + j;
					if(num.length == 1){
						num = "0" + num;
					}
					console.log(num + ": " + this.chord_strings[j]);
				}
				return chords;
			}
		}
		console.log("FAILED TO GENERATE CHORDS");
		return null;
	}
}
