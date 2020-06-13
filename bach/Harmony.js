class HarmonyFunctions {
	constructor(){
		this.voice_order = [0, 3, 1, 2];
		
		this.max_dist_above = {3: 12 + 7, 2: 10, 1: 12};
		
		this.parallel_pitches = [0, 7];
		this.max_total_score = 100;
		this.max_single_score = 50;
		
		this.nf = new NoteFunctions();
		this.mf = new MotionFunctions(this.max_single_score);
		
		this.repeat = false;
	}
	
	shuffle(array){
		var current_index = array.length, temp_value, random_index;
		while (0 !== current_index) {
			random_index = Math.floor(Math.random() * current_index);
			current_index -= 1;
			temp_value = array[current_index];
			array[current_index] = array[random_index];
			array[random_index] = temp_value;
		}
	}
	distBetweenVoices(harmony, index, order_index){
		var voice = this.voice_order[order_index];
		for(var i = 0; i < order_index; i++){
			if(Math.abs(this.voice_order[i] - voice) == 1){
				var voice2 = this.voice_order[i];
				var max = Math.max(harmony[index].getNumNotes(voice), harmony[index].getNumNotes(voice2))
				var sus = Math.max(voice, voice2) == 3 && (harmony[index].getMotion(voice) == this.mf.type.SUSPENSION ||
									   harmony[index].getMotion(voice2) == this.mf.type.SUSPENSION);
				for(var sub_index = 0; sub_index < max; sub_index++){
					var lower_value = harmony[index].getValue(voice, sub_index);
					var upper_value = harmony[index].getValue(voice2, sub_index);
					var max_dist = this.max_dist_above[voice];
					if(voice2 > voice){
						max_dist = this.max_dist_above[voice2];
						var temp = lower_value;
						lower_value = upper_value;
						upper_value = temp;
					}
					if(lower_value > upper_value || (sus && lower_value == upper_value)){
						return true;
					}
					if(lower_value + max_dist < upper_value){
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
			var interval2;
			var interval1 = Math.abs(harmony[index].getValue(voice1, 0) -
						harmony[index].getValue(voice2, 0)) % 12;
			var max = Math.max(voice1_num_notes, harmony[index].getNumNotes(voice2));
			for(var j = 1; j < max; j++){
				interval2 = Math.abs(harmony[index].getValue(voice1, j) -
						     harmony[index].getValue(voice2, j)) % 12;
				if(this.checkParallelIntervals(interval1, interval2)){
					return true;
				}
				interval1 = interval2;
			}
			interval2 = Math.abs(harmony[index + 1].getValue(voice1, 0) -
					     harmony[index + 1].getValue(voice2, 0)) % 12;
			if(this.checkParallelIntervals(interval1, interval2)){
				return true;
			}
		}
		return false;
	}
	hasNctError(harmony, index, order_index){
		var has_nct = (harmony[index].getNumNotes(this.voice_order[order_index]) > 1)
		if(index == harmony.length - 1 || order_index == 0 || !has_nct){
			return false;
		}
		for(var i = 0; i < order_index; i++){
			if(harmony[index].getNumNotes(this.voice_order[i]) > 1){
				return true;
			}
		}
		return false;
	}
	hasErrors(harmony, index, order_index){
		if(order_index == 0){
			return false;
		}
		if(this.hasNctError(harmony, index, order_index)){
			return true;
		}
		if(this.distBetweenVoices(harmony, index, order_index)){
			return true;
		}
		if(this.parallels(harmony, index, order_index)){
			return true;
		}
		if(order_index == 3 && harmony[index].score.equalsHistory()){
			return true;
		}
		return false;
	}
	
	fillHarmony(harmony, voicing, doubling, options, index, order_index, score_sum){
		if(score_sum > this.max_total_score){
			console.log("score error: ", score_sum);
			return false;
		}
		if(order_index == 0){
			this.shuffle(this.voice_order);
			console.log(this.voice_order);
		}
		var check_same = false;
		if(order_index > 1 && this.voice_order[order_index - 1] == 3 || this.voice_order[order_index - 1] == 0){
			for(var i = 0; i < order_index - 1; i++){
				if(this.voice_order[i] == 3 || this.voice_order[i] == 0){
					check_same = true;
				}
			}
		}
		if(check_same){
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
		if(order_index == 4){
			if(index + 1 < harmony.length && !harmony[index].end_of_phrase){
				harmony[index].score.updateAvgs(harmony[index + 1].score);
			}
			return true;
		}
		var voice = this.voice_order[order_index];
		for(var i = 0; i < options[voice].length; i++){
			var option = options[voice][i];
			if(voicing[option.degree] > 0){
				var valid = true;
				if(option.motion == this.mf.type.SUSPENSION){
					valid = false;
					if(option.degree == 0 && harmony[index].bass_degree == 0){
						valid = true;
					}
					else if(option.degree == 1 && doubling != 1 && harmony[index].bass_degree == 0){
						valid = true;
					}
					else if(option.degree == 2 && doubling != 2 && harmony[index].bass_degree == 1){
						valid = true;
					}
				}
				if(valid){
					harmony[index].setNotes(voice, option.values, option.values.length, option.motion);
					if(voice == 3){
						harmony[index].bass_degree = option.degree;
					}
					harmony[index].score.scores[voice] = option.score;
					voicing[option.degree] -= 1;
					if(!this.hasErrors(harmony, index, order_index) &&
					   this.fillHarmony(harmony, voicing, doubling, options, index,
				 			    order_index + 1, score_sum + option.score)){
						return true;
					}
					voicing[option.degree] += 1;
				}
			}
		}
		return false;
	}
	addNctOptions(options, degree, harmony, index, voice, key, next_key, value, next_value, simple_motion, next_motion){
		var start_num = key.valueToNum(value);
		var sus_pitch = key.numToPitch((start_num % 7) + 1);
		var suspension = ((voice == 1 || voice == 2) && index > 1 && !harmony[index - 1].end_of_phrase &&
				  degree != 2 && harmony[index - 1].chord.pitches.includes(sus_pitch));
		var queue = this.mf.getMotionOptions(voice, simple_motion, suspension);
		/*if(key.valueToNum(next_value) == undefined){
			//this check isn't well written and is also possibly unnecessary
			//could also check if names are equal between keys
			console.log("next pitch not in current key");
			return;
		}*/
		for(var i = 0; i < queue.length; i++){
			if(queue[i] != this.mf.type.SUSPENSION){
				queue.splice(i, 1);
				i--;
			}
		}
		if((queue.length == 1) != suspension){
			console.log("discrepancy");
			console.log("numeral " + start_num + " at index " + index + " and voice " + voice + " gets sus: " + suspension);
		}
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
				var score = 0;
				if(index + 1 < harmony.length - 1){
					// harmony at index (length - 1) has no valid motion b/c no notes after
					score = this.mf.getMotionScore(voice, motion, next_motion);
				}
				if(motion == this.mf.type.SUSPENSION && degree == 0 && values[0] - values[1] == 1){
					score += 20;
				}
				var sum = 0;
				for(var j = 0; j < values.length; j++){
					sum += values[j];
				}
				var avg_value = sum / values.length;
				if(!this.nf.inPrefRange(avg_value, voice)){
					score += 10;
				}
				//score += harmony[index].score.getAvgScore(harmony[index + 1].score, voice, avg_value);
				if(score < this.max_single_score){
					for(var i = 0; i < options.length; i++){
						if(score < options[i].score){
							options.splice(i, 0, {"values": values, "score": score,
									      "motion": motion, "degree": degree});
							return;
						}
					}
					options.push({"values": values, "score": score,
						      "motion": motion, "degree": degree});
				}
			}
		}
	}
	addOption(options, degree, harmony, index, voice, value){
		if(!this.nf.inAbsoluteRange(value, voice)){
			return;
		}
		var key = harmony[index].chord.key;
		if(index + 1 == harmony.length){
			options.unshift({"values": [value], "score": 0, "motion": this.mf.type.CONSTANT, "degree": degree});
			return;
		}
		var next_key = harmony[index + 1].chord.key;
		var next_value = harmony[index + 1].getValue(voice, 0);
		var change = next_value - value;
		var motion = this.mf.getSimpleMotion(change);
		var next_motion = harmony[index + 1].getMotion(voice);
		
		if(next_motion == this.mf.type.SUSPENSION){
			if(value != next_value || next_key.valueToName(next_value) != key.valueToName(value)){
				return;
			}
		}
		if(key.valueToNum(value) == 7 && next_key.valueToName(next_value) != key.valueToName(key.pitch)){
			//leading tone check
			return;
		}
		if(this.nf.isAugOrDim(change, key.valueToName(value), next_key.valueToName(next_value))){
			// this check ignores augmented/diminished unison
			return;
		}
		if(Math.abs(change) < 6 && !harmony[index].end_of_phrase && next_motion != this.mf.type.SUSPENSION){
			//note: this current placement means aug/dim intervals and leading tone violations will not 
			// be considered with ncts
			this.addNctOptions(options, degree, harmony, index, voice, key, next_key, value, next_value, motion, next_motion);
		}
		
		if(Math.abs(change) > 5 && !(voice == 3 && (Math.abs(change) == 7 || Math.abs(change) == 12))){
			//leaps greater than a fourth not allowed except for fifths and octaves in bass
			return;
		}
		
		var score = 0;
		if(index + 1 < harmony.length - 1){
			// harmony at index (length - 1) has no valid motion b/c no notes after
			score = this.mf.getMotionScore(voice, motion, next_motion);
		}
		
		if(!this.nf.inPrefRange(value, voice)){
			score += 10;
		}
		
		//score += harmony[index].score.getAvgScore(harmony[index + 1].score, voice, value);
		
		if(score < this.max_single_score){
			for(var i = 0; i < options.length; i++){
				if(score < options[i].score){
					options.splice(i, 0, {"values": [value], "score": score, "motion": motion, "degree": degree});
					return;
				}
			}
			options.push({"values": [value], "score": score, "motion": motion, "degree": degree});
		}
	}
	generateSingleHarmony(harmony){
		var index = this.global_index;
		console.log("generate single harmony at index " + index);
		if(index == -1){
			return;
		}
		var chord = harmony[index].chord
		var options = [[], [], [], []];
		
		var has_next_value = (index != harmony.length - 1);
		for(var voice = 0; voice < 4; voice++){
			var inversion = chord.inversion;
			var min_degree = 0;
			var max_degree = 2;
			if(voice == 3){
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
					this.addOption(options[voice], degree, harmony, index, voice, value);
				}
				else{
					var value = this.nf.getValueClosestTo(chord.pitches[degree], harmony[index + 1].getValue(voice, 0));
					this.addOption(options[voice], degree, harmony, index, voice, value);
					if(voice == 3){
						var change = value - harmony[index + 1].getValue(voice, 0);
						if(change == 0 || change == 5){
							this.addOption(options[voice], degree, harmony, index, voice, value - 12);
						}
						if(change == 0 || change == -5){
							this.addOption(options[voice], degree, harmony, index, voice, value + 12);
						}
						
					}
				}
			}
			if(options[voice].length == 0){
				if(index + 1 > harmony.length - 1){
					console.log("COMPLETE FAILURE");
					this.global_index = -1;
					this.repeat = true;
					return;
				}
				else{
					console.log("no options");
					console.log("going back to index ", (index + 1));
					harmony[index + 1].score.addToHistory();
					console.log("    added to history");
					this.global_index += 1;
					return;
				}
			}
		}
		if(this.fillHarmony(harmony, {0: 2, 1: 1, 2: 1, 3: 0}, 0, options, index, 0, 0)){
			this.global_index -= 1;
			console.log("root doubling at index ", index);
			return;
		}
		if(this.fillHarmony(harmony, {0: 1, 1: 2, 2: 1, 3: 0}, 1, options, index, 0, 0)){
			this.global_index -= 1;
			console.log("third doubling at index ", index);
			return;
		}
		if(this.fillHarmony(harmony, {0: 1, 1: 1, 2: 2, 3: 0}, 2, options, index, 0, 0)){
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
				harmony.push(new HarmonyUnit(chords[i], [target_avgs[0], null, null, null], false));
			}
		}
		return harmony;
	}
	logAvgScore(harmony){
		var avg = 0;
		for(var i = 0; i < harmony.length; i++){
			var sum = 0;
			for(var voice = 0; voice < 4; voice++){
				sum += harmony[i].score.scores[voice];
			}
			avg += (sum / 4);
		}
		console.log("avg score: " + (avg / harmony.length));
	}
	generateHarmony(chords, phrase_lengths, sampler){		
		var harmony = this.createEmptyHarmony(phrase_lengths, chords);
		
		this.global_index = chords.length - 1;
		this.retrace_attempts = 5 * (chords.length - 1);
		while(this.global_index >= 0){
			this.generateSingleHarmony(harmony);
		}
		if(this.repeat){
			return false;//true;
		}
		new Score(harmony, this.nf, phrase_lengths, sampler).renderHarmony();
		console.log(harmony);
		this.logAvgScore(harmony);
		return false;
	}
}
