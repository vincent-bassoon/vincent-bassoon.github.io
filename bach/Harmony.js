class HarmonyFunctions {
	constructor(){
		this.note_functions = new NoteFunctions();
		
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
	
	
	distBetweenVoices(harmony, index, order_index){
		var voice = this.voice_order[order_index];
		for(var i = 0; i < 2; i++){
			if(this.check_adjacent[order_index][i]){
				for(var start_or_end = 0; start_or_end < 2; start_or_end++){
					var parity = this.adjacent_direction[i];
					var voice1 = parity * harmony[index].getValue(voice, start_or_end);
					var voice2 = parity * harmony[index].getValue(voice + parity, start_or_end);
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
			return true;
		}
		if(this.parallels(harmony, index, order_index)){
			return true;
		}
		if(order_index == 3 && harmony[index].equalsHistory()){
			return true;
		}
		return false;
	}
	
	
	calcLeap(change){
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
	fillHarmony(harmony, chords, voicing, pitch_options, index, order_index, score){
		if(order_index == 4){
			if(index + 1 < harmony.length && !harmony[index].isEndOfPhrase()){
				harmony[index].updateAvgs(harmony[index + 1]);
			}
			return true;
		}
		else if(order_index == 2){
			for(var i = 2; i <= 3; i++){
				if(index + i < harmony.length && this.note_functions.chordsEqual(chords[index], chords[index + i])){
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
		if(score > this.max_total_score){//NEEDS ADJUSTMENT **************************
			return false;
		}
		var voice = this.voice_order[order_index];
		for(var i = 0; i < voicing.length; i++){
			var degree = voicing.shift();
			for(var j = 0; j < pitch_options[voice][degree].length; j++){
				var option = pitch_options[voice][degree][j];
				harmony[index].setNotes(voice, option.values, option.names, option.num_notes, option.leap);
				this.scores[index][voice] = option.score;
				if(!this.hasErrors(harmony, index, order_index) &&
				   this.fillHarmony(harmony, chords, voicing, pitch_options,
						     index, order_index + 1, score + option.score)){
					return true;
				}
			}
			voicing.push(degree);
		}
		harmony[index].resetNotes(voice);
		return false;
	}
	calcLeapScore(voice, this_leap, next_leap){
		var score = 0;
		if(Math.abs(this_leap * next_leap) >= 6){
			//no two consecutive leaps if one of them is a fourth
			return this.max_single_score + 1;
		}
		if(Math.abs(this_leap * next_leap) == 4){
			// consecutive leaps of a third
			score += 15;
			if(this_leap == -1 * next_leap){
				//leap down then up, or up then down
				score += 20;
			}
		}
		if(Math.abs(this_leap) == 3 && this_leap * next_leap != -3){
			// big leap must be followed by step in opposite direction
			score += 20;
			if(voice == 3){
				score += 20;
			}
		}
		if(this_leap == 0 && next_leap == 0){
			//consecutive stagnation
			score += 10;
			if(voice == 3){
				score += 10;
			}
		}
		return score;
	}
	addNctOptions(options, harmony, index, key, next_key, voice, value, name, next_value, this_leap, next_leap){
		var parity = 1;
		if(this_leap < 0){
			parity = -1;
		}
		var queue = [];
		var notes = this.note_functions.getNotesInKey(key);
		var start_num = this.note_functions.valueToNum(value, key) - 1;
		if(this.note_functions.valueToNum(next_value, next_key) == undefined){
			console.log("next pitch not in key");
			return;
		}
		switch(Math.abs(this_leap)){
			case 0:
				queue.push({"changes": [-1, 0], "leap": 0});
				queue.push({"changes": [1, 0], "leap": 0});
				break;
			case 1:
				queue.push({"changes": [parity, parity * 2, parity], "leap": parity * -1});
				break;
			case 2:
				queue.push({"changes": [parity, parity * 2], "leap": parity});
				break;
			case 3:
				queue.push({"changes": [parity, parity * 2, parity * 3], "leap": parity});
		}
		while(queue.length > 0){
			var temp = queue.pop();
			var num_changes = temp.changes;
			var leap = temp.leap;
			var names = [name];
			var values = [value];
			var valid = true;
			var prev_num = start_num;
			for(var i = 0; i < num_changes.length; i++){
				var num = (start_num + num_changes[i] + 7) % 7
				names.push(notes[num]);
				var pitch = this.note_functions.numToPitch(num + 1, key);
				values.push(this.getValueClosestTo(pitch, values[values.length - 1]));
				var change = values[values.length - 1] - values[values.length - 2];
				if(this.note_functions.isAugOrDim(change, names[names.length - 1], names[names.length - 2])){
					valid = false;
					i = num_changes.length;
				}
				if(prev_num + 1 == 7 && num + 1 != 1){
					valid = false;
					i = num_changes.length;
				}
				prev_num = num;
			}
			names.pop();
			values.pop();
			if(valid){
				var score = this.calcLeapScore(voice, leap, next_leap);
				var avg_value = 0;
				for(var j = 0; j < values.length; j++){
					avg_value += values[j];
				}
				avg_value = avg_value / values.length;
				if(!this.inPrefRange(avg_value, voice)){
					score += 10;
				}
				if(voice == 3 && !harmony[index].isEndOfPhrase()){
					var target_avg = harmony[index].getTargetAvg(voice);
					var avg = harmony[index + 1].getNextAvg(voice, avg_value);
					var diff = Math.abs(target_avg - avg);
					if(diff > 2){
						if((avg_value > avg && avg > target_avg) || (avg_value < avg && avg < target_avg)){
							score += diff * 5;
						}
					}
					if(Math.abs(avg_value - target_avg) > 5){
						score += 20;
					}
				}
				if(score < this.max_single_score){
					options.push({"values": values, "names": names, "num_notes": num_changes.length,
						      "score": score, "leap": leap});
				}
			}
		}
	}
	addOption(options, harmony, index, voice, value){
		if(!this.note_functions.inAbsoluteRange(value, voice)){
			return;
		}
		var key = harmony[index].chord.key;
		if(index + 1 == harmony.length){
			options.unshift({"values": [value], "num_notes": 1, "score": 0, "leap": 0});
			return;
		}
		var next_key = harmony[index + 1].chord.key;
		var next_value = harmony[index + 1].getValue(voice, 0);
		var change = next_value - value;
		var this_leap = this.calcLeap(change);
		var next_leap = harmony[index + 1].getLeap(voice);
		
		if(Math.abs(change) < 6 && !harmony[index].end_of_phrase){
			this.addNctOptions(options, harmony, index, key, next_key, voice,
					   value, next_value, this_leap, next_leap);
		}
		
		if(key.valueToNum(value) == 7 && next_value % 12 != key.pitch){
			//leading tone check
			return;
		}
		if(Math.abs(change) > 5 && !(voice == 3 && (Math.abs(change) == 7 || Math.abs(change) == 12))){
			//leaps greater than a fourth not allowed except for fifths and octaves in bass
			return;
		}
		if(this.note_functions.isAugOrDim(change, next_key.valueToName(next_value), key.valueToName(value))){
			// this check ignores augmented/diminished unison
			return;
		}
		
		var score = this.calcLeapScore(voice, this_leap, next_leap);
		
		if(!this.note_functions.inPrefRange(value, voice)){
			score += 10;
		}
		
		score += harmony[index].score.getAvgScore(harmony[index + 1].score, voice, value);
		
		if(score < this.max_single_score){
			for(var i = 0; i < options.length; i++){
				if(score < options[i].score){
					options.splice(i, 0, {"values": [value], "num_notes": 1, "score": score, "leap": this_leap});
					return;
				}
			}
			options.push({"values": [value], "num_notes": 1, "score": score, "leap": this_leap});
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
					var value = this.note_functions.getValueInPrefRange(chord.pitches[degree], voice);
					this.addOption(options[voice][degree], harmony, index, voice, value);
				}
				else{
					var value = this.note_functions.getValueClosestTo(chord.pitches[degree],
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
		console.log(this.scores);
		if(this.repeat){
			return true;
		}
		new Score(harmony, sampler).renderHarmony();
		console.log(harmony);
		return false;
	}
}
