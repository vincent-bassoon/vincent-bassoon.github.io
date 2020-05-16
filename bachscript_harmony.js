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
	}
	generate_adjacent(chords, harmony, adjacent_index, target_index){
		if(Math.abs(adjacent_index - target_index) != 1){
			console.log("index error");
			return;
		}
		
	}
	complete_harmony(chords, harmony, start_index, end_index, prev_harmony_unit){
		var change;
		if(start_index > end_index){
			change = -1;
		}
		else{
			change = 1;
		}
		
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
		if(phrase_plan.get_previous_cadence_chord() == null){
			
		}
		else{
			
		}
		
		var harmony = [this.create_empty_harmony(chords.length), this.create_empty_harmony(chords.length - 2)];
		var start_index = [chords.length - 3, 0];
		var end_index = [0, chords.length - 3];
		this.generate_cadence_harmony(chords, harmony[0], phrase_plan.get_cadence());
		
		this.complete_harmony(chords, harmony[0], start_index[0], end_index[0], harmony[0][chords.length - 2]);
		// if harmony[0] can be stitched to prev_harmony_unit
		if(false){
			return harmony[0];
		}
		
		this.complete_harmony(chords, harmony[1], start_index[1], end_index[1], prev_harmony_unit);
		
	}
}

					


// Construct melody
// PAC/IAC: 55% 2-1, 14% 4-3, 13% 7-1, 12% 2-3, 3% 5-3, 3% 5-5
// HC: 40% 3-2, 20% 1-2, 15% 4-5, 15% 1-7, 4% 2-7, 4% 4-2, 2% 2-2
// DC: 60% 2-1, 22% 4-5, 18% 7-1
// PC: 50% 1-1, 50% 6-5
