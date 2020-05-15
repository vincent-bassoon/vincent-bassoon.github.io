/*
0: C
2: D
4: E
5: F
7: G
9: A
11: B

*/


class HarmonyFunctions {
	constructor(){
		this.name_to_num = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11};
		function note(name, octave){
			return new Note(this.name_to_num, octave);
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
	generate_harmony(chords, phrase_plan){
		
	}
}

					


// Construct melody
// PAC/IAC: 55% 2-1, 14% 4-3, 13% 7-1, 12% 2-3, 3% 5-3, 3% 5-5
// HC: 40% 3-2, 20% 1-2, 15% 4-5, 15% 1-7, 4% 2-7, 4% 4-2, 2% 2-2
// DC: 60% 2-1, 22% 4-5, 18% 7-1
// PC: 50% 1-1, 50% 6-5
