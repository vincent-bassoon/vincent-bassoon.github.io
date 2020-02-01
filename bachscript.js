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

function create_score(beat_num){
	var score = [];
	for(var i = 0; i < beat_num; i++){
		score[i] = [];
		for(var j = 0; j < 4; j++){
			score[i][j] = [];
		}
	}
	return score;
}

function create_note(pitch, octave, accidental, fermata){
	var note = {};
	note.pitch = pitch;
	note.octave = octave;
	note.accidental = accidental;
	note.fermata = fermata;
	return note;
}
