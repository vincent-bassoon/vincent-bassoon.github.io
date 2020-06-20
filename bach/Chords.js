class ChordFunctions {
	constructor(key_generator){
		this.key_generator = key_generator;
		// 0 is I, 1 is V or vii, 2 ii, 3 IV, 4 vi, 5 iii
		//{2: 0.65, 4: 0.35}
		this.chord_to_class = {1: 0, 5: 1, 7: 1, 2: 2, 4: 3, 6: 4, 3: 5};
		this.class_to_chord = {0: 1, 2: 2, 3: 4, 4: 6, 5: 3};
		// 3-6-4/2-5-1
		
		this.cadence_lengths = {"pac": 3, "pac/iac": 3, "hc": 2, "dc": 3, "pc": 2, "pacm": 3};
		this.cadences = {"pac": [1, 5], "pac/iac": [1], "hc": [5], "dc": [6, 5], "pc": [1, 4], "pacm": [1, 5]};
		
	}
	generateChord(roman_num, key, inversion){
		return new Chord(roman_num, key, this.qualities[key.modality][roman_num], inversion);
	}
	getChordRomanNum(chord_class){
		if(chord_class == 1){
			return chooseInt({5: 0.95, 7: 0.05})
		}
		else{
			return this.class_to_chord[chord_class];
		}
	}
	generateRemainingChords(phrase_chords, num_chords, next_chord_roman_num, key){
		var chord_class = this.chord_to_class[next_chord_roman_num];
		if(5 - chord_class < num_chords){
			console.log("phrase length error: ", num_chords);
		}
		else if(num_chords == 0){
			return;
		}
		else if(5 - chord_class == num_chords){
			for(var i = 0; i < num_chords; i++){
				chord_class++
				var num = this.getChordRomanNum(chord_class);
				phrase_chords.unshift(this.generateChord(num, key, null));
			}
			return;
		}
		else{
			var choices = [];
			for(var i = 2; i <= 3; i++){
				if(i >= chord_class + 1 && i < chord_class + 1 + num_chords + 1){
					choices.push(i);
				}
			}
			if(chord_class + num_chords + 1 == 5){
				choices.push(5);
			}
			else if(chord_class + num_chords + 1 == 4){
				choices.push(4);
			}
			// choices should be a subset of [2, 3, (4 or 5)]
			
			var freqs = {2: 20, 3: 30, 4: 30, 5: 200};
			var removed = chooseIntFromFreqs(freqs, choices);
			for(var i = 0; i < num_chords + 1; i++){
				chord_class++
				if(chord_class != removed){
					var num = this.getChordRomanNum(chord_class);
					phrase_chords.unshift(this.generateChord(num, key, null));
				}
			}
			return;
		}
	}
	// returns chords of a phrase of specified length, first chord of phrase is at index 0
	generatePhraseChords(phrase_length, key){
		var phrase_chords = [];
		phrase_chords.unshift(this.generateChord(1, key, null));
		this.generateRemainingChords(phrase_chords, phrase_length - 1, 1, key);
		return phrase_chords;
	}
	// returns chords of the entire cadence phrase, first chord of phrase is at index 0
	generateCadenceChords(cad, cad_length, phrase_length, key){
		var cadence_chords = [];
		for(var i = 0; i < this.cadences[cad].length; i++){
			if(cad == "pacm" && i == 0){
				cadence_chords.unshift(this.generateChord(this.cadences[cad][i],
									  this.key_generator.getKey(key.pitch, "major"), 0));
			}
			else{
				cadence_chords.unshift(this.generateChord(this.cadences[cad][i], key, 0));
			}
		}
		if(cad_length == 4){
			cadence_chords.unshift(this.generateChord(1, key, 2));
		}
		var roman_num = this.cadences[cad][this.cadences[cad].length - 1];
		this.generateRemainingChords(cadence_chords, phrase_length - cadence_chords.length, roman_num, key);
		return cadence_chords;
	}
	generatePhrase(phrase_lengths, key, prev_chord, prev_key, index){
		var cadence;
		var start_key = prev_key;
		var end_key;
		
		if(index == phrase_lengths.length - 1){
			end_key = key;
			if(key.modality == "minor"){
				cadence = choose({"pac": 0.3, "pacm": 0.7});
			}
			else{
				cadence = "pac";
			}
		}
		else{
			cadence = choose({"pac": 0.37, "pac/iac": 0.34, "hc": 0.2, "dc": 0.07, "pc": 0.02});
		}
		
		var cadence_length = this.cadence_lengths[cadence];
		// 4 beat cadence includes a 64 tonic
		if(cadence != "pac/iac" && cadence_length == 3 && chooseInt({0: 0.8, 1: 0.2}) == 0){
			cadence_length++;
		}
		
		var pivot_num = null;
		
		do{
			end_key = start_key.getModulation();
			if(!start_key.equals(end_key)){
				pivot_num = null;
			}
			else{
				pivot_num = start_key.getPivotChordNum(end_key);
			}
		}while(!start_key.equals(end_key) && pivot_num == null);
		
		var sub_phrase_lengths = this.generateSubPhrases(phrase_data);
		var chords = [];
		var key = phrase_data.key;
		
		var cadence_chords = this.generateCadenceChords(cadence, cadence_length,
								  sub_phrase_lengths.pop(), key);
		for(var i = 0; i < sub_phrase_lengths.length; i++){
			chords.push(...this.generatePhraseChords(sub_phrase_lengths[i], key));
		}
		chords.push(...cadence_chords);
		var string = "" + chords[0].roman_num;
		for(var i = 1; i < chords.length; i++){
			string += ", " + chords[i].roman_num;
		}
		console.log("chords: ", string);
		return chords;
	}
	generateSubPhrases(phrase_data){
		var sub_phrase_lengths = [];
		
		// sub_phrase_length of 2 means V-I, 1 means I
		var probs;
		switch(phrase_data.previous_cadence_chord){
			case 1:
				probs = {1: 0.6, 2: 0.4};
				break;
			case 5:
					probs = {1: 0.85, 2: 0.15};
				break;
			case 6:
				probs = {1: 0.9, 2: 0.1};
				break;
			default:
				// Starting chord: 70% V, 30% I
				probs = {1: 0.4, 2: 0.6};
		}
		sub_phrase_lengths.push(chooseInt(probs));
		
		var cad_length = phrase_data.cadence_length;
		var spaces = phrase_data.phrase_length - cad_length - sub_phrase_lengths[0];
		
		// frequency of each addition to cadence sub-phrase
		var freqs = {0: 58, 1: 40, 2: 2};
		var choices = [0, 1, 2];
		for(var i = choices.length - 1; i >= 0; i--){
			if(choices[i] > spaces || choices[i] + 1 == spaces){
				choices.splice(i, 1);
			}
		}
		cad_length += chooseIntFromFreqs(freqs, choices);
		spaces = phrase_data.phrase_length - cad_length - sub_phrase_lengths[0];
		
		// frequency of each length of sub-phrase
		freqs = {2: 10, 3: 46, 4: 37, 5: 6, 6: 1};
		if(sub_phrase_lengths[0] == 2){
			freqs[2] = 5;
		}
		
		while(spaces > 4){
			choices = [];
			for(var i = Math.min(6, spaces); i >= 2; i--){
				if(i + 1 != spaces){
					choices.push(i);
				}
			}
			var length_temp = chooseIntFromFreqs(freqs, choices);
			sub_phrase_lengths.push(length_temp);
			spaces -= length_temp;
		}
		if(spaces != 0){
			sub_phrase_lengths.push(spaces);
			if(spaces == 1){
				console.log("sub phrase length 1 error");
			}
		}
		sub_phrase_lengths.push(cad_length);
		console.log("phrase lengths: ", sub_phrase_lengths);
		return sub_phrase_lengths;
	}
	generateChords(key, phrase_lengths){
		var chords = [];
		var prev_key = key;
		var prev_chord = null;
		for(var i = 0; i < phrase_lengths.length; i++){
			chords.push(...this.generatePhrase(phrase_lengths, key, prev_chord, prev_key, i));
			prev_chord = chords[chords.length - 1];
			prev_key = prev_chord.key;
		}
		
		
	}
}
