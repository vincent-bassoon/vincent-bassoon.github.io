var firebaseConfig = {
    apiKey: "AIzaSyD9njoN659jBaO-Ov6sQI33Q5xi9kRl3jw",
    authDomain: "clue-51aa1.firebaseapp.com",
    databaseURL: "https://clue-51aa1-default-rtdb.firebaseio.com",
    projectId: "clue-51aa1",
    storageBucket: "clue-51aa1.appspot.com",
    messagingSenderId: "314308110149",
    appId: "1:314308110149:web:73d763dd4c6d554714802c",
    measurementId: "G-092MCPQDB9"
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

function main_function(){
	let game = [];
	let log = [];
	let players = [];
	let current_player = parseInt(window.location.href.replace(".html", "")[window.location.href.replace(".html", "").length - 1]);

	let suspects = ["Col. Mustard", "Prof. Plum", "Mr. Green", "Miss Scarlet", "Mrs. Peacock", "Mrs. White", "Mme. Rose", "Sgt. Gray", "M. Brunette", "Miss Peach"];
	let weapons = ["Knife", "Candlestick", "Revolver", "Rope", "Lead Pipe", "Wrench", "Poison", "Horseshoe", "Frying Pan"];
	let rooms = ["Courtyard", "Gazebo", "Drawing Room", "Dining Room", "Kitchen", "Carriage House", "Trophy Room", "Conservatory", "Studio", "Billiard Room", "Library", "Fountain"];
	let clues = [];
	clues.push(...suspects);
	clues.push(...weapons);
	clues.push(...rooms);
	
	let titles = {};
	let boxes = {};

	let current_tab = {main: document.getElementById("main-tab-chart"),
					   log: document.getElementById("log-tab-all"),
					   toggle: document.getElementById("toggle-tab-show")};
	let active_tags = {};
	let current_tag = null;
	let current_tag_index = 0;

	let test_element = document.getElementById("test-element");
	let test_selector = $("#test-element");

	let bottom_button_tabs = new Set();
	let active_bottom_buttons = {0: false, 1: false};

	let save_button_active = false;

	let row_height;
	let base_font_size;

	let map_rooms = 13;


	let turn_queue = {
		queue: [],
		page_loaded: false,
		page_shown: false,
		pageFinished: function(queue_length){
			this.page_loaded = true;
			if(this.queue.length <= queue_length && !this.page_shown){
				this.page_shown = true;
				this.showPage();
			}
		},
		showPage: function(){
			updateBoxes(0, 0, true, function(){
				console.log("Showing page");
				for(let i = 0; i < players.length; i++){
					for(let j = 0; j < clues.length; j++){
						boxes[i][j].element.classList.remove("tag-highlight");
					}
				}
				document.getElementById("page-container").style.opacity = 1;
				setTimeout(function(){
					setLoadingMessage("");
				}, 500);
			})
		},
		remove: function(){
			if(this.queue.length == 0){
				return;
			}
			let item = this.queue.shift();
			if(item.render){
				let queue = [];
				updateQueueFromTurn(queue, item.turn, item.pause);
				updateChartQueue(queue, item.pause);
				if(item.pause){
					document.getElementById("log-window").innerText = getMessage(item.turn);
				}
			}
			else{
				updateTurn(item.turn, item.pause);
			}
			if(this.queue.length == 0 && !this.page_shown && this.page_finished){
				this.page_shown = true;
				this.showPage();
			}
		},
		addTurn: function(turn, pause){
			this.queue.push({"turn": turn, "pause": pause, "render": true});
			this.queue.push({"turn": turn, "pause": pause, "render": false});
			if(this.queue.length == 2){
				this.remove();
			}
		}
	}


	function createPage(){
		document.getElementById("map-container").style.display = "none";
		document.getElementById("notes-container").style.display = "none";
		document.getElementById("log-container").style.display = "none";
		document.getElementById("chart-container").style.display = "block";
		document.getElementById("confirm-container").style.display = "none";
		document.getElementById("confirm-container").onclick = function(){
			document.getElementById("confirm-container").style.display = "none";
		};
		clearBottomButtons();

		firebase.database().ref("/game").once('value').then(function(snapshot){
			if(snapshot.val().status == -1){
				configureNewGameScreen();
				return;
			}
			players = snapshot.val().players;
			for(let i = 0; i < players.length; i++){
				players[i].was_moved = false;
				players[i].final_guess = false;
				if(current_player == 0 && !players[i].is_human){
					ai_main_function(i, snapshot.val());
				}
			}
			if(!("notes" in players[current_player])){
				players[current_player].notes = "";
			}
			else{
				document.getElementById("notes-text-field").value = players[current_player].notes;
			}
			answers = snapshot.val().answer;
			game = {"status": snapshot.val().status, "turn": snapshot.val().turn};
			if("history" in snapshot.val()){
				game.history = snapshot.val().history;
			}
			else{
				game.history = {};
			}

			for(let j = 0; j < players.length; j++){
				boxes[j] = {};
			}

			
			$("[id=notes-text-field]").on("input", function() {
				let data = $(this).val();
				if(!save_button_active && data != players[current_player].notes){
					save_button_active = true;
					let save_button = document.getElementById("save-button");
					save_button.innerText = "Save Notes";
					save_button.classList.remove("save-button-disabled");
					save_button.onclick = function(){
						let new_notes = document.getElementById("notes-text-field").value;
						players[current_player].notes = new_notes;
						firebase.database().ref("/game/players/" + current_player + "/notes").set(new_notes);
						save_button_active = false;
						let save_button = document.getElementById("save-button");
						save_button.onclick = null;
						save_button.classList.add("save-button-disabled");
						save_button.innerText = "Notes Saved";
					}
				}
				else if(save_button_active && data == players[current_player].notes){
					save_button_active = false;
					let save_button = document.getElementById("save-button");
					save_button.innerText = "Notes Saved";
					save_button.classList.add("save-button-disabled");
					save_button.onclick = null;
				}
			});

			createTabs();
			createTable();
			createMap();

			updateGameHistory();
			createListeners();
		});
	}



	function createTabs(){
		//create log tabs
		document.getElementById("log-tab-all").style.width = (100.0 / (players.length + 1)) + "%";
		for(let i = 0; i < players.length; i++){
			let index = (current_player + i) % players.length;

			//configure log tabs
			let item = document.createElement("a");
			item.classList.add("tab");
			item.classList.add("log");
			item.id = "log-tab-" + index;
			item.style.width = (100.0 / (players.length + 1)) + "%";
			item.innerText = players[index].name;
			document.getElementById("log-tab-container").appendChild(item);
		}
		
		//set active tabs and onclick
		for(let key in current_tab){
			let tabs = document.getElementsByClassName(key);
			for(let i = 0; i < tabs.length; i++){
				if(tabs[i].id == current_tab[key].id){
					tabs[i].classList.add("active-tab");
				}
				tabs[i].onclick = function(){
					let type = this.id.split("-")[0];
					if(current_tab[type].id != this.id){
						current_tab[type].classList.remove("active-tab");
						this.classList.add("active-tab");
						current_tab[type] = this;
						if(type == "main"){
							document.getElementById("map-container").style.display = "none";
							document.getElementById("chart-container").style.display = "none";
							document.getElementById("log-container").style.display = "none";
							document.getElementById("notes-container").style.display = "none";
							document.getElementById(this.id.split("-")[2] + "-container").style.display = "block";
							if(this.id == "main-tab-log"){
								if(current_tab.log.id == "log-tab-all"){
									displayLog(players.length, (current_tab.toggle.id == "toggle-tab-show"));
								}
								else{
									displayLog(parseInt(current_tab.log.id.split("-")[2]), (current_tab.toggle.id == "toggle-tab-show"));
								}
							}
							if(this.id == "main-tab-chart"){
								document.getElementById("page-container").style.backgroundColor = "white";
								document.getElementById("chart-header").style.display = "table";
							}
							else{
								document.getElementById("chart-header").style.display = "none";
								document.getElementById("page-container").style.backgroundColor = "#777";
							}
							if(this.id == "main-tab-map" || this.id == "main-tab-chart"){
								document.getElementById("page-container").style.height = "";
							}
							else{
								document.getElementById("page-container").style.height = "100%";
							}
							if(bottom_button_tabs.has(this.id)){
								for(let j = 0; j < 2; j++){
									if(active_bottom_buttons[j]){
										document.getElementById("bottom-button-div-" + j).style.display = "block";
									}
								}
							}
							else{
								for(let j = 0; j < 2; j++){
									if(active_bottom_buttons[j]){
										document.getElementById("bottom-button-div-" + j).style.display = "none";
									}
								}
							}
						}
						else if(type == "log"){
							if(this.id == "log-tab-all"){
								displayLog(players.length, (current_tab.toggle.id == "toggle-tab-show"));
							}
							else{
								displayLog(parseInt(this.id.split("-")[2]), (current_tab.toggle.id == "toggle-tab-show"));
							}
						}
						else if(type == "toggle"){
							if(current_tab.log.id == "log-tab-all"){
								displayLog(players.length, (this.id == "toggle-tab-show"));
							}
							else{
								displayLog(parseInt(current_tab.log.id.split("-")[2]), (this.id == "toggle-tab-show"));
							}
						}
					}
				};
			}
		}
	}

	function displayLog(player, show){
		for(let i = 0; i < log.length; i++){
			if(player == players.length || log[i].player == player){
				if(show){
					log[i].element.innerHTML = log[i].question + log[i].answer;
				}
				else{
					log[i].element.innerHTML = log[i].question;
				}
				log[i].element.style.display = "block";
			}
			else{
				log[i].element.style.display = "none";
			}
		}
	}

	function createTable(){
		//offscreen formatting
		for(let i = 0; i < players.length - 4; i++){
			let item = document.createElement("td");
			item.classList.add("chart");
			item.classList.add("data");
			document.getElementById("test-row").appendChild(item);
		}

		//create table
		let table = document.createElement("table");
		table.id = "chart-table";
		table.classList.add("chart");
		let container = document.getElementById("chart-container");
		container.insertBefore(table, container.firstChild);

		//set font and header row of table
		base_font_size = parseInt(window.getComputedStyle(table).fontSize.replace("px", ""));
		let row = document.createElement("tr");
		row.id = "chart-header-row";
		let item = document.createElement("td");
		item.classList.add("title");
		row.appendChild(item);
		for(let i = 0; i < players.length; i++){
			let index = (current_player + i) % players.length;
			item = document.createElement("th");
			item.classList.add("chart");
			item.classList.add("player-name-header");
			item.style.backgroundColor = colors[players[index].character];
			item.innerText = players[index].name;
			row.appendChild(item);
		}
		document.getElementById("chart-header").appendChild(row);

		//add subsequent rows
		for(let i = 0; i < clues.length; i++){
			if(i == suspects.length || i == suspects.length + weapons.length){
				row = document.createElement("tr");
				item = document.createElement("td");
				item.classList.add("chart");
				item.classList.add("border");
				item.colSpan = "" + (players.length + 1);
				row.appendChild(item);
				table.appendChild(row);
			}
			row = document.createElement("tr");
			row.id = "r" + i;
			item = document.createElement("td");
			item.id = "t" + i;
			item.innerText = clues[i];
			item.classList.add("chart");
			item.classList.add("title");
			if(weapons.includes(clues[i])){
				item.classList.add("weapon");
			}
			titles[i] = {element: item, status: 2};
			row.appendChild(item);
			for(let j = 0; j < players.length; j++){
				let index = (current_player + j) % players.length;
				item = document.createElement("td");
				item.classList.add("chart");
				item.id = index + "d" + i;
				boxes[index][i] = {element: item, tags: new Set(), pressed: false, status: 2, update: false};
				item.classList.add("data");
				item.classList.add("status-2");
				row.appendChild(item);
			}
			table.appendChild(row);
		}
		$(document).ready(function(){
			row_height = $("[id=0d0]").height();
		});
	}

	function updateQueueFromTurn(queue, turn, pause){
		if(turn.phase == players.length + 1){
			return;
		}
		let showing_player = getPlayerFromCard(turn.shown);
		if(turn.phase == players.length){
			if(turn.guess[0] == suspects.length){
				return;
			}
			if(turn.shown == clues.length){
				let last_phase = (turn.player + players.length - 1) % players.length;
				if(last_phase != current_player){
					queue.push([last_phase, turn.guess[0], 0]);
					queue.push([last_phase, turn.guess[1], 0]);
					queue.push([last_phase, turn.guess[2], 0]);
				}
			}
			else if(turn.player == current_player){
				queue.push([showing_player, turn.shown, 1]);
			}
			else if(showing_player == current_player){
				queue.push([turn.player, turn.shown, 3]);
			}
			else{
				queue.push([showing_player, turn.guess[0], turn.guess[1], turn.guess[2]]);
			}
		}
		else if(turn.phase > -1 && turn.phase != turn.player && turn.phase != ((turn.player + 1) % players.length)){
			let last_phase = (turn.phase + players.length - 1) % players.length;
			if(last_phase != current_player){
				queue.push([last_phase, turn.guess[0], 0]);
				queue.push([last_phase, turn.guess[1], 0]);
				queue.push([last_phase, turn.guess[2], 0]);
			}
		}
	}

	function updateGameHistory(){
		for(let i = 0; i < players.length; i++){
			players[i].location = {"row": 14, "col": 9};
			map_data[players[i].location.row][players[i].location.col].players.add(i);
			updateMap(i, players[i].location, true);
		}
		let queue = [];
		for(let i = 0; i < players[current_player].hand.length; i++){
			queue.push([current_player, players[current_player].hand[i], 1]);
		}
		updateChartQueue(queue, false);
		let dates = [];
		for(let date in game.history){
			dates.push(date);
		}
		dates.sort(function(a, b){
			return a - b;
		});
		for(let i = 0; i < dates.length; i++){
			let turns = expandTurn(decodeTurn(game.history[dates[i]]));
			for(let j = 0; j < turns.length; j++){
				turn_queue.addTurn(turns[j], false);
			}
		}
	}

	function createListeners(){
		let game_first_call = true;
		firebase.database().ref("/game/status").on('value', (snapshot) => {
			if(game_first_call){
				game_first_call = false;
				let turn_first_call = true;
				firebase.database().ref("/game/turn").on('value', (snapshot) => {
					//this should call once when attaching the listener
					if(turn_first_call){
						turn_first_call = false;
						let turns = expandTurn(decodeTurn(snapshot.val()));
						for(let i = 0; i < turns.length; i++){
							turn_queue.addTurn(turns[i], (i == turns.length - 1));
						}
					}
					else{
						turn_queue.addTurn(decodeTurn(snapshot.val()), true);
					}
				});
				if(snapshot.val() == -1){
					configureNewGameScreen();
				}
				return;
			}
			if(snapshot.val() == -1){
				configureNewGameScreen();
				return;
			}
			for(let i = 0; i < players.length; i++){
				if(snapshot.val() == i){
					let str = "";
					if(i == current_player){
						str = "You won!\n";
					}
					else{
						str = "Player " + players[snapshot.val()].name + " has won!\n";
					}
					for(let i = 0; i < 3; i++){
						str += "\n" + clues[answers[i]];
					}
					setLoadingMessage(str);
					document.getElementById("page-container").style.opacity = 0;
					str = "";
					if(i == current_player){
						str = "You won!\n";
					}
					else{
						str = "Player " + players[snapshot.val()].name + " has won!\n";
					}
					str += clues[answers[0]] + ", " + clues[answers[1]] + ", " + clues[answers[2]];
					document.getElementById("log-window").innerText = str;
					setTimeout(function(){
						document.getElementById("page-container").style.opacity = 1;
					}, 4000);
					setTimeout(function(){
						setLoadingMessage("");
					}, 4500);
					return;
				}
			}
		});
	}

	function getMessage(turn){
		let showing_player = getPlayerFromCard(turn.shown);
		let message = "";
		switch(turn.phase){
		case -3:
			if(turn.prev_final_guess){
				let p = (turn.player - 1 + players.length) % players.length;
				while(players[p].final_guess){
					p = (turn.player - 1 + players.length) % players.length;
				}
				message = players[p].name + " incorrectly guessed";
			}
			if(current_player == turn.player){
				return "Roll to move your character on the map";
			}
			else{
				return "Waiting for " + players[turn.player].name + " to roll";
			}
			break;
		case -2:
			if(current_player == turn.player){
				return "Select a room to move your character " + turn.roll + " spaces on the map";
			}
			else if(turn.roll == 8 || turn.roll == 11){
				return players[turn.player].name + " rolled an " + turn.roll;
			}
			else{
				return players[turn.player].name + " rolled a " + turn.roll;
			}
			break;
		case -1:
			if(current_player == turn.player){
				return "Select a suspect and weapon to ask " + players[(current_player + 1) % players.length].name;
			}
			else{
				return "Waiting for " + players[turn.player].name + " to ask a question";
			}
			break;
		case players.length:
			if(current_player == turn.player){
				message = "To guess the answer, select three clues";
				if(turn.shown != clues.length){
					return players[showing_player].name + " showed you " + clues[turn.shown] + "\n" + message;
				}
				return message;
			}
			else if(turn.guess[0] == suspects.length){
				return "Waiting for " + players[turn.player].name + " to guess or pass the turn";
			}
			else if(turn.shown != clues.length){
				if(getPlayerFromCard(turn.shown) == current_player){
					return "You showed " + clues[turn.shown] + " to " + players[turn.player].name;
				}
				else{
					return players[showing_player].name + " showed a card to " + players[turn.player].name;
				}
			}
			else{
				return "No players had any of the cards";
			}
			break;
		case (players.length + 1):
			return players[turn.player].name + " incorrectly guessed " + clues[turn.guess[0]] + ", " + clues[turn.guess[1]] + ", " + clues[turn.guess[2]];
			break;
		default:
			if(current_player == turn.player){
				message = "You";
			}
			else{
				message = players[turn.player].name;
			}
			message += " asked " + clues[turn.guess[0]] + ", " + clues[turn.guess[1]] + ", " + clues[turn.guess[2]];
			if(turn.phase == current_player){
				let valid_responses = 0;
				for(let i = 0; i < players[current_player].hand.length; i++){
					for(let j = 0; j < 3; j++){
						if(players[current_player].hand[i] == turn.guess[j]){
							valid_responses++;
						}
					}
				}
				if(valid_responses == 0){
					message += ". Your turn to respond";
				}
				else{
					message += ". Select a card to show";
				}
			}
			else if(turn.phase == (turn.player + 1) % players.length || current_player == (turn.phase - 1 + players.length) % players.length){
				message += "\nWaiting for " + players[turn.phase].name + " to respond";
			}
			else{
				message += "\n" + players[(turn.phase - 1 + players.length) % players.length].name + " had none.";
			}
			return message;
			break;
		}
	}

	function updateLog(turn){
		console.log("updating log", log);
		let htmltab = "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp- ";
		if(turn.phase >= 0 && turn.guess[0] != suspects.length){
			if(turn.phase == (turn.player + 1) % players.length){
				let str = "";
				let element = document.createElement("a");
				element.classList.add("log-element");
				element.style.borderColor = colors[players[turn.player].character];
				if(current_tab.log.id == "log-tab-all" || current_tab.log.id == "log-tab-" + turn.player){
					element.style.display = "block";
				}
				else{
					element.style.display = "none";
				}
				document.getElementById("log-display-container").appendChild(element);
				if(turn.player == current_player){
					str += "You";
				}
				else{
					str += players[turn.player].name;
				}
				str += " asked " + clues[turn.guess[0]] + ", " + clues[turn.guess[1]] + ", " + clues[turn.guess[2]] + "<br>";
				log.push({"player": turn.player, "question": str, "answer": "", "element": element});
			}
			else if(turn.phase == players.length){
				if(turn.shown != clues.length){
					let p = getPlayerFromCard(turn.shown);
					let str = htmltab;
					if(p == current_player){
						str += "You ";
					}
					else{
						str += players[p].name;
					}
					if(p == current_player || turn.player == current_player){
						str += " showed " + clues[turn.shown] + "<br>";
					}
					else{
						str += " showed a card";
					}
					log[log.length - 1].answer += str;
				}
				else{
					log[log.length - 1].answer += htmltab + players[(turn.player - 1 + players.length) % players.length].name + " had none";
				}
			}
			else if(turn.phase == players.length + 1){
				let str = players[turn.player].name + " incorrectly guessed " + clues[turn.guess[0]] + ", " + clues[turn.guess[1]] + ", " + clues[turn.guess[2]];
				let element = document.createElement("a");
				element.classList.add("log-element");
				element.style.borderColor = colors[players[turn.player].character];
				if(current_tab.log.id == "log-tab-all" || current_tab.log.id == "log-tab-" + turn.player){
					element.style.display = "block";
				}
				else{
					element.style.display = "none";
				}
				document.getElementById("log-display-container").appendChild(element);
				log.push({"player": turn.player, "question": str, "answer": "", "element": element});
			}
			else{
				log[log.length - 1].answer += htmltab + players[(turn.phase - 1 + players.length) % players.length].name + " had none<br>";
			}
			if(current_tab.toggle.id == "toggle-tab-show"){
				log[log.length - 1].element.innerHTML = log[log.length - 1].question + log[log.length - 1].answer;
			}
			else{
				log[log.length - 1].element.innerHTML = log[log.length - 1].question;
			}
		}
	}

	function getRoom(player){
		//this iteration excludes the cloak room
		for(let i = 0; i < rooms.length; i++){
			if(players[player].location.row == map_room_coords[i].row && players[player].location.col == map_room_coords[i].col){
				return i;
			}
		}
		return -1;
	}

	function updateTurn(turn, pause){
		console.log("Updating turn: player " + turn.player + ", phase " + turn.phase);
		let showing_player = getPlayerFromCard(turn.shown);
		for(let j = 0; j < clues.length; j++){
			titles[j].element.classList.remove("title-guess-selected");
			titles[j].element.classList.remove("title-ask-selected");
			titles[j].element.onclick = null;
		}
		for(let row = 0; row < map_data.length; row++){
			for(let col = 0; col < map_data[row].length; col++){
				if(map_data[row][col].value[0] == "t" && map_data[row][col].value != "t12"){
					map_data[row][col].element.onclick = null;
				}
			}
		}

		updateLog(turn);

		if(pause){
			turn_queue.pageFinished(0);
			if(turn.phase > -1 && turn.guess[0] != suspects.length){
				for(let i = 0; i < 3; i++){
					document.getElementById("r" + turn.guess[i]).classList.add("row-highlight");
				}
			}
			else{
				for(let i = 0; i < clues.length; i++){
					document.getElementById("r" + i).classList.remove("row-highlight");
				}
			}
		}

		switch(turn.phase){
		case -3:
			if(current_player == turn.player){
				if(pause){
					setBottomButton(0, "Roll", !(players[current_player].was_moved), true, ["main-tab-map"], function(){
						clearBottomButtons();
						turn.roll = 2 + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6);
						updateTurnFirebase(encodeTurn(turn.player, -2, turn.roll, [], clues.length, map_rooms));
						turn_queue.remove();
					}, false, "");
					if(players[current_player].was_moved){
						players[current_player].was_moved = false;
						setBottomButton(1, "Stay in " + rooms[getRoom(current_player)], false, false, ["main-tab-map"], function(){
							clearBottomButtons();
							updateTurnFirebase(encodeTurn(turn.player, -1, turn.roll, [], clues.length, getRoom(turn.player)));
							turn_queue.remove();
						}, false, "");
					}
				}
				else{
					players[current_player].was_moved = false;
					turn.roll = 2 + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6);
					turn_queue.remove();
				}
			}
			else{
				turn_queue.remove();
			}
			break;
		case -2:
			if(current_player == turn.player){
				if(pause){
					for(let row = 0; row < map_data.length; row++){
						for(let col = 0; col < map_data[row].length; col++){
							if(map_data[row][col].value[0] == "t" && map_data[row][col].value != "t12"){
								map_data[row][col].element.onclick = function(){
									let room_index = parseInt(this.id.split("_")[1]);
									let dest = calculatePath(current_player, turn.roll, room_index, true);
									if(players[current_player].location.row == dest.row && players[current_player].location.col == dest.col){
										clearBottomButtons();
									}
									else{
										setBottomButton(0, "Move to selected space", true, false, ["main-tab-map"], function(){
											clearBottomButtons();
											resetPath();
											updateMap(current_player, {"row": dest.row, "col": dest.col}, true);
											document.getElementById("confirm-container").style.display = "none";
											if(getRoom(current_player) == -1){
												updateTurnFirebase(encodeTurn(turn.player, players.length, turn.roll, [], clues.length, room_index));
											}
											else{
												updateTurnFirebase(encodeTurn(turn.player, -1, turn.roll, [], clues.length, room_index));
											}
											turn_queue.remove();
										}, false, "");
									}
								};
							}
						}
					}
				}
				else{
					updateMap(turn.player, calculatePath(turn.player, turn.roll, turn.map_room, false), false);
					turn_queue.remove();
				}
			}
			else{
				turn_queue.remove();
			}
			break;
		case -1:
			if(current_player == turn.player && pause){
				//doesn't need to update map, that's done when phase is set to -1;
				for(let row = 0; row < map_data.length; row++){
					for(let col = 0; col < map_data[row].length; col++){
						if(map_data[row][col].value[0] == "t"){
							map_data[row][col].element.onclick = null;
						}
					}
				}
				enableTitleSelection(turn, getRoom(current_player), function(current_guess){
					current_guess = [current_guess[0], current_guess[1], current_guess[2]];
					setBottomButton(1, "Ask", false, false, ["main-tab-chart"], function(){
						clearBottomButtons();
						console.log(current_guess);
						for(let i = 0; i < 3; i++){
							titles[current_guess[i]].element.classList.remove("title-ask-selected");
						}
						for(let j = 0; j < clues.length; j++){
							titles[j].element.onclick = null;
						}
						updateTurnFirebase(encodeTurn(turn.player, (current_player + 1) % players.length, turn.roll, current_guess, clues.length, turn.map_room));
						turn_queue.remove();
					}, true, "Confirm asking " + players[(current_player + 1) % players.length].name + ": \n\n" + clues[current_guess[0]] + "\n" + clues[current_guess[1]] + "\n" + clues[current_guess[2]]);
				});
			}
			else if(current_player != turn.player){
				updateMap(turn.player, calculatePath(turn.player, turn.roll, turn.map_room, false), true);
				turn_queue.remove();
			}
			else{
				turn_queue.remove();
			}
			break;
		case players.length:
			if(current_player == turn.player && pause){
				setBottomButtonPassTurn(0, turn);
				enableTitleSelection(turn, -1, function(current_guess){
					current_guess = [current_guess[0], current_guess[1], current_guess[2]];
					setBottomButton(1, "Guess the answer", false, true, ["main-tab-chart"], function(){
						clearBottomButtons();
						let guess = [];
						for(let j = 0; j < 3; j++){
							guess[j] = current_guess[j];
						}
						for(let i = 0; i < 3; i++){
							if(guess[i] != answers[i]){
								setLoadingMessage("Incorrect guess.\n\nYou must still answer other player's questions");
								document.getElementById("page-container").style.opacity = 0;
								for(let j = 0; j < 3; j++){
									titles[guess[j]].element.classList.remove("title-guess-selected");
								}
								for(let j = 0; j < clues.length; j++){
									titles[j].element.onclick = null;
								}
								setTimeout(function(){
									document.getElementById("page-container").style.opacity = 1;
								}, 4000);
								setTimeout(function(){
									setLoadingMessage("");
								}, 4500);
								firebase.database().ref("/game/history/" + Date.now()).set(encodeTurn(turn.player, turn.phase, turn.roll, turn.guess, turn.shown, turn.map_room));
								updateTurnFirebase(encodeTurn(turn.player, players.length + 1, turn.roll, guess, -1, map_rooms));
								turn_queue.remove();
								return;
							}
						}
						for(let j = 0; j < 3; j++){
							titles[guess[j]].element.classList.remove("title-guess-selected");
						}
						for(let j = 0; j < clues.length; j++){
							titles[j].element.onclick = null;
						}
						firebase.database().ref("/game/status").set(current_player);
					}, true, "Confirm guessing the answer as: \n\n" + clues[current_guess[0]] + "\n" + clues[current_guess[1]] + "\n" + clues[current_guess[2]]);
				});;
			}
			else if(current_player != turn.player && turn.guess[0] == suspects.length){
				updateMap(turn.player, calculatePath(turn.player, turn.roll, turn.map_room, false), true);
				turn_queue.remove();
			}
			else{
				turn_queue.remove();
			}
			break;
		case (players.length + 1):
			players[turn.player].final_guess = true;
			if(current_player == turn.player && pause){
				setTimeout(function(){
					firebase.database().ref("/game/history/" + Date.now()).set(encodeTurn(turn.player, players.length + 1, turn.roll, turn.guess, -1, map_rooms));
					passTurn(turn);
					turn_queue.remove();
				}, 4000);
			}
			else{
				turn_queue.remove();
			}
			break;
		default:
			if(turn.phase == (turn.player + 1) % players.length){
				for(let i = 0; i < players.length; i++){
					if(players[i].character == turn.guess[0]){
						let room_coord = map_room_coords[turn.guess[2] - suspects.length - weapons.length]
						if(players[i].location.row != room_coord.row || players[i].location.col != room_coord.col){
							updateMap(i, room_coord, true);
							players[i].was_moved = true;
						}
						i = players.length;
					}
				}
			}
			if(current_player == turn.player){
				if(pause){
					clearBottomButtons();
				}
				turn_queue.remove();
			}
			else if(turn.phase == current_player && pause){
				let valid_responses = [];
				for(let i = 0; i < players[current_player].hand.length; i++){
					for(let j = 0; j < 3; j++){
						if(players[current_player].hand[i] == turn.guess[j]){
							valid_responses.push(turn.guess[j]);
						}
					}
				}
				console.log("valid responses: ", valid_responses);
				if(valid_responses.length == 0){
					/*setBottomButton(0, "I have none", false, false, ["main-tab-chart"], function(){
						clearBottomButtons();
						let next_phase = (turn.phase + 1) % players.length;
						if(next_phase == turn.player){
							next_phase = players.length;
						}
						updateTurnFirebase(encodeTurn(turn.player, next_phase, turn.roll, turn.guess, clues.length, turn.map_room));
						turn_queue.remove();
					}, false, "");*/
					setTimeout(function(){
						clearBottomButtons();
						let next_phase = (turn.phase + 1) % players.length;
						if(next_phase == turn.player){
							next_phase = players.length;
						}
						updateTurnFirebase(encodeTurn(turn.player, next_phase, turn.roll, turn.guess, clues.length, turn.map_room));
						turn_queue.remove();
					}, 1000);
				}
				else{
					let current_response = null;
					for(let i = 0; i < valid_responses.length; i++){
						titles[valid_responses[i]].element.onclick = function(){
							let shown = parseInt(this.id.substring(1));
							if(current_response != null){
								titles[current_response].element.classList.remove("title-guess-selected");
							}
							if(current_response == shown){
								current_response = null;
							}
							else{
								current_response = shown;
								titles[shown].element.classList.add("title-guess-selected");
							}
							if(current_response != null){
								setBottomButton(0, "Show " + clues[current_response] + " to " + players[turn.player].name, false, false, ["main-tab-chart"], function(){
									clearBottomButtons();
									titles[shown].element.classList.remove("title-guess-selected");
									for(let j = 0; j < clues.length; j++){
										titles[j].element.onclick = null;
									}
									console.log("Showing card " + shown);
									updateTurnFirebase(encodeTurn(turn.player, players.length, turn.roll, turn.guess, shown, turn.map_room));
									turn_queue.remove();
								}, false, "");
							}
							else{
								clearBottomButtons();
							}
						}
					}
				}
			}
			else{
				turn_queue.remove();
			}
			break;
		}
	}

	function enableTitleSelection(turn, current_room, onclick){
		let current_guess = {0: null, 1: null, 2: null};
		let tag = "title-guess-selected";
		if(turn.phase == -1){
			tag = "title-ask-selected";
			current_guess[2] = current_room + suspects.length + weapons.length;
			titles[current_guess[2]].element.classList.add(tag);
		}
		for(let i = 0; i < clues.length; i++){
			titles[i].element.onclick = function(){
				let id = parseInt(this.id.substring(1));
				let index;
				if(id >= suspects.length + weapons.length){
					index = 2;
					if(turn.phase == -1){
						return;
					}
				}
				else if(id >= suspects.length){
					index = 1;
				}
				else{
					index = 0;
				}
				if(current_guess[index] != null){
					titles[current_guess[index]].element.classList.remove(tag);
				}
				if(current_guess[index] == id){
					current_guess[index] = null;
				}
				else{
					current_guess[index] = id;
					titles[id].element.classList.add(tag);
				}
				console.log(current_guess);
				if(current_guess[0] != null && current_guess[1] != null && current_guess[2] != null){
					onclick(current_guess);
				}
				else{
					clearBottomButton(1);
				}
			}
		}
	}

	function setBottomButtonPassTurn(index, turn){
		setBottomButton(index, "Pass the turn", false, false, ["main-tab-chart", "main-tab-map"], function(){
			clearBottomButtons();
			for(let i = 0; i < titles.length; i++){
				titles[i].element.classList.remove("title-guess-selected");
				titles[i].element.classList.remove("title-ask-selected");
				titles[i].element.onclick = null;
			}
			firebase.database().ref("/game/history/" + Date.now()).set(encodeTurn(turn.player, turn.phase, turn.roll, turn.guess, turn.shown, turn.map_room));
			passTurn(turn);
		}, false, "");
	}

	function passTurn(turn){
		for(let i = 0; i < players.length; i++){
			let next_player = (current_player + 1 + i) % players.length;
			if(!players[next_player].final_guess){
				updateTurnFirebase(encodeTurn(next_player, -3, turn.roll, [], -1, map_rooms));
				turn_queue.remove();
				return;
			}
		}
	}
	



	function testFont(selector, font_size, success){
		if(font_size == 12){
			selector.css("font-size", font_size);
			console.log("font set to min font size of " + font_size);
			success();
			return;
		}
		$(document).ready(function(){
			if(test_selector.height() > row_height){
				font_size--;
				test_selector.css("font-size", font_size);
				testFont(selector, font_size, success);
			}
			else{
				selector.css("font-size", font_size);
				console.log("font set to " + font_size + " with heights of " + test_selector.height() + " and " + row_height);
				success();
			}
		});
	}


	function updateBoxes(p, c, highlight, success){
		if(c == clues.length){
			p += 1;
			c = 0;
		}
		if(p == players.length){
			console.log("finished box updates");
			success();
			return;
		}
		if(boxes[p][c].update){
			let box = boxes[p][c];
			box.update = false;
			if(highlight && box.tags.size > 0){
				box.element.classList.add("tag-highlight");
			}
			if(!box.element.classList.contains("status-" + box.status)){
				if(box.status == 3){
					box.element.classList.remove("status-0");
				}
				else{
					box.element.classList.remove("status-2");
				}
				box.element.classList.add("status-" + box.status);
			}
			test_element.style.fontSize = base_font_size + "px";
			let str = Array.from(box.tags).join(", ");
			test_element.innerText = str;
			box.element.innerText = str;
			if(box.tags.size < 2){
				updateBoxes(p, c + 1, highlight, success);
			}
			else{
				console.log(box.element.innerText);
				testFont($("[id=" + box.element.id + "]"), base_font_size, function(){
					updateBoxes(p, c + 1, highlight, success);
				});
			}
		}
		else{
			boxes[p][c].element.classList.remove("tag-highlight");
			updateBoxes(p, c + 1, highlight, success);
		}
	}

	function checkChart(queue, pause){
		//Check for max hand size of other players, fully white rows, if something is already the answer
		for(let i = 0; i < players.length; i++){
			let hand = 0;
			let all_tags = new Set();
			for(let j = 0; j < clues.length; j++){
				if(boxes[i][j].status == 1){
					hand++;
				}
				for(let tag of boxes[i][j].tags){
					all_tags.add(tag);
				}
			}
			let counted_tags = new Set();
			for(let tag of all_tags){
				let overlap = false;
				for(let id of active_tags[tag]){
					let xy = id.split("d");
					xy[0] = parseInt(xy[0]);
					xy[1] = parseInt(xy[1]);
					for(let tag1 of counted_tags){
						if(boxes[xy[0]][xy[1]].tags.has(tag1)){
							overlap = true;
						}
					}
				}
				if(!overlap){
					counted_tags.add(tag);
				}
			}
			if(hand + counted_tags.size == players[i].hand.length){
				let add_pause = true;
				for(let j = 0; j < clues.length; j++){
					if(boxes[i][j].status == 2 && boxes[i][j].tags.size == 0){
						if(pause && add_pause){
							queue.push([]);
							add_pause = false;
						}
						queue.push([i, j, 0]);
					}
				}
			}
		}
		for(let i = 0; i < players.length; i++){
			let hand = clues.length;
			for(let j = 0; j < clues.length; j++){
				if(boxes[i][j].status == 0){
					hand--;
				}
			}
			if(hand == players[i].hand.length){
				let add_pause = true;
				for(let j = 0; j < clues.length; j++){
					if(boxes[i][j].status == 2){
						if(pause && add_pause){
							queue.push([]);
							add_pause = false;
						}
						queue.push([i, j, 1]);
					}
				}
			}
		}
		for(let i = 0; i < clues.length; i++){
			let answer = true;
			let not_answer = false;
			for(let j = 0; j < players.length; j++){
				if(boxes[j][i].status != 0){
					answer = false;
				}
				if(boxes[j][i].status == 1){
					not_answer = true;
				}
			}
			let new_status;
			if(answer){
				new_status = 0;
				//if one suspect is the answer, then some player must have every other suspect
				let start, end;
				if(i < suspects.length){
					start = 0;
					end = suspects.length;
				}
				else if(i < weapons.length + suspects.length){
					start = suspects.length;
					end = suspects.length + weapons.length;
				}
				else{
					start = suspects.length + weapons.length;
					end = clues.length;
				}
				for(let j = start; j < end; j++){
					let num_unknown = 0;
					let player_unknown = -1;
					for(let k = 0; k < players.length; k++){
						if(boxes[k][j].status == 1){
							player_unknown = -1;
							num_unknown = -1;
							k = players.length;
						}
						else if(boxes[k][j].status == 2){
							num_unknown++;
							player_unknown = k;
						}
					}
					if(num_unknown == 1 && player_unknown != -1){
						if(pause){
							queue.push([]);
						}
						queue.push([player_unknown, j, 1]);
					}
				}
			}
			else if(not_answer){
				new_status = 1;
			}
			else{
				new_status = 2;
			}
			if(new_status != titles[i].status){
				if(titles[i].status != 2){
					titles[i].element.classList.remove("title-" + titles[i].status);
				}
				if(new_status != 2){
					titles[i].element.classList.add("title-" + new_status);
				}
				titles[i].status = new_status;
			}
		}
		if(queue.length > 0){
			updateChartQueue(queue, pause);
			return;
		}
		if(pause){
			updateBoxes(0, 0, true, function(){
				if(document.getElementsByClassName("tag-highlight").length > 0){
					setTimeout(function(){
						updateBoxes(0, 0, false, function(){});
					}, 4000);
				}
				clearBottomButtons();
				turn_queue.remove();
			}, false, "");
		}
		else{
			turn_queue.remove();
		}
	}

	function updateChartQueueBackend(queue, pause){
		if(queue[0].length == 3){
			let box = boxes[queue[0][0]][queue[0][1]];
			if(box.status == queue[0][2]){
				queue.splice(0, 1);
				updateChartQueue(queue, pause);
				return;
			}
			box.status = queue[0][2];
			box.element.classList.add("status-" + box.status);
			box.update = true;
			if(box.status == 1){
				for(let tag of box.tags){
					active_tags[tag].delete(box.element.id);
					for(let id of active_tags[tag]){
						let xy = id.split("d");
						xy[0] = parseInt(xy[0]);
						xy[1] = parseInt(xy[1]);
						boxes[xy[0]][xy[1]].tags.delete(tag);
						boxes[xy[0]][xy[1]].update = true;
					}
					active_tags[tag].clear();
				}
				box.tags.clear();
				for(let i = 1; i < players.length; i++){
					let index = (queue[0][0] + i) % players.length;
					if(boxes[index][queue[0][1]].status == 2){
						queue.push([index, queue[0][1], 0]);
					}
				}
			}
			else if(box.status == 0){
				for(let tag of box.tags){
					active_tags[tag].delete(box.element.id);
					if(active_tags[tag].size == 1){
						for(let id of active_tags[tag]){
							let xy = id.split("d");
							xy[0] = parseInt(xy[0]);
							xy[1] = parseInt(xy[1]);
							if(pause){
								queue.push([]);
							}
							queue.push([xy[0], xy[1], 1]);
						}
					}
					else{
						for(let id of active_tags[tag]){
							let xy = id.split("d");
							xy[0] = parseInt(xy[0]);
							xy[1] = parseInt(xy[1]);
							boxes[xy[0]][xy[1]].update = true;
						}
					}
				}
				box.tags.clear();
			}
		}
		else{
			let available_boxes = 0;
			for(let i = 1; i < 4; i++){
				if(boxes[queue[0][0]][queue[0][i]].status == 1){
					available_boxes = -1;
					i = 4;
				}
				else if(boxes[queue[0][0]][queue[0][i]].status == 2){
					available_boxes++;
				}
			}
			if(available_boxes == -1){
				queue.splice(0, 1);
				updateChartQueue(queue, pause);
				return;
			}
			else if(available_boxes == 1){
				for(let i = 1; i < 4; i++){
					if(boxes[queue[0][0]][queue[0][i]].status == 2){
						queue.push([queue[0][0], queue[0][i], 1]);
						queue.splice(0, 1);
						updateChartQueue(queue, pause);
						return;
					}
				}
			}
			current_tag = String.fromCharCode(97 + (current_tag_index % 26));
			if(current_tag_index >= 26){
				current_tag = current_tag + Math.floor(current_tag_index / 26);
			}
			current_tag_index++;
			active_tags[current_tag] = new Set();
			for(let i = 1; i < 4; i++){
				let box = boxes[queue[0][0]][queue[0][i]];
				if(box.status == 2){
					box.tags.add(current_tag);
					active_tags[current_tag].add(box.element.id);
					box.update = true;
				}
			}
		}
		queue.splice(0, 1);
		updateChartQueue(queue, pause);
		return;
	}

	function updateChartQueue(queue, pause){
		console.log("\tQueue length: ", queue.length);
		if(queue.length == 0){
			checkChart(queue, pause);
			return;
		}
		if(pause && queue[0].length == []){
			turn_queue.pageFinished(2);
			queue.shift();
			updateBoxes(0, 0, true, function(){
				setBottomButton(0, "View chart updates", false, true, ["main-tab-chart"], function(){
					updateChartQueueBackend(queue, pause);
				}, false, "");
			});
		}
		else{
			updateChartQueueBackend(queue, pause);
		}
	}






	let map_data;
	let map_raw_text =  `x,x,x,x,x,x,x,x,x,t5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
x,x,x,x,x,x,x,x,x,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
t7,7,7,7,7,7,7,x,x,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
7,7,7,7,7,7,7,x,x,5,5,5,5,5,5,5,5,5,5,5,5,5,5,b5
7,7,7,7,7,7,7,x,x,x,x,d5,d5,x,x,x,x,x,x,x,x,x,x,x
7,7,7,7,7,7,7,x,x,x,x,d6,d6,x,x,x,x,x,x,x,x,x,x,x
7,7,7,7,7,7,7,x,x,t6,6,6,6,6,6,x,x,t4,4,4,4,4,4,4
7,7,7,7,7,7,7,s,d6,6,6,6,6,6,6,d6,s,4,4,4,4,4,4,4
7,7,7,7,7,7,7,s,s,6,6,6,6,6,6,s,s,4,4,4,4,4,4,4
7,7,7,7,7,7,b7,s,s,6,6,6,6,6,6,s,s,4,4,4,4,4,4,4
x,d8,s,s,s,s,d7,s,s,6,6,6,6,6,6,s,s,4,4,4,4,4,4,4
t8,8,8,8,8,8,8,s,s,6,6,6,6,6,b6,s,s,4,4,4,4,4,4,b4
8,8,8,8,8,8,8,s,s,s,s,d6,d6,s,s,s,s,s,d4,s,s,s,s,x
8,8,8,8,8,8,8,d8,s,s,s,p+,s,s,s,s,s,s,s,s,s,s,d3,x
8,8,8,8,8,8,8,s,s,t12,12,12,12,12,s,s,t3,3,3,3,3,3,3,3
8,8,8,8,8,8,b8,s,s,12,12,12,12,12,d12,s,3,3,3,3,3,3,3,3
x,d9,s,d8,s,s,s,s,s,12,12,12,12,12,s,s,3,3,3,3,3,3,3,3
t9,9,9,9,9,9,s,s,d12,12,12,12,12,12,s,s,3,3,3,3,3,3,3,3
9,9,9,9,9,9,s,s,s,12,12,12,12,12,s,d3,3,3,3,3,3,3,3,3
9,9,9,9,9,9,s,s,s,12,12,12,12,b12,s,s,3,3,3,3,3,3,3,b3
9,9,9,9,9,9,d9,s,s,s,s,d12,s,s,s,s,s,s,s,s,s,d3,s,x
9,9,9,9,9,b9,s,s,s,d0,s,s,s,s,d0,s,s,s,s,s,s,s,s,x
x,d9,s,s,s,s,s,s,t0,0,0,0,0,0,0,0,s,s,s,d2,s,s,s,x
t10,10,10,10,10,s,s,s,0,0,0,0,0,0,0,0,s,s,t2,2,2,2,2,2
10,10,10,10,10,d10,s,s,0,0,0,0,0,0,0,0,s,s,2,2,2,2,2,2
10,10,10,10,10,s,s,s,0,0,0,0,0,0,0,0,s,s,2,2,2,2,2,2
10,10,10,10,10,s,s,d0,0,0,0,0,0,0,0,0,d0,s,2,2,2,2,2,2
10,10,10,10,b10,x,x,x,0,0,0,0,0,0,0,0,x,x,2,2,2,2,2,b2
x,x,x,x,x,x,x,x,0,0,0,0,0,0,0,0,x,x,x,x,x,x,x,x
x,x,x,x,x,d11,s,d0,0,0,0,0,0,0,0,0,d0,s,d1,x,x,x,x,x
t11,11,11,11,11,11,11,x,0,0,0,0,0,0,0,b0,x,t1,1,1,1,1,1,1
11,11,11,11,11,11,11,x,x,x,x,x,x,x,x,x,x,1,1,1,1,1,1,1
11,11,11,11,11,11,11,d11,s,s,s,s,p-,s,s,s,d1,1,1,1,1,1,1,1
11,11,11,11,11,11,b11,x,x,x,x,x,x,x,x,x,x,1,1,1,1,1,1,b1`;


	function createMap(){
		//create map_data
		map_data = [];

		let passages = {"t7": {dest: "t2"},
						"t2": {dest: "t7"},
						"t4": {dest: "t10"},
						"t10": {dest: "t4"},
						"p-": {dest: "p+"},
						"p+": {dest: "p-"}};


		let rows = map_raw_text.split("\n");
		for(let row = 0; row < rows.length; row++){
			let cols = rows[row].split(",");
			map_data[row] = [];
			for(let col = 0; col < cols.length; col++){
				let value = cols[col];
				if(value in passages){
					passages[value].row = row;
					passages[value].col = col;
				}
				map_data[row][col] = {"value": value, "color": {}, "movable": /^[tsdp]$/.test(value[0]), "path": false};
			}
		}

		
		//get t and d coords
		let tcoords = {};
		let dcoords = {};
		for(let row = 0; row < map_data.length; row++){
			for(let col = 0; col < map_data[row].length; col++){
				if(map_data[row][col].value[0] == "t"){
					tcoords[map_data[row][col].value] = {"row": row, "col": col};
				}
				else if(map_data[row][col].value[0] == "d"){
					let key = map_data[row][col].value;
					if(!(key in dcoords)){
						dcoords[key] = [];
					}
					dcoords[key].push({"row": row, "col": col});
				}
			}
		}
		//get move possibilities
		for(let row = 0; row < map_data.length; row++){
			for(let col = 0; col < map_data[row].length; col++){
				if(map_data[row][col].movable){
					let value = map_data[row][col].value;
					let moves = [];
					if(value in passages){
						let dest = passages[value].dest;
						moves.push({row: passages[dest].row, col: passages[dest].col});
					}
					if(value in tcoords){
						moves.push(...dcoords["d" + value.substring(1)]);
					}
					if(value in dcoords){
						moves.push(tcoords["t" + value.substring(1)]);
					}
					checkMove(moves, row, col, row - 1, col);
					checkMove(moves, row, col, row + 1, col);
					checkMove(moves, row, col, row, col - 1);
					checkMove(moves, row, col, row, col + 1);
					map_data[row][col].moves = moves;
					map_data[row][col].dists = {};
				}
			}
		}

		//populate move numbers
		for(let key in tcoords){
			let room_index = parseInt(key.substring(1));
			let queue = [];
			queue.push({"row": tcoords[key].row, "col": tcoords[key].col, "prevdist": -1});
			while(queue.length > 0){
				let row = queue[0].row;
				let col = queue[0].col;
				let prevdist = queue.shift().prevdist;
				if(!(room_index in map_data[row][col].dists) || prevdist + 1 < map_data[row][col].dists[room_index]){
					map_data[row][col].dists[room_index] = prevdist + 1;
					let moves = map_data[row][col].moves;
					for(let i = 0; i < moves.length; i++){
						queue.push({"row": moves[i].row, "col": moves[i].col, "prevdist": prevdist + 1});
					}
				}

			}

		}
		configurePlayers();
		createMapTable();
	}

	let map_room_coords;

	function updateMap(player, new_location, draw){
		console.log("updating map for player " + player);
		//first pass: delete old colors/innerText, update sets, update player location
		if(!("location" in players[player])){
			players[player].location = new_location;
			map_data[players[player].location.row][players[player].location.col].players.add(player);
		}
		else{
			let old_row = players[player].location.row, old_col = players[player].location.col;
			if(old_row != new_location.row || old_col != new_location.col){
				map_data[old_row][old_col].players.delete(player);
				setColor(map_data[old_row][old_col], player, "");
				map_data[old_row][old_col].element.innerText = "";
				players[player].location = new_location;
				map_data[players[player].location.row][players[player].location.col].players.add(player);
				if(map_data[old_row][old_col].value[0] == "t"){
					updateRoomText(map_data[old_row][old_col]);
				}
				else if(map_data[old_row][old_col].players.size > 0){
					for(let p of map_data[old_row][old_col].players){
						updateMap(p, players[p].location, draw);
					}
				}
			}
		}
		//second pass: add new colors/innerText
		let row = players[player].location.row, col = players[player].location.col;
		if(map_data[row][col].value[0] == "t"){
			updateRoomText(map_data[row][col]);
			if(current_player == player){
				setColor(map_data[row][col], player, colors[players[player].character]);
			}
		}
		else{
			setColor(map_data[row][col], player, colors[players[player].character]);
			map_data[row][col].element.innerText = players[player].name;
		}
	}

	function configurePlayers(){
		for(let row = 0; row < map_data.length; row++){
			for(let col = 0; col < map_data[row].length; col++){
				if(map_data[row][col].movable){
					map_data[row][col].players = new Set();
				}
			}
		}
	}

	function createMapTable(){

		//create table
		let table = document.createElement("table");
		table.classList.add("map");
		document.getElementById("map-container").appendChild(table);

		map_room_coords = {};
		let item, room_index;
		for(let row = 0; row < map_data.length; row++){
			let row_element = document.createElement("tr");
			for(let col = 0; col < map_data[row].length; col++){
				switch(map_data[row][col].value[0]){
					case "s":
					case "p":
					case "x":
					case "d":
						item = document.createElement("td");
						if(map_data[row][col].value[0] != "x"){
							map_data[row][col].element = item;
						}
						item.classList.add("map");
						if(map_data[row][col].value[0] == "p"){
							item.classList.add("passage");
						}
						else if(map_data[row][col].value[0] == "x"){
							item.classList.add("wall");
						}
						else{
							item.classList.add("square");
						}
						createRoomBorders(item, row, col);
						row_element.appendChild(item);
						break;
					case "t":
						item = document.createElement("td");
						map_data[row][col].element = item;
						item.classList.add("room");
						room_index = parseInt(map_data[row][col].value.substring(1));
						item.id = "room_" + room_index;
						updateRoomText(map_data[row][col]);
						setRoomEdgeBorders(item, room_index);
						map_room_coords[room_index] = {"row": row, "col": col};
						row_element.appendChild(item)
						break;
					case "b":
						room_index = parseInt(map_data[row][col].value.substring(1));
						document.getElementById("room_" + room_index).colSpan = 1 + col - map_room_coords[room_index].col;
						document.getElementById("room_" + room_index).rowSpan = 1 + row - map_room_coords[room_index].row;
						break;
					default:
				}
			}
			table.appendChild(row_element);
		}
	}

	function setColor(item, player, color){
		item.color[player] = color;
		for(let i = 0; i < players.length; i++){
			let p = (current_player + i) % players.length;
			if(p in item.color && item.color[p] != ""){
				item.element.style.backgroundColor = item.color[p];
				return;
			}
		}
		item.element.style.backgroundColor = "white";
	}

	function resetPath(){
		for(let i = 0; i < map_data.length; i++){
			for(let j = 0; j < map_data[i].length; j++){
				if(map_data[i][j].path){
					map_data[i][j].path = false;
					setColor(map_data[i][j], current_player, "");
				}
			}
		}
	}

	function calculatePath(player, roll, room_index, draw){
		if(draw){
			console.log("drawing path");
		}
		else{
			console.log("calculating path");
		}
		resetPath();
		let row = players[player].location.row;
		let col = players[player].location.col;
		if(map_room_coords[room_index].row == row && map_room_coords[room_index].col == col){
			return {"row": row, "col": col};
		}
		for(let i = 0; i < roll; i++){
			if(map_data[row][col].dists[room_index] == 0){
				if(draw){
					map_data[row][col].path = true;
					setColor(map_data[row][col], player, colors[players[player].character]);
				}
				return {"row": row, "col": col};
			}
			else{
				let min_dist = 100;
				let move, best_move = null;
				for(let j = 0; j < map_data[row][col].moves.length; j++){
					move = map_data[row][col].moves[j];
					if(map_data[move.row][move.col].dists[room_index] <= min_dist || best_move == null){
						if(map_data[move.row][move.col].dists[room_index] < min_dist || map_data[move.row][move.col].players.size <= map_data[best_move.row][best_move.col].players.size){
							min_dist = map_data[move.row][move.col].dists[room_index];
							best_move = move;
						}
					}
				}
				if(i == roll - 1 && map_data[best_move.row][best_move.col].players.size > 0){
					if(map_data[best_move.row][best_move.col].value[0] != "t"){
						if(draw){
							setColor(map_data[row][col], player, colors[players[player].character]);
							map_data[row][col].path = true;
						}
						return {"row": row, "col": col};
					}
				}
				row = best_move.row;
				col = best_move.col;
				if(min_dist == 0 || i == roll - 1){
					if(draw){
						setColor(map_data[row][col], player, colors[players[player].character]);
						map_data[row][col].path = true;
					}
					return {"row": row, "col": col};
				}
				else if(draw){
					setColor(map_data[row][col], player, lighter_colors[players[player].character]);
					map_data[row][col].path = true;
				}
			}
		}
	}

	let passage_names = {7: "1", 2: "1", 4: "2", 10: "2"};

	function updateRoomText(map_data_element){
		let room_index = parseInt(map_data_element.value.substring(1));
		let text;
		if(room_index == 12){
			text = "Cloak Room<br />";
		}
		else{
			text = rooms[room_index] + "<br />";
		}
		if(room_index in passage_names){
			text += "(passage " + passage_names[room_index] + ")<br />";
		}
		let occupants = Array.from(map_data_element.players);
		let occupant_names = [];
		for(let i = 0; i < occupants.length; i++){
			occupant_names.push("<mark style='background-color:" + colors[players[occupants[i]].character] + ";'>" + players[occupants[i]].name + "</mark>");
		}
		text += occupant_names.join(", ");
		map_data_element.element.innerHTML = text;
	}

	function checkMove(moves, row1, col1, row2, col2){
		if(row2 < 0 || row2 == map_data.length){
			return;
		}
		if(col2 < 0 || col2 == map_data[row1].length){
			return;
		}
		if(!map_data[row2][col2].movable){
			return;
		}
		if(/^t\d+$/.test(map_data[row1][col1].value) || /^t\d+$/.test(map_data[row2][col2].value)){
			return;
		}
		moves.push({"row": row2, "col": col2});
	}

	function getRoomBorder(border, row1, col1, row2, col2){
		if(row2 < 0 || row2 == map_data.length){
			return "";
		}
		if(col2 < 0 || col2 == map_data[row1].length){
			return "";
		}
		if(map_data[row1][col1].value[0] == "d"){
			if(map_data[row1][col1].value.substring(1) == map_data[row2][col2].value || "b" + map_data[row1][col1].value.substring(1) == map_data[row2][col2].value){
				return "hidden";
			}
			if(/^[tb]$/.test(map_data[row2][col2].value[0]) && map_data[row1][col1].value.substring(1) == map_data[row2][col2].value.substring(1)){
				return "";
			}
		}
		if(/^[tb]?\d+$/.test(map_data[row2][col2].value)){
			return border;
		}
		else{
			return "";
		}
	}

	function createRoomBorders(item, row, col){
		if(map_data[row][col].value == "x"){
			//item.style.border = "2px solid #777";
		}
		if(map_data[row][col].value[0] == "p"){
			return;
		}
		let border = "2px solid black";
		item.style.borderTop = getRoomBorder(border, row, col, row - 1, col);
		item.style.borderBottom = getRoomBorder(border, row, col, row + 1, col);
		item.style.borderLeft = getRoomBorder(border, row, col, row, col - 1);
		item.style.borderRight = getRoomBorder(border, row, col, row, col + 1);
	}

	function setRoomEdgeBorders(item, room_index){
		if(room_index >= 7 && room_index <= 11){
			item.style.borderLeft = "2px solid black";
		}
		if(room_index >= 1 && room_index <= 5){
			item.style.borderRight = "2px solid black";
		}
		if(room_index == 5){
			item.style.borderTop = "2px solid black";
		}
		if(room_index == 1 || room_index == 11){
			item.style.borderBottom = "2px solid black";
		}
	}


	function updateTurnFirebase(encoded_turn){
		turn_queue.remove();
		firebase.database().ref("/game/turn").set(encoded_turn);
	}

	function setLoadingMessage(str){
		document.getElementById("loading-message").innerText = str;
	}

	function clearBottomButton(index){
		active_bottom_buttons[index] = false;
		document.getElementById("bottom-button-div-" + index).style.display = "none";
		bottom_button_tabs = new Set();
		document.getElementById("bottom-button-" + index).onclick = null;
		document.getElementById("bottom-button-" + index).innerText = "";
	}

	function clearBottomButtons(){
		for(let i = 0; i < 2; i++){
			clearBottomButton(i);
		}
	}

	function setBottomButton(button_index, str, full, offset, tabs, onclick, confirm, confirm_message){
		let button = document.getElementById("bottom-button-" + button_index);
		let div = document.getElementById("bottom-button-div-" + button_index);
		active_bottom_buttons[button_index] = true;
		let width;
		if(full){
			width = 100;
		}
		else{
			width = 50;
		}
		if(confirm){
			button.onclick = function(){
				document.getElementById("confirm").innerText = confirm_message;
				document.getElementById("confirm").onclick = function(){
					console.log("pressed");
					onclick();
					document.getElementById("confirm-container").style.display = "none";
				};
				document.getElementById("confirm-container").style.display = "block";
			}
		}
		else{
			button.onclick = onclick;
		}
		button.innerText = str;
		div.style.width = width + "%";
		if(offset){
			div.style.float = "right";
		}
		else{
			div.style.float = "left";
		}
		bottom_button_tabs = new Set();
		for(let i = 0; i < tabs.length; i++){
			bottom_button_tabs.add(tabs[i]);
		}
		if(bottom_button_tabs.has(current_tab.main.id)){
			div.style.display = "block";
		}
		else{
			div.style.display = "none";
		}
	}

	function decodeTurn(turn_data){
		let temp = {};
		temp.shown = turn_data % (clues.length + 1);
		turn_data = (turn_data - temp.shown) / (clues.length + 1);
		temp.map_room = turn_data % (map_rooms + 1);
		turn_data = (turn_data - temp.map_room) / (map_rooms + 1);
		temp.roll = turn_data % 11 + 2;
		turn_data = (turn_data - (temp.roll - 2)) / 11;
		temp.guess = [];
		temp.guess[2] = turn_data % (rooms.length + 1);
		turn_data = (turn_data - temp.guess[2]) / (rooms.length + 1);
		temp.guess[1] = turn_data % (weapons.length + 1);
		turn_data = (turn_data - temp.guess[1]) / (weapons.length + 1);
		temp.guess[0] = turn_data % (suspects.length + 1);
		turn_data = (turn_data - temp.guess[0]) / (suspects.length + 1);
		temp.phase = turn_data % (5 + players.length) - 3;
		turn_data = (turn_data - (temp.phase + 3)) / (5 + players.length);
		temp.player = turn_data;
		temp.guess[2] += suspects.length + weapons.length;
		temp.guess[1] += suspects.length;
		return temp;
	}

	function createTurn(player, phase, roll, guess, shown, map_room){
		if(guess.length == 0){
			guess = [suspects.length, weapons.length, rooms.length];
		}
		else{
			guess = [guess[0], guess[1], guess[2]];
		}
		return {"player": player, "phase": phase, "roll": roll, "guess": guess, "shown": shown, "map_room": map_room};
	}

	function encodeTurn(player, phase, roll, guess, shown, map_room){
		/*
			player: current player
			phase:  -3: needs to roll
					-2: needs to move
					-1: needs to ask question
					0-9: waiting for player 0-9 to respond
						-note: phase should never equal player
					=number of players: needs to decide whether to make a guess
						in this phase, two of the cards will have values of [clue].length, which is invalid. remaining card will be what was shown.
						Or all will be invalid, showing that question went all the way around
					also includes what room players are moving towards
		*/
		if(guess.length == 0){
			guess = [suspects.length, weapons.length, rooms.length];
		}
		else{
			guess = [guess[0], guess[1] - suspects.length, guess[2] - suspects.length - weapons.length];
		}
		let data = (((((player * (5 + players.length)) + phase + 3) * (suspects.length + 1) + guess[0]) * (weapons.length + 1) + guess[1]) * (rooms.length + 1) + guess[2]);
		return ((data * 11 + roll - 2) * (map_rooms + 1) + map_room) * (clues.length + 1) + shown;
	}

	function expandTurn(turn){
		console.log("Expanding ", turn);
		let turns = [];
		let showing_player = getPlayerFromCard(turn.shown);
		console.log("Showing player ", showing_player);
		if(turn.phase == players.length + 1){
			turns.push(createTurn(turn.player, turn.phase, turn.roll, turn.guess, turn.shown, turn.map_room));
			console.log(turns);
			return turns;
		}
		if(turn.phase > -3){
			turns.push(createTurn(turn.player, -3, turn.roll, [], clues.length, map_rooms));
		}
		if(turn.phase > -2){
			turns.push(createTurn(turn.player, -2, turn.roll, [], clues.length, turn.map_room));
		}
		if(turn.phase > -1 && !(turn.phase == players.length && turn.guess[0] == suspects.length)){
			turns.push(createTurn(turn.player, -1, turn.roll, [], clues.length, turn.map_room));
			let index = 1;
			while(index < players.length){
				let phase = (turn.player + index) % players.length;
				if(phase == turn.phase || ((turn.player + index - 1) % players.length) == showing_player){
					index = players.length;
				}
				else{
					turns.push(createTurn(turn.player, phase, turn.roll, turn.guess, clues.length, turn.map_room));
					index++;
				}
			}
		}
		turns.push(createTurn(turn.player, turn.phase, turn.roll, turn.guess, turn.shown, turn.map_room));
		console.log(turns);
		return turns;
	}
	

	function getPlayerFromCard(shown){
		if(shown == clues.length){
			return -1;
		}
		for(let i = 0; i < players.length; i++){
			for(let j = 0; j < players[i].hand.length; j++){
				if(shown == players[i].hand[j]){
					return i;
				}
			}
		}
	}

	function configureNewGameScreen(){
		firebase.database().ref("/game/players").once('value').then(function(snapshot){
			let new_players = snapshot.val();
			let current = document.getElementById("current-player");
			let links = document.getElementById("player-link-container");
			current.innerText = "Current player: " + new_players[current_player].name + "\n\nSetting up new game...\n\n\n";

			let item;
			for(let i = 1; i < new_players.length; i++){
				let p = (current_player + i) % new_players.length;
				if(new_players[p].is_human){
					item = document.createElement("a");
					item.style.textDecoration = "none";
					item.href = p + ".html";
					item.classList.add("player-link")
					item.innerText = "Switch to " + new_players[p].name;
					links.appendChild(item);
				}
			}

			current.style.display = "block";
			links.style.display = "block";
			setLoadingMessage("");
			document.getElementById("page-container").style.opacity = 0;
			setTimeout(function(){
				document.getElementById("page-container").style.display = "none";
			}, 500);
			let first = true;
				firebase.database().ref("/game/status").on('value', (snapshot) => {
					if(first){
						first = false;
					}
					else{
						document.location.reload();
					}
				});
		});
	}

	createPage();
}

main_function();