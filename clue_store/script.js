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
	var titles = {};
	var boxes = {0: {}, 1: {}, 2: {}, 3: {}};
	var turn_history = [];
	var tag_history = [];

	var current_tab = {top: document.getElementById("top-tab-all"),
					   status: document.getElementById("status-tab-none"),
					   add: document.getElementById("add-tab-none"),
					   player: document.getElementById("player-tab-1")};
	var current_tag = {};
	var current_box_num = 0;

	var players = ["C", "T", "J", "V"];
	var test_element = document.getElementById("test-element");
	var test_selector = $("#test-element");
	var player_initial = test_element.innerText;
	while(players[0] != player_initial.toUpperCase()){
		players.unshift(players.pop());
	}
	for(var i = 1; i < 4; i++){
		current_tag[players[i]] = 1;
		document.getElementById("player-tab-" + i).innerText = players[i];
	}

	var row_height;
	var base_font_size;

	var suspects = ["Col. Mustard", "Prof. Plum", "Mr. Green", "Mrs. Peacock", "Miss Scarlet", "Mrs. White", "Mme. Rose", "Sgt. Gray", "M. Brunette", "Miss Peach"];
	var weapons = ["Knife", "Candlestick", "Revolver", "Rope", "Lead Pipe", "Wrench", "Poison", "Horseshoe", "Frying Pan"];
	var rooms = ["Courtyard", "Gazebo", "Drawing Room", "Dining Room", "Kitchen", "Carriage House", "Trophy Room", "Conservatory", "Studio", "Billiard Room", "Library", "Fountain"];
	var clues = [];
	clues.push(...suspects);
	clues.push(...weapons);
	clues.push(...rooms);


	function updateTab(element){
		var type = element.id.split("-")[0];
		if(current_tab[type].id != element.id){
			current_tab[type].classList.toggle("active-tab");
			element.classList.toggle("active-tab");
			current_tab[type] = element;
		}
	}

	function clearBoxes(){
		for(var i = 0; i < players.length; i++){
			for(var j = 0; j < clues.length; j++){
				if(boxes[i][j].pressed){
					boxes[i][j].pressed = false;
					boxes[i][j].element.classList.toggle("data-pressed");
				}
			}
		}
		current_box_num = 0;
		document.getElementById("edit").innerText = "Edit 0 boxes";
	}

	function createTabs(){
		for(var key in current_tab){
			var tabs = document.getElementsByClassName(key);
			for(var i = 0; i < tabs.length; i++){
				if(tabs[i].id == current_tab[key].id){
					tabs[i].classList.toggle("active-tab");
				}
				if(key == "top"){
					tabs[i].onclick = function(){
						updateTab(this);
						clearBoxes();
						if(this.id == "top-tab-all"){
							for(var i = 0; i < clues.length; i++){
								document.getElementById("r" + i).classList.remove("hide");
							}
							document.getElementById("border-0").classList.remove("hide");
							document.getElementById("border-1").classList.remove("hide");
						}
						else{
							var category_found = {0: false, 1: false, 2: false};
							for(var i = 0; i < clues.length; i++){
								var known = false;
								for(var j = 0; j < players.length; j++){
									if(boxes[j][i].status == 1){
										known = true;
									}
								}
								if((this.id == "top-tab-known") == known){
									document.getElementById("r" + i).classList.remove("hide");
									if(i < suspects.length){
										category_found[0] = true;
									}
									else if(i < suspects.length + weapons.length){
										category_found[1] = true;
									}
									else{
										category_found[2] = true;
									}
								}
								else{
									document.getElementById("r" + i).classList.add("hide");
								}
							}
							var found = [];
							for(var i = 0; i < 3; i++){
								if(category_found[i]){
									found.push(i);
								}
							}
							if(found.length == 0 || found.length == 1){
								document.getElementById("border-0").classList.add("hide");
								document.getElementById("border-1").classList.add("hide");
							}
							else if(found.length == 2){
								document.getElementById("border-0").classList.add("hide");
								document.getElementById("border-1").classList.add("hide");
								document.getElementById("border-" + found[0]).classList.remove("hide");
							}
							else{
								document.getElementById("border-0").classList.remove("hide");
								document.getElementById("border-1").classList.remove("hide");
							}
						}
					}
				}
				else{
					tabs[i].onclick = function(){
						updateTab(this);
						if(current_tab.status.id == "status-tab-none" && current_tab.add.id == "add-tab-none"){
							document.getElementById("submit-edit").innerText = "Cancel";
						}
						else{
							document.getElementById("submit-edit").innerText = "Submit";
						}
					};
				}
			}
		}
	}


	function createTable(){
		var table = document.getElementById("table");
		base_font_size = parseInt(window.getComputedStyle(table).fontSize.replace("px", ""));
		var row = document.createElement("tr");
		var item = document.createElement("td");
		item.classList.add("title");
		row.appendChild(item);
		for(var i = 0; i < players.length; i++){
			item = document.createElement("th");
			item.innerText = players[i];
			row.appendChild(item);
		}
		table.appendChild(row);

		for(var i = 0; i < clues.length; i++){
			if(i == suspects.length || i == suspects.length + weapons.length){
				row = document.createElement("tr");
				if(i == suspects.length){
					row.id = "border-0";
				}
				else{
					row.id = "border-1";
				}
				item = document.createElement("td");
				item.classList.add("border");
				item.colSpan = "5";
				row.appendChild(item);
				table.appendChild(row);
			}
			row = document.createElement("tr");
			row.id = "r" + i;
			item = document.createElement("td");
			item.id = "t" + i;
			item.innerText = clues[i];
			item.classList.add("title");
			if(weapons.includes(clues[i])){
				item.classList.add("weapon");
			}
			titles[i] = {element: item, status: 2};
			row.appendChild(item);
			for(var j = 0; j < players.length; j++){
				item = document.createElement("td");
				item.id = j + "d" + i;
				boxes[j][i] = {element: item, tags: [], pressed: false, status: 2, update: false};
				item.onclick = function(){
					this.classList.toggle("data-pressed");
					var id = this.id.split("d");
					var box = boxes[id[0]][id[1]];
					box.pressed = !box.pressed;
					if(box.pressed){
						current_box_num++;
					}
					else{
						current_box_num--;
					}
					var plural = "";
					if(current_box_num != 1){
						plural = "es"
					}
					document.getElementById("edit").innerText = "Edit " + current_box_num + " box" + plural;
				};
				item.classList.add("data");
				row.appendChild(item);
			}
			table.appendChild(row);
		}
		$(document).ready(function(){
			row_height = $("[id=0d0]").height();
		});
	}



	function testFont(selector, font_size, success){
		if(font_size == 8){
			success();
			return;
		}
		$(document).ready(function(){
			if(test_selector.height() > row_height){
				console.log(test_selector.height() + " > " + row_height)
				font_size--;
				console.log(Date.now() + " font decrease to " + font_size);
				test_selector.css("font-size", font_size);
				testFont(selector, font_size, success);
			}
			else{
				selector.css("font-size", font_size);
				console.log(test_selector.height() + " " + row_height);
				success();
			}
		});
	}


	function updateBoxes(p, c, success){
		if(c == clues.length){
			p += 1;
			c = 0;
		}
		if(p == players.length){
			console.log("boxes successfully updated");
			success();
			return;
		}
		if(boxes[p][c].update){
			console.log("updating box " + p + " " + c);
			var box = boxes[p][c];
			box.update = false;
			test_element.style.fontSize = base_font_size + "px";
			test_element.innerText = box.tags.join(", ");
			box.element.innerText = box.tags.join(", ");
			if(box.tags.length == 0){
				updateBoxes(p, c + 1, success);
				return;
			}
			testFont($("[id=" + box.element.id + "]"), base_font_size, function(){
				updateBoxes(p, c + 1, success);
			});
			return;
		}
		updateBoxes(p, c + 1, success);
	}



	function getHistory(success){
		firebase.database().ref("/" + player_initial + "/history").once('value').then(function(snapshot){
			var data = snapshot.val();
			if(data != null){
				turn_history = data;
				for(var i = 0; i < turn_history.length; i++){
					execute(turn_history[i].t, turn_history[i].s, turn_history[i].b);
				}
				updateBoxes(0, 0, success);
			}
			else{
				console.log("null data from server");
				success();
			}
		}, function(error){
			console.log("Could not obtain data from server");
		});
	}



	function execute(tag, status, selections){
		var tag_elements = document.getElementsByClassName("multiple-tag");
		for(var i = tag_elements.length - 1; i >= 0; i--){
			tag_elements[i].classList.remove("multiple-tag");
		}
		tag_elements = document.getElementsByClassName("single-tag");
		for(var i = tag_elements.length - 1; i >= 0; i--){
			var id = tag_elements[i].id.split("d");
			if(boxes[id[0]][id[1]].tags.length == 0){
				tag_elements[i].classList.remove("single-tag");
			}
		}
		if(tag != null){
			current_tag[tag.substring(0, 1)] = parseInt(tag.substring(1)) + 1;
			tag_history[tag] = [];
			if(selections.length == 1){
				boxes[selections[0][0]][selections[0][1]].element.classList.add("single-tag");
			}
		}
		var last_tags = [];
		for(var i = 0; i < selections.length; i++){
			var box = boxes[selections[i][0]][selections[i][1]];
			if(status != null){
				if(box.status != 2){
					box.element.classList.remove("data-" + box.status);
				}
				box.status = status;
				if(status == 0 || status == 3){
					last_tags.push(...box.tags);
					for(var j = 0; j < box.tags.length; j++){
						for(var k = 0; k < tag_history[box.tags[j]].length; k++){
							if(tag_history[box.tags[j]][k].element.id == box.element.id){
								tag_history[box.tags[j]].splice(k, 1);
								k = tag_history[box.tags[j]].length;
							}
						}
					}
					box.tags = [];
				}
				else if(status == 1){
					var remove_tags = [];
					remove_tags.push(...box.tags);
					for(var j = 0; j < remove_tags.length; j++){
						for(var k = 0; k < tag_history[remove_tags[j]].length; k++){
							var box2 = tag_history[remove_tags[j]][k];
							for(var h = 0; h < box2.tags.length; h++){
								if(box2.tags[h] == remove_tags[j]){
									box2.tags.splice(h, 1);
									box2.update = true;
									h = box2.tags.length;
								}
							}
						}
						tag_history[remove_tags[j]] = [];
					}
				}
				if(status != 2){
					box.element.classList.add("data-" + status);
				}
			}
			if(tag != null){
				box.tags.push(tag);
				tag_history[tag].push(box);
			}
			box.update = true;
		}
		for(var i = 0; i < last_tags.length; i++){
			var className;
			if(tag_history[last_tags[i]].length == 1){
				className = "single-tag";
			}
			else{
				className = "multiple-tag";
			}
			for(var j = 0; j < tag_history[last_tags[i]].length; j++){
				tag_history[last_tags[i]][j].element.classList.add(className);
			}
		}
		for(var i = 0; i < clues.length; i++){
			var answer = true;
			var not_answer = false;
			for(var j = 0; j < players.length; j++){
				if(boxes[j][i].status != 0){
					answer = false;
				}
				if(boxes[j][i].status == 1){
					not_answer = true;
				}
			}
			var new_status;
			if(answer){
				new_status = 0;
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
		var answers = document.getElementsByClassName("title-0");
		document.getElementById("guess").style.display = "none";
		if(answers.length == 3){
			var indices = [];
			for(var i = 0; i < 3; i++){
				indices.push(parseInt(answers[i].id.substring(1)));
			}
			indices.sort(function(a, b) {
				return a - b;
			});
			console.log(indices);
			if(indices[0] < suspects.length && indices[1] >= suspects.length && indices[1] < suspects.length + weapons.length && indices[2] >= suspects.length + weapons.length){
				document.getElementById("guess").style.display = "block";
			}
		}
		if(status == 1){
			for(var i = 0; i < selections.length; i++){
				for(var j = 0; j < players.length; j++){
					if(boxes[j][selections[i][1]].status == 2 && boxes[j][selections[i][1]].tags.length == 0){
						boxes[j][selections[i][1]].status = 0;
						boxes[j][selections[i][1]].element.classList.add("data-0");
					}
				}
			}
		}
	}


	function configureShowCards(){
		var div = document.getElementById("show-cards");
		while (div.firstChild) {
			div.removeChild(div.firstChild);
		}
		for(var i = 0; i < turn_history[0].b.length; i++){
			var card = document.createElement("a");
			card.innerText = clues[turn_history[0].b[i][1]];
			console.log(card.innerText);
			card.classList.add("tab");
			card.classList.add("showcard");
			card.id = "showcard-tab-" + turn_history[0].b[i][1];
			div.appendChild(card);
		}
		current_tab["showcard"] = document.getElementById("showcard-tab-" + turn_history[0].b[0][1]);
		current_tab["showcard"].classList.toggle("active-tab");
		document.getElementById("player-tab-1").click();
		var tabs = document.getElementsByClassName("showcard");
		for(var i = 0; i < tabs.length; i++){
			tabs[i].onclick = function(){
				updateTab(this);
			};
		}
	}

	function configureEdit(){
		function editFunction(){
			var tag_elements = document.getElementsByClassName("multiple-tag");
			for(var i = tag_elements.length - 1; i >= 0; i--){
				tag_elements[i].classList.remove("multiple-tag");
			}
			for(var i = 1; i < players.length; i++){
				document.getElementById("add-tab-" + i).innerText = players[i] + current_tag[players[i]];
			}
			document.getElementById("status-tab-none").click();
			document.getElementById("add-tab-none").click();
			if(current_box_num == 0){
				turn_history.push({b: [], s: null, t: null});
			}
			else{
				var selections = [];
				for(var i = 0; i < players.length; i++){
					for(var j = 0; j < clues.length; j++){
						if(boxes[i][j].pressed){
							selections.push({0: i, 1: j});
						}
					}
				}
				turn_history.push({b: selections, t: null, s: null});
			}
			document.getElementById("table-container").style.display = "none";
			document.getElementById("edit-container").style.display = "block";
		}
		document.getElementById("edit").onclick = editFunction;
		document.getElementById("show").onclick = function(){
			document.getElementById("table-container").style.display = "none";
			document.getElementById("show-container").style.display = "block";
		};
		function show(){
			var x = parseInt(current_tab.player.id.split("-")[2]);
			var y = parseInt(current_tab.showcard.id.split("-")[2]);
			turn_history.push({b: [{0: x, 1: y}], s: 3, t: null});

			clearBoxes();
			current_tab.top.click();

			execute(turn_history[turn_history.length - 1].t, turn_history[turn_history.length - 1].s, turn_history[turn_history.length - 1].b);
			firebase.database().ref("/" + player_initial + '/history/' + (turn_history.length - 1)).set(turn_history[turn_history.length - 1]);
			updateBoxes(0, 0, function(){
				document.getElementById("show-container").style.display = "none";
				document.getElementById("table-container").style.display = "block";
				firebase.database().ref("/" + players[x].toLowerCase() + "/shown").set({p: player_initial, i: y});
			});
		}
		document.getElementById("submit-show").onclick = function(){
			document.getElementById("confirm").innerText = "Confirm to show card";
			document.getElementById("confirm").onclick = show;
			document.getElementById("confirm-container").style.display = "block";
		}
		document.getElementById("cancel-show").onclick = function(){
			document.getElementById("show-container").style.display = "none";
			document.getElementById("table-container").style.display = "block";
		}
		function submitEditFunction(){
			var selections = turn_history[turn_history.length - 1].b;
			if(selections.length == 0){
				turn_history.pop();
				clearBoxes();
				document.getElementById("edit-container").style.display = "none";
				document.getElementById("table-container").style.display = "block";
				return;
			}
			if(current_tab.status.id != "status-tab-none"){
				var status = parseInt(current_tab.status.id.split("-")[2]);
				turn_history[turn_history.length - 1].s = status;
			}
			if(current_tab.add.id != "add-tab-none"){
				var player_index = parseInt(current_tab.add.id.split("-")[2]);
				turn_history[turn_history.length - 1].t = players[player_index] + current_tag[players[player_index]];
			}

			clearBoxes();
			current_tab.top.click();

			if(turn_history[turn_history.length - 1].s == null && turn_history[turn_history.length - 1].t == null){
				turn_history.pop();
				document.getElementById("edit-container").style.display = "none";
				document.getElementById("table-container").style.display = "block";
			}
			else{
				execute(turn_history[turn_history.length - 1].t, turn_history[turn_history.length - 1].s, turn_history[turn_history.length - 1].b);
				firebase.database().ref("/" + player_initial + '/history/' + (turn_history.length - 1)).set(turn_history[turn_history.length - 1]);
				updateBoxes(0, 0, function(){
					document.getElementById("edit-container").style.display = "none";
					document.getElementById("table-container").style.display = "block";
				});
			}
		}
		document.getElementById("submit-edit").onclick = submitEditFunction;
		function clearData(){
			for(var i = 1; i < players.length; i++){
				current_tag[players[i]] = 1;
			}
			for(var j = 0; j < clues.length; j++){
				if(titles[j].status != 2){
					titles[j].element.classList.remove("title-" + titles[j].status);
				}
				titles[j].status = 2;
				for(var i = 0; i < players.length; i++){
					boxes[i][j].tags = [];
					if(boxes[i][j].status != 2){
						boxes[i][j].element.classList.remove("data-" + boxes[i][j].status);
					}
					boxes[i][j].status = 2;
					boxes[i][j].element.innerText = "";
				}
			}
			clearBoxes();
		}
		document.getElementById("confirm-container").onclick = function(){
			document.getElementById("confirm-container").style.display = "none";
		};
		function reset(){
			clearData();
			turn_history = [];
			firebase.database().ref(player_initial).set(turn_history);
			document.getElementById("confirm-container").style.display = "none";
			document.getElementById("edit-container").style.display = "none";
			document.getElementById("table-container").style.display = "block";
		}
		function undo(){
			turn_history.pop();
			if(turn_history.length > 2){
				firebase.database().ref("/" + player_initial + '/history/' + (turn_history.length - 1)).remove();
				turn_history.pop();
				clearData();
				for(var i = 0; i < turn_history.length; i++){
					execute(turn_history[i].t, turn_history[i].s, turn_history[i].b);
				}
				updateBoxes(0, 0, function(){
					document.getElementById("confirm-container").style.display = "none";
					document.getElementById("edit-container").style.display = "none";
					document.getElementById("table-container").style.display = "block";
				});
			}
			else{
				document.getElementById("confirm-container").style.display = "none";
				document.getElementById("edit-container").style.display = "none";
				document.getElementById("table-container").style.display = "block";
			}
		}
		document.getElementById("settings-tab-undo").onclick = function(){
			document.getElementById("confirm").innerText = "Confirm undo";
			document.getElementById("confirm").onclick = undo;
			document.getElementById("confirm-container").style.display = "block";
		};
		function guess(){
			var answers = document.getElementsByClassName("title-0");
			firebase.database().ref("/game/answer").once('value').then(function(snapshot){
				var data = snapshot.val();
				if(answers.length == 3){
					var indices = [];
					for(var i = 0; i < 3; i++){
						indices.push(parseInt(answers[i].id.substring(1)));
					}
					indices.sort(function(a, b) {
						return a - b;
					});
					for(var i = 0; i < 3; i++){
						if(indices[i] != data[i]){
							document.getElementById("loading-message").innerText = "Incorrect guess.";
							document.getElementById("main-container").style.opacity = 0;
							setTimeout(function(){
								document.getElementById("main-container").style.opacity = 1;
							}, 5000);
							setTimeout(function(){
								document.getElementById("loading-message").innerText = "";
							}, 5500);
							return;
						}
					}
					firebase.database().ref("/game/status").set(player_initial);
				}
			}, function(error){
				console.log("Could not obtain data from server");
			});
		}
		document.getElementById("guess").onclick = function(){
			document.getElementById("confirm").innerText = "Confirm guess";
			document.getElementById("confirm").onclick = guess;
			document.getElementById("confirm-container").style.display = "block";
		}
		var shown_first = true;
		firebase.database().ref("/" + player_initial + "/shown").on('value', (snapshot) => {
			if(shown_first || snapshot.val() == null){
				shown_first = false;
			}
			else{
				var data = snapshot.val();
				console.log(data);
				var index = 1;
				while(index < players.length && players[index].toLowerCase() != data.p){
					index++;
				}
				document.getElementById("loading-message").innerText = "Player " + data.p.toUpperCase() + " has " + clues[data.i];
				document.getElementById("main-container").style.opacity = 0;
				setTimeout(function(){
					clearBoxes();
					if(document.getElementById("edit-container").style == "block"){
						turn_history.pop();
					}
					boxes[index][data.i].pressed = true;
					boxes[index][data.i].element.classList.toggle("data-pressed");
					current_box_num = 1;
					editFunction();
					document.getElementById("status-tab-1").click();
					submitEditFunction();
					document.getElementById("table-container").style.display = "block";
					document.getElementById("show-container").style.display = "none";
					document.getElementById("edit-container").style.display = "none";
					document.getElementById("confirm-container").style.display = "none";
				}, 500);
				setTimeout(function(){
					document.getElementById("main-container").style.opacity = 1;
				}, 3000);
				setTimeout(function(){
					document.getElementById("loading-message").innerText = "";
				}, 3500);
			}
		});
		var game_first = true;
		firebase.database().ref("/game").on('value', (snapshot) => {
			if(game_first){
				game_first = false;
			}
			else if(snapshot.val().status.length == 1){
				if(snapshot.val().status == player_initial){
					document.getElementById("loading-message").innerText = "You won!\n";
				}
				else{
					document.getElementById("loading-message").innerText = "Player " + snapshot.val().status.toUpperCase() + " has won.\n";
				}
				for(var i = 0; i < 3; i++){
					document.getElementById("loading-message").innerText += "\n" + clues[snapshot.val().answer[i]];
				}
				document.getElementById("main-container").style.opacity = 0;
				setTimeout(function(){
					document.getElementById("main-container").style.opacity = 1;
				}, 4000);
				setTimeout(function(){
					document.getElementById("loading-message").innerText = "";
				}, 4500);
			}
			else{
				console.log("Starting new game");
				document.getElementById("loading-message").innerText = "Starting new game..."
				document.getElementById("main-container").style.opacity = 0;
				setTimeout(function(){
					document.getElementById("table-container").style.display = "block";
					document.getElementById("show-container").style.display = "none";
					document.getElementById("edit-container").style.display = "none";
					document.getElementById("confirm-container").style.display = "none";
					updateTab(document.getElementById("top-tab-all"));
					for(var i = 0; i < clues.length; i++){
						document.getElementById("r" + i).classList.remove("hide");
					}
					document.getElementById("border-0").classList.remove("hide");
					document.getElementById("border-1").classList.remove("hide");
					reset();
					firebase.database().ref("/game/" + player_initial).once('value').then(function(snapshot){
						var starting_hand = snapshot.val();
						console.log(starting_hand);
						for(var i = 0; i < starting_hand.length; i++){
							boxes[0][starting_hand[i]].pressed = true;
							boxes[0][starting_hand[i]].element.classList.toggle("data-pressed");
						}
						current_box_num = starting_hand.length;
						editFunction();
						document.getElementById("status-tab-1").click();
						submitEditFunction();

						for(var i = 0; i < starting_hand.length; i++){
							boxes[0][starting_hand[i]].pressed = true;
						}
						for(var i = 0; i < clues.length; i++){
							boxes[0][i].pressed = !boxes[0][i].pressed;
							if(boxes[0][i].pressed){
								boxes[0][i].element.classList.toggle("data-pressed");
							}
						}
						current_box_num = clues.length - starting_hand.length;
						editFunction();
						document.getElementById("status-tab-0").click();
						submitEditFunction();
						configureShowCards();
						setTimeout(function(){
							document.getElementById("main-container").style.opacity = 1;
						}, 500);
						setTimeout(function(){
							document.getElementById("loading-message").innerText = "";
						}, 1000);
					});
				}, 500);
			}
		});
	}

	createTabs();
	createTable();
	configureEdit();
	getHistory(function(){
		configureShowCards();
		document.getElementById("main-container").style.opacity = 1;
		setTimeout(function(){
			document.getElementById("loading-message").innerText = "";
		}, 500);
	});
}

main_function();