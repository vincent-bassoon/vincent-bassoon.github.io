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
	constructor(key, cadence, cadence_length, previous_cadence_chord){
		this.key = key;
		this.cadence = cadence;
		this.cadence_length = cadence_length;
		this.previous_cadence_chord = previous_cadence_chord;
	}
	get_key(){return this.key;}
	get_cadence(){return this.cadence;}
	get_cadence_length(){return this.cadence_length;}
	get_previous_cadence_chord(){return this.previous_cadence_chord;}
}

class Chord {
	constructor(roman_num, key, chord_modality, inversion){
		this.roman_num = roman_num;
		this.key = key;
		this.chord_modality = chord_modality;
		this.inversion = inversion;
	}
	get_roman_num(){return this.roman_num;}
	get_key(){return this.key;}
	get_modality(){return this.chord_modality;}
	get_inversion(){return this.inversion;}
}

class ChordFunctions {
	constructor(){
		// 0 is I, 1 is V or vii, 2 ii, 3 IV, 4 vi, 5 iii
		//{2: 0.65, 4: 0.35}
		this.chord_to_class = {1: 0, 5: 1, 7: 1, 2: 2, 4: 3, 6: 4, 3: 5};
		this.class_to_chord = {0: 1, 2: 2, 3: 4, 4: 6, 5: 3};
		this.cadences = {"pac": [1, 5], "pac/iac": [1], "hc": [5], "dc": [6, 5], "pc": [1, 4], "pacm": [1, 5]};
		this.modalities = {"major": {1: "major", 2: "minor", 3: "minor", 4: "major", 5: "major", 6: "minor", 7: "dim"},
				   "minor": {1: "minor", 2: "dim", 3: "major", 4: "minor", 5: "major", 6: "major", 7: "dim"}};
		// 3-6-4/2-5-1
	}
	generate_chord(roman_num, key, inversion){
		return new Chord(roman_num, key, this.modalities[key.get_modality()][roman_num], inversion);
	}
	get_chord_roman_num(chord_class){
		if(chord_class == 1){
			return choose_int({5: 0.95, 7: 0.05})
		}
		else{
			return this.class_to_chord[chord_class];
		}
	}
	generate_remaining_chords(phrase_chords, num_chords, next_chord_roman_num, key){
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
				var num = this.get_chord_roman_num(chord_class);
				phrase_chords.unshift(this.generate_chord(num, key, null));
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
			// choices should be a subset of [2, 3, 4 or 5]
			
			var freqs = {2: 20, 3: 30, 4: 30, 5: 200};
			var removed = choose_int_from_freqs(freqs, choices);
			for(var i = 0; i < num_chords + 1; i++){
				chord_class++
				if(chord_class != removed){
					var num = this.get_chord_roman_num(chord_class);
					phrase_chords.unshift(this.generate_chord(num, key, null));
				}
			}
			return;
		}
	}
	// returns chords of a phrase of specified length, first chord of phrase is at index 0
	generate_phrase_chords(phrase_length, key){
		var phrase_chords = [];
		phrase_chords.unshift(this.generate_chord(1, key, null));
		this.generate_remaining_chords(phrase_chords, phrase_length - 1, 1, key);
		console.log("phrase chords: ", phrase_chords);
		return phrase_chords;
	}
	// returns chords of the entire cadence phrase, first chord of phrase is at index 0
	generate_cadence_chords(cad, cad_length, phrase_length, key){
		var cadence_chords = [];
		for(var i = 0; i < this.cadences[cad].length; i++){
			if(cad == "pacm" && i == 0){
				cadence_chords.unshift(new Chord(this.cadences[cad][i], key, "major", 0));
			}
			else{
				cadence_chords.unshift(this.generate_chord(this.cadences[cad][i], key, 0));
			}
		}
		if(cad_length == 4){
			cadence_chords.unshift(this.generate_chord(1, key, 2));
		}
		var roman_num = this.cadences[cad][this.cadences[cad].length - 1];
		this.generate_remaining_chords(cadence_chords, phrase_length - cadence_chords.length, roman_num, key);
		console.log("cadence chords: ", cadence_chords);
		return cadence_chords;
	}
}

function generate_chorale_plan(key, cadence_num){
	var lengths = {"pac": 3, "pac/iac": 3, "hc": 2, "dc": 3, "pc": 2, "pacm": 3};
	var endings = {"pac": 1, "pac/iac": 1, "hc": 5, "dc": 6, "pc": 1, "pacm": 1};
	var chorale_plan = [];
	var previous_cadence_chord = null;
	for(var i = 0; i < cadence_num; i++){
		var cadence;
		
		// Ending: 100% PAC ... 70% Piccardy third for minor, 30% not
		if(i == cadence_num - 1){
			if(key.get_modality() == "minor"){
				cadence = choose({"pac": 0.3, "pacm": 0.7});
			}
			else{
				cadence = "pac";
			}
		}
		// 74% PAC/IAC, 17% HC, 7% DC, 2% PC
		else{
			cadence = choose({"pac": 0.37, "pac/iac": 0.34, "hc": 0.2, "dc": 0.07, "pc": 0.02});
		}
		
		var cadence_length = lengths[cadence];
		// 4 beat cadence includes a 64 tonic
		if(cadence != "pac/iac" && cadence_length == 3 && choose_int({0: 0.8, 1: 0.2}) == 0){
			cadence_length++;
		}
		chorale_plan.push(new PhraseData(key, cadence, cadence_length, previous_cadence_chord));
		previous_cadence_chord = endings[cadence];
	}
	return chorale_plan;
}

