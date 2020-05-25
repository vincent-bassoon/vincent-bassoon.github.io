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
		this.check_adjacent = [];
		for(var i = 0; i < 4; i++){
			this.check_adjacent[i] = [false, false];
			for(var j = 0; j < i; j++){
				if(this.voice_order[j] == this.voice_order[i] - 1){
					this.check_adjacent[i][0] = true;
				}
				else if(this.voice_order[j] == this.voice_order[i] + 1){
					this.check_adjacent[i][1] = true;
				}
			}
		}
		
		this.adjacent_max_dist = [];
		var max_dist_above_voice = {0: 12 + 7, 1: 10, 2: 12};
		for(var i = 0; i < 4; i++){
			this.adjacent_max_dist[i] = [null, null];
			if(this.check_adjacent[i][0]){
				this.adjacent_max_dist[i][0] = max_dist_above_voice[this.voice_order[i] - 1];
			}
			if(this.check_adjacent[i][1]){
				this.adjacent_max_dist[i][1] = max_dist_above_voice[this.voice_order[i]];
			}
		}
		
		this.adjacent_direction = [-1, 1];
		this.parallel_pitches = [0, 7];
	}
	
	
	dist_between_voices(harmony, index, order_index){
		var voice = this.voice_order[order_index];
		for(var i = 0; i < 2; i++){
			if(this.check_adjacent[order_index][i]){
				for(var start_or_end = 0; start_or_end < 2; start_or_end++){
					var parity = this.adjacent_direction[i];
					var voice1 = parity * harmony[index].get_value(voice, start_or_end);
					var voice2 = parity * harmony[index].get_value(voice + parity, start_or_end);
					if(voice1 > voice2){
						console.log("  crossed");
						return true;
					}
					if(voice1 + this.adjacent_max_dist[order_index][i] < voice2){
						console.log("  voices too far apart");
						return true;
					}
				}
			}
		}
		return false;
	}
	parallels_helper(harmony, voice1, voice2, index1, index2){
		var interval = Math.abs(harmony[index1].get_value(voice1, 1) -
					harmony[index1].get_value(voice2, 1)) % 12;
		for(var j = 0; j < 2; j++){
			if(interval == this.parallel_pitches[j]){
				var interval2 = Math.abs(harmony[index2].get_value(voice1, 0) -
							 harmony[index2].get_value(voice2, 0)) % 12;
				if(interval2 == interval){
					console.log("  parallels");
					return true;
				}
			}
		}
		return false;
	}
	parallels(harmony, index, order_index){
		if(index == harmony.length - 1 || order_index == 0){
			return false;
		}
		var voice1 = this.voice_order[order_index];
		var check_within_unit = harmony[index].has_two_values(voice1);
		for(var i = 0; i < order_index; i++){
			var voice2 = this.voice_order[i];
			if(this.parallels_helper(harmony, voice1, voice2, index, index + 1)){
				return true;
			}
			if(check_within_unit && harmony[index].has_two_values(voice2)){
				if(this.parallels_helper(harmony, voice1, voice2, index, index)){
					return true;
				}
			}
		}
		return false;
	}
	has_errors(harmony, index, order_index){
		if(order_index == 0){
			return false;
		}
		if(this.dist_between_voices(harmony, index, order_index)){
			return true;
		}
		if(this.parallels(harmony, index, order_index)){
			return true;
		}
		return false;
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
		return value >= this.absolute_ranges[voice_index].min && value <= this.absolute_ranges[voice_index].max;
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
	fill_harmony(harmony, voicing, pitch_options, index, order_index){
		if(order_index == 4){
			return true;
		}
		var voice = this.voice_order[order_index];
		for(var i = 0; i < voicing.length; i++){
			var degree = voicing.shift();
			for(var j = 0; j < pitch_options[voice][degree].length; j++){
				harmony[index].set_note(voice, pitch_options[voice][degree][j]);
				if(this.has_errors(harmony, index, order_index)){
					harmony[index].set_note(voice, null);
				}
				else if(this.fill_harmony(harmony, voicing, pitch_options, index, order_index + 1)){
					return true;
				}
				else{
					harmony[index].set_note(voice, null);
				}
			}
			voicing.push(degree);
		}
		return false;
	}
	generate_single_harmony(chords, harmony, index, fixed_pitches){
		this.reset_pitch_options();
		var options = this.pitch_options;
		
		var pitches = [];
		for(var degree = 0; degree < 3; degree++){
			pitches[degree] = this.note_functions.get_pitch(chords[index], degree);
		}
		
		for(var voice = 0; voice < 4; voice++){
			if(fixed_pitches[voice].length != 0 && fixed_pitches[voice][0].index == index){
				var fixed_pitch = fixed_pitches[voice].shift();
				options[voice][fixed_pitch.degree].push(fixed_pitch.pitch);
			}
			else{
				var prev_note;
				if(index == chords.length - 1){
					prev_note = null;
				}
				else{
					prev_note = harmony[index + 1].get_start_value(voice);
				}
				var min_degree = 0;
				var max_degree = 2;
				if(voice == 0){
					max_degree = 1;
					if(chords[index].get_modality() == "dim"){
						min_degree = 1;
					}
				}
				for(var degree = min_degree; degree <= max_degree; degree++){
					if(true){//prev_note == null){
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
		console.log("root doubling, starting at index ", index);
		if(this.fill_harmony(harmony, [0, 0, 1, 2], options, index, 0)){
			console.log("finished at index ", index);
			return;
		}
		console.log("third doubling, starting at index ", index);
		if(this.fill_harmony(harmony, [0, 1, 1, 2], options, index, 0)){
			console.log("finished at index ", index);
			return;
		}
		console.log("fifth doubling, starting at index ", index);
		if(this.fill_harmony(harmony, [0, 1, 2, 2], options, index, 0)){
			console.log("finished at index ", index);
			return;
		}
		console.log("failure at index ", index);
	}
	create_empty_harmony(length){
		var harmony = [];
		for(var i = 0; i < length; i++){
			harmony.push(new HarmonyUnit());
		}
		return harmony;
	}
	generate_harmony(chords, chorale_plan){
		var nf = this.note_functions;
		
		var sum = -1;
		var fixed_pitches = {0: [], 1: [], 2: [], 3: []}
		for(var i = 0; i < chorale_plan.length; i++){
			
			sum += chorale_plan[i].get_phrase_length();
			this.cadence_indicies.push(sum);
			
			var num = choose_int(this.cadence_probabilities[chorale_plan[i].get_cadence()]);
			var degree = chords[sum].get_degree(num);
			var pitch = nf.num_to_pitch_for_cad(num, chords[sum]);
			pitch = this.get_pitch_in_pref_range(pitch, 3);
			fixed_pitches[3].unshift({"pitch": pitch, "degree": degree, "index": sum});
		}
		
		var harmony = this.create_empty_harmony(chords.length);
		for(var i = 0; i < chords.length; i++){
			var inversion = chords[i].get_inversion();
			if(inversion != null){
				var pitch = nf.get_bass_pitch(chords[i]);
				pitch = this.get_pitch_in_pref_range(pitch, 0);
				fixed_pitches[0].unshift({"pitch": pitch, "degree": inversion, "index": i});
			}
		}
		//COMMENT OUT LATER
		fixed_pitches = {0: [], 1: [], 2: [], 3: []};
		//COMMENT OUT LATER
		
		for(var i = chords.length - 1; i >= 0; i--){
			this.generate_single_harmony(chords, harmony, i, fixed_pitches);
		}
		new Score(harmony, chords, chorale_plan, nf).render_harmony();
	}
}
