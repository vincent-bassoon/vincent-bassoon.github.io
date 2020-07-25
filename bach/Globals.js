function watchForHover(){
	
	let lastTouchTime = 0

	function enableHover(){
		if(new Date() - lastTouchTime < 500){
			return;
		}
		document.body.classList.add('hasHover');
	}
	
	function disableHover(){
		document.body.classList.remove('hasHover');
	}

	function updateLastTouchTime(){
		lastTouchTime = new Date();
	}

	document.addEventListener('touchstart', updateLastTouchTime, true);
	document.addEventListener('touchstart', disableHover, true);
	document.addEventListener('mousemove', enableHover, true);

	enableHover();
}

watchForHover();

function choose(probs){
	var num = 100 * Math.random();
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
	if(sum != 100){
		console.log("Probability sum error: ", probs);
	}
	return choice;
}

function chooseInt(probs){
	return parseInt(choose(probs));
}

function chooseFromFreqs(freqs, choices){
	var sum = 0;
	for(var i = 0; i < choices.length; i++){
		sum += freqs[choices[i]];
	}
	var num = Math.random() * sum;
	sum = 0;
	for(var i = 0; i < choices.length; i++){
		sum += freqs[choices[i]];
		if(sum > num){
			return choices[i];
		}
	}
	console.log("Probability null choice error: ", choices, freqs);
	return null;
}

function chooseIntFromFreqs(freqs, choices){
	return parseInt(chooseFromFreqs(freqs, choices));
}

function chooseFromFreqsRemove(freqs, choices){
	var sum = 0;
	for(var i = 0; i < choices.length; i++){
		sum += freqs[choices[i]];
	}
	var num = Math.random() * sum;
	sum = 0;
	for(var i = 0; i < choices.length; i++){
		sum += freqs[choices[i]];
		if(sum > num){
			return choices.splice(i, 1)[0];
		}
	}
	console.log("Probability null choice error: ", choices, freqs);
	return null;
}

function chooseIntFromFreqsRemove(freqs, choices){
	return parseInt(chooseFromFreqsRemove(freqs, choices));
}

class PhraseData {
	// note: previous_cadence_chord means be careful updating a single PhraseData object without updating them all
	constructor(key, phrase_length, fermata_duration, cadence, cadence_length, previous_cadence_chord){
		this.key = key;
		this.phrase_length = phrase_length;
		this.fermata_duration = fermata_duration;
		this.cadence = cadence;
		this.cadence_length = cadence_length;
		this.previous_cadence_chord = previous_cadence_chord;
	}
}

class Modulation {
	constructor(type, nums, keys){
		this.type = type;
		this.nums = nums;
		this.keys = keys;
		this.connect_nums = [];
		this.additions = [];
	}
}

