class Player {
	constructor(sampler){
		this.schedule = [];
		this.sampler = sampler;
	}
	schedule_notes(names, duration, is_fermata){
		if(is_fermata && duration < 2){
			duration = 2;
		}
		this.schedule.push({"names": names, "duration": duration});
	}
	get_time_string(beat_num){
		return "" + Math.floor(beat_num / 16) + ":" + Math.floor((beat_num % 16) / 4) + ":" + (beat_num % 4);
	}
	generate_audio(){
		var sources = {};
		var names_to_files = {"A" : "A", "C": "C", "D#": "Ds", "F#": "Fs"};
		var file_end = "v5.mp3";
		for(var name in names_to_files){
			for(var i = 2; i <= 5; i++){
				sources[name + i] = names_to_files[name] + i + file_end;
			}
		}
		var transport = Tone.Transport;
		transport.cancel();
		transport.timeSignature = 4;
		transport.bpm.value = 80;
		var beat_num = 1;
		var rit_time_string;
		var rit_length = 3;
		var schedule = this.schedule;
		var sampler = this.sampler;
		schedule[schedule.length - 1].duration = 3;
		
		
		transport.schedule(function(time){
			if(play.innerText == "PLAY" || play.innerText == "LOADING..."){
				transport.stop();
				sampler.releaseAll();
			}
		}, this.get_time_string(0));
		transport.schedule(function(time){
			sampler.triggerAttack(schedule[0].names, time);
		}, this.get_time_string(beat_num));
		
		for(var i = 1; i < schedule.length - 1; i++){
			beat_num += 4 * schedule[i - 1].duration;
			if(i + rit_length == schedule.length - 1){
				rit_time_string = this.get_time_string(beat_num);
			}
			(function(unit, prev_unit, time_string){
				transport.schedule(function(time){
					sampler.triggerRelease(prev_unit.names, time);
					sampler.triggerAttack(unit.names, time);
				}, time_string);
			})(schedule[i], schedule[i - 1], this.get_time_string(beat_num));
		}
		beat_num += 4 * schedule[schedule.length - 2].duration;
		transport.schedule(function(time){
			sampler.triggerRelease(schedule[schedule.length - 2].names, time);
			sampler.release = 2;
			sampler.triggerAttack(schedule[schedule.length - 1].names, time);
		}, this.get_time_string(beat_num));
		beat_num += 4 * schedule[i].duration;
		transport.schedule(function(time){
			sampler.triggerRelease(schedule[schedule.length - 1].names, time);
		}, this.get_time_string(beat_num));
		var play = document.getElementById("play_button");
		function play_stop(){
			if(play.innerText == "STOP"){
				transport.stop();
				sampler.releaseAll();
				play.innerText = "PLAY";
			}
			else{
				play.innerText = "STOP";
				transport.bpm.value = 80;
				sampler.release = 0.1;
				transport.start("+.3", "0:0:0");
			}
		}
		beat_num += 6;
		transport.schedule(function(time){
			if(transport.state == "started"){
				transport.stop();
			}
			play.innerText = "PLAY";
			play.onclick = play_stop;
		}, this.get_time_string(beat_num));
		transport.schedule(function(time){
			transport.bpm.linearRampTo(60, "0:" + rit_length + ":0");
		}, rit_time_string);
		play.classList.remove("running");
		play.innerText = "PLAY";
		play.onclick = play_stop;
	}
}

class LineData {
	constructor(score){
		this.score = score;
		
		var treble_temp = new score.vf.Stave(20, 40, 100).addClef('treble').addKeySignature(score.key_name);
		var bass_temp = new score.vf.Stave(20, 40, 100).addClef('bass').addKeySignature(score.key_name);
		
		this.note_indent = Math.max(treble_temp.getNoteStartX(), bass_temp.getNoteStartX()) + 25;
		
		treble_temp = treble_temp.addTimeSignature("4/4");
		bass_temp = bass_temp.addTimeSignature("4/4");
		
		this.initial_note_indent = Math.max(treble_temp.getNoteStartX(), bass_temp.getNoteStartX()) + 25;
		
		this.line_height = 280;
		this.stave_y_indents = [0, 140];
		this.x_margin = 30;
		this.y_margin = 40;
		
		this.min_measure_beat_size = 45;
		this.beat_size_list = [];
		
		if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini|Mobile/i.test(navigator.userAgent)){
			this.stave_width = this.min_measure_beat_size * 13 + this.initial_note_indent;
			this.score.measures_per_line = Math.floor(13 / 4);
		}
		else{
			var width  = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
			this.stave_width = width - (2 * this.x_margin) - 2;
			var possible_beats = (this.stave_width - this.initial_note_indent) / this.min_measure_beat_size;
			if(possible_beats < 13){
				this.stave_width = this.min_measure_beat_size * 13 + this.initial_note_indent;
				this.score.measures_per_line = Math.floor(13 / 4);
			}
			this.score.measures_per_line = Math.floor(possible_beats / 4);
		}
		
		
		
		this.clefs = ["treble", "bass"];
		
