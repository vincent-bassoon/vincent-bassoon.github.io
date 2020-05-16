class HarmonyFunctions {
	constructor(){
		this.name_to_num = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11};
		function note(name, octave){
			return new Note(this.name_to_num[name], octave);
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
		
		this.cadence_probabilities = {"pac": ac_probs,
					      "pac/iac": ac_probs,
					      "hc": hc_probs,
					      "dc": {"2-1": 0.6, "4-5": 0.22, "7-1": 0.18},
					      "pc": {"1-1": 0.5, "6-5": 0.5},
					      "pacm": ac_probs};
		
	}
	generate_adjacent(chords, harmony, adjacent_index, target_index){
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
		
	}
	complete_matching_harmony(chords, harmony, existing_harmony, start_index, end_index){
		
	}
	is_in_chord(roman_num, chord_root){
		if(roman_num == chord_root){
			return true;
		}
		for(var i = 0; i < 2; i++){
			chord_root = ((chord_root + 2 - 1) % 7) + 1;
			if(roman_num == chord_root){
				return true;
			}
		}
		return false;
	}
	generate_cadence_harmony(chords, harmony, cadence){
		
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
			this.generate_cadence_harmony(chords, harmonies[0], phrase_plan.get_cadence());
			
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
