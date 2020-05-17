class HarmonyFunctions {
	constructor(){
		this.note_functions = new NoteFunctions();
		var nf = this.note_functions;
		this.preferred_ranges = {0: {"min": nf.name_to_value("F", 2), "max": nf.name_to_value("E", 3)},
					 1: {"min": nf.name_to_value("F", 3), "max": nf.name_to_value("E", 4)},
					 2: {"min": nf.name_to_value("A", 3), "max": nf.name_to_value("Ab", 4)},
					 3: {"min": nf.name_to_value("E", 4), "max": nf.name_to_value("Eb", 5)}},
	
		this.absolute_ranges = {0: {"min": nf.name_to_value("C", 2), "max": nf.name_to_value("C", 4)},
					1: {"min": nf.name_to_value("C", 3), "max": nf.name_to_value("G", 4)},
					2: {"min": nf.name_to_value("G", 3), "max": nf.name_to_value("D", 5)},
					3: {"min": nf.name_to_value("C", 4), "max": nf.name_to_value("G", 5)}};
		
		// all cadential soprano voicings must leap less than a tritone.
		var ac_probs = {"2-1": 0.55, "4-3": 0.14, "7-1": 0.13, "2-3": 0.12, "5-3": 0.03, "5-5": 0.03};
		var hc_probs = {"3-2": 0.4, "1-2": 0.2, "4-5": 0.15, "1-7": 0.15, "2-7": 0.04, "4-2": 0.04, "2-2": 0.02};
		
		this.cadence_probabilities = {"pac": ac_probs,
					      "pac/iac": ac_probs,
					      "hc": hc_probs,
					      "dc": {"2-1": 0.6, "4-5": 0.22, "7-1": 0.18},
					      "pc": {"1-1": 0.5, "6-5": 0.5},
					      "pacm": ac_probs};
		
	}
	value_in_pref_range(pitch, voice_index){
		var min = this.preferred_ranges[voice_index].min;
		while(pitch < min){
			pitch += 12;
		}
		return pitch;
	}
	generate_adjacent(chords, harmony, existing_harmony, target_index, adjacent_index){
		if(Math.abs(adjacent_index - target_index) != 1){
			console.log("index error");
			return;
		}
		
	}
	complete_harmony(chords, harmony, start_index, end_index){
		var change;
		if(start_index > end_index){
			change = -1;
		}
		else{
			change = 1;
		}
		for(var i = start_index; i * change <= end_index * change; i += change){
			this.generate_adjacent(chords, harmony, null, i, i - change);
		}
	}
	complete_matching_harmony(chords, harmony, existing_harmony, start_index, end_index){
		var change;
		if(start_index > end_index){
			change = -1;
		}
		else{
			change = 1;
		}
		for(var i = start_index; i * change <= end_index * change; i += change){
			this.generate_adjacent(chords, harmony, existing_harmony, i, i - change);
		}
	}
	generate_cadence_harmony(chords, harmony, cadence, key){
		// set soprano notes
		
		var sop_pitches = [];
		var sop_values = [];
		var done = false;
		
		var options = [];
		for(var option in this.cadence_probabilities[cadence]){
			options.push(option);
		}
		
		do{
			var temp = choose_from_freqs_remove(this.cadence_probabilities[cadence], options).split("-");
			for(var i = 0; i < 2; i++){
				sop_pitches[i] = parseInt(temp[i]);
				sop_values[i] = this.value_in_pref_range(sop_pitches[i], 3);
			}
			
			console.log("cadence iteration");
			
			done = chords[chords.length - 2].is_in_chord(sop_pitches[0]) &&
				Math.abs(sop_values[1] - sop_values[0]) < 6;
			// 6 is the value of a tritone
		} while(!done);
		
		for(var i = 0; i < 2; i++){
			harmony[harmony.length - 2 + i][3].set_note(sop_values[i]);
		}
		
		// set base notes
		for(var i = 0; i < 2; i++){
			var bass = this.note_functions.get_bass(chords[chords.length - 1 - i]);
			if(bass != null){
				harmony[harmony.length - 1 - i][0].set_note(this.value_in_pref_range(bass, 0));
			}
		}
		// note: all cadences end with a root position chord
		
	}
	create_empty_harmony(length){
		var harmony = [];
		for(var i = 0; i < length; i++){
			harmony.push({0: new Voice(null), 1: new Voice(null), 2: new Voice(null), 3: new Voice(null)});
		}
		return harmony;
	}
	generate_harmony(chords, prev_harmony_unit, phrase_plan){
		if(prev_harmony_unit == null){
			var harmony = this.create_empty_harmony(chords.length);
			this.generate_cadence_harmony(chords, harmony, phrase_plan.get_cadence());
			this.complete_harmony(chords, harmony, chords.length - 3, 0);
			return harmony;
		}
		else{
			var length = chords.length + 1;
			var harmonies = [this.create_empty_harmony(length),
				       this.create_empty_harmony(length - 2)];
			harmonies[0][0] = prev_harmony_unit;
			harmonies[1][0] = prev_harmony_unit;
			this.generate_cadence_harmony(chords, harmonies[0], phrase_plan.get_cadence(), phrase_plan.get_key());
			
			this.complete_harmony(chords, harmonies[0], length - 3, 1);
			var stitch_index = this.complete_matching_harmony(chords, harmonies[1], harmonies[0], 1, length - 3);
			if(stitch_index != null){
				return this.stitch_and_trim(harmonies[0], harmonies[1], stitch_index);
			}
			
			this.complete_harmony(chords, harmonies[1], 1, length - 3);
			var stitch_index = this.complete_matching_harmony(chords, harmonies[0], harmonies[1], length - 3, 1);
			if(stitch_index != null){
				return this.stitch_and_trim(harmonies[0], harmonies[1], stitch_index);
			}
			return null;
		}
		
	}
}