class Key {
	constructor(key_pitch, key_modality, kg){
		this.pitch = key_pitch;
		this.modality = key_modality;
		this.kg = kg;
		
		var pitches = kg.pitches[this.modality];
		this.pitch_to_name = {};
		this.pitch_to_num = {};
		var letter_index = kg.key_pitch_to_letter_index[this.modality][this.pitch];
		for(var i = 0; i < pitches.length; i++){
			var pitch = (pitches[i] + this.pitch) % 12;
			var num = kg.pitch_to_num[pitches[i]];
			var name = kg.letters[(num - 1 + letter_index) % 7];
			name += kg.getAccidental(kg.letter_to_pitch[name], pitch);
			this.pitch_to_name[pitch] = name;
			this.pitch_to_num[pitch] = num;
		}
		this.num_to_pitch = {};
		for(var num in kg.num_to_pitch[this.modality]){
			this.num_to_pitch[num] = (kg.num_to_pitch[this.modality][num] + this.pitch) % 12;
		}
		
		this.mod_freqs = kg.mod_freqs[this.modality];
		this.qualities = kg.qualities[this.modality];
	}
	numToPitch(num){
		return this.num_to_pitch[num];
	}
	numToName(num){
		return this.pitch_to_name[this.num_to_pitch[num]];
	}
	valueToNum(value){
		return this.pitch_to_num[value % 12];
	}
	valueToName(value){
		return this.pitch_to_name[value % 12];
	}
	getAccidentals(){
		//Note: this function returns an object using lower case letters as keys
		var accidentals = {};
		var pitches;
		if(this.modality == "major"){
			pitches = [0, 2, 4, 5, 7, 9, 11];
		}
		else{
			pitches = [0, 2, 3, 5, 7, 8, 10];
		}
		for(var i = 0; i < pitches.length; i++){
			var value = (this.pitch + pitches[i]) % 12;
			var name = this.valueToName(value);
			accidentals[name.substring(0, 1).toLowerCase()] = name.substring(1);
		}
		return accidentals;
	}
	getChordQuality(num){
		return this.qualities[num];
	}
	equals(key){
		return this.pitch == key.pitch && this.modality == key.modality;
	}
	generateTypeModulation(current_key, nums, type){
		if(type == "pivot"){
			var modality = current_key.modality;
			if(current_key.getChordQuality(nums[0]) != current_key.getChordQuality(nums[1])){
				modality = this.kg.opposite_modality[current_key.modality];
			}
			var change = (current_key.numToPitch(nums[0]) + 24 - this.pitch - this.kg.getKey(0, modality).numToPitch(nums[1])) % 12;
			if(change in this.kg.mod_modalities[this.modality] && (nums[1] == 5 || this.kg.mod_modalities[this.modality][change] == modality)){
				var new_key = this.kg.getKey((this.pitch + change) % 12, this.kg.mod_modalities[this.modality][change]);
				return new Modulation(type, nums, [current_key, new_key]);
			}
		}
		else if(type == "mediant"){
			var parity = nums[1] / 5;
			nums[1] = 5;
			var changes = [3, 4];
			if(chooseInt({0: 50, 1: 50}) == 1){
				changes = [4, 3];
			}
			for(var j = 0; j < 2; j++){
				var change = (current_key.numToPitch(nums[0]) + 24 - this.pitch - 7 + parity * changes[j]) % 12;
				if(change in this.kg.mod_modalities[this.modality]){
					var new_key = this.kg.getKey((this.pitch + change) % 12, this.kg.mod_modalities[this.modality][change]);
					var temp_num;
					if(parity == -1){
						temp_num = 7;
					}
					else{
						temp_num = 3;
					}
					if(new_key.numToName(temp_num).substring(0, 1) == current_key.numToName(nums[0]).substring(0, 1)){
						return new Modulation(type, nums, [current_key, new_key]);
					}
				}
			}
		}
		return null;
	}
	getStartModulation(current_key, current_num, first_num, type){
		var nums;
		if(type == "pivot"){
			if(current_key.getChordQuality(first_num) != "major"){
				return null;
			}
			var num_options = [];
			if(first_num == 1){
				num_options.push([1, 5]);
			}
			else if(first_num == 5){
				num_options.push([5, 1]);
			}
			num_options.push([4, 1]);
			num_options.push([4, 5]);
			
			var mod = null;
			for(var i = 0; i < num_options.length; i++){
				mod = this.generateTypeModulation(current_key, num_options[i], type);
				if(mod != null){
					return mod;
				}
			}
			return mod;
		}
		else if(type == "mediant"){
			if(current_num == 5 || current_key.getChordQuality(current_num) != "major"){
				return null;
			}
			var nums = [current_num, -5];
			return this.generateTypeModulation(current_key, nums, type);
		}
	}
	getModulation(current_key, type, is_last){
		var choices = [];
		for(var choice in current_key.mod_freqs[type]){
			choices.push(choice);
		}
		while(choices.length > 0){
			var nums = this.kg.modStringToNums(chooseFromFreqsRemove(current_key.mod_freqs[type], choices), type);
			var mod = this.generateTypeModulation(current_key, nums, type);
			if(mod != null && !(is_last && !mod.keys[1].equals(this))){
				return mod;
			}
		}
		return null;
	}
}

class KeyGenerator {
	constructor(){
		this.letters = ["C", "D", "E", "F", "G", "A", "B"];
		this.letter_to_pitch = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11};
		this.key_pitch_to_letter_index = {"major": {}, "minor": {}};
		var pitch = {"major": 0, "minor": 9};
		var letter_index = {"major": 0, "minor": 5};
		for(var modality in this.key_pitch_to_letter_index){
			for(var i = 0; i < 12; i++){
				this.key_pitch_to_letter_index[modality][pitch[modality]] = letter_index[modality];
				if(i == 5){
					letter_index[modality] = (letter_index[modality] + 5) % 7;
				}
				else{
					letter_index[modality] = (letter_index[modality] + 4) % 7;
				}
				pitch[modality] = (pitch[modality] + 7) % 12;
			}
		}
		
		
		this.pitch_to_num = {0: 1, 2: 2, 3: 3, 4: 3, 5: 4, 7: 5, 8: 6, 9: 6, 10: 7, 11: 7};
		this.num_to_pitch = {"major": {1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11},
				     "minor": {1: 0, 2: 2, 3: 3, 4: 5, 5: 7, 6: 8, 7: 11}};
		this.pitches = {"major": [0, 2, 4, 5, 7, 9, 11], "minor": [0, 2, 3, 5, 7, 8, 10, 11]};
		
