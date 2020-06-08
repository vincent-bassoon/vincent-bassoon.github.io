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
		
		var pitch = {"major": 0, "minor": 9};
		var letter_index = {"major": 0, "minor": 5};
		for(var modality in this.pitch_to_key_letter){
			for(var i = 0; i < 12; i++){
				this.pitch_to_letter_index[modality][pitch[modality]] = letter_index[modality];
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
	createKey(key_pitch, key_modality){
		var pitches = this.pitches[key_modality];
		var pitch_to_name = {};
		var pitch_to_num = {};
		var letter_index = this.key_pitch_to_letter_index[key_modality][key_pitch];
		for(var i = 0; i < pitches.length; i++){
			var pitch = (pitches[i] + key_pitch) % 12;
			var num = this.pitch_to_num[pitches[i]];
			var name = this.letters[(num - 1 + key_letter_index) % 7];
			switch(this.letter_to_pitch[name] - pitch){
				case 2:
					name += "bb";
					break;
				case 1:
					name += "b";
					break;
				case -1:
					name += "#";
					break;
				case -2:
					name += "##";
					break;
			}
			pitch_to_name[pitch] = name;
			pitch_to_num[pitch] = num;
		}
		var num_to_pitch = {};
		for(var num in this.num_to_pitch){
			num_to_pitch[num] = (this.num_to_pitch[num] + key_pitch) % 12;
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
			pitches[i] = (this.pitches[0] + chord_mapping[quality][i]) % 12
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
	updateAvgs(next_harmony){
		for(var voice = 0; voice < 4; voice++){
			var value = (this.harmony.getValue(voice, 0) + this.harmony.getValue(voice, 1) + this.harmony.getValue(voice, 2)) / 3;
			this.avg_nums[voice] = next_harmony.avg_nums[voice] + 1;
			this.avgs[voice] = next_harmony.getNextAvg(voice, value);
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
		this.leap = [null, null, null, null];
		
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
	setNotes(voice, values, num_notes, leap){
		for(var i = 0; i < num_notes; i++){
			this.values[i][voice] = values[i];
		}
		for(var i = num_notes; i < 3; i++){
			this.values[i][voice] = values[num_notes - 1];
		}
		this.leap[voice] = leap;
	}
	getLeap(voice){
		return this.leap[voice];
	}
}



class NoteFunctions {
	constructor(){
		this.value_to_simple_name = {0: "C", 2: "D", 4: "E", 5: "F", 7: "G", 9: "A", 11: "B"};
		this.letter_index = {};
		var letters = ["C", "D", "E", "F", "G", "A", "B"];
		for(var i = 0; i < letters.length; i++){
			this.letter_index[letters[i]] = i;
		}
		for(var key in this.value_to_simple_name){
			var value = (key + 11) % 12;
			if(!(value in this.value_to_simple_name)){
				this.value_to_simple_name[value] = this.value_to_simple_name[key] + "b"
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
		return this.simple_val_to_name[value % 12];
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
		if(change > 0){
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

