class Score {
	constructor(harmony, chords, note_functions){
		this.harmony = harmony;
		this.chords = chords;
		this.note_functions = note_functions;
		this.vf = Vex.Flow;
		this.formatter = new this.vf.Formatter();
		
		var width  = window.innerWidth || document.documentElement.clientWidth || 
		document.body.clientWidth;
		var height = window.innerHeight|| document.documentElement.clientHeight|| 
		document.body.clientHeight;
		var dim = Math.max(width, height);
		this.stave_length = dim - 50;
		
		var div = document.getElementById("staff")
		var renderer = new this.vf.Renderer(div, this.vf.Renderer.Backends.SVG);
		renderer.resize(dim, dim);
		
		this.context = renderer.getContext();
		
		this.clefs = ["treble", "bass"];
		this.voice_clefs = ["bass", "bass", "treble", "treble"];
		this.durations = {1: "q", 2: "h", 3: "hd", 4: "w"};
	}
	
	
	
	render_harmony(){
		var y_start = 40;
		var x_start = 20;
		
		var measures = this.generate_measures();
		var measure_length = 100;
		
		while(harmony.length != 0){
			var staves = [new vf.Stave(20, y_start, stave_length), new vf.Stave(20, y_start + 110, stave_length)];
			staves[0].addClef('treble').addTimeSignature("4/4").getNoteStartX();
			staves[1].addClef('bass').addTimeSignature("4/4");
			
			var measures = generate_measures(vf, stave_length, harmony, chords);
			
			var brace = new vf.StaveConnector(staves[0], staves[1]).setType(vf.StaveConnector.type.BRACE);
			var line_left = new vf.StaveConnector(staves[0], staves[1]).setType(vf.StaveConnector.type.SINGLE_LEFT);
			/*
			var staveBar1 = new VF.Stave(10, 50, 200);
			staveBar1.setBegBarType(VF.Barline.type.REPEAT_BEGIN);
      staveBar1.setEndBarType(VF.Barline.type.DOUBLE);
      staveBar1.setSection("A", 0);
      staveBar1.addClef("treble").setContext(ctx).draw();
      var notesBar1 = [
        new VF.StaveNote({ keys: ["c/4"], duration: "q" }),
        new VF.StaveNote({ keys: ["d/4"], duration: "q" }),
        new VF.StaveNote({ keys: ["b/4"], duration: "qr" }),
        new VF.StaveNote({ keys: ["c/4", "e/4", "g/4"], duration: "q" })
      ];

      // Helper function to justify and draw a 4/4 voice
      VF.Formatter.FormatAndDraw(ctx, staveBar1, notesBar1);

      // bar 2 - juxtaposing second bar next to first bar
      var staveBar2 = new VF.Stave(staveBar1.width + staveBar1.x, staveBar1.y, 300);
      staveBar2.setSection("B", 0);
      staveBar2.setEndBarType(VF.Barline.type.END);
      staveBar2.setContext(ctx).draw();
		*/
			staves[0].setContext(context).draw();
			staves[1].setContext(context).draw();
			brace.setContext(context).draw();
			line_right.setContext(context).draw();
			line_left.setContext(context).draw();
			
			var voices = [];
			for(var i = 0; i < 2; i++){
				voices[i] = new vf.Voice({num_beats: 4, beat_value: 4});
				voices[i].addTickables(notes[i]).setStave(staves[i]);
			}
			
			var startX = Math.max(staves[0].getNoteStartX(), staves[1].getNoteStartX());
			staves[0].setNoteStartX(startX);
			staves[1].setNoteStartX(startX);
			
			formatter.joinVoices([voices[0]]);
			formatter.joinVoices([voices[1]]);
			formatter.format([voices[0], voices[1]], stave_length - (startX - staveX));			

			voices[0].setContext(context).draw();
			voices[1].setContext(context).draw();
		
			y_start += 240;
		}
	}
	
	generate_measures(){
		var measures = [];
		var pickup = (this.chords[0].length % 2 == 0);
		var start = 0;
		for(var i = 0; i < this.chords.length i++){
			var length = this.chords[i].length;
			var index = 0;
			if(pickup){
				measures.push(this.generate_single_measure(index + start 1, 1));
				index++;
			}
			while(index + 4 <= length){
				measures.push(this.generate_single_measure(index + start, 4, 4));
				index += 4;
			}
			if(index < length){
				var duration = 4;
				if(pickup){
					duration = 3;
				}
				measures.push(this.generate_single_measure(index + start, length - index, duration));
			}
			start += length
		}
		return measures;
	}
		
	generate_single_measure(index, index_length, duration){
		var measure = {notes: [[], [], [], []], "duration": duration};		
		for(var i = index; i < index + index_length; i++){
			for(var voice = 0; voice < 4; voice++){
				var value = this.harmony[i][voice].get_end_value();
				var octave = Math.floor(value / 12);
				var name = this.note_functions.value_to_name(value, this.chords[i]);
				var duration;
				if(i == index + index_length - 1){
					duration = this.durations[duration - index_length + 1];
				}
				else{
					duration = "q";
				}
				var note_data = {clef: this.voice_clefs[voice], keys: [name + "/" + octave], "duration": duration };
				var note = new this.vf.StaveNote(note_data);
				if(name.length != 1){
					note = note.addAccidental(0, new this.vf.Accidental(note.substring(1)));
				}
				if(duration == 3){
					note = note.addDotToAll();
				}
				measure.notes[voice].push(note);
			}
		}
		return measure;
	}
}
