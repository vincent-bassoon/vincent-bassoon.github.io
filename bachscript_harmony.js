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
		this.pitch_options = {};
		for(var voice = 0; voice < 4; voice++){
			this.pitch_options[voice] = {};
			for(var degree = 0; degree < 4; degree++){
				this.pitch_options[voice][degree] = [];
			}
		}
		this.voice_order = [3, 0, 2, 1];
	}
	reset_pitch_options(){
		for(var voice = 0; voice < 4; voice++){
			for(var degree = 0; degree < 4; degree++){
				this.pitch_options[voice][degree] = [];
			}
		}
	}
	is_cadence(index){
		return this.cadence_indicies.includes(index);
	}
	is_in_absolute_range(value, voice_index){
		return value >= this.absolute_ranges[voice_index].min && 
			value <= this.absolute_ranges[voice_index].max;
	}
	get_pitch_in_pref_range(pitch, voice_index){
		var min = this.preferred_ranges[voice_index].min;
		while(pitch < min){
			pitch += 12;
		}
		return pitch;
	}
	get_pitch_closest_to(pitch, static_value){
		while(Math.abs(static_value - pitch) > 6){
			pitch += 12;
		}
		return pitch;
	}
	generate_single_harmony(chords, harmony, index, fixed_pitches){
		this.reset_pitch_options();
		var options = this.pitch_options;
		
		var pitches = [];
		for(var degree = 0; degree < 3; degree++){
			pitches[degree] = this.note_functions.get_pitch(chords[index], degree);
		}
		
		for(var voice = 0; voice < 4; voice++){
			if(fixed_pitches[voice].index == index){
				options[voice][fixed_pitches[voice].degree].push(fixed_pitches[voice].pitch);
			}
			else{
				var prev_note;
				if(index == chords.length - 1){
					prev_note = null;
				
				else{
					prev_note = harmony[index + 1][voice].get_start_value();
				}
				for(var degree = 0; degree < 3; degree++){
					if(prev_note == null){
						var value = this.get_pitch_in_pref_range(pitches[degree], voice);
						options[voice][degree].push(value);
					}
					else{
						var value = this.get_pitch_closest_to(pitches[degree], prev_note);
						if(this.is_in_absolute_range(value, voice)){
							options[voice][degree].push(value);
						}
					}
				}
			}
		}
		if(this.fill_harmony(harmony, [0, 0, 1, 2], options, index, 0)){
			return;
		}
		if(this.fill_harmony(harmony, [0, 1, 1, 2], options, index, 0)){
			return;
		}
		if(this.fill_harmony(harmony, [0, 1, 2, 2], options, index, 0)){
			return;
		}
		console.log("failure at index ", index);
	}
	has_errors(harmony, index, order_index){
		if(order_index == 0){
			return false;
		}
		return false;
	}
	fill_harmony(harmony, voicing, pitch_options, index, order_index){
		if(order_index == 4){
			return true;
		}
		var voice = this.voice_order[order_index];
		for(var i = 0; i < voicing.length; i++){
			for(var j = 0; j < pitch_options[voice][i].length; j++){
				harmony[index][voice].set_note(pitch_options[voice][i][j]);
				var num = voicing.shift();
				if(this.has_errors(harmony, index, order_index)){
					harmony[index][voice].set_note(null);
					voicing.push(num);
				}
				else if(this.fill_harmony(harmony, voicing, pitch_options, index, order_index + 1)){
					return true;
				}
				else{
					harmony[index][voice].set_note(null);
					voicing.push(num);
				}
			}
		}
		return false;
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
			var degree = chord_array[i][chord_array[i].length - 1].get_degree(num);
			var pitch = nf.num_to_pitch_for_cad(num, chord_array[i][chord_array[i].length - 1]);
			fixed_pitches[3].unshift({"pitch": pitch, "degree": degree, "index": sum});
		}
		
		var harmony = this.create_empty_harmony(chords.length);
		for(var i = 0; i < chords.length; i++){
			var inversion = chords[i].get_inversion();
			if(inversion != null){
				fixed_pitches[0].unshift({"pitch": nf.get_bass_pitch(chords[i]), "degree": inversion, "index": i});
			}
		}
		
		for(var i = chords.length - 1; i >= 0; i--){
			this.generate_single_harmony(chords, harmony, i, fixed_pitches);
		}
		return harmony;
	}
}
