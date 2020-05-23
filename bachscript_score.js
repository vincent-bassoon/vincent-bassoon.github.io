class LineData {
	constructor(score){
		this.score = score;
		
		var treble_temp = new score.vf.Stave(20, 40, 100).addClef('treble').addKeySignature(score.key_name);
		var bass_temp = new score.vf.Stave(20, 40, 100).addClef('bass').addKeySignature(score.key_name);
		
		this.note_indent = Math.max(treble_temp.getNoteStartX(), bass_temp.getNoteStartX());
		
		treble_temp = treble_temp.addTimeSignature("4/4");
		bass_temp = bass_temp.addTimeSignature("4/4");
		
		this.initial_note_indent = Math.max(treble_temp.getNoteStartX(), bass_temp.getNoteStartX());
		
		var width  = window.innerWidth || document.documentElement.clientWidth || 
		document.body.clientWidth;
		var height = window.innerHeight|| document.documentElement.clientHeight|| 
		document.body.clientHeight;
		var dim = Math.max(width, height);
		
		this.stave_x_end = dim - 20;
		this.line_height = 250;
		this.stave_y_indents = [0, 140];
		this.x_margin = 20;
		this.y_margin = 40;
		this.measure_length = 150;
		
		this.clefs = ["treble", "bass"];
		
		this.duration_to_length = {};
		for(var i = 1; i < 5; i++){
			this.duration_to_length[i] = this.measure_length * (i / 4);
		}
		
		this.line_num = 0;
	}
	get_note_indent(){
		if(this.line_num == 0){
			return this.initial_note_indent;
		}
		else{
			return this.note_indent;
		}
	}
	check_new_line(measures){
		var x = this.x_margin + this.get_note_indent();
		var beats = 0;
		for(var i = 0; i < measures.length - 1; i++){
			var next = x + this.duration_to_length[measures[i + 1].duration]
			if(next > this.stave_x_end){
				this.generate_line(measures.splice(0, i + 1), x, beats);
				return;
			}
			else if(i + 2 < measures.length && measures[i + 1].duration == 1){
				next += this.duration_to_length[measures[i + 2].duration]
				if(next > this.stave_x_end){
					this.generate_line(measures.splice(0, i + 1), x, beats);
					return;
				}
			}
			beats += measures[i].duration;
			x += this.duration_to_length[measures[i].duration];
		}
	}
	generate_line(measures, x, beats){
		var add_per_beat = (this.stave_x_end - x) / beats;
		for(var i = 0; i < measures.length; i++){
			var duration = measures[i].duration
			measures[i].width = this.duration_to_length[duration] + add_per_beat * duration;
		}
		var staves = {};
		for(var i = 0; i < 2; i++){
			var x = this.x_margin;
			var y = this.y_margin + this.stave_y_indents[i] + this.line_height * this.line_num;
			var length = measures[0].width + this.get_note_indent(this.line_num);
			staves[i] = new this.score.vf.Stave(x, y, length).addClef(this.clefs[i]).addKeySignature(this.score.key_name);
			if(this.line_num == 0){
				staves[i] = staves[i].addTimeSignature("4/4");
				staves[i].setNoteStartX(this.initial_note_indent);
			}
			else{
				staves[i].setNoteStartX(this.note_indent);
			}
		}
		this.score.render_line(measures, staves);
		this.line_num++;
	}
	generate_final_line(measures){
		for(var i = 0; i < measures.length; i++){
			var duration = measures[i].duration
			measures[i].width = this.duration_to_length[duration];
		}
		this.generate_line(measures, this.stave_x_end, 1);
		this.line_num++;
	}
}

class Score {
	constructor(harmony, chord_array, chords, note_functions){
		var key_temp = chords[chords.length - 1].get_key();
		
		this.accidentals_in_key = note_functions.get_accidentals_in_key(key_temp);
		
		if(key_temp.get_modality() == "minor"){
			this.key_name = note_functions.value_to_name(key_temp.get_pitch() + 3, key_temp);
		}
		else{
			this.key_name = note_functions.value_to_name(key_temp.get_pitch(), key_temp);
		}
		
		this.harmony = harmony;
		this.chords = chords;
		this.chord_array = chord_array;
		this.note_functions = note_functions;
		this.vf = Vex.Flow;
		this.formatter = new this.vf.Formatter();
		
		var div = document.getElementById("staff")
		this.renderer = new this.vf.Renderer(div, this.vf.Renderer.Backends.SVG);
		
console.log("render size");
		this.renderer.resize(1000, 1000);
		//*********************************************************************************************
		
		this.context = this.renderer.getContext();
		this.voice_clefs = ["treble", "treble", "bass", "bass"];
		this.durations = {1: "q", 2: "h", 3: "hd", 4: "w"};
	}
	get_accidentals_in_key_copy(){
		var copy = {};
		for(var key in this.accidentals_in_key){
			copy[key] = this.accidentals_in_key[key];
		}
		return copy;
	}
	
