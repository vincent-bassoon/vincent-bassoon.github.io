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
		
		if(width != null && width != 0 && height != null && height != 0){
			
		}
		
		this.score.measures_per_line = 4;
		
		this.stave_x_end = 800;
		this.line_height = 280;
		this.stave_y_indents = [0, 140];
		this.x_margin = 20;
		this.y_margin = 40;
		
		this.clefs = ["treble", "bass"];
		
		this.min_measure_size = 1000;
		this.line_num = 0;
	}
	get_renderer_width(){
		return this.stave_x_end + (this.x_margin * 2);
	}
	get_renderer_height(){
		return this.line_height * (this.line_num + 0.3);
	}
	get_note_indent(){
		if(this.line_num == 0){
			return this.initial_note_indent;
		}
		else{
			return this.note_indent;
		}
	}
	generate_line(measures, beats, is_last){
		var measure_size;
		if(beats <= this.score.measures_per_line * 4 - 3){
			measure_size = this.min_measure_size;
		}
		else{
			measure_size = (this.stave_x_end - this.get_note_indent()) / beats;
			if(measure_size < this.min_measure_size){
				this.min_measure_size = measure_size;
			}
		}
		for(var i = 0; i < measures.length; i++){
			var duration = measures[i].duration;
			measures[i].width = measure_size * duration;
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
		this.score.render_line(measures, staves, is_last);
		this.line_num++;
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
		this.measures_per_line = 4;
		
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
	
	render_measure(measure, staves, is_last){
		for(var i = 0; i < 2; i++){
			staves[i].setBegBarType(this.vf.Barline.type.NONE);
			if(measure.duration == 4 || measure.duration == 1 || is_last){
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
				voices[6 + i] = new this.vf.Voice({num_beats: measure.duration, beat_value: 4});
				voices[6 + i].addTickables(measure.ghost_voices[i]).setStave(staves[i]);
				all_voices.push(voices[6 + i]);
			}
			voices[4 + i] = new this.vf.Voice({num_beats: measure.duration, beat_value: 4});
			var notes = [];
			for(var j = 0; j < measure.duration; j++){
				notes.push(new this.vf.GhostNote({"clef": this.voice_clefs[2 * i], "keys": ["c/4"], "duration": "q"}));
			}
			voices[4 + i].addTickables(notes).setStave(staves[i]);
			all_voices.unshift(voices[4 + i]);
		}
		this.formatter.joinVoices([voices[4], voices[0], voices[1]]);
		this.formatter.joinVoices([voices[5], voices[2], voices[3]]);
		var indent = Math.max(staves[0].getNoteStartX(), staves[1].getNoteStartX());
		this.formatter.format(all_voices, staves[0].width - (indent - staves[0].x));
		for(var i = 0; i < all_voices.length; i++){
			all_voices[i].setContext(this.context).draw();
		}
	}
	render_line(measures, staves, is_last){
		var brace = new this.vf.StaveConnector(staves[0], staves[1]).setType(3);
		brace.setContext(this.context).draw();
		var lineLeft = new this.vf.StaveConnector(staves[0], staves[1]).setType(2);
		brace.setContext(this.context).draw();
		if(measures.length == 1){
			this.render_measure(measures[0], staves, is_last);
		}
		else{
			this.render_measure(measures[0], staves, false);
		}
		for(var i = 1; i < measures.length; i++){
			for(var j = 0; j < 2; j++){
				var x = staves[j].width + staves[j].x;
				var y = staves[j].y;
				staves[j] = new this.vf.Stave(x, y, measures[i].width);
			}
			if(i == measures.length - 1){
				this.render_measure(measures[i], staves, is_last);
			}
			else{
				this.render_measure(measures[i], staves, false);
			}
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
		var needs_pickup = pickup;
		while(index < this.chords.length){
			if(needs_pickup){
				needs_pickup = false;
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
				var index_change = 0;
				var num_beats_change = 0;
				while(index + index_change < phrase_done_indices[phrase_index] - 1){
					durations.push(1);
					num_beats_change++;
					index_change++;
				}
				var fermata_duration = this.chorale_plan[phrase_index].get_fermata_duration();
				durations.push(fermata_duration);
				var fermata_index = index + index_change;
				index_change++;
				num_beats_change += fermata_duration;
				num_beats += num_beats_change;
				if(phrase_index != phrase_done_indices.length - 1){
					var max = 4;
					if(pickup && num_beats >= 4 * this.measures_per_line - 2){
						max = 3;
						needs_pickup = true;
					}
					while(num_beats_change < max){
						durations.push(1);
						num_beats_change++;
						num_beats++;
						index_change++;
					}
				}
				measures.push(this.generate_single_measure(index, durations, num_beats_change, fermata_index));
				index += index_change;
			}
			if(num_beats >= 4 * this.measures_per_line - 1){
				line_data.generate_line(measures, num_beats, index >= this.chords.length);
				measures = [];
				num_beats = 0;
			}
			if(phrase_done_indices.length > 0 && index >= phrase_done_indices[phrase_index]){
				phrase_index++;
			}
		}
		if(num_beats > 0){
			line_data.generate_line(measures, num_beats, true);
		}
		this.renderer.resize(line_data.get_renderer_width(), line_data.get_renderer_height());
		console.log(line_data.min_measure_size);
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
						accidentals_in_key[name.substring(0, 1)] = name.substring(1);
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
