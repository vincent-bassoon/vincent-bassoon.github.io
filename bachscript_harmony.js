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
		this.max_total_score = 100;
		this.max_single_score = 100;
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
	check_parallel_intervals(interval1, interval2){
		for(var i = 0; i < 2; i++){
			if(interval1 == this.parallel_pitches[i] && interval1 == interval2){
				return true;
			}
		}
		return false;
	}
	parallels(harmony, index, order_index){
		if(index == harmony.length - 1 || order_index == 0){
			return false;
		}
		var voice1 = this.voice_order[order_index];
		var voice1_has_two_values = harmony[index].has_two_values(voice1);
		for(var i = 0; i < order_index; i++){
			var voice2 = this.voice_order[i];
			var interval1 = Math.abs(harmony[index].get_value(voice1, 0) -
					harmony[index].get_value(voice2, 0)) % 12;
			var interval2 = Math.abs(harmony[index + 1].get_value(voice1, 0) -
						 harmony[index + 1].get_value(voice2, 0)) % 12;
			if(this.check_parallel_intervals(interval1, interval2)){
				return true;
			}
			var voice2_has_two_values = harmony[index].has_two_values(voice2)
			if(voice1_has_two_values || voice2_has_two_values){
				var interval3 = Math.abs(harmony[index].get_value(voice1, 1) -
							 harmony[index].get_value(voice2, 1)) % 12;
				if(this.check_parallel_intervals(interval3, interval2)){
					return true;
				}
				if(voice1_has_two_values && voice2_has_two_values){
					if(this.check_parallel_intervals(interval1, interval3)){
						return true;
					}
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
			console.log("  parallels");
			return true;
		}
		if(order_index == 3 && harmony[index].equals_history()){
			console.log("  equals history");
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
	is_in_pref_range(value, voice_index){
		return value >= this.preferred_ranges[voice_index].min && value <= this.preferred_ranges[voice_index].max;
	}
	get_pitch_in_pref_range(pitch, voice_index){
		var min = this.preferred_ranges[voice_index].min;
		while(pitch < min){
			pitch += 12;
		}
		return pitch;
	}
	calc_leap(change){
		if(change == 0){
			return 0;
		}
		var parity = 1;
		if(change < 0){
			parity = -1;
		}
		if(Math.abs(change) <= 2){
			return parity;
		}
		else{
			return parity * 2;
		}
	}
	get_pitch_closest_to(pitch, static_value){
		while(Math.abs(static_value - pitch) > 6){
			pitch += 12;
		}
		return pitch;
	}
	get_fp_range_score(value, index, fixed_pitch){
		if(fixed_pitch == null || fixed_pitch.index - index > 4){
			return 0;
		}
		var desired_diff = (fixed_pitch.index - index) * 2;
		var actual_diff = Math.abs(value - fixed_pitch.value);
		if(actual_diff < desired_diff){
			return 0;
		}
		else{
			return (actual_diff - desired_diff) * 5;
		}
	}
	get_fp_index(fixed_pitches, voice, index){
		for(var i = 0; i < fixed_pitches[voice].length; i++){
			if(index < fixed_pitches[voice][i].index){
				if(i - 1 < 0){
					return null;
				}
				else{
					return fixed_pitches[voice][i - 1].index;
				}
			}
		}
		return null;
	}
	fill_harmony(harmony, voicing, pitch_options, index, order_index, score){
		if(order_index == 4){
			return true;
		}
		if(score > this.max_total_score){//NEEDS ADJUSTMENT **************************
			return false;
		}
		var voice = this.voice_order[order_index];
		for(var i = 0; i < voicing.length; i++){
			var degree = voicing.shift();
			for(var j = 0; j < pitch_options[voice][degree].length; j++){
				var option = pitch_options[voice][degree][j];
				harmony[index].set_note(voice, option.value, option.leap);
				if(this.has_errors(harmony, index, order_index)){
					if(order_index == 3){
						harmony[index].add_to_history();
						console.log("    added to history");
					}
					harmony[index].set_note(voice, null, null);
				}
				else if(this.fill_harmony(harmony, voicing, pitch_options, index,
							  order_index + 1, score + option.score)){
					return true;
				}
				else{
					harmony[index].set_note(voice, null, null);
				}
			}
			voicing.push(degree);
		}
		return false;
	}
	add_option(options, harmony, index, voice, value, next_value, fixed_pitch){
		if(next_value == null){
			options.unshift({"value": value, "score": 0, "leap": 0});
			return;
		}
		var score = 0;
		var change = next_value - value;
		if(Math.abs(change) == 6){
			return;
		}
		
		var this_leap = this.calc_leap(change);
		var next_leap = harmony[index + 1].get_leap(voice);
		if(this_leap * next_leap > 0){
			score += 1;
		}
		if(Math.abs(this_leap * next_leap) == 4){
			score += 20;
		}
		if(this_leap == 0 && next_leap == 0){
			score += 1;
		}
		
		if(!this.is_in_pref_range(value, voice)){
			score += 5;
		}
		
		score += this.get_fp_range_score(value, index, fixed_pitch);
		
		if(score < this.max_single_score){
			for(var i = 0; i < options.length; i++){
				if(score < options[i].score){
					options.splice(i, 0, {"value": value, "score": score, "leap": this_leap});
					return;
				}
			}
			options.push({"value": value, "score": score, "leap": this_leap});
		}
	}
	generate_single_harmony(chords, harmony, fixed_pitches){
		var index = this.global_index;
		if(index == -1){
			return;
		}
		this.reset_pitch_options();
		var options = this.pitch_options;
		
		var pitches = [];
		for(var degree = 0; degree < 3; degree++){
			pitches[degree] = this.note_functions.get_pitch(chords[index], degree);
		}
		var fp_indices_change = [0, 0, 0, 0];
		for(var voice = 0; voice < 4; voice++){
			var next_value;
			if(index == chords.length - 1){
				next_value = null;
			}
			else{
				next_value = harmony[index + 1].get_start_value(voice);
			}
			var fp_index = this.get_fp_index(fixed_pitches, voice, index);
			var fixed_pitch = null;
			if(fp_index != null){
				fixed_pitch = fixed_pitches[voice][fp_index];
			}
			if(fixed_pitch != null && fixed_pitch.index == index){
				this.add_option(options[voice][fixed_pitch.degree], harmony, index, voice,
						fixed_pitch.value, next_value, fixed_pitch);
				if(options[voice][fixed_pitch.degree].length == 0){
					if(index + 1 > harmony.length - 1){
						console.log("COMPLETE FAILURE");
					}
					else{
						harmony[index + 1].add_to_history();
						console.log("    added to history");
						this.global_index += 1;
					}
					return;
				}
			}
			else{
				var min_degree = 0;
				var max_degree = 2;
				if(voice == 0){
					max_degree = 1;
					if(chords[index].get_modality() == "dim"){
						min_degree = 1;
					}
				}
				for(var degree = min_degree; degree <= max_degree; degree++){
					if(next_value == null){
						var value = this.get_pitch_in_pref_range(pitches[degree], voice);
						this.add_option(options[voice][degree], harmony, index, voice,
								value, next_value, fixed_pitch);
					}
					else{
						//could also add the octave and the fifth
						var value = this.get_pitch_closest_to(pitches[degree], next_value);
						if(this.is_in_absolute_range(value, voice)){
							this.add_option(options[voice][degree], harmony, index, voice,
									value, next_value, fixed_pitch);
						}
					}
				}
			}
		}
		console.log("root doubling, starting at index ", index);
		if(this.fill_harmony(harmony, [0, 2, 1, 0], options, index, 0, 0)){
			this.global_index -= 1;
			return;
		}
		console.log("third doubling, starting at index ", index);
		if(this.fill_harmony(harmony, [1, 0, 2, 1], options, index, 0, 0)){
			this.global_index -= 1;
			return;
		}
		console.log("fifth doubling, starting at index ", index);
		if(this.fill_harmony(harmony, [0, 2, 1, 2], options, index, 0, 0)){
			this.global_index -= 1;
			return;
		}
		console.log("failure at index ", index);
		if(index + 1 > harmony.length - 1){
			console.log("COMPLETE FAILURE");
		}
		else{
			harmony[index + 1].add_to_history();
			console.log("    added to history");
			this.global_index += 1;
		}
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
			var value = nf.num_to_pitch_for_cad(num, chords[sum]);
			value = this.get_pitch_in_pref_range(value, 3);
			fixed_pitches[3].unshift({"value": value, "degree": degree, "index": sum});
		}
		
		var harmony = this.create_empty_harmony(chords.length);
		for(var i = 0; i < chords.length; i++){
			var inversion = chords[i].get_inversion();
			if(inversion != null){
				var value = nf.get_bass_pitch(chords[i]);
				value = this.get_pitch_in_pref_range(value, 0);
				fixed_pitches[0].unshift({"value": value, "degree": inversion, "index": i});
			}
		}
		
		this.global_index = chords.length - 1;
		while(this.global_index >= 0){
			this.generate_single_harmony(chords, harmony, fixed_pitches);
		}
		new Score(harmony, chords, chorale_plan, nf).render_harmony();
	}
}
