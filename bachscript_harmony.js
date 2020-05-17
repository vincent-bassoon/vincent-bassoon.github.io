class RomanNumeral {
	constructor(){
		this.roman_num_mapping = {"major": {1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11},
					  "minor": {1: 0, 2: 2, 3: 3, 4: 5, 5: 7, 6: 8, 7: 10}};
	}
	get_pitch(roman_num, key){
		return (key.get_pitch() + this.roman_num_mapping[key.get_modality()][roman_num]) % 12;
	}
	dist(num1, num2){
		return Math.min((num1 - num2 + 7) % 7, (num2 - num1 + 7) % 7);
	}
	min(num1, num2){
		if(this.add(num1, this.dist(num1, num2)) == num2){
			return num1;
		}
		else{
			return num2;
		}
	}
	max(num1, num2){
		if(this.min(num1, num2) == num1){
			return num2;
		}
		else{
			return num1;
		}
	}
	add(num1, change){
		return ((num1 - 1 + change) % 7) + 1;
	}
}

class HarmonyFunctions {
	constructor(){
		var name_to_num = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11};
		function note(name, octave){
			return new Note(name_to_num[name], octave);
		}
		
		this.preferred_ranges = {0: {"min": note("F", 2), "max": note("F", 3)},
					 1: {"min": note("F", 3), "max": note("F", 4)},
					 2: {"min": note("A", 3), "max": note("A", 4)},
					 3: {"min": note("E", 4), "max": note("E", 5)}};
		
		this.absolute_ranges = {0: {"min": note("C", 2), "max": note("C", 4)},
					1: {"min": note("C", 3), "max": note("G", 4)},
					2: {"min": note("G", 3), "max": note("D", 5)},
					3: {"min": note("C", 4), "max": note("G", 5)}};
		
		var ac_probs = {"2-1": 0.55, "4-3": 0.14, "7-1": 0.13, "2-3": 0.12, "5-3": 0.03, "5-5": 0.03};
		var hc_probs = {"3-2": 0.4, "1-2": 0.2, "4-5": 0.15, "1-7": 0.15, "2-7": 0.04, "4-2": 0.04, "2-2": 0.02};
		
		this.rn = new RomanNumeral();
		
		this.cadence_probabilities = {"pac": ac_probs,
					      "pac/iac": ac_probs,
					      "hc": hc_probs,
					      "dc": {"2-1": 0.6, "4-5": 0.22, "7-1": 0.18},
					      "pc": {"1-1": 0.5, "6-5": 0.5},
					      "pacm": ac_probs};
		
	}
	create_note(pitch, octave){
		return new Note(pitch, octave);
	}
	create_note_from_value(value){
		return new Note(Math.floor(value / 12), value % 12);
	}
	lowest_octave_in_preferred_range(pitch, voice_index){
		var min = this.preferred_ranges[voice_index].min.get_value();
		var octave = 0;
		while(pitch + 12 * octave < min){
			octave++;
		}
		return octave;
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
		var soprano_notes = [];
		do{
			var temp = choose(this.cadence_probabilities[cadence]).split("-");
			soprano_notes[0] = parseInt(temp[0]);
			soprano_notes[1] = parseInt(temp[1]);
			console.log("cadence iteration");
		} while(!chords[chords.length - 2].is_in_chord(soprano_notes[0]));
		var min_index = 0;
		var max_index = 1;
		if(this.rn.min(soprano_notes[0], soprano_notes[1]) == soprano_notes[1]){
			min_index = 1;
			max_index = 0;
		}
		var pitch = this.rn.get_pitch(soprano_notes[min_index], key);
		var absolute = this.move_to_preferred_range(pitch, 3);
		harmony[harmony.length - 2 + min_index][3].set_note(this.create_note());
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
