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
		
		var ac_probs = {1: 0.68, 3: 0.29, 5: 0.03};
		var hc_probs = {2: 0.66, 5: 0.15, 7: 0.19};
		
		this.cadence_probabilities = {"pac": ac_probs,
					      "pac/iac": ac_probs,
					      "hc": hc_probs,
					      "dc": {1: 0.78, 3: 0.22},
					      "pc": {1: 0.5, 5: 0.5},
					      "pacm": ac_probs};
		
		this.cadence_indicies = [];
		
		
	}
	is_cadence(index){
		return this.cadence_indicies.includes(index);
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
	fill_harmony(harmony, pitches, index, order_index){
		if(order_index == 4){
			return true;
		}
		var voice = this.voice_order[order_index];
	}
	generate_cadence_harmony(chords, harmony, cadence, key){
		var nf = this.note_functions;
		
		// set soprano notes
		var options = [];
		for(var option in this.cadence_probabilities[cadence]){
			options.push(option);
		}
		var num = choose_int_from_freqs_remove(this.cadence_probabilities[cadence], options);
		var pitch = nf.num_to_pitch(num, chords[chords.length - 1]);
			sop_values[i] = this.value_in_pref_range(temp, 3);
		harmony[harmony.length - 2 + i][3].set_note(sop_values[i]);
		
		// set base notes
		
		
	}
	create_empty_harmony(length){
		var harmony = [];
		for(var i = 0; i < length; i++){
			harmony.push({0: new Voice(null), 1: new Voice(null), 2: new Voice(null), 3: new Voice(null)});
		}
		return harmony;
	}
	generate_harmony(chord_array, chorale_plan){
		var nf = this.note_functions;
		
		var chords = [];
		var sum = -1;
		var fixed_pitches = {0: [], 1: [], 2: [], 3: []}
		for(var i = 0; i < chord_array.length; i++){
			chords.push(...chord_array[i]);
			
			sum += chord_array[i].length;
			this.cadence_indicies.push(sum);
			
			var num = choose_int(this.cadence_probabilities[chorale_plan[i].get_cadence()]);
			var pitch = nf.num_to_pitch_for_cad(num, chord_array[i][chord_array[i].length - 1]);
			fixed_pitches[3].unshift({"pitch": pitch, "index": sum});
		}
		
		var harmony = this.create_empty_harmony(chords.length);
		for(var i = 0; i < chords.length; i++){
			var inversion = chords[i].get_inversion();
			if(inversion != null){
				fixed_pitches[0].unshift({"pitch": nf.get_bass_pitch(chords[i]), "index": i});
			}
		}
		
		
		
		
		this.generate_cadence_harmony(chords, harmony, phrase_plan.get_cadence());
		
	}
}