	render_measure(measure, staves){
		for(var i = 0; i < 2; i++){
			if(measure.duration == 4 || measure.duration == 1){
				staves[i].setEndBarType(this.vf.Barline.type.SINGLE);
			}
			else{
				staves[i].setEndBarType(this.vf.Barline.type.NONE);
			}
			staves[i].setContext(this.context).draw();
		}
		var voices = {};
		var all_voices = [];
		for(var i = 0; i < 4; i++){
			voices[i] = new this.vf.Voice({num_beats: measure.duration, beat_value: 4});
			voices[i].addTickables(measure.notes[i]).setStave(staves[Math.floor(i / 2)]);
			all_voices.push(voices[i]);
		}
		for(var i = 0; i < 2; i++){
			if(measure.ghost_voices[i] != null){
				voices[4 + i] = new this.vf.Voice({num_beats: measure.duration, beat_value: 4});
				voices[4 + i].addTickables(measure.ghost_voices[i]).setStave(staves[i]);
				all_voices.push(voices[4 + i]);
			}
		}
		this.formatter.joinVoices([voices[0], voices[1]]);
		this.formatter.joinVoices([voices[2], voices[3]]);
		var indent = Math.max(staves[0].getNoteStartX(), staves[1].getNoteStartX());
		this.formatter.format(all_voices, staves[0].width - (indent - staves[0].x));
		for(var i = 0; i < all_voices.length; i++){
			all_voices[i].setContext(this.context).draw();
		}
	}
	render_line(measures, staves){
		this.render_measure(measures[0], staves);
		for(var i = 1; i < measures.length; i++){
			for(var j = 0; j < 2; j++){
				var x = staves[j].width + staves[j].x;
				var y = staves[j].y;
				staves[j] = new this.vf.Stave(x, y, measures[i].width);
			}
			this.render_measure(measures[i], staves);
		}
	}
	
	render_harmony(){
		var line_data = new LineData(this);
		
		var measures = [];
		var pickup = (this.chord_array[0].length % 2 == 0);
		var index_start = 0;
		for(var i = 0; i < this.chord_array.length; i++){
			var chords_length = this.chord_array[i].length;
			var index = 0;
			if(pickup){
				measures.push(this.generate_single_measure(index + index_start, 1, 1, line_data, false));
				index++;
				line_data.check_new_line(measures);
			}
			while(index + 4 <= chords_length){
				measures.push(this.generate_single_measure(index + index_start, 4, 4, line_data, false));
				index += 4;
				line_data.check_new_line(measures);
			}
			if(index < chords_length){
				var duration = 4;
				if(pickup){
					duration = 3;
				}
				measures.push(this.generate_single_measure(index + index_start, chords_length - index,
									   duration, line_data, true));
				line_data.check_new_line(measures);
			}
			index_start += chords_length;
		}
		if(measures.length != 0){
			line_data.generate_final_line(measures);
		}
	}
	
	create_note_data(value, name, duration, voice, i, index, index_length, last_in_measure){
		var octave = Math.floor(value / 12);
		if(name.substring(0, 2) == "cb"){
			octave += 1;
		}
		else if(name.substring(0, 2) == "b#"){
			octave -= 1;
		}
		var note_duration;
		if(i == index + index_length - 1){
			note_duration = this.durations[duration - index_length + 1];
		}
		else{
			note_duration = "q";
		}
		var stem_dir;
		if(voice % 2 == 0){
			stem_dir = 1;
		}
		else{
			stem_dir = -1;
		}
		var note_data = {"clef": this.voice_clefs[voice],
				 "keys": [name + "/" + octave],
				 "duration": note_duration,
				 "stem_direction": stem_dir};
		return note_data;
	}
		
	generate_single_measure(index, index_length, duration, fermata){
		var measure = {notes: [[], [], [], []], "duration": duration, "width": null, "ghost_voices": [[], []]};
		var accidentals_in_key = this.get_accidentals_in_key_copy();
		var needs_ghost_voices = {0: false, 1: false};
		var prev_value = null;
		for(var i = index; i < index + index_length; i++){
			for(var voice = 0; voice < 4; voice++){
				var value = this.harmony[i][3 - voice].get_end_value();
				var name = this.note_functions.value_to_name(value, this.chords[i].get_key()).toLowerCase();
				var note_data = this.create_note_data(value, name, duration, voice, i, index, index_length)
				var note = new this.vf.StaveNote(note_data);
				if(voice % 2 == 1 && value == prev_value){
					measure.notes[voice].push(new this.vf.GhostNote(note_data));
					measure.ghost_voices[Math.floor(voice / 2)].push(note);
					needs_ghost_voices[Math.floor(voice / 2)] = true;
				}
				else{
					if(accidentals_in_key[name.substring(0, 1)] != name.substring(1)){
						accidentals_in_key[name.substring(0, 1)] != name.substring(1);
						if(name.substring(1) == ""){
							note = note.addAccidental(0, new this.vf.Accidental("n"));
						}
						else{
							note = note.addAccidental(0, new this.vf.Accidental(name.substring(1)));
						}
					}
					if(note_data.duration[note_data.duration.length - 1] == "d"){
						note = note.addDotToAll();
					}
					if(voice == 0 && fermata && i == index + index_length - 1){
						note = note.addArticulation(0, new this.vf.Articulation("a@a").setPosition(3));
					}
					measure.notes[voice].push(note);
					if(voice % 2 == 0){
						prev_value = value;
					}
					else{
						measure.ghost_voices[Math.floor(voice / 2)].push(new this.vf.GhostNote(note_data));
					}
				}
				
			}
		}
		for(var i = 0; i < 2; i++){
			if(!needs_ghost_voices[i]){
				measure.ghost_voices[i] = null;
			}
		}
		return measure;
	}
}
