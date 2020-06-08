class HarmonyFunctions {
	constructor(){
		this.voice_order = [0, 3, 1, 2];
		this.check_adjacent = [];
		for(var i = 0; i < 4; i++){
			this.check_adjacent[i] = [false, false];
			for(var j = 0; j < i; j++){
				if(this.voice_order[j] == this.voice_order[i] + 1){
					this.check_adjacent[i][0] = true;
				}
				else if(this.voice_order[j] == this.voice_order[i] - 1){
					this.check_adjacent[i][1] = true;
				}
			}
		}
		
		this.adjacent_max_dist = [];
		var max_dist_above_voice = {3: 12 + 7, 2: 10, 1: 12};
		for(var i = 0; i < 4; i++){
			this.adjacent_max_dist[i] = [null, null];
			if(this.check_adjacent[i][0]){
				this.adjacent_max_dist[i][0] = max_dist_above_voice[this.voice_order[i] + 1];
			}
			if(this.check_adjacent[i][1]){
				this.adjacent_max_dist[i][1] = max_dist_above_voice[this.voice_order[i]];
			}
		}
		
		this.adjacent_direction = [-1, 1];
		this.parallel_pitches = [0, 7];
		this.max_total_score = 10000;
		this.max_single_score = 50;
		
		this.nf = new NoteFunctions();
		this.mf = new MotionFunctions(this.max_single_score);
		
		this.repeat = false;
		this.scores = null;
	}
	
	
	distBetweenVoices(harmony, index, order_index){
		var voice = this.voice_order[order_index];
		for(var i = 0; i < 2; i++){
			if(this.check_adjacent[order_index][i]){
				var parity = this.adjacent_direction[i];
				var max = Math.max(harmony[index].getNumNotes(voice), harmony[index].getNumNotes(voice + parity))
				for(var sub_index = 0; sub_index < max; sub_index++){
					var voice1 = parity * harmony[index].getValue(voice, sub_index);
					var voice2 = parity * harmony[index].getValue(voice + parity, sub_index);
					if(voice1 < voice2){
						return true;
					}
					if(voice1 + this.adjacent_max_dist[order_index][i] > voice2){
						return true;
					}
				}
			}
		}
		return false;
	}
	checkParallelIntervals(interval1, interval2){
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
		var voice1_num_notes = harmony[index].getNumNotes(voice1);
		for(var i = 0; i < order_index; i++){
			var voice2 = this.voice_order[i];
			var interval1 = Math.abs(harmony[index].getValue(voice1, 0) -
					harmony[index].getValue(voice2, 0)) % 12;
			var interval4 = Math.abs(harmony[index + 1].getValue(voice1, 0) -
						 harmony[index + 1].getValue(voice2, 0)) % 12;
			if(this.checkParallelIntervals(interval1, interval4)){
				return true;
			}
			var voice2_num_notes = harmony[index].getNumNotes(voice2);
			if(voice1_num_notes > 1 || voice2_num_notes > 1){
				var interval2 = Math.abs(harmony[index].getValue(voice1, 1) -
							 harmony[index].getValue(voice2, 1)) % 12;
				if(this.checkParallelIntervals(interval2, interval4)){
					return true;
				}
				if(this.checkParallelIntervals(interval1, interval2)){
					return true;
				}
				if(voice1_num_notes == 3 || voice2_num_notes == 3){
					var interval3 = Math.abs(harmony[index].getValue(voice1, 2) -
								 harmony[index].getValue(voice2, 2)) % 12;
					if(this.checkParallelIntervals(interval3, interval4)){
						return true;
					}
					if(this.checkParallelIntervals(interval2, interval3)){
						return true;
					}
				}
			}
		}
		return false;
	}
	hasErrors(harmony, index, order_index){
		if(order_index == 0){
			return false;
		}
		if(this.distBetweenVoices(harmony, index, order_index)){
			console.log("dist error");
			return true;
		}
		if(this.parallels(harmony, index, order_index)){
			console.log("parallel error");
			return true;
		}
		if(order_index == 3 && harmony[index].score.equalsHistory()){
			console.log("history error");
			return true;
		}
		return false;
	}
	
	fillHarmony(harmony, voicing, pitch_options, index, order_index, score_sum){
		if(score_sum > this.max_total_score){
			console.log("score error: ", score_sum);
			return false;
		}
		if(order_index == 4){
			if(index + 1 < harmony.length && !harmony[index].end_of_phrase){
				harmony[index].score.updateAvgs(harmony[index + 1]);
			}
			return true;
		}
		else if(order_index == 2){
			for(var i = 2; i <= 3; i++){
				if(index + i < harmony.length && harmony[index].chord.equals(harmony[index + i].chord)){
					var same = true;
					for(var voice = 0; voice < 4; voice += 3){
						if(harmony[index].getValue(voice, 0) != harmony[index + i].getValue(voice, 0)){
							same = false;
						}
					}
					if(same){
						console.log("same error");
						return false;
					}
				}
			}
		}
		var voice = this.voice_order[order_index];
		for(var i = 0; i < voicing.length; i++){
			var degree = voicing.shift();
			for(var j = 0; j < pitch_options[voice][degree].length; j++){
				var option = pitch_options[voice][degree][j];
				harmony[index].setNotes(voice, option.values, option.values.length, option.motion);
				harmony[index].score.scores[voice] = option.score;
				if(!this.hasErrors(harmony, index, order_index) &&
				   this.fillHarmony(harmony, voicing, pitch_options, index,
						    order_index + 1, score_sum + option.score)){
					return true;
				}
			}
			voicing.push(degree);
		}
		console.log("out of options error");
		return false;
	}
	addNctOptions(options, harmony, index, voice, key, next_key, value, next_value, simple_motion, next_motion){
		var queue = this.mf.getMotionOptions(next_value - value, simple_motion, next_motion);
		var start_num = key.valueToNum(value);
		/*if(key.valueToNum(next_value) == undefined){
			//this check isn't well written and is also possibly unnecessary
			//could also check if names are equal between keys
			console.log("next pitch not in current key");
			return;
		}*/
		while(queue.length > 0){
			var motion = queue.pop();
			var num_changes = this.mf.getNumChanges(motion);
			var values = [next_value];
			var names = [next_key.valueToName(next_value)];
			var valid = true;
			for(var i = num_changes.length - 1; i >= 0; i--){
				var num = ((start_num + num_changes[i] + 7 - 1) % 7) + 1;
				var pitch = key.numToPitch(num);
				values.unshift(this.nf.getValueClosestTo(pitch, values[0]));
				names.unshift(key.valueToName(pitch));
				if(this.nf.isAugOrDim(values[1] - values[0], names[0], names[1])){
					valid = false;
					i = -1;
				}
				//as it stands, unresolved leading tones are allowed within nct seq
			}
			values.pop();
			if(valid){
				var score = this.mf.getMotionScore(voice, motion, next_motion);
				var avg_value = 0;
				for(var j = 0; j < values.length; j++){
					avg_value += values[j];
				}
				avg_value = avg_value / values.length;
				if(!this.inPrefRange(avg_value, voice)){
					score += 10;
				}
				score += harmony[index].score.getAvgScore(harmony[index + 1].score, voice, avg_value);
				if(score < this.max_single_score){
					options.push({"values": values, "score": score, "motion": motion});
				}
			}
		}
	}
	addOption(options, harmony, index, voice, value){
		if(!this.nf.inAbsoluteRange(value, voice)){
			return;
		}
		var key = harmony[index].chord.key;
		if(index + 1 == harmony.length){
			options.unshift({"values": [value], "score": 0, "motion": this.mf.type.CONSTANT});
			return;
		}
		var next_key = harmony[index + 1].chord.key;
		var next_value = harmony[index + 1].getValue(voice, 0);
		var change = next_value - value;
		var motion = this.mf.getSimpleMotion(change);
		var next_motion = harmony[index + 1].getMotion(voice);
		
		if(key.valueToNum(value) == 7 && next_key.valueToName(next_value) != key.valueToName(key.pitch)){
			//leading tone check
			return;
		}
		if(this.nf.isAugOrDim(change, next_key.valueToName(next_value), key.valueToName(value))){
			// this check ignores augmented/diminished unison
			return;
		}
		if(Math.abs(change) < 6 && !harmony[index].end_of_phrase){
			//note: this current placement means aug/dim intervals and leading tone violations will not 
			// be considered with ncts
			this.addNctOptions(options, harmony, index, voice, key, next_key, value, next_value, motion, next_motion);
		}
		
		if(Math.abs(change) > 5 && !(voice == 3 && (Math.abs(change) == 7 || Math.abs(change) == 12))){
			//leaps greater than a fourth not allowed except for fifths and octaves in bass
			return;
		}
		
		var score = this.getMotionScore(voice, motion, next_motion);
		
		if(!this.nf.inPrefRange(value, voice)){
			score += 10;
		}
		
		score += harmony[index].score.getAvgScore(harmony[index + 1].score, voice, value);
		
		if(score < this.max_single_score){
			for(var i = 0; i < options.length; i++){
				if(score < options[i].score){
					options.splice(i, 0, {"values": [value], "score": score, "motion": motion});
					return;
				}
			}
			options.push({"values": [value], "score": score, "motion": motion});
		}
	}
	generateSingleHarmony(harmony){
		var index = this.global_index;
		if(index == -1){
			return;
		}
		var chord = harmony[index].chord
		var options = [];
		for(var voice = 0; voice < 4; voice++){
			options[voice] = [];
			for(var degree = 0; degree < 4; degree++){
				options[voice][degree] = [];
			}
		}
		
		var has_next_value = (index != harmony.length - 1);
		for(var voice = 0; voice < 4; voice++){
			var no_options = true;
			var inversion = chord.inversion;
			var min_degree = 0;
			var max_degree = 2;
			if(voice == 0){
				if(inversion != null){
					max_degree = inversion;
					min_degree = inversion;
				}
				else{
					max_degree = 1;
					if(chord.quality == "dim"){
						min_degree = 1;
					}
				}
			}
			for(var degree = min_degree; degree <= max_degree; degree++){
				if(!has_next_value){
					var value = this.nf.getValueInPrefRange(chord.pitches[degree], voice);
					this.addOption(options[voice][degree], harmony, index, voice, value);
				}
				else{
					var value = this.nf.getValueClosestTo(chord.pitches[degree],
											 harmony[index + 1].getValue(voice, 0));
					this.addOption(options[voice][degree], harmony, index, voice, value);
					if(voice == 3){
						var change = value - harmony[index + 1].getValue(voice, 0);
						if(change == 0 || change == 5){
							this.addOption(options[voice][degree], harmony, index, voice, value - 12);
						}
						if(change == 0 || change == -5){
							this.addOption(options[voice][degree], harmony, index, voice, value + 12);
						}
						
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
					return;
				}
				else{
					console.log("going back to index ", (index + 1));
					harmony[index + 1].score.addToHistory();
					console.log("    added to history");
					this.global_index += 1;
					return;
				}
			}
		}
		console.log("options: ", options);
		if(this.fillHarmony(harmony, [0, 2, 1, 0], options, index, 0, 0)){
			this.global_index -= 1;
			return;
		}
		if(this.fillHarmony(harmony, [1, 0, 2, 1], options, index, 0, 0)){
			this.global_index -= 1;
			console.log("third doubling at index ", index);
			return;
		}
		if(this.fillHarmony(harmony, [0, 2, 1, 2], options, index, 0, 0)){
			this.global_index -= 1;
			console.log("fifth doubling at index ", index);
			return;
		}
		if(index + 1 > harmony.length - 1 || this.retrace_attempts <= 0){
			console.log("COMPLETE FAILURE, AFTER ATTEMPTS: ", this.retrace_attempts);
			this.global_index = -1;
			this.repeat = true;
			return;
		}
		else{
			console.log("going back to index ", (index + 1));
			harmony[index + 1].score.addToHistory();
			console.log("    added to history");
			this.global_index += 1;
			this.retrace_attempts -= 1;
			return;
		}
	}
	createEmptyHarmony(phrase_lengths, chords){
		var harmony = [];
		
		var target_avgs = [];
		var phrase_ends = [];
		var index = 0;
		for(var i = 0; i < phrase_lengths.length; i++){
			var value;
			if(i == 0 || i == phrase_lengths.length - 1){
				value = (8 + 48) + chooseInt({0: 0.36, 1: 0.34, 2: 0.3});
			}
			else{
				value = target_avgs[i - 1] + chooseInt({1: 0.6, 2: 0.4});
			}
			index += phrase_lengths[i];
			phrase_ends.push(index - 1);
			target_avgs.push(value);
		}
		for(var i = 0; i < chords.length; i++){
			if(phrase_ends[0] == i){
				phrase_ends.shift();
				target_avgs.shift();
				harmony.push(new HarmonyUnit(chords[i], [null, null, null, null], true));
			}
			else{
				harmony.push(new HarmonyUnit(chords[i], [null, null, null, target_avgs[0]], false));
			}
		}
		return harmony;
	}
	generateHarmony(chords, phrase_lengths, sampler){		
		var harmony = this.createEmptyHarmony(phrase_lengths, chords);
		
		this.global_index = chords.length - 1;
		this.retrace_attempts = 3 * (chords.length - 1);
		while(this.global_index >= 0){
			this.generateSingleHarmony(harmony);
		}
		if(this.repeat){
			return false;//true;
		}
		new Score(harmony, this.nf, phrase_lengths, sampler).renderHarmony();
		console.log(harmony);
		return false;
	}
}