		this.mod_modalities = {"major": {0: "major", 2: "minor", 4: "minor", 5: "major", 7: "major", 9: "minor"},
				       "minor": {0: "minor", 3: "major", 5: "minor", 7: "minor", 8: "major", 10: "major"}};
		
		//mediant should always go to V
		this.mod_freqs = {"major": {"pivot": {"vi-ii": 30, "IV-I": 5, "I-V": 65},
					    "mediant": {"I+": 50, "IV-": 50}},
				  "minor": {"pivot": {"VII-V": 10, "III-V": 10, "i-iv": 10},
					    "mediant": {"III-": 50, "VI+": 50}}};
		
		this.qualities = {"major": {1: "major", 2: "minor", 3: "minor", 4: "major", 5: "major", 6: "minor", 7: "dim"},
				   "minor": {1: "minor", 2: "dim", 3: "major", 4: "minor", 5: "major", 6: "major", 7: "dim"}};
		
		this.opposite_modality = {"major": "minor", "minor": "major"};
		
		this.keys = {"major": {}, "minor": {}};
		
		this.string_to_num = {"i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7};
	}
	modStringToNums(mod_string, type){
		var nums = [];
		if(type == "pivot"){
			var strings = mod_string.split("-");
			for(var i = 0; i < 2; i++){
				nums[i] = this.string_to_num[strings[i].toLowerCase()];
			}
		}
		else if(type == "mediant"){
			nums[0] = this.string_to_num[mod_string.substring(0, mod_string.length - 1).toLowerCase()];
			if(mod_string.substring(mod_string.length - 1) == "+"){
				nums[1] = 5;
			}
			else{
				nums[1] = -5;
			}
		}
		return nums;
	}
	getAccidental(base_pitch, target_pitch){
		var accidental = "";
		if(base_pitch == target_pitch){
			return accidental;
		}
		var dist1 = (base_pitch - target_pitch + 12) % 12;
		var dist2 = (target_pitch - base_pitch + 12) % 12;
		if(dist1 < dist2){
			for(var i = 0; i < dist1; i++){
				accidental += "b";
			}
		}
		else{
			for(var i = 0; i < dist2; i++){		
				accidental += "#";
			}
		}
		return accidental;
	}
	getKey(pitch, modality){
		if(pitch in this.keys[modality]){
			return this.keys[modality][pitch];
		}
		else{
			var key = new Key(pitch, modality, this);
			this.keys[modality][pitch] = key;
			return key;
		}
	}
}

class Chord {
	constructor(roman_num, key, quality, mod, seven, inversion){
		this.roman_num = roman_num;
		this.key = key;
		this.quality = quality;
		this.mod = mod;
		this.seven = seven;
		this.inversion = inversion;
		
		this.pitches = [key.numToPitch(roman_num)];
		var chord_mapping = {"major": {1: 4, 2: 7}, "aug": {1: 4, 2: 8},
				     "minor": {1: 3, 2: 7}, "dim": {1: 3, 2: 6}};
		for(var i = 1; i < 3; i++){
			this.pitches.push((this.pitches[0] + chord_mapping[quality][i]) % 12);
		}
		if(roman_num == 5 && quality == "major"){
			this.pitches.push((this.pitches[0] + chord_mapping[quality][2] + 3) % 12);
		}
	}
	equals(chord){
		return this.quality == chord.quality && this.pitches[0] == chord.pitches[0] && this.seven == chord.seven;
	}
}


class HarmonyUnit {
	constructor(chord, end_of_phrase, sixteenths){
		this.values = [[null, null, null, null], [null, null, null, null], [null, null, null, null]];
		this.motion = [null, null, null, null];
		this.degree = [null, null, null, null];
		
		this.sixteenths = sixteenths;	
		this.chord = chord;
		
		this.end_of_phrase = end_of_phrase;
		
		this.scores = [null, null, null, null];
		
		this.history = [];
	}
	getNumNotes(voice){
		if(this.values[1][voice] != this.values[2][voice]){
			return 3;
		}
		else if(this.values[0][voice] != this.values[1][voice]){
			return 2;
		}
		else{
			return 1;
		}
	}
	getValue(voice, index){
		return this.values[index][voice];
	}
	setScore(voice, score){
		this.scores[voice] = score;
	}
	getScore(voice){
		return this.scores[voice];
	}
	setNotes(voice, values, degree, num_notes, motion){
		for(var i = 0; i < num_notes; i++){
			this.values[i][voice] = values[i];
		}
		for(var i = num_notes; i < 3; i++){
			this.values[i][voice] = values[num_notes - 1];
		}
		this.degree[voice] = degree;
		this.motion[voice] = motion;
	}
	getDegree(voice){
		return this.degree[voice];
	}
	getMotion(voice){
		return this.motion[voice];
	}
	addToHistory(){
		var copy = [[], [], []];
		for(var i = 0; i < 4; i++){
			copy[0][i] = this.values[0][i];
			copy[1][i] = this.values[1][i];
			copy[2][i] = this.values[2][i];
		}
		this.history.push(copy);
	}
	equalsHistory(){
		var equals;
		for(var i = 0; i < this.history.length; i++){
			equals = true;
			for(var j = 0; j < 3; j++){
				for(var k = 0; k < 4; k++){
					if(this.history[i][j][k] != this.values[j][k]){
						equals = false;
					}
				}
			}
			if(equals){
				return true;
			}
		}
		return false;
	}
}

