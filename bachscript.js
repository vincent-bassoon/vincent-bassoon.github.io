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
	var chords = chord_functions.generate_segment_chords(length, phrase_data);
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
