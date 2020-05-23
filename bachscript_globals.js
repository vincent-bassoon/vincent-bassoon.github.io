function choose(probs){
	var num = Math.random();
	var choice = null;
	var sum = 0;
	for(var key in probs){
		sum += probs[key];
		if(sum > num && choice == null){
			choice = key;
		}
	}
	if(choice == null){
		console.log("Probability null choice error: ", probs);
	}
	if(sum != 1.0){
		console.log("Probability sum error: ", probs);
	}
	return choice;
}

function choose_int(probs){
	var num = Math.random();
	var choice = null;
	var sum = 0;
	for(var key in probs){
		sum += probs[key];
		if(sum > num && choice == null){
			choice = key;
		}
	}
	if(choice == null){
		console.log("Probability null choice error: ", probs);
	}
	if(sum != 1.0){
		console.log("Probability sum error: ", probs);
	}
	return parseInt(choice);
}

function choose_int_from_freqs(freqs, choices){
	var sum = 0;
	for(var i = 0; i < choices.length; i++){
		sum += freqs[choices[i]];
	}
	var num = Math.random() * sum;
	sum = 0;
	for(var i = 0; i < choices.length; i++){
		sum += freqs[choices[i]];
		if(sum > num){
			return parseInt(choices[i]);
		}
	}
	console.log("Probability null choice error: ", choices, freqs);
	return null;
}

function choose_int_from_freqs_remove(freqs, choices){
	var sum = 0;
	for(var i = 0; i < choices.length; i++){
		sum += freqs[choices[i]];
	}
	var num = Math.random() * sum;
	sum = 0;
	for(var i = 0; i < choices.length; i++){
		sum += freqs[choices[i]];
		if(sum > num){
			return parseInt(choices.splice(i, 1)[0]);
		}
	}
	console.log("Probability null choice error: ", choices, freqs);
	return null;
}

class Key {
	constructor(pitch, modality){
		this.pitch = pitch;
		this.modality = modality;
	}
	get_pitch(){return this.pitch;}
	get_modality(){return this.modality;}
}

class PhraseData {
	// note: previous_cadence_chord means be careful updating a single PhraseData object without updating them all
	constructor(key, phrase_length, fermata_length, is_last, cadence, cadence_length, previous_cadence_chord){
		this.key = key;
		this.phrase_length = phrase_length;
		this.fermata_length = fermata_length;
		this.is_last = is_last;
		this.cadence = cadence;
		this.cadence_length = cadence_length;
		this.previous_cadence_chord = previous_cadence_chord;
	}
	get_key(){return this.key;}
	get_phrase_length(){return this.phrase_length;}
	get_fermata_length(){return this.fermata_length;}
	is_last_phrase(){return this.is_last;}
	get_cadence(){return this.cadence;}
	get_cadence_length(){return this.cadence_length;}
	get_previous_cadence_chord(){return this.previous_cadence_chord;}
}

class Chord {
	constructor(roman_num, key, chord_modality, inversion){
		this.root = roman_num;
		this.third = ((roman_num + 2 - 1) % 7) + 1;
		this.fifth = ((roman_num + 4 - 1) % 7) + 1;
		this.key = key;
		this.chord_modality = chord_modality;
		this.inversion = inversion;
	}
	get_roman_num(){return this.root;}
	get_key(){return this.key;}
	get_modality(){return this.chord_modality;}
	get_inversion(){return this.inversion;}
	get_degree(roman_num){
		switch(roman_num){
			case this.root:
				return 0;
			case this.third:
				return 1;
			case this.fifth:
				return 2;
			default:
				return null;
		}
	}
}

class Voice {
	constructor(){
		this.end_note_value = null;
		this.start_note_value = null;
	}
	get_end_value(){
		return this.end_note_value;
	}
	get_start_value(){
		return this.start_note_value;
	}
	set_end_value(value){
		this.end_note_value = value;
	}
	set_start_value(value){
		this.start_note_value = value;
	}
	set_note(value){
		this.start_note_value = value;
		this.end_note_value = value;
	}
	
}