class MotionFunctions {
	constructor(max_score){
		this.type = {"CONSTANT": 0, "STEP": 1, "THIRD": 2, "LEAP": 3,
			     "MORDENT": 4, "TURN": 5, "PASSING_8": 6, "PASSING_16": 7,
			     "SUSPENSION": 8, "SUSPENSION_7": 9};
		
		this.max_score = max_score;
	}
	getNumChanges(motion){
		var direction = this.direction(motion);
		motion = Math.abs(motion);
		if(motion == this.type.SUSPENSION || motion == this.type.SUSPENSION_7){
			return [1, 0];
		}
		if(motion == this.type.TURN || motion == this.type.PASSING_16){
			return [0, direction, direction * 2];
			
		}
		if(motion == this.type.MORDENT || motion == this.type.PASSING_8){
			return [0, direction];
		}
	}
	direction(motion){
		if(motion == this.type.CONSTANT){
			return 0;
		}
		if(motion == this.type.SUSPENSION || motion < 0){
			return -1;
		}
		else{
			return 1;
		}
	}
	getSimpleMotion(change){
		if(change == 0){
			return this.type.CONSTANT;
		}
		var parity = 1;
		if(change < 0){
			parity = -1;
		}
		if(Math.abs(change) <= 2){
			return this.type.STEP * parity;
		}
		else if(Math.abs(change) <= 4){
			return this.type.THIRD * parity;
		}
		else{
			return this.type.LEAP * parity;
		}
	}
	getMotionOptions(voice, simple_motion, sixteenths, next_motion){
		var direction = this.direction(simple_motion);
		var options = [];
		switch(Math.abs(simple_motion)){
			case this.type.CONSTANT:
				if(voice != 3){
					if(Math.abs(next_motion) < 4){
						options.push(this.type.MORDENT);
						options.push(this.type.MORDENT * -1);
					}
					else{
						options.push(this.type.MORDENT * -1 * this.direction(next_motion));
					}
				}
				break;
			case this.type.STEP:
				if(voice != 3 && sixteenths){
					options.push(this.type.TURN * direction);
				}
				break;
			case this.type.THIRD:
				options.push(this.type.PASSING_8 * direction);
				break;
			case this.type.LEAP:
				if(sixteenths){
					options.push(this.type.PASSING_16 * direction);
				}
		}
		return options;
	}
	getMotionScore(harmony, index, voice, motion){
		var score = 1;
		if(motion == this.type.SUSPENSION){
			score = 0;
		}
		var next_motion = harmony[index + 1].getMotion(voice);
		var direction = this.direction(motion);
		var next_direction = this.direction(next_motion);
		motion = Math.abs(motion);
		next_motion = Math.abs(next_motion);
		
		if(motion == this.type.MORDENT || motion == this.type.PASSING_16){
			if(harmony[index + 1].end_of_phrase){
				return this.max_score + 1;
			}
			else{
				score += 20;
			}
		}
		
		if(index + 1 == harmony.length - 1){
			return score;
		}
		//restrictions for mordents
		if(motion == this.type.MORDENT && next_direction != direction * -1){
			return this.max_score + 1;
		}
		if(next_motion == this.type.MORDENT && next_direction != direction){
			return this.max_score + 1;
		}
		if(next_motion == this.type.MORDENT){
			if(index + 2 >= harmony.length || (Math.abs(harmony[index + 2].getMotion(voice)) < 4 && motion < 4)){
				return this.max_score + 1;
			}
		}
		//no two consecutive leaps if one of them is a fourth
		if(motion == this.type.LEAP && next_motion == this.type.LEAP){
			return this.max_score + 1;
		}
		if(motion == this.type.LEAP && next_motion == this.type.THIRD){
			return this.max_score + 1;
		}
		if(motion == this.type.THIRD && next_motion == this.type.LEAP){
			return this.max_score + 1;
		}
		if(motion == this.type.THIRD && next_motion == this.type.THIRD){
			// consecutive leaps of a third
			score += 15;
			if(direction == -1 * next_direction){
				//leap down then up, or up then down
				score += 20;
			}
		}
		else if(motion == this.type.CONSTANT && next_motion == this.type.CONSTANT){
			//consecutive stagnation
			score += 15;
			if(voice == 0){
				score += 15;
			}
		}
		else if(motion == this.type.LEAP && next_direction != direction * -1){
			// big leap must be followed by step in opposite direction
			score += 20;
			if(voice == 0){
				return this.max_score + 1;
			}
		}
		return score + this.getMotionHistoryScore(harmony, index, voice, motion);
	}
	getMotionHistoryScore(harmony, index, voice, motion){
		return 0;
		if(motion != this.type.MORDENT && motion != this.type.PASSING_16){
			return 0;
		}
		var score = 0;
		var max = Math.min(harmony.length - 1, index + 6);
		for(var i = 1; i < max; i++){
			motion = harmony[index].getMotion(voice);
			if(motion == this.type.MORDENT || motion == this.type.PASSING_16){
				return this.max_score + 1;
			}
		}
	}
}