function run(){
	var chord_functions = new ChordFunctions();
	// Decide basic structure
	
	// 50% major, 50% minor
	var modality = choose({"major": 0.5, "minor": 0.5});
	// 80% four-cadence length, 20% five-cadence
	var cadence_num = choose_int({4: 0.8, 5: 0.2});
	// 66.7% with pickup, 33.3% without
	var pickup = choose_int({1: 0.667, 0: 0.333});
	
	// key
	var num_accidentals = choose_int({0: 0.2, 1: 0.2, 2: 0.2, 3: 0.2, 4: 0.14, 5: 0.03, 6: 0.02, 7: 0.01});
	var sharp_or_flat = choose_int({0: 0.5, 2: 0.5}) - 1;
	var pitch = (7 * (12 + (sharp_or_flat * num_accidentals))) % 12;
	
	var chorale_plan = generate_chorale_plan(new Key(pitch, modality), cadence_num);
	
	var segments = [];
	for(var i = 0; i < cadence_num; i++){
		// 90% 7-8 note segment length, 10% 9-10 note length
		var length = pickup + choose_int({7: 0.8, 9: 0.2});
		segments.push(generate_segment(length, segments, chorale_plan[i], chord_functions));
	}
	
	
}

function generate_segment(length, previous_segments, phrase_data, chord_functions){
	var voices = [];
	for(var i = 0; i < length; i++){
		voices.push(null);
	}
}

function generate_chords(length, phrase_data, chord_functions){
	var sub_phrase_lengths = generate_sub_phrases(length, phrase_data);
	var chords = [];
	var key = phrase_data.get_key();
	
	// first chords manual input (to avoid vii)
	var first_phrase_length = sub_phrase_lengths.shift();
	if(first_phrase_length == 1){
		chords.push(chord_functions.generate_chord(1, key, null));
	}
	else if(first_phrase_length == 2){
		chords.push(chord_functions.generate_chord(5, key, null));
		chords.push(chord_functions.generate_chord(1, key, null));
	}
	else{
		console.log("first sub phrase length error: ", first_phrase_length);
	}
	
	var cadence_chords = chord_functions.generate_cadence_chords(phrase_data.get_cadence(),
								     phrase_data.get_cadence_length(),
								     sub_phrase_lengths.pop(),
								     key);
	for(var i = 0; i < sub_phrase_lengths.length; i++){
		chords.push(...chord_functions.generate_phrase_chords(sub_phrase_lengths[i], key));
	}
	chords.push(...cadence_chords);
	console.log("chords: ", chords);
}

function generate_sub_phrases(length, phrase_data){
	var sub_phrase_lengths = [];
	
	// sub_phrase_length of 2 means V-I, 1 means I
	var probs;
	switch(phrase_data.get_previous_cadence_chord()){
		case 1:
			probs = {1: 0.4, 2: 0.6};
			break;
		case 5:
			probs = {1: 0.7, 2: 0.3};
			break;
		case 6:
			probs = {1: 0.9, 2: 0.1};
			break;
		default:
			// Starting chord: 70% V, 30% I
			probs = {1: 0.3, 2: 0.7};
	}
	sub_phrase_lengths.push(choose_int(probs));
	
	var cad_length = phrase_data.get_cadence_length()
	var spaces = length - cad_length - sub_phrase_lengths[0];
	
	// frequency of each addition to cadence sub-phrase
	var freqs = {0: 58, 1: 40, 2: 2};
	var choices = [0, 1, 2];
	for(var i = choices.length - 1; i >= 0; i--){
		if(choices[i] > spaces || choices[i] + 1 == spaces){
			choices.splice(i, 1);
		}
	}
	cad_length += choose_int_from_freqs(freqs, choices);
	spaces = length - cad_length - sub_phrase_lengths[0];
	
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
		var length_temp = choose_int_from_freqs(freqs, choices);
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


					


// Construct melody
// PAC/IAC: 55% 2-1, 14% 4-3, 13% 7-1, 12% 2-3, 3% 5-3, 3% 5-5
// HC: 40% 3-2, 20% 1-2, 15% 4-5, 15% 1-7, 4% 2-7, 4% 4-2, 2% 2-2
// DC: 60% 2-1, 22% 4-5, 18% 7-1
// PC: 50% 1-1, 50% 6-5


// Harmonize


//   If not pickup, then 2 note pickup after downbeat cadence
//   If pickup, then 1 note pickup after downbeat cadence


class Note {
	constructer(pitch, octave){
		this.pitch = pitch;
		this.octave = octave;
	}
	get_pitch(){return this.pitch}
	get_octave(){return this.octave}
	get_value(){
		return this.pitch + 12 * this.octave;
	}
}

class Score {
	constructor(length){
		this.harmony = [];
		for(var i = 0; i < length; i++){
			this.harmony[i] = {};
			this.harmony[i].voice = [[], [], [], []];
			this.harmony[i].chord = null;
		}
	}
	get_chord(chord_index){
		return this.harmony[chord_index].chord;
	}
	get_note(chord_index){
	}
}

function configure_ui(){
	//create_score(beat_num);
	VF = Vex.Flow;
	var div = document.getElementById("staff")
	var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
	renderer.resize(500, 500);
	var context = renderer.getContext();
	var stave = new VF.Stave(10, 40, 400);
	stave.addClef("treble").addTimeSignature("4/4");
	stave.setContext(context).draw();
}