class NoteFunctions {
	constructor(){
		this.name_to_val = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11};
		var letters = ["C", "D", "E", "F", "G", "A", "B"];
		this.letter_index = {};
		for(var i = 0; i < letters.length; i++){
			this.letter_index[letters[i]] = i;
			this.name_to_val[letters[i] + "b"] = (this.name_to_val[letters[i]] + 11) % 12;
			this.name_to_val[letters[i] + "#"] = (this.name_to_val[letters[i]] + 1) % 12;
		}
		this.letters = letters;
		this.val_to_key_name = {"major": {}, "minor": {}};
		var notes = {"major": {letter_index: 0, value: 0}, "minor": {letter_index: 5, value: 9}};
		for(var i = 0; i < 12; i++){
			for(var modality in notes){
				var name = letters[notes[modality].letter_index];
				var value = notes[modality].value;
				if(this.name_to_val[name] != value){
					if(this.name_to_val[name] + 1 == value){
						name += "#";
					}
					else if(this.name_to_val[name] - 1 == value){
						name += "b";
					}
				}
				this.val_to_key_name[modality][value] = name;
				if(i == 5){
					notes[modality].letter_index = (notes[modality].letter_index + 5) % 7;
				}
				else{
					notes[modality].letter_index = (notes[modality].letter_index + 4) % 7;
				}
				notes[modality].value = (value + 7) % 12;
			}
		}
		
		this.num_to_pitch = {"major": {1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11},
				     "minor": {1: 0, 2: 2, 3: 3, 4: 5, 5: 7, 6: 8, 7: 11}};
		
		this.pitch_to_num = {0: 1, 2: 2, 3: 3, 4: 3, 5: 4, 7: 5, 8: 6, 9: 6, 10: 7, 11: 7};
		
		this.chord_mapping = {"major": {0: 0, 1: 4, 2: 7}, "aug": {0: 0, 1: 4, 2: 8},
				      "minor": {0: 0, 1: 3, 2: 7}, "dim": {0: 0, 1: 3, 2: 6}};
		
	}
	name_to_value(name, octave){
		return this.name_to_val[name] + 12 * octave;
	}
	get_accidentals_in_key(key){
		//Note: this function returns an object using lower case letters as keys
		var start_value = key.get_pitch();
		var accidentals = {};
		var pitches;
		if(key.get_modality() == "major"){
			pitches = [0, 2, 4, 5, 7, 9, 11];
		}
		else{
			pitches = [0, 2, 3, 5, 7, 8, 10];
		}
		for(var i = 0; i < pitches.length; i++){
			var value = (start_value + pitches[i]) % 12;
			var name = this.value_to_name(value, key);
			accidentals[name.substring(0, 1).toLowerCase()] = name.substring(1);
		}
		return accidentals;
	}
	get_accidental(base_pitch, target_pitch){
		var accidentals = "";
		if(base_pitch == target_pitch){
			return accidentals;
		}
		var dist1 = (base_pitch - target_pitch + 12) % 12;
		var dist2 = (target_pitch - base_pitch + 12) % 12;
		if(dist1 < dist2){
			for(var i = 0; i < dist1; i++){
				accidentals += "b";
			}
		}
		else{
			for(var i = 0; i < dist2; i++){
				accidentals += "#";
			}
		}
		return accidentals;
	}
	value_to_name(value, key){
		value = value % 12;
		var adjusted_value = (value - key.get_pitch() + 12) % 12
		var key_letter = this.val_to_key_name[key.get_modality()][key.get_pitch()];
		var key_letter_index = this.letter_index[key_letter[0]];
		var val_letter_index = (key_letter_index + (this.pitch_to_num[adjusted_value] - 1)) % 7;
		var name = this.letters[val_letter_index];
		return name + this.get_accidental(this.name_to_val[name], value);
	}
	num_to_pitch_for_cad(roman_num, chord){
		var key = chord.get_key();
		var key_pitch = key.get_pitch();
		var root_pitch = this.num_to_pitch[key.get_modality()][chord.get_roman_num()];
		var degree_pitch = this.chord_mapping[chord.get_modality()][chord.get_degree(roman_num)];
		return (key_pitch + root_pitch + degree_pitch) % 12;
	}
	get_bass_pitch(chord){
		var inversion = chord.get_inversion();
		if(inversion == null){
			return null;
		}
		else{
			return this.get_pitch(chord, inversion);
		}
	}
	get_pitch(chord, degree){
		var key = chord.get_key();
		var key_pitch = key.get_pitch();
		var root_pitch = this.num_to_pitch[key.get_modality()][chord.get_roman_num()];
		var degree_pitch = this.chord_mapping[chord.get_modality()][degree];
		return (key_pitch + root_pitch + degree_pitch) % 12;
	}
}