		this.line_num = 0;
	}
	avg(list){
		var sum = 0;
		for(var i = 0; i < list.length; i++){
			sum += list[i];
		}
		return sum / list.length;
	}
	get_renderer_width(){
		return this.stave_width + (this.x_margin * 2);
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
		var measure_beat_size;
		if(beats <= this.score.measures_per_line * 4 - 3){
			measure_beat_size = this.avg(this.beat_size_list);
		}
		else{
			measure_beat_size = (this.stave_width - this.get_note_indent()) / beats;
			this.beat_size_list.push(measure_beat_size);
		}
		for(var i = 0; i < measures.length; i++){
			var duration = measures[i].duration;
			measures[i].width = measure_beat_size * duration;
		}
		var staves = {};
		for(var i = 0; i < 2; i++){
			var x = this.x_margin;
			var y = this.y_margin + this.stave_y_indents[i] + this.line_height * this.line_num;
			var length = measures[0].width + this.get_note_indent(this.line_num) - 25;
			staves[i] = new this.score.vf.Stave(x, y, length).addClef(this.clefs[i]).addKeySignature(this.score.key_name);
			if(this.line_num == 0){
				staves[i] = staves[i].addTimeSignature("4/4");
			}
		}
		this.score.render_line(measures, staves, is_last, this.get_note_indent());
		this.line_num++;
	}
}

class Score {
	constructor(harmony, chords, chorale_plan, note_functions, sampler){
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
		
		
		this.player = new Player(sampler);
	}
	get_accidentals_in_key_copy(){
		var copy = {};
		for(var key in this.accidentals_in_key){
			copy[key] = this.accidentals_in_key[key];
		}
		return copy;
	}
	
	render_measure(measure, staves, is_last, initial_indent){
		for(var i = 0; i < 2; i++){
			staves[i].setBegBarType(this.vf.Barline.type.NONE);
			if(is_last){
				staves[i].setEndBarType(this.vf.Barline.type.END);
			}
			else if(measure.duration == 4 || measure.duration == 1){
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
		if(initial_indent != null){
			indent = initial_indent
		}
		this.formatter.format(all_voices, staves[0].width - (indent - staves[0].x));
		staves[0].setNoteStartX(indent);
		staves[1].setNoteStartX(indent);
		for(var i = 0; i < all_voices.length; i++){
			all_voices[i].setContext(this.context).draw();
		}
	}
	render_line(measures, staves, is_last, initial_indent){
		var brace = new this.vf.StaveConnector(staves[0], staves[1]).setType(3);
		brace.setContext(this.context).draw();
		var line_left = new this.vf.StaveConnector(staves[0], staves[1]).setType(1);
		line_left.setContext(this.context).draw();
		if(measures.length == 1){
			this.render_measure(measures[0], staves, is_last, initial_indent);
		}
		else{
			this.render_measure(measures[0], staves, false, initial_indent);
		}
		for(var i = 1; i < measures.length; i++){
			for(var j = 0; j < 2; j++){
				var x = staves[j].width + staves[j].x;
				var y = staves[j].y;
				staves[j] = new this.vf.Stave(x, y, measures[i].width);
			}
			if(i == measures.length - 1){
				this.render_measure(measures[i], staves, is_last, null);
			}
			else{
				this.render_measure(measures[i], staves, false, null);
			}
		}
	}
	
	render_harmony(){
		var line_data = new LineData(this);
		
		var pickup = (this.chorale_plan[0].get_phrase_length() % 2 == 0);
		var measures = [];
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
		this.player.generate_audio();
	}
	
	create_note_data(value, name, octave, duration, voice){
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
		var accidentals_in_key = {0: {}, 1: {}};
		var needs_ghost_voices = {0: false, 1: false};
		var prev_value = null;
		for(var i = 0; i < durations.length; i++){
			var index = start_index + i;
			var names = [];
			for(var voice = 0; voice < 4; voice++){
				var value = this.harmony[index].get_value(3 - voice, 1);
				var simple_name = this.note_functions.value_to_simple_name_octave(value);
				if(!names.includes(simple_name)){
					names.push(simple_name);
				}
				var name = this.harmony[index].get_name(3 - voice, 1).toLowerCase();
				var octave = Math.floor(value / 12);
				if(name.substring(0, 2) == "cb"){
					octave += 1;
				}
				else if(name.substring(0, 2) == "b#"){
					octave -= 1;
				}
				var note_data = this.create_note_data(value, name, octave, durations[i], voice);
				var note = new this.vf.StaveNote(note_data);
				note.setLedgerLineStyle({strokeStyle: "black"});
				var clef_index = Math.floor(voice / 2);
				if(voice % 2 == 1 && value == prev_value){
					//note: if one of the intersecting notes is a half note and the other is not, new strategy needed
					measure.notes[voice].push(new this.vf.GhostNote(note_data));
					measure.ghost_voices[clef_index].push(note);
					needs_ghost_voices[clef_index] = true;
				}
				else{
					if(!(octave in accidentals_in_key[clef_index])){
						accidentals_in_key[clef_index][octave] = this.get_accidentals_in_key_copy();
					}
					if(accidentals_in_key[clef_index][octave][name.substring(0, 1)] != name.substring(1)){
						accidentals_in_key[clef_index][octave][name.substring(0, 1)] = name.substring(1);
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
			this.player.schedule_notes(names, durations[i], (fermata_index != null && index == fermata_index));
		}
		for(var i = 0; i < 2; i++){
			if(!needs_ghost_voices[i]){
				measure.ghost_voices[i] = null;
			}
		}
		return measure;
	}
}
