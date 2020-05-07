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

function choose_from_freqs(freqs, choices){
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
	console.log("Probability null choice error: ", freqs);
	return null;
}

function generate_chorale_plan(key, modality, cadence_num){
	var lengths = {"pac": 3, "pac/iac": 3, "hc": 2, "dc": 3, "pc": 2, "pacm": 3};
	var endings = {"pac": 1, "pac/iac": 1, "hc": 5, "dc": 6, "pc": 1, "pacm": 1};
	var chorale_plan = [];
	var previous_cadence_chord = null;
	for(var i = 0; i < cadence_num; i++){
		var modulation = {"key": key, "modality": modality};
		var cadence;
		
		// Ending: 100% PAC ... 70% Piccardy third for minor, 30% not
		if(i == cadence_num - 1){
			if(modality == "minor"){
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
		if(cadence != "pc" && choose({false: 0.8, true: 0.2})){
			cadence_length++;
		}
		chorale_plan.push(new PhraseData(modulation, cadence, cadence_length, previous_cadence_chord));
		previous_cadence_chord = endings[cadence];
	}
	return chorale_plan;
}

class PhraseData {
	// note: previous_cadence_chord means be careful updating a single PhraseData object without updating them all
	constructor(modulation, cadence, cadence_length, previous_cadence_chord){
		this.modulation = modulation;
		this.cadence = cadence;
		this.cadence_length = cadence_length;
		this.previous_cadence_chord = previous_cadence_chord;
	}
	get_modulation(){return this.modulation;}
	get_cadence(){return this.cadence;}
	get_cadence_length(){return this.cadence_length;}
	get_previous_cadence_chord(){return this.previous_cadence_chord;}
}

function run(){
	var chord_data = new ChordData();
	// Decide basic structure
	
	// 50% major, 50% minor
	var modality = choose({"major": 0.5, "minor": 0.5});
	// 80% four-cadence length, 20% five-cadence
	var cadence_num = choose({4: 0.8, 5: 0.2});
	// 66.7% with pickup, 33.3% without
	var pickup = choose({1: 0.667, 0: 0.333});
	
	// key
	var num_accidentals = choose({0: 0.2, 1: 0.2, 2: 0.2, 3: 0.2, 4: 0.14, 5: 0.03, 6: 0.02, 7: 0.01});
	var sharp_or_flat = choose({0: 0.5, 2: 0.5}) - 1;
	var pitch = (7 * (12 + (sharp_or_flat * num_accidentals))) % 12;
	
	var chorale_plan = generate_chorale_plan(pitch, modality, cadence_num);
	
	var segments = [];
	for(var i = 0; i < cadence_num; i++){
		// 90% 7-8 note segment length, 10% 9-10 note length
		var length = pickup + choose({7: 0.8, 9: 0.2});
		segments.push(generate_segment(length, segments, chorale_plan[i], chord_data));
	}
	
	
}

function generate_segment(length, previous_segments, phrase_data, chord_data){
	var voices = [];
	for(var i = 0; i < length; i++){
		voices.push(null);
	}
}

function generate_chords(length, phrase_data, chord_data){
	var sub_phrase_lengths = generate_sub_phrases(length, phrase_data);
	
	/*for(var i = max - 1; i >= min; i--){
		var cad_index = chords.length - 1 - i;
		if(cad_index < phrase_data.get_cadence_length()){
			chords[i] = chord_data.choose_cad_chord(cad_index, phrase_data);
		}
		else{
			chords[i] = chord_data.generate_chord_before(chords[i + 1], phrase_data);
		}
	}*/
	
}

function generate_sub_phrases(length, phrase_data){
	var sub_phrase_lengths = [];
	
	// sub_phrase_length of 2 means V-I, 1 means I
	switch(phrase_data.get_previous_cadence_chord()){
		case 1:
			sub_phrase_lengths.push(choose({1: 0.4, 2: 0.6}));
			break;
		case 5:
			sub_phrase_lengths.push(choose({1: 0.7, 2: 0.3}));
			break;
		case 6:
			sub_phrase_lengths.push(choose({1: 0.9, 2: 0.1}));
			break;
		default:
			// Starting chord: 70% V, 30% I
			sub_phrase_lengths.push(choose({1: 0.3, 2: 0.7}));
	}
	
	var cad_length = phrase_data.get_cadence_length()
	var spaces = length - cad_length - sub_phrase_lengths[0];
	console.log("pre mod spaces: ", spaces);
	
	/*
	prev_cadence_chord: all can lead to either 5 or 1 (varying probabilities)
	start: length of 1 or 2
	end:
		hc: 2 or 3
		pc: 2
		all pacs + dc: 3 or 4
		
		All cadences begin with predominant, can be extended by up to 2
	*/
	var freqs = {0: 49, 1: 49, 2: 2};
	var choices = [0, 1, 2];
	for(var i = choices.length - 1; i >= 0; i--){
		if(choices[i] > spaces || choices[i] + 1 == spaces){
			choices.splice(i, 1);
		}
	}
	cad_length += choose_from_freqs(freqs, choices);
	spaces = length - cad_length - sub_phrase_lengths[0];
	console.log("post cadence mod spaces: ", spaces);
	
	freqs = {2: 23, 3: 40, 4: 30, 5: 6, 6: 1}
	while(spaces > 4){
		choices = [];
		for(var i = Math.min(6, spaces); i >= 2; i--){
			if(i + 1 != spaces){
				choices.push(i);
			}
		}
		var length_temp = choose_from_freqs(freqs, choices);
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
	return sub_phrase_lengths;
}



// Decide chords






// Construct melody
// PAC/IAC: 55% 2-1, 14% 4-3, 13% 7-1, 12% 2-3, 3% 5-3, 3% 5-5
// HC: 40% 3-2, 20% 1-2, 15% 4-5, 15% 1-7, 4% 2-7, 4% 4-2, 2% 2-2
// DC: 60% 2-1, 22% 4-5, 18% 7-1
// PC: 50% 1-1, 50% 6-5


// Harmonize


//   If not pickup, then 2 note pickup after downbeat cadence
//   If pickup, then 1 note pickup after downbeat cadence

class ChordFunctions {
	constructor(){
		// 0 is tonic, 1 is dominant, sub-dominant, tonic prolongation, tonic prolongation+
		this.probs = {1: {5: 0.95, 7: 0.05}, 2: {2: 0.65, 4: 0.35}};
		this.constants = {0: 1, 3: 6, 4: 3};
	}
	get_chord(chord_class){
		if(chord_class == 1 || chord_class == 2){
			return choose(this.probs[chord_class]);
		}
		else{
			return this.constants[chord_class];
		}
	}
}

class ChordData {
	constructor(){
		this.chord_functions = new ChordFunctions();
	}
	// note: index is from the end (0 is the last chord)
	choose_cad_chord(index, phrase_data){
		var key_data = phrase_data.get_modulation();
		var cad = phrase_data.get_cadence();
		if(index == 2){
			return new Chord(this.chord_functions.get_chord(1), key_data.key, key_data.modality);
		}
		else if(index == 1){
			if(cad == "pc"){
				return new Chord(4, key_data.key, key_data.modality);
			}
			else{
				return new Chord(choose({5: 0.97, 7: 0.03}), key_data.key, key_data.modality);
			}
		}
		else if(index == 0){
			if(cad == "pacm"){
				return new Chord(1, key_data.key, "major");
			}
			else if(cad.includes("pac") || cad == "pc"){
				return new Chord(1, key_data.key, key_data.modality);
			}
			else if(cad == "hc"){
				return new Chord(5, key_data.key, key_data.modality);
			}
		}
		else{
			console.log("Cadence index error: ", index);
			return null;
		}
	}
}

class Chord {
	constructer(roman_num, key, modality){
		this.roman_num = roman_num;
		this.key = key;
		this.modality = modality;
	}
	get_roman_num(){return this.roman_num;}
	get_key(){return this.key;}
	get_modality(){return this.modality;}
}

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
