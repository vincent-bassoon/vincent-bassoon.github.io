class Player {
	constructor(sampler){
		this.beat_nums = [0, 0, 0, 0];
		this.schedule = [];
		this.sampler = sampler;
		this.priority_voice_order = [3, 0, 1, 2];

		this.tempo = 60 / 60;
		this.rit_tempo = 58 / 60;
		this.rit_length = 2;
		this.final_rit_tempo = 48 / 60;
		this.final_rit_length = 3;

		this.phrase_beat_nums = [];
	}
	addPhraseIndex(){
		this.phrase_beat_nums.push(this.beat_nums[0]);
	}
	scheduleNote(voice, note, duration){
		var beat_num = this.beat_nums[voice];
		var index = this.schedule.length;
		while(index > 0 && this.schedule[index - 1] > beat_num){
			index--;
		}
		if(index == 0 || this.schedule[index - 1].beat_num != beat_num){
			var notes = {0: null, 1: null, 2: null, 3: null};
			notes[voice] = note;
			this.schedule.splice(index, 0, {"attack": notes, "beat_num": beat_num})
		}
		else{
			this.schedule[index - 1].attack[voice] = note;
		}
		this.beat_nums[voice] += duration;
	}
	getTime(index){
		if(index == 0){
			return 0;
		}
		var schedule = this.schedule;
		var beat_num = schedule[index].beat_num;
		if(this.phrase_beat_nums.includes(beat_num)){
			var beats = beat_num - schedule[index - 1].beat_num;
			return schedule[index - 1].time + this.rit_tempo * beats / 4;
		}

		var end_index = 0;
		while(end_index < schedule.length - 1 && (beat_num > schedule[end_index].beat_num || !this.phrase_beat_nums.includes(schedule[end_index + 1].beat_num))){
			end_index++;
		}
		var rit_length;
		var rit_tempo;
		if(end_index == schedule.length - 1){
			rit_tempo = this.final_rit_tempo;
			rit_length = this.final_rit_length;
		}
		else{
			rit_tempo = this.rit_tempo;
			rit_length = this.rit_length;
		}
		if(beat_num + 4 * rit_length > schedule[end_index].beat_num){
			var start_index = index;
			while(schedule[start_index].beat_num + 4 * rit_length != schedule[end_index].beat_num){
				start_index--;
			}
			var progress = schedule[index].beat_num - schedule[start_index].beat_num;
			progress = progress / 4;

			var a = (this.tempo - rit_tempo) / (2 * rit_length);
			var b = this.tempo;
			var c = progress;
			var time = (b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
			return schedule[start_index].time + time;
		}
		else{
			return schedule[index - 1].time + this.tempo * (schedule[index].beat_num - schedule[index - 1].beat_num) / 4;
		}
	}
	voiceToIndex(voice){
		if(voice % 3 == 0){
			return 0;
		}
		else{
			return 1;
		}
	}
	generateAudio(){
		var transport = Tone.Transport;
		transport.cancel();
		transport.timeSignature = 4;
		var rit_time_string;
		var rit_length = 3;
		var schedule = this.schedule;
		var final_schedule = [];
		var prev_note = {0: null, 1: null, 2: null, 3: null};
		var new_note = {0: null, 1: null, 2: null, 3: null};
		var current_note = {0: null, 1: null, 2: null, 3: null};
		for(var i = 0; i < schedule.length; i++){
			for(var voice = 0; voice < 4; voice++){
				prev_note[voice] = current_note[voice];
				if(schedule[i].attack[voice] != null){
					current_note[voice] = schedule[i].attack[voice];
					new_note[voice] = true;
				}
				else{
					new_note[voice] = false;
				}
			}
			schedule[i].time = this.getTime(i);
			var unit = {"time": schedule[i].time, "attack": {0: [], 1: []}, "release": []};
			for(var voice1 = 0; voice1 < 4; voice1++){
				if(new_note[voice1]){
					var valid = true;
					for(var voice2 = 0; voice2 < 4; voice2++){
						if(voice2 != voice1 && new_note[voice2] && current_note[voice2] == current_note[voice1]){
							valid = (voice1 % 3 == 0 || (voice1 == 1 && voice2 == 2));
							voice2 = 4;
						}
					}
					if(valid){
						unit.attack[this.voiceToIndex(voice1)].push(current_note[voice1]);
					}
					var valid = true;
					for(var voice2 = 0; voice2 < 4; voice2++){
						if(voice2 != voice1 && prev_note[voice2] == prev_note[voice1]){
							if(new_note[voice2]){
								valid = (voice1 % 3 == 0 || (voice1 == 1 && voice2 == 2));
							}
							else{
								valid = false;
							}
							voice2 = 4;
						}
					}
					if(valid){
						unit.release.push(prev_note[voice1]);
					}
				}
			}
			final_schedule.push(unit);
		}
		var release = [];
		for(var voice = 0; voice < 4; voice++){
			var note = current_note[voice];
			if(!release.includes(note)){
				release.push(note);
			}
		}
		var phrase_times = [];
		for(var i = 0; i < schedule.length; i++){
			if(this.phrase_beat_nums.includes(schedule[i].beat_num)){
				phrase_times.push(schedule[i].time);
			}
		}
		schedule = final_schedule;
		schedule.push({"attack": {0: [], 1: []}, "release": release, "time": (schedule[schedule.length - 1].time + 4 * this.final_rit_tempo)});
		console.log(schedule);
		var sampler = this.sampler;
		
		var play = document.getElementById("play_button");
		
		var done = {"index": null}

		for(var i = 0; i < schedule.length; i++){
			(function(schedule, index, done){
				transport.schedule(function(time){
					if(index == done.index){
						console.log("repeat transport trigger caught at index " + index);
						return;
					}
					done.index = index;
					if(play.innerText == "PLAY" || play.innerText == "LOADING..."){
						transport.stop();
						sampler.releaseAll();
						return;
					}
					if(schedule[index].release.length != 0){
						sampler.triggerRelease(schedule[index].release, time);
					}
					for(var j = 0; j < 2; j++){
						if(schedule[index].attack[j].length != 0){
							sampler.triggerAttack(schedule[index].attack[j], time, 1 - 0.1 * j);
						}
					}
					if(play.innerText == "PLAY" || play.innerText == "LOADING..."){
						transport.stop();
						sampler.releaseAll();
						return;
					}
					if(index == schedule.length - 3){
						sampler.release = 0.6;
					}
				}, schedule[index].time);
			})(schedule, i, done);
		}
		
		var player = this;
		function play_start(){
			play.innerText = "STOP";
			done.index = null;
			sampler.release = 0.15;
			transport.start("+.3", phrase_times[document.start]);
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
		transport.schedule(function(time){
			if(transport.state == "started"){
				transport.stop();
			}
			play.innerText = "PLAY";
			play.onclick = play_stop;
		}, schedule[schedule.length - 1].time + 1);
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
		
		this.note_indent = Math.max(treble_temp.getNoteStartX(), bass_temp.getNoteStartX()) + 35;
		
		treble_temp = treble_temp.addTimeSignature("4/4");
		bass_temp = bass_temp.addTimeSignature("4/4");
		
		this.initial_note_indent = Math.max(treble_temp.getNoteStartX(), bass_temp.getNoteStartX()) + 35;
		
		this.line_height = 280;
		this.stave_y_indents = [0, 140];
		this.x_margin = 40;
		this.y_margin = 40;
		
		this.min_measure_beat_size = 65;
		this.max_beat_size = this.min_measure_beat_size;
		
		var max_initial_note_indent = 192;
		
		this.is_mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini|Mobile/i.test(navigator.userAgent);

		if(this.is_mobile){
			this.stave_width = this.min_measure_beat_size * 13 + max_initial_note_indent;
		}
		else{
			var width = document.getElementById("flex_container").offsetWidth;
			this.stave_width = Math.max(Math.round(1.17 * (width - this.x_margin)), (this.min_measure_beat_size * 13 + max_initial_note_indent));
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
		return this.stave_width + this.x_margin;
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
	generateLine(measures, weighted_beats, is_last){
		var measure_beat_size = (this.stave_width - this.getNoteIndent()) / weighted_beats;
		if(is_last && weighted_beats <= this.score.measures_per_line * 4 - 4 && this.max_beat_size < measure_beat_size){
			measure_beat_size = this.max_beat_size;
		}
		else if(measure_beat_size > this.max_beat_size){
			this.max_beat_size = measure_beat_size;
		}
		for(var i = 0; i < measures.length; i++){
			measures[i].width = measure_beat_size * measures[i].weighted_duration;
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
		this.key = harmony[harmony.length - 2].chord.key;
		if(this.key.modality == "minor"){
			this.key_name = this.key.valueToName((this.key.pitch + 3) % 12);
		}
		else{
			this.key_name = this.key.valueToName(this.key.pitch);
		}
		
		this.nf = note_functions;
		this.harmony = harmony;
		this.phrase_lengths = phrase_lengths;
		this.pickup = phrase_lengths[0] % 2 == 0;
		this.vf = Vex.Flow;
		this.softmaxFactor = 10;
		this.formatter = new this.vf.Formatter({softmaxFactor: this.softmaxFactor});
		
		var div = document.getElementById("staff");
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
		if(measure.max_duration == 3){
			this.formatter.options.softmaxFactor = 6;
		}
		var voices = {};
		var all_voices = [];
		measure.format_voice.setStave(staves[0]);
		all_voices.push(measure.format_voice);
		for(var i = 0; i < 4; i++){
			voices[i] = new this.vf.Voice({num_beats: measure.duration, beat_value: 4});
			voices[i].addTickables(measure.notes[i]).setStave(staves[Math.floor(i / 2)]);
			all_voices.push(voices[i]);
		}
		for(var i = 0; i < 2; i++){
			if(measure.ghost_notes[i] != null){
				voices[4 + i] = new this.vf.Voice({num_beats: measure.duration, beat_value: 4});
				voices[4 + i].addTickables(measure.ghost_notes[i]).setStave(staves[i]);
				all_voices.push(voices[4 + i]);
			}
		}
		var indent = Math.max(staves[0].getNoteStartX(), staves[1].getNoteStartX());
		if(initial_indent != null){
			indent = initial_indent;
		}
		for(var i = 0; i < 2; i++){
			staves[i].setNoteStartX(indent);
			this.formatter.joinVoices([voices[2 * i], voices[2 * i + 1]]);
		}
		this.formatter.format(all_voices, staves[0].getNoteEndX() - staves[0].getNoteStartX());
		for(var i = 1; i < all_voices.length; i++){
			all_voices[i].setContext(this.context).draw();
		}
		for(var i = 0; i < measure.beams.length; i++){
			measure.beams[i].setContext(this.context).draw();
		}
		if(measure.max_duration == 3){
			this.formatter.options.softmaxFactor = this.softmaxFactor;
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
		var weighted_num_beats = 0;
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
				var total_num_beats = fermata_duration + num_beats_change + num_beats;
				if(phrase_index == this.phrase_lengths.length - 1 && total_num_beats % 4 != 0){
					fermata_duration += (4 - (total_num_beats % 4));
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
			weighted_num_beats += measures[measures.length - 1].weighted_duration;
			if(num_beats >= 4 * this.measures_per_line - 1){
				line_data.generateLine(measures, weighted_num_beats, index >= this.harmony.length);
				measures = [];
				num_beats = 0;
				weighted_num_beats = 0;
			}
			if(phrase_done_indices.length > 0 && index >= phrase_done_indices[phrase_index]){
				phrase_index++;
			}
		}
		if(num_beats > 0){
			line_data.generateLine(measures, num_beats, true);
		}
		var buttons = document.getElementById("flex_container");
        var factor = line_data.getRendererWidth() / buttons.offsetWidth;
        var height = line_data.getRendererHeight() / factor;
		if(!line_data.is_mobile && height + buttons.offsetHeight > window.innerHeight){
        	factor = line_data.getRendererWidth() / (buttons.offsetWidth - 17);
        	height = line_data.getRendererHeight() / factor;
        	document.getElementById("staff").style.width = (buttons.offsetWidth - 17) + "px";
		}
		else{
        	document.getElementById("staff").style.width = buttons.offsetWidth + "px";
		}
        var width = line_data.getRendererWidth() / factor;
		this.renderer.resize(width, height);
		//this.renderer.resize(line_data.getRendererWidth(), line_data.getRendererHeight());
        this.context.setViewBox(0, 0, line_data.getRendererWidth(), line_data.getRendererHeight());
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
			       "width": null, "ghost_notes": [[], []], "format_voice": null};
		measure.weighted_duration = total_duration;
		if(durations.includes(2)){
			measure.weighted_duration -= 0.3;
			measure.max_duration = 2;
		}
		else if(durations.includes(3)){
			if(durations.length == 1){
				measure.weighted_duration -= 1.3;
			}
			else{
				measure.weighted_duration -= 1;
			}
			measure.max_duration = 3;
		}
		else if(durations.includes(4)){
			measure.weighted_duration -= 2;
			measure.max_duration = 4;
		}
		else{
			measure.max_duration = 1;
		}
		var accidentals_in_key = {0: {}, 1: {}};
		var needs_ghost_voices = {0: false, 1: false};
		var prev_value = null;
		var prev_sub_index_max;
		var format_notes = [];
		for(var i = 0; i < durations.length; i++){
			var index = start_index + i;
			if(index == 0 || this.harmony[index - 1].end_of_phrase){
				this.player.addPhraseIndex();
			}
			var beat_format_data = {};
			for(var j = 0; j < 3; j++){
				beat_format_data[j] = {accidental: null, adjacent: false};
			}
			var sub_index_max = 0;
			var beam_start_index = {};
			for(var voice = 0; voice < 4; voice++){
				beam_start_index[voice] = measure.notes[voice].length;
				if(this.harmony[index].getNumNotes(voice) > sub_index_max){
					sub_index_max = this.harmony[index].getNumNotes(voice);
				}
			}
			for(var sub_index = 0; sub_index < sub_index_max; sub_index++){
            	for(var voice = 0; voice < 4; voice++){
            		var voice_sub_index_max = this.harmony[index].getNumNotes(voice);
            		if(sub_index < voice_sub_index_max){
            			var duration;
            			if(voice_sub_index_max == 1){
            				duration = 4 * durations[i];
            			}
            			else{
            				duration = this.num_notes_to_durations[voice_sub_index_max][sub_index];
            			}
            			var accidental = this.generateSingleBeat(measure, index, fermata_index, voice, sub_index,
            				this.duration_strings[duration], prev_value,
            				accidentals_in_key, needs_ghost_voices);

            			if(fermata_index != null && index == fermata_index && duration < 8){
							duration = 8;
						}
						var value = this.harmony[index].getValue(voice, sub_index);
            			if(accidental != null){
            				if(sub_index > 0 || i == 0 || this.harmony[index - 1].getNumNotes(voice) == prev_sub_index_max){
            					beat_format_data[sub_index].accidental = accidental;
            				}
            				else{
            					var other_voice = voice;
            					if(voice % 2 == 0){
            						other_voice++;
            					}
            					else{
            						other_voice--;
            					}
            					if(this.harmony[index - 1].getNumNotes(other_voice) == prev_sub_index_max &&
            						Math.abs(this.harmony[index - 1].getValue(other_voice, prev_sub_index_max - 1) - value) < 5){
            						beat_format_data[sub_index].accidental = accidental;
            					}
            				}
            			}
						if(voice % 2 == 0){
							prev_value = value;
						}
						else{
							var name1 = this.harmony[index].chord.key.valueToName(prev_value);
							var name2 = this.harmony[index].chord.key.valueToName(value);
							if(Math.abs(value - prev_value) < 6 && this.nf.isAdjacent(name1.substring(0, 1), name2.substring(0, 1))){
								beat_format_data[sub_index].adjacent = true;
							}
							prev_value = null;
						}
						var simple_name = this.nf.valueToSimpleName(value) + Math.floor(value / 12);
						this.player.scheduleNote(voice, simple_name, duration);
            		}
            	}
            }
            for(var voice = 0; voice < 4; voice++){
				if(this.harmony[index].getNumNotes(voice) > 1){
					var beam_notes = [];
					for(var j = beam_start_index[voice]; j < beam_start_index[voice] + this.harmony[index].getNumNotes(voice); j++){
						if(measure.notes[voice][j] instanceof this.vf.StaveNote){
							beam_notes.push(measure.notes[voice][j]);
						}
						else{
							beam_notes.push(measure.ghost_notes[Math.floor(voice / 2)][j]);
						}
					}
					measure.beams.push(new this.vf.Beam(beam_notes));
				}
			}
			prev_sub_index_max = sub_index_max;
			var beam_notes = [];
			for(var j = 0; j < sub_index_max; j++){
				var duration;
            	if(sub_index_max == 1){
            		duration = 4 * durations[i];
            	}
            	else{
            		duration = this.num_notes_to_durations[sub_index_max][j];
            	}
            	duration = this.duration_strings[duration];
            	var note_data = this.createNoteData(11 + 48, "b", 4, duration, 0)
            	if(beat_format_data[j].adjacent){
            		note_data.keys.push("c/5");
            	}
				var note = new this.vf.StaveNote(note_data);
				if(beat_format_data[j].accidental != null){
					note = note.addAccidental(0, new this.vf.Accidental(beat_format_data[j].accidental));
				}
				if(duration.substring(duration.length - 1) == "d"){
					note = note.addDotToAll();
				}
				format_notes.push(note);
				if(sub_index_max > 1){
					beam_notes.push(note);
				}
			}
			if(sub_index_max > 1){
				new this.vf.Beam(beam_notes);
			}
		}
		for(var i = 0; i < 2; i++){
			if(!needs_ghost_voices[i]){
				measure.ghost_notes[i] = null;
			}
		}
		measure.format_voice = new this.vf.Voice({num_beats: measure.duration, beat_value: 4});
		measure.format_voice.addTickables(format_notes);
		return measure;
	}
	generateSingleBeat(measure, index, fermata_index, voice, sub_index, duration, prev_value, accidentals_in_key, needs_ghost_voices){
		var accidental = null;

		var value = this.harmony[index].getValue(voice, sub_index);
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
		if(voice % 2 == 1 && value == prev_value){
			//note: if one of the intersecting notes is a half note and the other is not, new strategy needed
			measure.notes[voice].push(new this.vf.GhostNote(note_data));
			measure.ghost_notes[clef_index].push(note);
			needs_ghost_voices[clef_index] = true;
		}
		else{
			if(!(octave in accidentals_in_key[clef_index])){
				accidentals_in_key[clef_index][octave] = this.key.getAccidentals();
			}
			if(accidentals_in_key[clef_index][octave][name.substring(0, 1)] != name.substring(1)){
				accidentals_in_key[clef_index][octave][name.substring(0, 1)] = name.substring(1);
				if(name.substring(1) == ""){
					accidental = "n";
					note = note.addAccidental(0, new this.vf.Accidental("n"));
				}
				else{
					accidental = name.substring(1);
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
			if(voice % 2 == 1){
				measure.ghost_notes[Math.floor(voice / 2)].push(new this.vf.GhostNote(note_data));
			}
		}
		return accidental;
	}
}
