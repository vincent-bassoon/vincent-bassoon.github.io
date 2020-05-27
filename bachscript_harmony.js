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
		this.max_single_score = 50;
		
		this.repeat = false;
		this.scores = null;
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
						return true;
					}
					if(voice1 + this.adjacent_max_dist[order_index][i] < voice2){
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
			return true;
		}
		if(order_index == 3 && harmony[index].equals_history()){
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
		else if(Math.abs(change) <= 4){
			return parity * 2;
		}
		else{
			return parity * 3;
		}
	}
	get_pitch_closest_to(pitch, static_value){
		while(Math.abs(static_value - pitch) > 6){
			pitch += 12;
		}
		return pitch;
	}
	fill_harmony(harmony, voicing, pitch_options, index, order_index, score){
		if(order_index == 4){
			if(index + 1 < harmony.length && !harmony[index].is_end_of_phrase()){
				harmony[index].update_avgs(harmony[index + 1]);
			}
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
				harmony[index].set_note(voice, option.value, option.name, option.leap);
				this.scores[index][voice] = option.score;
				if(this.has_errors(harmony, index, order_index)){
					harmony[index].set_note(voice, null, null, null);
				}
				else if(this.fill_harmony(harmony, voicing, pitch_options, index,
							  order_index + 1, score + option.score)){
					return true;
				}
				else{
					harmony[index].set_note(voice, null, null, null);
				}
			}
			voicing.push(degree);
		}
		return false;
	}
	add_option(options, harmony, chords, index, voice, value){
		var key = chords[index].get_key();
		var name = this.note_functions.value_to_name(value, key);
		if(index + 1 == harmony.length){
			options.unshift({"value": value, "name": name, "score": 0, "leap": 0});
			return;
		}
		var next_value = harmony[index + 1].get_value(voice, 0);
		if(this.note_functions.value_to_num(value, key) == 7 && next_value % 12 != key.get_pitch()){
			//leading tone check
			return;
		}
		var next_name = harmony[index + 1].get_name(voice, 0);
		var score = 0;
		var change = next_value - value;
		if(Math.abs(change) > 5 && !(voice == 0 && (Math.abs(change) == 7 || Math.abs(change) == 12))){
			//leaps greater than a fourth not allowed except for fifths and octaves in bass
			return;
		}
		if(this.note_functions.is_aug_or_dim(change, next_name, name)){
			// this check ignores augmented/diminished unison
			return;
		}
		
		var this_leap = this.calc_leap(change);
		var next_leap = harmony[index + 1].get_leap(voice);
		if(Math.abs(this_leap * next_leap) >= 6){
			//no two consecutive leaps if one of them is a fourth
			return;
		}
		if(Math.abs(this_leap * next_leap) == 4){
			// consecutive leaps of a third
			score += 20;
			if(this_leap == -1 * next_leap){
				//leap down then up, or up then down
				score += 20;
			}
		}
		if(this_leap == 0 && next_leap == 0){
			//consecutive stagnation
			score += 10;
		}
		if(!this.is_in_pref_range(value, voice)){
			score += 5;
		}
		
		if(voice == 3 && !harmony[index].is_end_of_phrase()){
			var target_avg = harmony[index + 1].get_target_avg(voice);
			var avg = harmony[index + 1].get_next_avg(voice, value);
			if(Math.abs(target_avg - avg) > 2){
				if(value > avg && avg > target_avg){
					score += 20;
				}
				else if(value < avg && avg < target_avg){
					score += 20;
				}
				else if(value == avg){
					score += 15;
				}
			}
		}
		
		if(score < this.max_single_score){
			for(var i = 0; i < options.length; i++){
				if(score < options[i].score){
					options.splice(i, 0, {"value": value, "name": name, "score": score, "leap": this_leap});
					return;
				}
			}
			options.push({"value": value, "name": name, "score": score, "leap": this_leap});
		}
	}
	generate_single_harmony(chords, harmony){
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
		var has_next_value = (index != chords.length - 1);
		for(var voice = 0; voice < 4; voice++){
			var no_options = true;
			var inversion = chords[index].get_inversion();
			var min_degree = 0;
			var max_degree = 2;
			if(voice == 0){
				if(inversion != null){
					max_degree = inversion;
					min_degree = inversion;
				}
				else{
					max_degree = 1;
					if(chords[index].get_modality() == "dim"){
						min_degree = 1;
					}
				}
			}
			for(var degree = min_degree; degree <= max_degree; degree++){
				if(!has_next_value){
					var value = this.get_pitch_in_pref_range(pitches[degree], voice);
					this.add_option(options[voice][degree], harmony, chords, index, voice, value);
				}
				else{
					//could also add the octave and the fifth
					var value = this.get_pitch_closest_to(pitches[degree], harmony[index + 1].get_value(voice, 0));
					if(this.is_in_absolute_range(value, voice)){
						this.add_option(options[voice][degree], harmony, chords, index, voice, value);
					}
				}
				if(options[voice][degree].length != 0){
					no_options = false;
				}
			}
			if(no_options){
				if(index + 1 > harmony.length - 1){
					console.log("COMPLETE FAILURE");
					this.global_index = -1;
					this.repeat = true;
				}
				else{
					console.log("going back to index ", (index + 1));
					harmony[index + 1].add_to_history();
					console.log("    added to history");
					this.global_index += 1;
				}
			}
		}
		if(this.fill_harmony(harmony, [0, 2, 1, 0], options, index, 0, 0)){
			this.global_index -= 1;
			return;
		}
		if(this.fill_harmony(harmony, [1, 0, 2, 1], options, index, 0, 0)){
			this.global_index -= 1;
			console.log("third doubling at index ", index);
			return;
		}
		if(this.fill_harmony(harmony, [0, 2, 1, 2], options, index, 0, 0)){
			this.global_index -= 1;
			console.log("fifth doubling at index ", index);
			return;
		}
		if(index + 1 > harmony.length - 1){
			console.log("COMPLETE FAILURE");
			this.global_index = -1;
			this.repeat = true;
		}
		else{
			console.log("going back to index ", (index + 1));
			harmony[index + 1].add_to_history();
			console.log("    added to history");
			this.global_index += 1;
		}
	}
	create_empty_harmony(chorale_plan, length){
		var harmony = [];
		this.scores = [];
		
		var target_avgs = [];
		var phrase_ends = [];
		var index = 0;
		for(var i = 0; i < chorale_plan.length; i++){
			var value;
			if(i == 0 || i == chorale_plan.length - 1){
				value = this.note_functions.name_to_value("Ab", 4) + choose_int({0: 0.36, 1: 0.34, 2: 0.3});
			}
			else{
				value = target_avgs[i - 1] + choose_int({1: 0.6, 2: 0.4});
			}
			index += chorale_plan[i].get_phrase_length();
			phrase_ends.push(index - 1);
			target_avgs.push(value);
		}
		for(var i = 0; i < length; i++){
			this.scores.push([null, null, null, null]);
			if(phrase_ends[0] == i){
				phrase_ends.shift();
				target_avgs.shift();
				harmony.push(new HarmonyUnit([null, null, null, null]));
			}
			else{
				harmony.push(new HarmonyUnit([null, null, null, target_avgs[0]]));
			}
		}
		return harmony;
	}
	generate_harmony(chords, chorale_plan){
		var nf = this.note_functions;
		
		var harmony = this.create_empty_harmony(chorale_plan, chords.length);
		
		this.global_index = chords.length - 1;
		while(this.global_index >= 0){
			this.generate_single_harmony(chords, harmony);
		}
		console.log(this.scores);
		if(this.repeat){
			return true;
		}
		new Score(harmony, chords, chorale_plan, nf).render_harmony();
		console.log(harmony);
		return false;
	}
}
