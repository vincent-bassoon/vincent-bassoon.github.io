function generate_chorale_plan(key, cadence_num, pickup){
	var lengths = {"pac": 3, "pac/iac": 3, "hc": 2, "dc": 3, "pc": 2, "pacm": 3};
	var endings = {"pac": 1, "pac/iac": 1, "hc": 5, "dc": 6, "pc": 1, "pacm": 1};
	var phrase_lengths = {};
	
	var retry = true;
	var num_beats = {7: 8, 8: 8, 9: 10, 10: 12};
	var fermata_index = {7: 6, 8: 6, 9: 8, 10: 8};
	var fermata_lengths = {7: 2, 8: 1, 9: 2, 10: 3};
	while(retry){
		retry = false;
		var sum = 0;
		for(var i = 0; i < cadence_num; i++){
			// 75% 7-8 note segment length, 25% 9-10 note length
			phrase_lengths[i] = pickup + choose_int({7: 0.75, 9: 0.25});
			if((sum + fermata_index[phrase_lengths[i]]) % 16 == 0){
				i = cadence_num;
				retry = true;
			}
			sum += num_beats[phrase_lengths[i]];
		}
	}
	
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
		var fermata_duration = fermata_lengths[phrase_lengths[i]];
		chorale_plan.push(new PhraseData(key, phrase_lengths[i], fermata_duration, i == cadence_num - 1,
						 cadence, cadence_length, previous_cadence_chord));
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
	var num_accidentals = choose_int({0: 0.2, 1: 0.2, 2: 0.2, 3: 0.2, 4: 0.15, 5: 0.03, 6: 0.02});
	var sharp_or_flat = choose_int({0: 0.5, 2: 0.5}) - 1;
	var pitch = (7 * (12 + (sharp_or_flat * num_accidentals))) % 12;
	
	var chorale_plan = generate_chorale_plan(new Key(pitch, modality), cadence_num, pickup);
	
	var harmony_functions = new HarmonyFunctions();
	var chord_functions = new ChordFunctions();
	
	var chords = [];
	for(var i = 0; i < cadence_num; i++){
		chords.push(...chord_functions.generate_segment_chords(chorale_plan[i]));
	}
	harmony_functions.generate_harmony(chords, chorale_plan);
}
