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

function chooseIntFromFreqsRemove(freqs, choices){
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

class Key {
	constructor(key_pitch, key_modality, kg){
		this.pitch = key_pitch;
		this.modality = key_modality;
		this.key_generator = kg;
		
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
		
		this.mod_freqs = {};
		this.mod_choices = [];
		for(var pitch_string in kg.mod_freqs[this.modality]){
			var pitch = parseInt(pitch_string);
			var key_pitch = (this.pitch + pitch) % 12;
			var key_modality;
			if(pitch == 0 || pitch == 5 || pitch == 7){
				key_modality = this.modality;
			}
			else{
				key_modality = kg.opposite_modality[this.modality];
			}
			var key_letter = kg.letters[kg.key_pitch_to_letter_index[key_modality][key_pitch]];
			if(key_letter == this.pitch_to_name[key_pitch].substring(0, 1)){
				this.mod_freqs[key_pitch] = kg.mod_freqs[this.modality][pitch];
				this.mod_choices.push(key_pitch);
			}
		}
		
		this.type_freqs = kg.type_freqs;
		this.qualities = kg.qualities[this.modality];
	}
	numToPitch(num){
		return this.num_to_pitch[num];
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
	getModulation(current_key, type){
		var choices = [];
		for(var i = 0; i < this.mod_choices.length; i++){
			choices.push(this.mod_choices[i]);
		}
		while(choices.length > 0){
			var pitch = chooseIntFromFreqsRemove(this.mod_freqs, choices);
			var modality;
			var num = this.pitch_to_num[pitch];
			if(num == 1 || num == 4 || num == 5){
				modality = this.modality;
			}
			else{
				modality = this.key_generator.opposite_modality[this.modality];
			}
			var next_key = this.key_generator.getKey(pitch, modality);
			if(!next_key.equals(current_key)){
				var mod_nums = current_key.getModulationNums(next_key, type);
				if(mod_nums != null){
					return {"keys": [current_key, next_key], "type": type, "nums": mod_nums, "connect_nums": []};
				}
			}
		}
		return null;
	}
	getModulationNums(next_key, type){
		var choices = [];
		for(var num in this.type_freqs[type][this.modality]){
			var pitch = this.num_to_pitch[num];
			if(type == "pivot"){
				if(pitch in next_key.pitch_to_name && next_key.pitch_to_name[pitch] == this.pitch_to_name[pitch] &&
				   this.qualities[num] == next_key.qualities[next_key.pitch_to_num[pitch]]){
					choices.push(num);
				}
			}
			else if(type == "mediant"){
				
			}
		}
		if(choices.length == 0){
			return null;
		}
		var num1 = chooseIntFromFreqs(this.type_freqs[type][this.modality], choices);
		var num2 = next_key.pitch_to_num[this.num_to_pitch[num1]];
		return [num1, num2];
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
		
		this.mod_freqs = {"major": {2: 0.14, 4: 0.02, 5: 0.2, 7: 0.38, 9: 0.26},
				  "minor": {3: 0.24, 5: 0.1, 7: 0.38, 8: 0.2, 10: 0.08}};
		
		this.type_freqs = {"pivot": {"major": {1: 25, 2: 9, 3: 2, 4: 15, 5: 15, 6: 30, 7: 4},
					     "minor": {1: 25, 2: 4, 3: 9, 4: 15, 5: 15, 6: 30, 7: 2}},
				   "mediant": {"major": {1: 30, 2: 5, 3: 0, 4: 20, 5: 40, 6: 5, 7: 0},
					       "minor": {1: 30, 2: 0, 3: 5, 4: 20, 5: 40, 6: 5, 7: 0}}};
		
		this.qualities = {"major": {1: "major", 2: "minor", 3: "minor", 4: "major", 5: "major", 6: "minor", 7: "dim"},
				   "minor": {1: "minor", 2: "dim", 3: "major", 4: "minor", 5: "major", 6: "major", 7: "dim"}};
		
		this.opposite_modality = {"major": "minor", "minor": "major"};
		
		this.keys = {"major": {}, "minor": {}};
		
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
	constructor(roman_num, key, quality, inversion){
		this.roman_num = roman_num;
		this.key = key;
		this.quality = quality;
		this.inversion = inversion;
		
		this.pitches = [key.numToPitch(roman_num)];
		var chord_mapping = {"major": {1: 4, 2: 7}, "aug": {1: 4, 2: 8},
				     "minor": {1: 3, 2: 7}, "dim": {1: 3, 2: 6}};
		for(var i = 1; i < 3; i++){
			this.pitches.push((this.pitches[0] + chord_mapping[quality][i]) % 12);
		}
	}
	equals(chord){
		return this.quality == chord.quality && this.pitches[0] == chord.pitches[0];
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
			     "SUSPENSION": 8};
		
		this.max_score = max_score;
	}
	getNumChanges(motion){
		var direction = this.direction(motion);
		motion = Math.abs(motion);
		if(motion == this.type.SUSPENSION){
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
	getMotionOptions(voice, simple_motion, suspension, sixteenths){
		var direction = this.direction(simple_motion);
		var options = [];
		if(suspension){
			options.push(this.type.SUSPENSION);
		}
		switch(Math.abs(simple_motion)){
			case this.type.CONSTANT:
				if(voice != 3){
					options.push(this.type.MORDENT);
					options.push(this.type.MORDENT * -1);
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
				score += 30;
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
}

