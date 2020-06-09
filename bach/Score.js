class Player {
	constructor(sampler){
		this.schedule = [];
		this.sampler = sampler;
	}
	scheduleNotes(attack_list, release_list, duration){
		this.schedule.push({"attack": attack_list, "release": release_list, "duration": duration});
	}
	getTimeString(beat_num){
		return "" + Math.floor(beat_num / 16) + ":" + Math.floor((beat_num % 16) / 4) + ":" + (beat_num % 4);
	}
	generateAudio(){
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
		transport.bpm.value = 60;
		var beat_num = 1;
		var rit_time_string;
		var rit_length = 12;
		var schedule = this.schedule;
		console.log(schedule);
		var sampler = this.sampler;
		schedule[schedule.length - 1].duration = 12;
		
		var play = document.getElementById("play_button");
		
		var held_notes;
		
		transport.schedule(function(time){
			held_notes = {};
			if(play.innerText == "PLAY" || play.innerText == "LOADING..."){
				transport.stop();
				sampler.releaseAll();
			}
		}, this.getTimeString(0));
		
		for(var i = 0; i < schedule.length; i++){
			(function(unit, time_string, rit, last){
				transport.schedule(function(time){
					sampler.triggerRelease(unit.release, time);
					for(var j = 0; j < unit.release.length; j++){
						if(!held_notes[unit.release[j]]){
							console.log("release failure: ", unit.release[j]);
						}
						held_notes[unit.release[j]] = false;
					}
					if(rit){
						transport.bpm.linearRampTo(42, "0:" + rit_length + ":0");
					}
					if(last){
						sampler.release = 2;
					}
					sampler.triggerAttack(unit.attack, time);
					for(var j = 0; j < unit.attack.length; j++){
						if(held_notes[unit.attack[j]]){
							console.log("attack failure: ", unit.attack[j]);
						}
						held_notes[unit.attack[j]] = true;
					}
				}, time_string);
			})(schedule[i], this.getTimeString(beat_num), i + rit_length == schedule.length - 1, i == schedule.length - 1);
			beat_num += schedule[i].duration;
		}
		transport.schedule(function(time){
			sampler.releaseAll(time);
		}, this.getTimeString(beat_num));
		
		function play_start(){
			play.innerText = "STOP";
			transport.bpm.value = 60;
			sampler.release = 0.1;
			transport.start("+.3", "0:0:0");
		}
		function play_stop(){
			if(play.innerText == "STOP"){
				transport.stop();
				sampler.releaseAll();
				play.innerText = "PLAY";
			}
			else if(Tone.getContext().state == "suspended"){
				Tone.start().then(function(result){
					play_start();
				});
			}
			else{
				play_start();
			}
		}
		beat_num += 6;
		transport.schedule(function(time){
			if(transport.state == "started"){
				transport.stop();
			}
			play.innerText = "PLAY";
			play.onclick = play_stop;
		}, this.getTimeString(beat_num));
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
		
		var max_initial_note_indent = 192;
		
		if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini|Mobile/i.test(navigator.userAgent)){
			this.stave_width = this.min_measure_beat_size * 13 + max_initial_note_indent;
		}
		else{
			var width  = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
			this.stave_width = Math.max((width - (2 * this.x_margin) - 2), (this.min_measure_beat_size * 13 + max_initial_note_indent));
		}
		var possible_beats = (this.stave_width - this.initial_note_indent) / this.min_measure_beat_size;
		this.score.measures_per_line = Math.floor(possible_beats / 4);
		
		
		
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
	getRendererWidth(){
		return this.stave_width + (this.x_margin * 2);
	}
	getRendererHeight(){
		return this.line_height * (this.line_num + 0.3);
	}
	getNoteIndent(){
		if(this.line_num == 0){
			return this.initial_note_indent;
		}
		else{
			return this.note_indent;
		}
	}
	generateLine(measures, beats, is_last){
		var measure_beat_size;
		if(beats <= this.score.measures_per_line * 4 - 3){
			measure_beat_size = this.avg(this.beat_size_list);
		}
		else{
			measure_beat_size = (this.stave_width - this.getNoteIndent()) / beats;
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
			var length = measures[0].width + this.getNoteIndent() - 25;
			staves[i] = new this.score.vf.Stave(x, y, length).addClef(this.clefs[i]).addKeySignature(this.score.key_name);
			if(this.line_num == 0){
				staves[i] = staves[i].addTimeSignature("4/4");
			}
		}
		this.score.renderLine(measures, staves, is_last, this.getNoteIndent());
		this.line_num++;
	}
}

