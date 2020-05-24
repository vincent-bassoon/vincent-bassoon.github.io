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
		this.dim = Math.max(width, height);
		
		this.stave_x_end = this.dim - 20;
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
		this.score.renderer.resize(this.dim, this.line_num * this.line_height);
	}
}

class Score {
	constructor(harmony, chords, chorale_plan, note_functions){
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
		this.chorale_plan = chorale_plan;
		this.note_functions = note_functions;
		this.vf = Vex.Flow;
		this.formatter = new this.vf.Formatter();
		
		var div = document.getElementById("staff")
		this.renderer = new this.vf.Renderer(div, this.vf.Renderer.Backends.SVG);
		
		this.context = this.renderer.getContext();
		this.voice_clefs = ["treble", "treble", "bass", "bass"];
		this.duration_strings = {1: "q", 2: "h", 3: "hd", 4: "w"};
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
			staves[i].setBegBarType(this.vf.Barline.type.NONE);
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
		var brace = new this.vf.StaveConnector(staves[0], staves[1]).setType(3);
		brace.setContext(this.context).draw();
		var lineLeft = new this.vf.StaveConnector(staves[0], staves[1]).setType(1);
		brace.setContext(this.context).draw();
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
		var pickup = (this.chorale_plan[0].get_phrase_length() % 2 == 0);
		var index_start = 0;
		
		var phrase_done_indices = [this.chorale_plan[0].get_phrase_length()];
		for(var i = 1; i < this.chorale_plan.length; i++){
			phrase_done_indices.push(this.chorale_plan[i].get_phrase_length() + phrase_done_indices[i - 1]);
		}
		
		var num_beats = 0;
		var index = 0;
		var phrase_index = 0;
		while(index < this.chords.length){
			if(pickup && measures.length == 0){
				measures.push(this.generate_single_measure(index, [1], 1, null));
				index++;
				num_beats++;
			}
			else if(index + 4 <= phrase_done_indices[phrase_index]){
				measures.push(this.generate_single_measure(index, [1, 1, 1, 1], 4, null));
				index += 4;
				num_beats += 4;
			}
			else{
				var durations = [];
				var sum = 0;
				while(index < phrase_done_indices[phrase_index] - 1){
					sum++;
					durations.push(1);
					index++;
				}
				var fermata_duration = this.chorale_plan[phrase_index].get_fermata_duration();
				durations.push(fermata_duration);
				var fermata_index = index;
				index++;
				sum += fermata_duration;
				if(phrase_index != phrase_done_indices.length - 1){
					var max = 4;
					if(pickup){
						max = 3;
					}
					while(sum < max){
						durations.push(1);
						sum++;
						index++;
					}
				}
				num_beats += sum;
				measures.push(this.generate_single_measure(index, durations, sum, fermata_index));
			}
			if(num_beats >= 15){
				line_data.generate_line(measures);
				num_beats = 0;
			}
			if(phrase_done_indices.length > 0 && index >= phrase_done_indices[phrase_index]){
				phrase_index++;
			}
		}
		if(measures.length != 0){
			line_data.generate_final_line(measures);
		}
	}
	
	create_note_data(value, name, duration, voice){
		var octave = Math.floor(value / 12);
		if(name.substring(0, 2) == "cb"){
			octave += 1;
		}
		else if(name.substring(0, 2) == "b#"){
			octave -= 1;
		}
		var note_duration = this.duration_strings[duration];
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
		
	generate_single_measure(start_index, durations, total_duration, fermata_index){
		var measure = {notes: [[], [], [], []], "duration": total_duration, "width": null, "ghost_voices": [[], []]};
		var accidentals_in_key = this.get_accidentals_in_key_copy();
		var needs_ghost_voices = {0: false, 1: false};
		var prev_value = null;
		for(var i = 0; i < durations.length; i++){
			var index = start_index + i;
			for(var voice = 0; voice < 4; voice++){
				var value = this.harmony[index][3 - voice].get_end_value();
				var name = this.note_functions.value_to_name(value, this.chords[index].get_key()).toLowerCase();
				var note_data = this.create_note_data(value, name, durations[i], voice);
				var note = new this.vf.StaveNote(note_data);
				if(voice % 2 == 1 && value == prev_value){
					//note: if one of the intersecting notes is a half note and the other is not, new strategy needed
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
					if(voice == 0 && fermata_index != null && index == fermata_index){
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
