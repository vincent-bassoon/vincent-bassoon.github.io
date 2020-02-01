function 

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
