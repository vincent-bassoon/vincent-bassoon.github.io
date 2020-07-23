function generateNewChorale(data, samplers){
	// Decide basic structure
	
	// 50% major, 50% minor
	var modality = choose({"major": 50, "minor": 50});
	// 80% four-cadence length, 20% five-cadence
	var cadence_num = chooseInt({4: 80, 5: 20});
	// 66.7% with pickup, 33.3% without
	var pickup = chooseInt({1: 67, 0: 33});
	
	// key
	var num_accidentals = chooseInt({0: 22, 1: 23, 2: 23, 3: 22, 4: 7, 5: 2, 6: 1});
	var sharp_or_flat = chooseInt({0: 50, 2: 50}) - 1;
	var pitch = (7 * (12 + (sharp_or_flat * num_accidentals))) % 12;
	if(modality == "minor"){
		pitch = (pitch + 9) % 12;
	}
	
	var harmony_functions = new HarmonyFunctions();
	var key_generator = new KeyGenerator();
	var chord_functions = new ChordFunctions(key_generator);
	
	var phrase_lengths = [];
	for(var i = 0; i < cadence_num; i++){
		// 75% 7-8 note segment length, 25% 9-10 note length
		phrase_lengths.push(pickup + chooseInt({7: 50, 9: 50}));
	}
	
	var chords = null;
	while(chords == null){
		chords = chord_functions.generateChords(key_generator.getKey(pitch, modality), phrase_lengths);
	}
	var counter = 0;
	if(harmony_functions.generateHarmony(data, chords, phrase_lengths, samplers) && counter < 10){
		generateNewChorale(data, samplers);
		counter++;
	}
	data[0].attempts = counter + 1;
}

function configureSampler(){
	function logData(data, before_time){
		data[0].time = Date.now() - before_time;
		console.log("Current data:    " + JSON.stringify(data[0]));
		var avg = {time: 0, avg_score: 0, attempts: 0};
		for(var key in avg){
			for(var i = 0; i < data.length; i++){
				avg[key] += data[i][key];
			}
			avg[key] /= data.length;
		}
		console.log("Cumulative data: " + JSON.stringify(avg));
		
	}
	var sources = {};
	var names_to_files = {"A" : "A", "C": "C", "D#": "Ds", "F#": "Fs"};
	var file_end = "v5.mp3";
	for(var name in names_to_files){
		for(var i = 2; i <= 5; i++){
			sources[name + i] = names_to_files[name] + i + file_end;
		}
	}
	Tone.getContext().latencyHint = 0.3;
	var transport = Tone.Transport;
	var start = document.getElementById("start_button");
	var play = document.getElementById("play_button");
	var staff = document.getElementById("staff");
	var data = [];
	var samplers = {};
	var channels = {};
	var pans = [0.2, 0.1, -0.1, -0.2];
	var vols = [0.7, 0, 0, 1];
	const reverb = new Tone.Reverb({channelCount: 2, decay: 1, wet: 0.5}).toDestination();
	for(var i = 0; i < 4; i++){
		channels[i] = new Tone.PanVol({channelCount: 2, pan: pans[i], vol: vols[i]}).connect(reverb);
	}
	samplers[0] = new Tone.Sampler(sources, function(){
		var buffers = {};
		for(let [key, value] of samplers[0]._buffers._buffers) {
			buffers[key] = value;
		}
		function createSampler(index){
			if(index == 4){
				function run(){
					play.onclick = "";
					play.innerText = "LOADING...";
					start.innerText = "GENERATING...";
					play.classList.add("running");
					if(transport.state == "started"){
						transport.stop();
						for(var i = 0; i < 4; i++){
							samplers[i].releaseAll();
						}
						transport.cancel();
					}
					start.onclick = "";
					start.classList.add("running");
					setTimeout(function(){
						var before_time = Date.now();
						while(staff.children.length != 0){
							staff.removeChild(staff.lastChild);
						}
						data.unshift({time: null, avg_score: null, attempts: null});
						generateNewChorale(data, samplers);
						logData(data, before_time);
						start.classList.remove("running");
						start.onclick = run;
						start.innerText = "NEW CHORALE";
					}, 1);
				}
				run();
			}
			else{
				samplers[index] = new Tone.Sampler(buffers, function(){
					createSampler(index + 1);
				}).connect(channels[index]);
			}
		}
		createSampler(1);
	}, "samples/").connect(channels[0]);
}

window.onload = configureSampler;