class Score {
	constructor(harmony, note_functions, phrase_lengths, sampler){
		var key = harmony[harmony.length - 2].chord.key;
		this.key_name = key.valueToName(key.pitch);
		
		this.nf = note_functions;
		this.harmony = harmony;
		this.phrase_lengths = phrase_lengths;
		this.pickup = phrase_lengths[0] % 2 == 0;
		this.vf = Vex.Flow;
		this.formatter = new this.vf.Formatter();
		
		var div = document.getElementById("staff")
		this.renderer = new this.vf.Renderer(div, this.vf.Renderer.Backends.SVG);
		
		this.context = this.renderer.getContext();
		this.voice_clefs = ["treble", "treble", "bass", "bass"];
		this.duration_strings = {1: "16", 2: "8", 4: "q", 8: "h", 12: "hd", 16: "w"};
		this.num_notes_to_durations = {2: {0: 2, 1: 2}, 3: {0: 2, 1: 1, 2: 1}};
		
		this.prev_names = [null, null, null, null];
		
		this.player = new Player(sampler);
	}
	
	renderMeasure(measure, staves, is_last, initial_indent){
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
		for(var i = 0; i < measure.beams.length; i++){
			measure.beams[i].setContext(this.context).draw();
		}
	}
	renderLine(measures, staves, is_last, initial_indent){
		var brace = new this.vf.StaveConnector(staves[0], staves[1]).setType(3);
		brace.setContext(this.context).draw();
		var line_left = new this.vf.StaveConnector(staves[0], staves[1]).setType(1);
		line_left.setContext(this.context).draw();
		if(measures.length == 1){
			this.renderMeasure(measures[0], staves, is_last, initial_indent);
		}
		else{
			this.renderMeasure(measures[0], staves, false, initial_indent);
		}
		for(var i = 1; i < measures.length; i++){
			for(var j = 0; j < 2; j++){
				var x = staves[j].width + staves[j].x;
				var y = staves[j].y;
				staves[j] = new this.vf.Stave(x, y, measures[i].width);
			}
			if(i == measures.length - 1){
				this.renderMeasure(measures[i], staves, is_last, null);
			}
			else{
				this.renderMeasure(measures[i], staves, false, null);
			}
		}
	}
	
