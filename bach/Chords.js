class ChordFunctions {
	constructor(key_generator){
		this.key_generator = key_generator;
		// 0 is I, 1 is V or vii, 2 ii, 3 IV, 4 vi, 5 iii
		//{2: 0.65, 4: 0.35}
		// 3-6-4/2-5-1
		
		this.cadence_lengths = {"pac": 3, "pac/iac": 3, "hc": 2, "dc": 3, "pc": 2, "pacm": 3};
		this.cadences = {"pac": [5, 1], "pac/iac": [1], "hc": [5], "dc": [5, 6], "pc": [4, 1], "pacm": [5, 1]};
		
		this.num_to_string = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII"};
		this.inversion_to_string = {0: ", root position", 1: ", 1st inversion", 2: ", 2nd inversion"};
		
		this.phrase_attempts = 5;
		this.prev_mods = {};
	}
	chooseSeven(){
		return (Math.random() < 0.7);
	}
	generateNumString(num, key, seven, inversion){
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
		if(seven){
			string += "7";
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
		return this.generateNumString(nums[0], keys[0], false, null) + " -> " + this.generateNumString(nums[1], keys[1], false, null) + " (pivot)";
	}
	generateChord(num, key, mod, seven, inversion){
		return new Chord(num, key, this.key_generator.qualities[key.modality][num], mod, seven, inversion);
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
	getModOrder(mods, phrase_length){
		if(mods[mods.length - 1].additions_valid && mods.length > 2 && mods[1].additions_valid && this.getLength(mods.slice(mods.length - 1)) > 2){
			mods[mods.length - 1].additions_valid = false;
		}
		var order = [];
		for(var i = 1; i < mods.length; i++){
			if(mods[i].additions_valid){
				order.push(i);
			}
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
	connectNums(mods, index, is_last){
		var nums = [];
		
		var prev_class = this.numToClass(mods[index - 1].nums[1]);
		var mod_class = this.numToClass(mods[index].nums[0]);
		var end_class;
		if(mod_class == 0 || mods[index].nums[0] == 6){
			mod_class = 0;
			end_class = 1;
		}
		else if(mods[index].type == "cadence" && !is_last && mods.length > 2 && prev_class > mod_class){
			end_class = mod_class + 1;
			mods[index].additions_valid = false;
		}
		else{
			end_class = 0;
		}
		if(prev_class == 0 && mod_class == 0){
			prev_class = 2;
		}
		
		var omit_class;
		if(Math.random < 0.1){
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
		mods[index].connect_nums = nums;
	}
	finalizeModulations(mods, phrase_length){
		var spaces = phrase_length - this.getLength(mods);
		if(spaces == 1){
			return false;
		}
		var mod_order = this.getModOrder(mods, phrase_length);
		var mod_index = 0;
		var freqs = {2: 1, 3: 50, 4: 40, 5: 6, 6: 1};
		
		var prev_length = null;
		while(spaces > 4){
			var choices = [];
			for(var i = Math.min(6, spaces); i >= 2; i--){
				if(i + 1 != spaces && !(prev_length == 2 && i == 2)){
					choices.push(i);
				}
			}
			if(choices.length == 0){
				return false;
			}
			prev_length = chooseIntFromFreqs(freqs, choices);
			mods[mod_order[mod_index]].additions.push(prev_length);
			mod_index++;
			if(mod_index == mod_order.length){
				mod_index = 0;
			}
			spaces -= prev_length;
		}
		if(spaces != 0){
			mods[mod_order[mod_index]].additions.push(spaces);
		}
		return true;
	}
	addToChords(mods, chords, chord_index, phrase_length, prev_key, cad){
		var start_chord_index = chord_index;
		var new_key = false;
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
				var seven = false;
				if(mods[i].connect_nums[j] == 5 && new_key && (start_chord_index + phrase_length > chord_index + 3 || cad == "hc")){
					seven = this.chooseSeven();
					new_key = false;
				}
				chords[chord_index] = this.generateChord(mods[i].connect_nums[j], prev_key, null, seven, null);
				this.chord_strings[chord_index] = this.generateNumString(mods[i].connect_nums[j], prev_key, seven, null);
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
						chords[chord_index] = this.generateChord(1, this.key_generator.getKey(prev_key.pitch, "major"), null, false, 0);
						this.chord_strings[chord_index] = this.generateNumString(1, this.key_generator.getKey(prev_key.pitch, "major"), false, 0);
					}
					else{
						var seven = false;
						if(j == mods[i].nums.length - 2 && mods[i].nums[j] == 5){
							seven = this.chooseSeven();
						}
						chords[chord_index] = this.generateChord(mods[i].nums[j], prev_key, null, seven, inversion);
						this.chord_strings[chord_index] = this.generateNumString(mods[i].nums[j], prev_key, seven, inversion);
					}
					chord_index++;
				}
			}
			else{
				var seven = false;
				if(mods[i].type == "pivot"){
					if(mods[i].nums[0] == null){
						this.chord_strings[chord_index] = this.generateNumString(mods[i].nums[1], mods[i].keys[1], false, null) + " (starting modulation)";
					}
					else{
						this.chord_strings[chord_index] = this.generatePivotNumString(mods[i].nums, mods[i].keys);
					}
					chords[chord_index] = this.generateChord(mods[i].nums[1], mods[i].keys[1], mods[i].type, false, null);
					chord_index++;
				}
				else{
					for(var j = 0; j < 2; j++){
						var mod_string;
						if(j == 0){
							mod_string = null;
						}
						else{
							mod_string = mods[i].type;
							if(mods[i].nums[j] == 5){
								seven = this.chooseSeven();
							}
						}
						chords[chord_index] = this.generateChord(mods[i].nums[j], mods[i].keys[j], mod_string, seven, null);
						this.chord_strings[chord_index] = this.generateNumString(mods[i].nums[j], mods[i].keys[j], seven, null) + " (mediant)";
						chord_index++;
					}
				}
				if(!mods[i].keys[1].equals(prev_key) && !seven){
					new_key = true;
				}
				prev_key = mods[i].keys[1];
			}
		}
	}
	addToPrevMods(mods, index){
		this.prev_mods[index] = [];
		for(var i = 1; i < mods.length - 1; i++){
			this.prev_mods[index].push(mods[i].copy());
		}
	}
	generateCadence(cadence, length, is_last){
		var nums = [];
		nums.push(...this.cadences[cadence]);
		var next_class = this.numToClass(nums[0]);
		if(length > this.cadence_lengths[cadence] && nums[0] == 5 && cadence != "hc"){
			var prob = 0.6;
			if(is_last){
				prob = 0.98;
			}
			else if(cadence == "pac" || cadence == "pacm"){
				prob = 0.8;
			}
			if(Math.random() < prob){
				nums.unshift(1);
			}
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
		var is_last = (index == phrase_data.length - 1);
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
		
		var num_mods;
		if(is_last){
			if(prev_key.equals(key)){
				num_mods = 0;
			}
			else{
				num_mods = 1;
			}
		}
		else if(index == 0){
			num_mods = 0;
		}
		else{
			var choices = [];
			var spaces = phrase_data[index].length - phrase_data[index].cadence_length - 1;
			for(var i = Math.floor(spaces / 2); i < 4; i++){
				if(i < spaces){
					choices.push(i);
				}
			}
			num_mods = chooseIntFromFreqs({0: 1, 1: 10, 2: 49, 3: 40}, choices);
		}
		
		var counter = 0;
		do{
			var mods = null;
			var prev_mods = [];
			if(index > 0){
				prev_mods = this.prev_mods[index - 1];
			}
			var temp_counter = 0;
			while(mods == null){
				mods = this.generateModulations(key, prev_key, prev_mods, prev_num, num_mods, is_last);
				temp_counter++;
				if(temp_counter > 10){
					return false;
				}
			}
			mods.push(this.generateCadence(phrase_data[index].cadence, phrase_data[index].cadence_length, is_last));
			mods[mods.length - 1].additions_valid = true;
		
			for(var i = 1; i < mods.length; i++){
				this.connectNums(mods, i, is_last);
			}

			var valid = false;
			if(is_last && !mods[mods.length - 2].keys[1].equals(key)){
				valid = false;
			}
			else if(this.getLength(mods) == phrase_data[index].length){
				valid = true;
			}
			else if(this.getLength(mods) < phrase_data[index].length && this.finalizeModulations(mods, phrase_data[index].length)){
				valid = true;
			}
			if(valid){
				this.addToChords(mods, chords, phrase_data[index].chord_index, phrase_data[index].length, prev_key, phrase_data[index].cadence);
				this.addToPrevMods(mods, index);
				for(var i = 0; i < this.phrase_attempts; i++){
					if(this.generatePhrase(key, chords, phrase_data, index + 1)){
						console.log("successfully generated phrase at index " + index + " with " + (phrase_data[index].length - phrase_data[index].cadence_length - 1) + " spaces and " + num_mods + " additional mods after " + counter + " attempts");
						return true;
					}
				}
				return false;
			}
			counter++;
			if(counter == 6 && index < phrase_data.length - 1 && num_mods > 1){
				num_mods--;
			}
		} while(counter < 11);
		console.log("failed to generate phrase at index " + index + " with " + (phrase_data[index].length - phrase_data[index].cadence_length - 1) + " spaces and " + num_mods + " additional mods");
		return false;
	}
	generateModulations(key, prev_key, prev_mods, prev_num, num_mods, is_last){
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
		var type = null;
		var done = false;
		var mods = [];
		if(!key.equals(prev_key)){
			var order = ["mediant", "pivot"];
			if(Math.random() < 0.65){
				order.unshift(order.pop());
			}
			for(var i = 0; i < 2; i++){
				var mod = key.getStartModulation(prev_key, prev_num, first_num, order[i]);
				if(mod != null){
					mods.unshift(new Modulation("pivot", [null, mod.nums[1]], [null, mod.keys[1]]));
					type = mod.type;
					prev_key = mod.keys[1];
					i = 2;
					done = true;
				}
			}
		}
		if(!done){
			mods.unshift(new Modulation("pivot", [null, first_num], [null, prev_key]));
		}
		if(!prev_key.equals(key) && num_mods == 0){
			num_mods = 1;
		}
		var first_mod_invalid = false;
		if(type == "mediant" && !prev_key.equals(key) && num_mods > 0){
			first_mod_invalid = true;
			if(num_mods == 1){
				num_mods = 2;
			}
		}
		for(var i = 0; i < num_mods; i++){
			if(i == num_mods - 1){
				if(is_last){
					type = "pivot";
				}
				else{
					type = choose({"mediant": 10, "pivot": 90});
				}
			}
			else if(type == "mediant"){
				type = "pivot";
			}
			else{
				type = choose({"mediant": 35, "pivot": 65});
			}
			var mod = key.getModulation(prev_key, type, prev_mods, (is_last && i == num_mods - 1));
			if(mod == null){
				return null;
			}
			mods.push(mod);
			prev_key = mods[mods.length - 1].keys[1];
		}
		mods[0].additions_valid = false;
		var start = 1;
		if(first_mod_invalid){
			start = 2;
			mods[1].additions_valid = false;
		}
		for(var i = start; i < mods.length; i++){
			mods[i].additions_valid = !is_last;
		}
		return mods;
	}
	generatePhraseData(key, phrase_lengths){
		var phrase_data = [];
		var sum = 0;
		var dc_valid = true;
		var pc_valid = true;
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
				if(!pc_valid){
					probs.pc = 0;
				}
				if(!dc_valid){
					probs.dc = 0;
				}
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
			if(cadence == "pc"){
				pc_valid = false;
			}
			else if(cadence == "dc"){
				dc_valid = false;
			}
			else{
				dc_valid = true;
			}
			
			var cadence_length = this.cadence_lengths[cadence];
			// 4 beat cadence includes a 64 tonic
			if(cadence != "pc"){
				var addition = chooseInt({0: 80, 1: 20});
				if(i == phrase_lengths.length - 1 && addition == 0){
					addition += 1;
				}
				cadence_length += addition;
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
						console.log("  NEW PHRASE: index ", phrase_index);
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