class NoteFunctions {
	constructor(){
		var letters = ["C", "D", "E", "F", "G", "A", "B"];
		var letter_to_value = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11};
		
		this.letter_index = {};
		this.value_to_simple_name = {};
		for(var i = 0; i < letters.length; i++){
			this.letter_index[letters[i]] = i;
			this.value_to_simple_name[letter_to_value[letters[i]]] = letters[i];
		}
		for(var i = 0; i < letters.length; i++){
			var value = (letter_to_value[letters[i]] + 11) % 12;
			if(!(value in this.value_to_simple_name)){
				this.value_to_simple_name[value] = letters[i] + "b"
			}
		}
		
		this.interval_mapping = {0: 0, 1: 1.5, 2: 3.5, 3: 5, 4: 7, 5: 8.5, 6: 10.5};
		
		
		this.preferred_ranges = {0: {"min": 4 + 48, "max": 3 + 60},
					 1: {"min": 9 + 36, "max": 8 + 48},
					 2: {"min": 5 + 36, "max": 4 + 48},
					 3: {"min": 5 + 24, "max": 4 + 36}};
	
		this.absolute_ranges = {0: {"min": 0 + 48, "max": 7 + 60},
					1: {"min": 7 + 36, "max": 2 + 60},
					2: {"min": 0 + 36, "max": 7 + 48},
					3: {"min": 0 + 24, "max": 0 + 48}};
	}
	valueToSimpleName(value){
		return this.value_to_simple_name[value % 12];
	}
	isAugOrDim(change, name1, name2){
		if(Math.abs(change) == 1){
			return false;
		}
		if(Math.abs(change) > 11){
			change = change % 12;
		}
		var letter_index1 = this.letter_index[name1.substring(0, 1)];
		var letter_index2 = this.letter_index[name2.substring(0, 1)];
		var letter_index_diff;
		if(change < 0){
			letter_index_diff = (letter_index1 - letter_index2 + 7) % 7;
		}
		else{
			letter_index_diff = (letter_index2 - letter_index1 + 7) % 7;
		}
		return Math.abs(Math.abs(change) - this.interval_mapping[letter_index_diff]) > 0.5;
	}
	inAbsoluteRange(value, voice){
		return value >= this.absolute_ranges[voice].min && value <= this.absolute_ranges[voice].max;
	}
	inPrefRange(value, voice){
		return value >= this.preferred_ranges[voice].min && value <= this.preferred_ranges[voice].max;
	}
	getValueInPrefRange(pitch, voice){
		var min = this.preferred_ranges[voice].min;
		while(pitch < min){
			pitch += 12;
		}
		return pitch;
	}
	getValueClosestTo(pitch, static_value){
		if(pitch > static_value){
			return pitch;
		}
		while(Math.abs(static_value - pitch) > 6){
			pitch += 12;
		}
		return pitch;
	}
	isAdjacent(letter1, letter2){
		//returns false if the same letter
		var letter_index1 = this.letter_index[letter1];
		var letter_index2 = this.letter_index[letter2];
		return (letter_index1 + 1) % 7 == letter_index2 || (letter_index2 + 1) % 7 == letter_index1;
	}
}

