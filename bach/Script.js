function generateNewChorale(data, sampler){
	// Decide basic structure
	
	// 50% major, 50% minor
	var modality = choose({"major": 0.5, "minor": 0.5});
	// 80% four-cadence length, 20% five-cadence
	var cadence_num = chooseInt({4: 0.8, 5: 0.2});
	// 66.7% with pickup, 33.3% without
	var pickup = chooseInt({1: 0.667, 0: 0.333});
	
	// key
	var num_accidentals = chooseInt({0: 0.22, 1: 0.23, 2: 0.23, 3: 0.22, 4: 0.07, 5: 0.02, 6: 0.01});
	var sharp_or_flat = chooseInt({0: 0.5, 2: 0.5}) - 1;
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
		phrase_lengths.push(pickup + chooseInt({7: 0.75, 9: 0.25}));
	}
	
	var chords = null;
	while(chords == null){
		chords = chord_functions.generateChords(key_generator.getKey(pitch, modality), phrase_lengths);
	}
	var counter = 0;
	if(harmony_functions.generateHarmony(data, chords, phrase_lengths, sampler) && counter < 10){
		generateNewChorale(data, sampler);
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
	var sampler = new Tone.Sampler(sources, function(){
		var before_time = Date.now();
		data.unshift({time: null, avg_score: null, attempts: null});
		generateNewChorale(data, sampler);
		logData(data, before_time);
		start.classList.remove("running");
		start.innerText = "NEW CHORALE";
		function run(){
			play.onclick = "";
			play.innerText = "LOADING...";
			start.innerText = "GENERATING...";
			play.classList.add("running");
			if(transport.state == "started"){
				transport.stop();
				sampler.releaseAll();
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
				generateNewChorale(data, sampler);
				logData(data, before_time);
				start.classList.remove("running");
				start.onclick = run;
				start.innerText = "NEW CHORALE";
			}, 1);
		}
		start.onclick = run;
	}, "samples/").toDestination();
}

window.onload = configureSampler;
