function run(){
	create_score(beat_num);
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