	renderHarmony(){
		var line_data = new LineData(this);
		
		var measures = [];
		var index_start = 0;
		
		var phrase_done_indices = [this.phrase_lengths[0]];
		for(var i = 1; i < this.phrase_lengths.length; i++){
			phrase_done_indices.push(this.phrase_lengths[i] + phrase_done_indices[i - 1]);
		}
		
		var fermata_lengths = {7: 2, 8: 1, 9: 2, 10: 3};
		
		var num_beats = 0;
		var index = 0;
		var phrase_index = 0;
		var needs_pickup = this.pickup;
		while(index < this.harmony.length){
			if(needs_pickup){
				needs_pickup = false;
				measures.push(this.generateSingleMeasure(index, [1], 1, null));
				index++;
				num_beats++;
			}
			else if(index + 4 <= phrase_done_indices[phrase_index]){
				measures.push(this.generateSingleMeasure(index, [1, 1, 1, 1], 4, null));
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
				var fermata_duration = fermata_lengths[this.phrase_lengths[phrase_index]];
				if(phrase_index == this.phrase_lengths.length - 1 && num_beats % 4 != 0){
					fermata_duration += (4 - (num_beats % 4));
				}
				durations.push(fermata_duration);
				var fermata_index = index + index_change;
				index_change++;
				num_beats_change += fermata_duration;
				num_beats += num_beats_change;
				if(phrase_index != phrase_done_indices.length - 1){
					var max = 4;
					if(this.pickup && num_beats >= 4 * this.measures_per_line - 2){
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
				measures.push(this.generateSingleMeasure(index, durations, num_beats_change, fermata_index));
				index += index_change;
			}
			if(num_beats >= 4 * this.measures_per_line - 1){
				line_data.generateLine(measures, num_beats, index >= this.harmony.length);
				measures = [];
				num_beats = 0;
			}
			if(phrase_done_indices.length > 0 && index >= phrase_done_indices[phrase_index]){
				phrase_index++;
			}
		}
		if(num_beats > 0){
			line_data.generateLine(measures, num_beats, true);
		}
		this.renderer.resize(line_data.getRendererWidth(), line_data.getRendererHeight());
		this.player.generateAudio();
	}
	
	createNoteData(value, name, octave, duration, voice){
		var stem_dir;
		if(voice % 2 == 0){
			stem_dir = 1;
		}
		else{
			stem_dir = -1;
		}
		var note_data = {"clef": this.voice_clefs[voice],
				 "keys": [name + "/" + octave],
				 "duration": duration,
				 "stem_direction": stem_dir};
		return note_data;
	}
		
	generateSingleMeasure(start_index, durations, total_duration, fermata_index){
		var measure = {"notes": [[], [], [], []], "beams": [], "duration": total_duration,
			       "width": null, "ghost_voices": [[], []]};
		var accidentals_in_key = {0: {}, 1: {}};
		var needs_ghost_voices = {0: false, 1: false};
		var prev_value = [null];
		for(var i = 0; i < durations.length; i++){
			var index = start_index + i;
			var beam_start_index = {};
			var voice_to_max = {};
			var max = 1;
			for(var voice = 0; voice < 4; voice++){
				beam_start_index[voice] = measure.notes[voice].length;
				voice_to_max[voice] = this.harmony[index].getNumNotes(voice);
				if(max < voice_to_max[voice]){
					max = voice_to_max[voice];
				}
			}
			for(var sub_index = 0; sub_index < max; sub_index++){
				var names = {0: null, 1: null, 2: null, 3: null};
				var min_duration = null;
				for(var voice = 0; voice < 4; voice++){
					if(sub_index < voice_to_max[voice]){
						var duration;
						if(voice_to_max[voice] == 1){
							duration = 4 * durations[i];
						}
						else{
							duration = this.num_notes_to_durations[voice_to_max[voice]][sub_index];
						}
						if(min_duration == null || min_duration > duration){
							min_duration = duration;
						}
						this.generateSingleBeat(measure, index, fermata_index, voice, sub_index,
									this.duration_strings[duration], names,
									prev_value, accidentals_in_key, needs_ghost_voices);
					}
				}
				var attack_list = [];
				var release_list = [];
				for(var voice = 0; voice < 4; voice++){
					if(names[voice] != null){
						if(this.prev_names[voice] != null && !release_list.includes(this.prev_names[voice])){
							release_list.push(this.prev_names[voice]);
						}
						if(!attack_list.includes(names[voice])){
							attack_list.push(names[voice]);
						}
						this.prev_names[voice] = names[voice];
					}
					else{
						for(var k = release_list.length; k >= 0; k--){
							if(release_list[k] == this.prev_names[voice]){
								release_list.splice(k, 1);
							}
						}
					}
				}
				if(fermata_index != null && index == fermata_index && min_duration < 8){
					min_duration = 8;
				}
				this.player.scheduleNotes(attack_list, release_list, min_duration);
			}
			for(var voice = 0; voice < 4; voice++){
				if(voice_to_max[voice] > 1){
					var beam_notes = [];
					for(var j = beam_start_index[voice]; j < beam_start_index[voice] + voice_to_max[voice]; j++){
						if(measure.notes[voice][j] instanceof this.vf.StaveNote){
							beam_notes.push(measure.notes[voice][j]);
						}
						else{
							beam_notes.push(measure.ghost_voices[Math.floor(voice / 2)][j]);
						}
					}
					measure.beams.push(new this.vf.Beam(beam_notes));
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
	generateSingleBeat(measure, index, fermata_index, voice, sub_index, duration, names, prev_value, accidentals_in_key, needs_ghost_voices){
		var value = this.harmony[index].getValue(voice, sub_index);
		var simple_name = this.nf.valueToSimpleName(value) + Math.floor(value / 12);
		names[voice] = simple_name;
		var name = this.harmony[index].chord.key.valueToName(value).toLowerCase();
		var octave = Math.floor(value / 12);
		if(name.substring(0, 2) == "cb"){
			octave += 1;
		}
		else if(name.substring(0, 2) == "b#"){
			octave -= 1;
		}
		var note_data = this.createNoteData(value, name, octave, duration, voice);
		var note = new this.vf.StaveNote(note_data);
		note.setLedgerLineStyle({strokeStyle: "black"});
		var clef_index = Math.floor(voice / 2);
		if(voice % 2 == 1 && value == prev_value[0]){
			//note: if one of the intersecting notes is a half note and the other is not, new strategy needed
			measure.notes[voice].push(new this.vf.GhostNote(note_data));
			measure.ghost_voices[clef_index].push(note);
			needs_ghost_voices[clef_index] = true;
		}
		else{
			if(!(octave in accidentals_in_key[clef_index])){
				accidentals_in_key[clef_index][octave] = this.harmony[index].chord.key.getAccidentals();
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
			if(duration.substring(duration.length - 1) == "d"){
				note = note.addDotToAll();
			}
			if(voice == 0 && fermata_index != null && index == fermata_index){
				note = note.addArticulation(0, new this.vf.Articulation("a@a").setPosition(3));
			}
			measure.notes[voice].push(note);
			if(voice % 2 == 0){
				prev_value[0] = value;
			}
			else{
				measure.ghost_voices[Math.floor(voice / 2)].push(new this.vf.GhostNote(note_data));
			}
		}
	}
}
