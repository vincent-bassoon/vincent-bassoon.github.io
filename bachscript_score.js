class Score {
	constructor(harmony, chords, note_functions){
		this.chords = chords;
		this.note_functions = note_functions;
		this.vf = Vex.Flow;
		this.formatter = new this.vf.Formatter();
		
		var width  = window.innerWidth || document.documentElement.clientWidth || 
		document.body.clientWidth;
		var height = window.innerHeight|| document.documentElement.clientHeight|| 
		document.body.clientHeight;
		this.dim = Math.max(width, height);
		
		var div = document.getElementById("staff")
		var renderer = new vf.Renderer(div, this.vf.Renderer.Backends.SVG);
		renderer.resize(this.dim, this.dim);
		
		this.context = renderer.getContext();
		
		this.clefs = ["treble", "bass"];
		
		function harmony_to_notes(harmony){
			
		}
	}
	
	generate_vex(begin_index, end_index, measure_length){
		var measure = [[], [], [], []];
		for(var i = begin_index; i < end_index; i++){
			for(var j = 0; j < 2; j++){
				
			}
		}
		/*
	
    new VF.StaveNote({clef: "treble", keys: ["e##/5"], duration: "8d" }).
      addAccidental(0, new VF.Accidental("##")).addDotToAll(),

    new VF.StaveNote({clef: "treble", keys: ["eb/5"], duration: "16" }).
      addAccidental(0, new VF.Accidental("b")),

    new VF.StaveNote({clef: "treble", keys: ["d/5", "eb/4"], duration: "h" }).
    	addDot(0),

    new VF.StaveNote({clef: "treble", keys: ["c/5", "eb/5", "g#/5"], duration: "q" }).
      addAccidental(1, new VF.Accidental("b")).
      addAccidental(2, new VF.Accidental("#")).addDotToAll()
  ];
  */
	}
	
	generate_measures(){
		var measures = [];
		var index_start = 0;
		var pickup = this.chords[0].length % 2 == 0
		for(var i = 0; i < this.chords.length i++){
			var phrase_length = this.chords[i].length;
			if(pickup){
				measures.push(this.harmony_to_vex(index_start, index_start + 1, 1));
			}
			var begin_index = 0;
			var end_index = begin_index + 4;
			while(end_index <= phrase_length){
				measures.push(this.harmony_to_vex(begin_index + index_start, end_index + index_start, 4));
				begin_index += 4;
				end_index += 4;
			}
			if(begin_index < phrase_length){
				var length = 4;
				if(pickup){
					length = 3;
				}
				measures.push(this.harmony_to_vex(begin_index + index_start, phrase_length + index_start, length));
			}
			
			index_start += phrase_length;
		}
		retuurn measures;
	}
	
	generate_lines(vf, context, formatter, dim, harmony, chords){
		var y_start = 40;
		var stave_length = dim - 50;
		while(harmony.length != 0){
			var staves = [new vf.Stave(20, y_start, stave_length), new vf.Stave(20, y_start + 110, stave_length)];
			staves[0].addClef('treble').addTimeSignature("4/4");
			staves[1].addClef('bass').addTimeSignature("4/4");
			
			var measures = generate_line_measures(vf, stave_length, harmony, chords);
			
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
