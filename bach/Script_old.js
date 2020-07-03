function generateChoralePlan(key, cadence_num, pickup){
	var phrase_lengths = {};

	for(var i = 0; i < cadence_num; i++){
		// 75% 7-8 note segment length, 25% 9-10 note length
		phrase_lengths[i] = pickup + chooseInt({7: 0.75, 9: 0.25});
	}

	var chorale_plan = [];
	var previous_cadence_chord = null;
	for(var i = 0; i < cadence_num; i++){
		var cadence;

		// Ending: 100% PAC ... 70% Piccardy third for minor, 30% not
		if(i == cadence_num - 1){
			if(key.modality == "minor"){
				cadence = choose({"pac": 0.3, "pacm": 0.7});
			}
			else{
				cadence = "pac";
			}
		}
		// 74% PAC/IAC, 17% HC, 7% DC, 2% PC
		else{
			cadence = choose({"pac": 0.37, "pac/iac": 0.34, "hc": 0.2, "dc": 0.07, "pc": 0.02});
		}

		var cadence_length = lengths[cadence];
		// 4 beat cadence includes a 64 tonic
		if(cadence != "pac/iac" && cadence_length == 3 && chooseInt({0: 0.8, 1: 0.2}) == 0){
			cadence_length++;
		}
		chorale_plan.push(new PhraseData(key, phrase_lengths[i], fermata_duration,
						 cadence, cadence_length, previous_cadence_chord));
		previous_cadence_chord = endings[cadence];
	}
	return chorale_plan;
}

function generateNewChorale(data, sampler){
	// Decide basic structure

@@ -65,9 +26,9 @@ function generateNewChorale(data, sampler){
		phrase_lengths.push(pickup + chooseInt({7: 0.75, 9: 0.25}));
	}

	var chords = [];
	for(var i = 0; i < cadence_num; i++){
		chords.push(chord_functions.generateChords(key_generator.getKey(pitch, modality), phrase_lengths));
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
