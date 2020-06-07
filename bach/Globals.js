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

class Key {
	constructor(pitch, modality){
		this.pitch = pitch;
		this.modality = modality;
	}
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

class Chord {
	constructor(roman_num, key, quality, inversion){
		this.roman_num = roman_num;
		this.third = ((roman_num + 2 - 1) % 7) + 1;
		this.fifth = ((roman_num + 4 - 1) % 7) + 1;
		this.key = key;
		this.quality = quality;
		this.inversion = inversion;
	}
}

class HarmonyUnit {
	constructor(target_avgs){
		this.values = [[null, null, null, null], [null, null, null, null], [null, null, null, null]];
		this.names = [[null, null, null, null], [null, null, null, null], [null, null, null, null]];
		this.nums = [[null, null, null, null], [null, null, null, null], [null, null, null, null]];
		this.leap = [null, null, null, null];
		
		this.chord = null;
		this.history = [];
		
		this.avgs = [0, 0, 0, 0];
		this.avg_nums = [0, 0, 0, 0];
		this.target_avgs = target_avgs;
	}
	updateAvgs(next_harmony){
		for(var voice = 0; voice < 4; voice++){
			var value = (this.getValue(voice, 0) + this.getValue(voice, 1) + this.getValue(voice, 2)) / 3;
			this.avg_nums[voice] = next_harmony.avg_nums[voice] + 1;
			this.avgs[voice] = next_harmony.getNextAvg(voice, value);
		}
	}
	getNextAvg(voice, value){
		return (this.avgs[voice] * this.avg_nums[voice] + value) / (this.avg_nums[voice] + 1);
	}
	getAvgNum(voice){
		return this.avg_nums[voice];
	}
	getTargetAvg(voice){
		return this.target_avgs[voice];
	}
	isEndOfPhrase(){
		return this.target_avgs[3] == null;
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
	setNotes(voice, values, names, num_notes, leap){
		for(var i = 0; i < num_notes; i++){
			this.values[i][voice] = values[i];
			this.names[i][voice] = names[i];
		}
		for(var i = num_notes; i < 3; i++){
			this.values[i][voice] = values[num_notes - 1];
			this.names[i][voice] = names[num_notes - 1];
		}
		this.leap[voice] = leap;
	}
	resetNotes(voice){
		for(var i = 0; i < 3; i++){
			this.values[i][voice] = null;
			this.names[i][voice] = null;
		}
		this.leap[voice] = null;
	}
	getName(voice, index){
		return this.names[index][voice];
	}
	getLeap(voice){
		return this.leap[voice];
	}
}



class NoteFunctions {
	constructor(){
		this.name_to_val = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11};
		var letters = ["C", "D", "E", "F", "G", "A", "B"];
		this.letter_index = {};
		this.simple_val_to_name = {};
		for(var i = 0; i < letters.length; i++){
			this.simple_val_to_name[this.name_to_val[letters[i]]] = letters[i];
		}
		for(var i = 0; i < letters.length; i++){
			this.letter_index[letters[i]] = i;
			var flat = letters[i] + "b";
			var flat_val = (this.name_to_val[letters[i]] + 11) % 12;
			this.name_to_val[flat] = flat_val;
			if(!(flat_val in this.simple_val_to_name)){
				this.simple_val_to_name[flat_val] = flat;
			}
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
		
		this.interval_mapping = {0: 0, 1: 1.5, 2: 3.5, 3: 5, 4: 7, 5: 8.5, 6: 10.5};
		
		this.chord_mapping = {"major": {0: 0, 1: 4, 2: 7}, "aug": {0: 0, 1: 4, 2: 8},
				      "minor": {0: 0, 1: 3, 2: 7}, "dim": {0: 0, 1: 3, 2: 6}};
	}
	nameToValue(name, octave){
		return this.name_to_val[name] + 12 * octave;
	}
	getAccidentalsInKey(key){
		//Note: this function returns an object using lower case letters as keys
		var start_value = key.pitch;
		var accidentals = {};
		var pitches;
		if(key.modality == "major"){
			pitches = [0, 2, 4, 5, 7, 9, 11];
		}
		else{
			pitches = [0, 2, 3, 5, 7, 8, 10];
		}
		for(var i = 0; i < pitches.length; i++){
			var value = (start_value + pitches[i]) % 12;
			var name = this.valueToName(value, key);
			accidentals[name.substring(0, 1).toLowerCase()] = name.substring(1);
		}
		return accidentals;
	}
	numToPitch(num, key){
		return (key.pitch + this.num_to_pitch[key.modality][num]) % 12;
	}
	getNotesInKey(key){
		var start_value = key.pitch;
		var notes = [];
		var pitches = this.num_to_pitch[key.modality];
		for(var i = 1; i < 8; i++){
			notes.push(this.valueToName(pitches[i] + start_value, key));
		}
		return notes;
	}
	getAccidental(base_pitch, target_pitch){
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
	valueToSimpleName(value){
		return this.simple_val_to_name[value % 12];
	}
	valueToName(value, key){
		value = value % 12;
		var adjusted_value = (value - key.pitch + 12) % 12;
		var key_letter = this.val_to_key_name[key.modality][key.pitch];
		var key_letter_index = this.letter_index[key_letter[0]];
		var val_letter_index = (key_letter_index + (this.pitch_to_num[adjusted_value] - 1)) % 7;
		var name = this.letters[val_letter_index];
		return name + this.getAccidental(this.name_to_val[name], value);
	}
	valueToNum(value, key){
		value = value % 12;
		var adjusted_value = (value - key.pitch + 12) % 12;
		return this.pitch_to_num[adjusted_value];
	}
	getPitch(chord, degree){
		var key = chord.key;
		var key_pitch = key.pitch;
		var root_pitch = this.num_to_pitch[key.modality][chord.roman_num];
		var degree_pitch = this.chord_mapping[chord.quality][degree];
		return (key_pitch + root_pitch + degree_pitch) % 12;
	}
	chordsEqual(chord1, chord2){
		return chord1.quality == chord2.quality && this.getPitch(chord1, 0) == this.getPitch(chord2, 0);
	}
	isAugOrDim(change, name1, name2){
		if(Math.abs(change) == 1){
			return false;
		}
		if(Math.abs(change) > 11){
			change = change % 12;
		}
		var letter_index1 = this.letter_index[name1[0]];
		var letter_index2 = this.letter_index[name2[0]];
		var letter_index_diff;
		if(change > 0){
			letter_index_diff = (letter_index1 - letter_index2 + 7) % 7;
		}
		else{
			letter_index_diff = (letter_index2 - letter_index1 + 7) % 7;
		}
		return Math.abs(Math.abs(change) - this.interval_mapping[letter_index_diff]) > 0.5;
	}
}

