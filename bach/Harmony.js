class HarmonyFunctions {
	constructor(){
		
		this.max_dist_above = {3: 12 + 7, 2: 10, 1: 12};
		
		this.parallel_pitches = [0, 7];
		this.thirds_and_sixths = [3, 4, 8, 9];
		this.max_total_score = 100;
		this.max_single_score = 50;
		
		this.doubling_name = {0: "root", 1: "third", 2: "fifth"};
		
		this.nf = new NoteFunctions();
		this.mf = new MotionFunctions(this.max_single_score);
		
		this.state = {"running": 0, "success": 1, "failure": 2};
		this.current_state = this.state.running;
	}
	
	getVoicing(doubling){
		var voicing = {0: 1, 1: 1, 2: 1, 3: 0};
		voicing[doubling] += 1;
		return voicing;
	}
	getRandomOrder(length){
		var order = [];
		for(var i = 0; i < length; i++){
			order.push(i);
		}
		var current_index = order.length, temp_value, random_index;
		while (current_index != 0) {
			random_index = Math.floor(Math.random() * current_index);
			current_index -= 1;
			temp_value = order[current_index];
			order[current_index] = order[random_index];
			order[random_index] = temp_value;
		}
		return order;
	}
	getVoiceOrder(options){
		var order = this.getRandomOrder(4);
		var voice_order = [];
		var avgs = {};
		for(var j = 0; j < 4; j++){
			var voice = order[j];
			avgs[voice] = 0;
			for(var i = 0; i < options[voice].length; i++){
				avgs[voice] += options[voice][i].score;
			}
			avgs[voice] += 3 / (6 * Math.random() + 1);
			avgs[voice] /= options[voice].length;
			var added = false;
			for(var i = 0; i < voice_order.length; i++){
				if(avgs[voice] > avgs[voice_order[i]]){
					voice_order.splice(i, 0, voice);
					i = voice_order.length;
					added = true;
				}
			}
			if(!added){
				voice_order.push(voice);
			}
		}
		return voice_order;
	}
	distBetweenVoices(harmony, index, voice_order, order_index){
		var voice = voice_order[order_index];
		for(var i = 0; i < order_index; i++){
			var voice2 = voice_order[i];
			if(Math.abs(voice2 - voice) == 1){
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
	parallels(harmony, index, voice_order, order_index){
		if(index == harmony.length - 1 || order_index == 0){
			return false;
		}
		var voice1 = voice_order[order_index];
		var voice1_num_notes = harmony[index].getNumNotes(voice1);
		for(var i = 0; i < order_index; i++){
			var voice2 = voice_order[i];
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
	hasNctError(harmony, index, voice_order, order_index){
		if(index == harmony.length - 1 || order_index == 0 || harmony[index].getNumNotes(voice_order[order_index]) == 1){
			return false;
		}
		var doubling_valid;
		switch(Math.abs(harmony[index].getMotion(voice_order[order_index]))){
			case this.mf.type.PASSING_8:
				doubling_valid = true;
				break;
			case this.mf.type.PASSING_16:
				doubling_valid = true;
				break;
			default:
				doubling_valid = false;
				break;
		}
		for(var i = 0; i < order_index; i++){
			if(harmony[index].getNumNotes(voice_order[i]) > 1){
				if(doubling_valid && harmony[index].getMotion(voice_order[i]) == harmony[index].getMotion(voice_order[order_index]) &&
				   !harmony[index + 1].end_of_phrase && !harmony[index + 2].end_of_phrase &&
				   this.thirds_and_sixths.includes(Math.abs(harmony[index].getValue(voice_order[i], 0) - harmony[index].getValue(voice_order[order_index], 0)) % 12)){
					doubling_valid = false;
				}
				else{
					return true;
				}
			}
		}
		return false;
	}
	hasErrors(harmony, index, voice_order, order_index){
		if(order_index == 0){
			return false;
		}
		if(order_index == 3 && harmony[index].equalsHistory()){
			return true;
		}
		if(this.hasNctError(harmony, index, voice_order, order_index)){
			return true;
		}
		if(this.distBetweenVoices(harmony, index, voice_order, order_index)){
			return true;
		}
		if(this.parallels(harmony, index, voice_order, order_index)){
			return true;
		}
		return false;
	}
	checkSus(sus_degree, bass_degree, doubling){
		if(sus_degree == 0){
			return (bass_degree == 0 || (bass_degree == 1 && doubling != 0));
		}
		if(sus_degree == 1){
			return (doubling != 1 && bass_degree == 0);
		}
		if(sus_degree == 3){
			return true;
		}
		return false;
	}
	fillHarmony(harmony, index, options, voice_order, order_index, voicing, doubling, score_sum){
		if(score_sum > this.max_total_score){
			console.log("score error");
			return false;
		}
		var check_same = false;
		if(order_index > 1 && voice_order[order_index - 1] == 3 || voice_order[order_index - 1] == 0){
			for(var i = 0; i < order_index - 1; i++){
				if(voice_order[i] == 3 || voice_order[i] == 0){
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
						return false;
					}
				}
			}
		}
		if(order_index == 4){
			return this.generateSingleHarmony(harmony, index - 1);
		}
		var voice = voice_order[order_index];
		var past = voice_order.slice(0, order_index);
		for(var i = 0; i < options[voice].length; i++){
			var option = options[voice][i];
			if(voicing[option.degree] > 0){
				var valid = true;
				if(option.motion == this.mf.type.SUSPENSION && past.includes(3)){
					valid = this.checkSus(option.degree, harmony[index].getDegree(3), doubling);
				}
				else if(voice == 3){
					for(var j = 1; j <= 2; j++){
						if(valid && past.includes(j) && harmony[index].getMotion(j) == this.mf.type.SUSPENSION){
							valid = this.checkSus(harmony[index].getDegree(j), option.degree, doubling);
						}
					}
				}
				if(valid){
					harmony[index].setNotes(voice, option.values, option.degree,
								option.values.length, option.motion);
					harmony[index].setScore(voice, option.score);
					voicing[option.degree] -= 1;
					if(!this.hasErrors(harmony, index, voice_order, order_index) &&
					   this.fillHarmony(harmony, index, options, voice_order, order_index + 1,
							    voicing, doubling, score_sum + option.score)){
						return true;
					}
					voicing[option.degree] += 1;
				}
			}
		}
		return false;
	}
	addNctOptions(options, degree, harmony, index, voice, key, next_key, value, next_value, simple_motion, next_motion, only_sus){
		var start_num = key.valueToNum(value);
		var sus_pitch = key.numToPitch((start_num % 7) + 1);
		var suspension = ((voice == 1 || voice == 2) && index > 1 && !harmony[index - 1].end_of_phrase &&
				  degree != 2 && harmony[index - 1].chord.pitches.includes(sus_pitch));
		var queue;
		if(only_sus){
			queue = [];
		}
		else{
			queue = this.mf.getMotionOptions(voice, simple_motion, harmony[index].sixteenths);
		}
		if(degree == 3 && !harmony[index].end_of_phrase){
			queue.unshift(this.mf.type.SUSPENSION_7);
		}
		else if(suspension){
			queue.unshift(this.mf.type.SUSPENSION);
		}
		while(queue.length > 0){
			var motion = queue.pop();
			var num_changes = this.mf.getNumChanges(motion);
			var values = [next_value];
			var names = [next_key.valueToName(next_value)];
			var valid = true;
			if(degree == 3 && Math.abs(motion) == this.mf.type.PASSING_16 || Math.abs(motion) == this.mf.type.TURN){
				valid = false;
				num_changes = [];
			}
			for(var i = num_changes.length - 1; i >= 0; i--){
				var num = ((start_num + num_changes[i] + 7 - 1) % 7) + 1;
				var pitch;
				if(num_changes[i] == 0){
					pitch = value % 12;
				}
				else{
					pitch = key.numToPitch(num);
				}
				values.unshift(this.nf.getValueClosestTo(pitch, values[0]));
				names.unshift(key.valueToName(pitch));
				if(this.nf.isAugOrDim(values[1] - values[0], names[0], names[1])){
					valid = false;
					i = -1;
				}
				//as it stands, unresolved leading tones are allowed within nct seq
			}
			values.pop();
			if(valid && next_motion == this.mf.type.SUSPENSION){
				if(value[value.length - 1] != next_value ||
				   next_key.valueToName(next_value) != key.valueToName(value[value.length - 1])){
					valid = false;
				}
			}
			if(valid){
				var score = this.mf.getMotionScore(harmony, index, voice, motion);
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
		var only_sus = false;
		if(key.valueToNum(value) == 7 && next_key.valueToName(next_value) != key.valueToName(key.pitch)){
			//leading tone check, ignores inner voices at penultimate chord
			only_sus = true;
			if(!((voice == 1 || voice == 2) && harmony[index + 1].end_of_phrase && motion == -1 * this.mf.type.THIRD)){
				return;
			}
		}
		if(degree == 3 && motion != -1 * this.mf.type.STEP){
			//resolving 7th check
			return;
		}
		if(this.nf.isAugOrDim(change, key.valueToName(value), next_key.valueToName(next_value))){
			// this check ignores augmented/diminished unison
			return;
		}
		if(Math.abs(change) < 6 && !harmony[index].end_of_phrase){
			//note: this current placement means aug/dim intervals and leading tone violations will not 
			// be considered with ncts
			this.addNctOptions(options, degree, harmony, index, voice, key, next_key, value, next_value, motion, next_motion, only_sus);
		}
		if(harmony[index + 1].chord.mod == "mediant" && (motion == this.mf.type.THIRD || motion == this.mf.type.LEAP)){
			// makes sure it never leaps up to mediant chord
			return;
		}
		if(next_motion == this.mf.type.SUSPENSION){
			if(value != next_value || next_key.valueToName(next_value) != key.valueToName(value)){
				return;
			}
		}
		
		if(Math.abs(change) > 5 && !(voice == 3 && (Math.abs(change) == 7 || Math.abs(change) == 12))){
			//leaps greater than a fourth not allowed except for fifths and octaves in bass
			return;
		}
		
		var score = 0;
		if(index + 1 < harmony.length - 1){
			// harmony at index (length - 1) has no valid motion b/c no notes after
			score = this.mf.getMotionScore(harmony, index, voice, motion);
		}
		
		if(!this.nf.inPrefRange(value, voice)){
			score += 10;
		}
		
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
	generateOptions(harmony, index){
		var chord = harmony[index].chord;
		
		var options = [[], [], [], []];
		
		for(var voice = 0; voice < 4; voice++){
			var inversion = chord.inversion;
			var min_degree = 0;
			var max_degree = 2;
			if(chord.seven){
				max_degree = 3;
			}
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
			if(index == harmony.length - 1 && voice == 0){
				min_degree = 0;
				max_degree = 0;
			}
			for(var degree = min_degree; degree <= max_degree; degree++){
				if(index == harmony.length - 1){
					var value = this.nf.getValueInPrefRange(chord.pitches[degree], voice);
					this.addOption(options[voice], degree, harmony, index, voice, value);
				}
				else{
					var value = this.nf.getValueClosestTo(chord.pitches[degree], harmony[index + 1].getValue(voice, 0));
					this.addOption(options[voice], degree, harmony, index, voice, value);
					if(voice == 3 && (harmony[index].end_of_phrase || harmony[index + 1].end_of_phrase || harmony[index + 2].end_of_phrase)){
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
				return null;
			}
		}
		return options;
	}
	generateSingleHarmony(harmony, index){
		if(this.current_state != this.state.running){
			return true;
		}
		if(index == -1){
			this.current_state = this.state.success;
			return true;
		}
		if(this.retrace_attempts <= 0 || index > harmony.length - 1){
			this.current_state = this.state.failure;
			return true;
		}
		var options = this.generateOptions(harmony, index);
		if(options != null){
			var voice_order = this.getVoiceOrder(options);
			if(harmony[index].chord.seven){
				if(this.fillHarmony(harmony, index, options, voice_order, 0, this.getVoicing(3), null, 0)){
					return true;
				}
				if(this.fillHarmony(harmony, index, options, voice_order, 0, {0: 2, 1: 1, 2: 0, 3: 1}, 0, 0)){
					return true;
				}
			}
			var doubling_order = [0, 1, 2];
			if(harmony[index].chord.inversion == 2 && index + 1 < harmony.length && harmony[index + 1].degree.includes(3)){
				doubling_order = [2, 0, 1];
			}
			for(var i = 0; i < 3; i++){
				if(this.fillHarmony(harmony, index, options, voice_order, 0, this.getVoicing(doubling_order[i]), doubling_order[i], 0)){
					return true;
				}
			}
		}
		if(index + 1 < harmony.length){
			harmony[index + 1].addToHistory();
			this.retrace_attempts -= 1;
		}
		return false;
	}
	randomInt(min, max){
		return Math.floor((Math.random() * (max - min)) + min);
	}
	createEmptyHarmony(phrase_lengths, chords){
		var harmony = [];
		
		var phrase_ends = [0];
		var index = 0;
		for(var i = 0; i < phrase_lengths.length; i++){
			index += phrase_lengths[i];
			phrase_ends.push(index - 1);
		}
		
		
		var sixteenths = [];
		for(var i = 0; i < chords.length; i++){
			sixteenths.push(false);
		}
		var length = phrase_lengths.length;
		var num_sixteenths = Math.random() * 2 * length;
		var order = this.getRandomOrder(length);
		for(var i = 0; i < num_sixteenths; i++){
			var phrase_index = order[i % length];
			sixteenths[this.randomInt(phrase_ends[phrase_index], phrase_ends[phrase_index + 1])] = true;
		}
		
		
		phrase_ends.shift();
		for(var i = 0; i < chords.length; i++){
			if(phrase_ends[0] == i){
				phrase_ends.shift();
				harmony.push(new HarmonyUnit(chords[i], true, sixteenths[i]));
			}
			else{
				harmony.push(new HarmonyUnit(chords[i], false, sixteenths[i]));
			}
		}
		return harmony;
	}
	getAvgScore(harmony){
		var avg = 0;
		for(var i = 0; i < harmony.length; i++){
			var sum = 0;
			for(var voice = 0; voice < 4; voice++){
				sum += harmony[i].getScore(voice);
			}
			avg += (sum / 4);
		}
		return avg / harmony.length;
	}
	generateHarmony(data, chords, phrase_lengths, sampler){		
		var harmony = this.createEmptyHarmony(phrase_lengths, chords);
		
		var max_retrace_attempts = Math.floor(3.5 * (chords.length - 1));
		this.retrace_attempts = max_retrace_attempts;
		this.generateSingleHarmony(harmony, harmony.length - 1);
		if(this.current_state != this.state.success){
			console.log("COMPLETE FAILURE, AFTER ATTEMPTS: ", max_retrace_attempts - this.retrace_attempts);
			return true;
		}
		new Score(harmony, this.nf, phrase_lengths, sampler).renderHarmony();
		console.log(harmony);
		data[0].avg_score = this.getAvgScore(harmony);
		return false;
	}
}
