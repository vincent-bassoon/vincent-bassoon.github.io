function run(){
	// Decide basic structure
	var modality = choose({"Major":0.5, "Minor":0.5});
	var cadence_num = choose({4:0.8, 5:0.2});
	//  If 5 segments, guaranteed 7-8 segment length?
	var pickup = choose({1:0.667, 0:0.333});
	
	var segments = [];
	for(var index = 0; index < cadence_num; index++){
		var length = pickup + choose({7:0.9, 9:0.1});
		segments.push(generate_segment(length, index));
	}
	
	
}

function choose(probs){
	var num = Math.random();
	var choice = null;
	var sum = 0;
	for(var key in probs){
		sum += probs[key];
		if(sum > num && choice == null){
			choice = key;
		}
	}
	if(choice == null){
		console.log("Probability null choice error: ", probs);
	}
	if(sum != 1.0){
		console.log("Probability sum error: ", probs);
	}
	return choice;
}

//   If not pickup, then 2 note pickup after downbeat cadence
//   If pickup, then 1 note pickup after downbeat cadence

// Key patterns
// Major:
//   Tonic: I, vi, iii
//   Dominant: V, vii
//   Predominant: ii, IV
// Minor:
//   Tonic: i, III, VI, VII
//   Dominant: V, vii
//   Predominant: VI, iv

// I: ALL
// II: V, vii
// III: IV, VI
// IV: II, V, vii, I
// V: I, vii, VI, IV, II
// VI: IV, II, III, V
// vii: I, V
// VII: III, IV, II


// Decide chords

// Decide on chords for cadences: 74% PAC/IAC, 17% HC, 7% DC, 2% PC
//   Ending: 90% PAC, 10% IAC ... 70% Piccardy third for minor, 30% not

// Starting chord: 70% V, 30% I



// Construct melody
// PAC/IAC: 55% 2-1, 14% 4-3, 13% 7-1, 12% 2-3, 3% 5-3, 3% 5-5
// HC: 40% 3-2, 20% 1-2, 15% 4-5, 15% 1-7, 4% 2-7, 4% 4-2, 2% 2-2
// DC: 60% 2-1, 22% 4-5, 18% 7-1
// PC: 50% 1-1, 50% 6-5


// Harmonize



// type = major, minor, aug, dim, 7, d7
// key = 0, 1,..., 12
// inversion = 0, 1, 2, 3
class Chord {
	constructer(type, key, inversion){
		this.type = type;
		this.key = key;
		this.inversion = inversion;
	}
	get_type(){return this.type;}
	get_key(){return this.key;}
	get_inversion(){return this.inversion;}
}

class Note {
	constructer(pitch, name, octave){
		this.pitch = pitch;
		this.name = name;
		this.octave = octave;
		var string = pitch
	}
	get_pitch(){return this.pitch}
	get_name(){return this.name}
	get_octave(){return this.octave}
	get_value(){
		return this.pitch + 12 * this.octave;
	}
	to_string(){
		
	}
	get_inversion(){return this.inversion;}
}

class Score {
	constructor(length){
		this.harmony = [];
		for(var i = 0; i < length; i++){
			this.harmony[i] = {};
			this.harmony[i].voice = [[], [], [], []];
			this.harmony[i].chord = null;
		}
	}
	get_chord(chord_index){
		return this.harmony[chord_index].chord;
	}
	get_note(chord_index){
	}
}

function run(){
	//create_score(beat_num);
	VF = Vex.Flow;
	var div = document.getElementById("staff")
	var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
	renderer.resize(500, 500);
	var context = renderer.getContext();
	var stave = new VF.Stave(10, 40, 400);
	stave.addClef("treble").addTimeSignature("4/4");
	stave.setContext(context).draw();
}
