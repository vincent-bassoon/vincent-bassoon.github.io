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
	
	var chord_functions = new ChordFunctions();
	var harmony_functions = new HarmonyFunctions();
	var segments = [];
	for(var i = 0; i < cadence_num; i++){
		// 90% 7-8 note segment length, 10% 9-10 note length
		var length = pickup + choose_int({7: 0.8, 9: 0.2});
		//remove the next line after implementing harmony
		var chords = chord_functions.generate_segment_chords(length, chorale_plan[i]);
		var harmony = null;
		/*
		while(harmony == null){
			chords = chord_functions.generate_segment_chords(length, chorale_plan[i]);
			harmony = harmony_functions.generate_harmony(segments[i].chords, chorale_plan[i]);
		}
		
		*/
		segments.push({"chords":chords, "harmony":harmony});
	}
}




//   If not pickup, then 2 note pickup after downbeat cadence
//   If pickup, then 1 note pickup after downbeat cadence




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
