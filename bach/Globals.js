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
	if(sum != 1.0){
		console.log("Probability sum error: ", probs);
	}
	return choice;
}

function chooseInt(probs){
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

function chooseIntFromFreqs(freqs, choices){
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
	constructor(pitch, modality, pitch_to_num, pitch_to_name, num_to_pitch){
		this.pitch = pitch;
		this.modality = modality;
		this.pitch_to_num = pitch_to_num;
		this.num_to_pitch = num_to_pitch;
		this.pitch_to_name = pitch_to_name;
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
	createKey(key_pitch, key_modality){
		var pitches = this.pitches[key_modality];
		var pitch_to_name = {};
		var pitch_to_num = {};
		var letter_index = this.key_pitch_to_letter_index[key_modality][key_pitch];
		for(var i = 0; i < pitches.length; i++){
			var pitch = (pitches[i] + key_pitch) % 12;
			var num = this.pitch_to_num[pitches[i]];
			var name = this.letters[(num - 1 + letter_index) % 7];
			name += this.getAccidental(this.letter_to_pitch[name], pitch);
			pitch_to_name[pitch] = name;
			pitch_to_num[pitch] = num;
		}
		var num_to_pitch = {};
		for(var num in this.num_to_pitch[key_modality]){
			num_to_pitch[num] = (this.num_to_pitch[key_modality][num] + key_pitch) % 12;
		}
		return new Key(key_pitch, key_modality, pitch_to_num, pitch_to_name, num_to_pitch);
	}
	getKey(pitch, modality){
		if(pitch in this.keys[modality]){
			return this.keys[modality][pitch];
		}
		else{
			var key = this.createKey(pitch, modality);
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
		
		this.pitches = {0: key.numToPitch(roman_num)};
		var chord_mapping = {"major": {1: 4, 2: 7}, "aug": {1: 4, 2: 8},
				     "minor": {1: 3, 2: 7}, "dim": {1: 3, 2: 6}};
		for(var i = 1; i < 3; i++){
			this.pitches[i] = (this.pitches[0] + chord_mapping[quality][i]) % 12
		}
	}
	equals(chord){
		return this.quality == chord.quality && this.pitches[0] == chord.pitches[0];
	}
}

class ScoreUnit {
	constructor(target_avgs, harmony){
		this.scores = [null, null, null, null];
		
		this.avgs = [0, 0, 0, 0];
		this.avg_nums = [0, 0, 0, 0];
		this.target_avgs = target_avgs;
		
		this.harmony = harmony;
		this.history = [];
	}
	updateAvgs(next_score){
		for(var voice = 0; voice < 4; voice++){
			var value = (this.harmony.getValue(voice, 0) + this.harmony.getValue(voice, 1) + this.harmony.getValue(voice, 2)) / 3;
			this.avg_nums[voice] = next_score.avg_nums[voice] + 1;
			this.avgs[voice] = next_score.getNextAvg(voice, value);
		}
	}
	getAvgScore(next_score, voice, value){
		if(voice != 0 || this.harmony.end_of_phrase){
			return 0;
		}
		var score = 0;
		var target_avg = this.target_avgs[voice];
		var avg = next_score.getNextAvg(voice, value);
		var diff = Math.abs(target_avg - avg);
		if(diff > 2){
			if((value > avg && avg > target_avg) || (value < avg && avg < target_avg)){
				score += diff * 5;
			}
		}
		if(Math.abs(value - target_avg) > 5){
			score += 20;
		}
		return score;
	}
	getNextAvg(voice, value){
		return (this.avgs[voice] * this.avg_nums[voice] + value) / (this.avg_nums[voice] + 1);
	}
	addToHistory(){
		var copy = [[], [], []];
		for(var i = 0; i < 4; i++){
			copy[0][i] = this.harmony.values[0][i];
			copy[1][i] = this.harmony.values[1][i];
			copy[2][i] = this.harmony.values[2][i];
		}
		this.history.push(copy);
	}
	equalsHistory(){
		var equals;
		for(var i = 0; i < this.history.length; i++){
			equals = true;
			for(var j = 0; j < 3; j++){
				for(var k = 0; k < 4; k++){
					if(this.history[i][j][k] != this.harmony.values[j][k]){
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

class HarmonyUnit {
	constructor(chord, target_avgs, end_of_phrase){
		this.values = [[null, null, null, null], [null, null, null, null], [null, null, null, null]];
		this.motion = [null, null, null, null];
		
		this.chord = chord;
		
		this.end_of_phrase = end_of_phrase;
		
		this.score = new ScoreUnit(target_avgs, this);
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
	setNotes(voice, values, num_notes, motion){
		for(var i = 0; i < num_notes; i++){
			this.values[i][voice] = values[i];
		}
		for(var i = num_notes; i < 3; i++){
			this.values[i][voice] = values[num_notes - 1];
		}
		this.motion[voice] = motion;
	}
	getMotion(voice){
		return this.motion[voice];
	}
}

class MotionFunctions {
	constructor(max_score){
		this.type = {"CONSTANT": 0, "STEP": 1, "THIRD": 2, "LEAP": 3,
			     "MORDANT": 4, "TURN": 5, "PASSING_8": 6, "PASSING_16": 7,
			     "SUSPENSION": 8};
		
		this.max_score = max_score;
	}
	getNumChanges(motion){
		var direction = this.direction(motion);
		motion = Math.abs(motion);
		if(motion == this.type.TURN || motion == this.type.PASSING_16){
			return [0, direction, direction * 2];
			
		}
		if(motion == this.type.MORDANT || motion == this.type.PASSING_8){
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
	getMotionOptions(voice, simple_motion){
		var direction = this.direction(simple_motion);
		switch(Math.abs(simple_motion)){
			case this.type.CONSTANT:
				if(voice != 3){
					return [this.type.MORDANT, this.type.MORDANT * -1];
				}
				break;
			case this.type.STEP:
				if(voice != 3){
					return [this.type.TURN * direction];
				}
				break;
			case this.type.THIRD:
				return [this.type.PASSING_8 * direction];
				break;
			case this.type.LEAP:
				return [this.type.PASSING_16 * direction];
		}
		return [];
	}
	getMotionScore(voice, motion, next_motion){
		var score = 0;
		var direction = this.direction(motion);
		var next_direction = this.direction(next_motion);
		motion = Math.abs(motion);
		next_motion = Math.abs(next_motion);
		
		//restrictions for mordents
		if(motion == this.type.MORDENT && next_direction != direction * -1){
			return this.max_score + 1;
		}
		if(next_motion == this.type.MORDENT && next_direction != direction){
			return this.max_score + 1;
		}
		//no two consecutive leaps if one of them is a fourth
		if(motion == this.type.LEAP && next_motion == this.type.LEAP){
			console.log("leap leap");
			return this.max_score + 1;
		}
		if(motion == this.type.LEAP && next_motion == this.type.THIRD){
			console.log("leap third");
			return this.max_score + 1;
		}
		if(motion == this.type.THIRD && next_motion == this.type.LEAP){
			console.log("third leap");
			return this.max_score + 1;
		}
		if(motion == this.type.THIRD && next_motion == this.type.THIRD){
			// consecutive leaps of a third
			score += 15;
			if(direction == -1 * next_direction){
				//leap down then up, or up then down
				score += 20;
			}
			console.log("third third");
			return score;
		}
		if(motion == this.type.CONSTANT && next_motion == this.type.CONSTANT){
			//consecutive stagnation
			score += 10;
			if(voice == 0){
				score += 10;
			}
			console.log("constant constant");
			return score;
		}
		if(motion == this.type.LEAP && next_direction != direction * -1){
			// big leap must be followed by step in opposite direction
			score += 20;
			if(voice == 0){
				score += 20;
			}
			console.log("leap (not opposite step)");
		}
		return score;
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

