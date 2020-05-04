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

function run(){
	var chord_data = new ChordData();
	// Decide basic structure
	
	// 50% major, 50% minor
	var modality = choose({"major":0.5, "minor":0.5});
	// 80% four-cadence length, 20% five-cadence
	var cadence_num = choose({4:0.8, 5:0.2});
	// 66.7% with pickup, 33.3% without
	var pickup = choose({1:0.667, 0:0.333});
	
	// key
	var num_accidentals = choose({0:0.2, 1:0.2, 2:0.2, 3:0.2, 4:0.14, 5:0.03, 6:0.02, 7:0.01});
	var sharp_or_flat = choose({-1:0.5, 1:0.5});
	var pitch = (7 * (12 + (sharp_or_flat * num_accidentals))) % 12;
	var key_data = {"key":pitch, "modality":modality};
	
	var segments = [];
	for(var i = 0; i < cadence_num; i++){
		// 90% 7-8 note segment length, 10% 9-10 note length
		var length = pickup + choose({7:0.9, 9:0.1});
		segments.push(generate_segment(length, segments, key_data, i, cadence_num, chord_data));
	}
	
	
}

function generate_segment(length, previous_segments, key_data, index, cadence_num, chord_data){
	var chords = [];
	var voices = [];
	for(var i = 0; i < length; i++){
		chords.push(null);
		voices.push(null);
	}
}

function generate_chords(chords, key_data, prev_chord, last, min, max, chord_data){
	if(min == 0){
		if(prev_chord == null){
			chords[0] = chord_data.choose_start_chord(key_data);
		}
		else{
			chords[0] = chord_data.choose_start_chord_after(prev_chord);
		}
	}
	var max_temp = max;
	if(max == chords.length){
		var cad = chord_data.choose_cad(last, key_data);
		var cad_length = chord_data.cad_length(cad);
		for(var i = 0; i < cad_length; i++){
			if(max - 1 - i >= min){
				chords[max - 1 - i] = chord_data.choose_cad_chord(cad, i, key_data);
				max_temp--;
			}
		}
	}
	else if(chords[max] != null && chords[max].cad != null){
		var cad = chords[max].cad;
		var cad_length = chord_data.cad_length(cad);
		for(var i = 0; i < cad_length; i++){
			if(chords.length - 1 - i < max && chords.length - 1 - i >= min){
				chords[chords.length - 1 - i] = chord_data.choose_cad_chord(cad, i, key_data);
				max_temp--;
			}
		}
	}
	var min_temp = Math.max(1, min);
	for(var index = max_temp - 1; index >= min_temp; index--){
		
	}
}

// I: ALL
// II: V, vii
// III: IV, VI
// IV: II, V, vii, I
// V: I, vii, VI, IV, II
// VI: IV, II, III, V
// vii: I, V


// Decide chords






// Construct melody
// PAC/IAC: 55% 2-1, 14% 4-3, 13% 7-1, 12% 2-3, 3% 5-3, 3% 5-5
// HC: 40% 3-2, 20% 1-2, 15% 4-5, 15% 1-7, 4% 2-7, 4% 4-2, 2% 2-2
// DC: 60% 2-1, 22% 4-5, 18% 7-1
// PC: 50% 1-1, 50% 6-5


// Harmonize


//   If not pickup, then 2 note pickup after downbeat cadence
//   If pickup, then 1 note pickup after downbeat cadence

class ChordData {
	constructor(){
		this.chord_functions = {"tonic":[1, 3, 6], "dominant":[5, 7], "predominant":[2, 4]};
	}
	choose_start_chord(key_data){
		// Starting chord: 70% V, 30% I
		return new Chord(choose({5:0.7, 1:0.3}), key_data.key, null);
	}
	choose_start_chord_after(prev_chord){
		// not-first, cadence-starting chord 85% like starting chord, 15% not
		if(choose({true:0.85, false:0.15})){
			return this.choose_start_chord(prev_chord.get_key());
		}
		else{
			return this.choose_chord_after(prev_chord);
		}
	}
	choose_cad(last, key_data){
		var cad;
		
		// Ending: 95% PAC, 5% IAC ... 70% Piccardy third for minor, 30% not
		if(last){
			cad = choose({"pac":0.95, "pac/iac":0.05});
			if(key_data.modality == "minor" && cad == "pac"){
				cad = choose({"pac":0.3, "pacm":0.7});
			}
		}
		// 74% PAC/IAC, 17% HC, 7% DC, 2% PC
		else{
			cad = choose({"pac":0.37, "pac/iac":0.37, "hc":0.17, "dc":0.07, "pc":0.02});
		}
		return cad;
	}
	cad_length(cad){
		if(cad == "hc"){
			return 1;
		}
		else if(cad == "pc"){
			return 2;
		}
		else{
			return 3;
		}
	}
	// note: index is from the end (0 is the last chord)
	choose_cad_chord(cad, index, key_data){
		if(index == 0){
			if(cad == "pacm"){
				return new Chord(1, key_data.key, "major", "pacm");
			else if(cad.contains("pac")){
				return new Chord(1, key_data.key, key_data.modality, "pac");
			}
		}
			else{
				
			}
		}
	}
	choose_chord_after(prev_chord){
		
	}
}

class Chord {
	constructer(roman_num, key, modality, cad){
		this.roman_num = roman_num;
		this.key = key;
		this.modality = modality;
		this.cad = cad;
	}
	get_roman_num(){return this.roman_num;}
	get_key(){return this.key;}
	get_modality(){return this.modality;}
	get_cad(){return this.cad;}
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
