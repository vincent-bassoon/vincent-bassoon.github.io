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
	var game_status;
	var titles = {};
	var boxes = {};
	var turn_history = [];
	var tag_history = [];

	var current_tab = {main: document.getElementById("main-tab-chart"),
					   status: document.getElementById("status-tab-none"),
					   tag: document.getElementById("tag-tab-none")};
	var current_tag = {};
	var current_box_num = 0;

	var suspects = ["Col. Mustard", "Prof. Plum", "Mr. Green", "Mrs. Peacock", "Miss Scarlet", "Mrs. White", "Mme. Rose", "Sgt. Gray", "M. Brunette", "Miss Peach"];
	var weapons = ["Knife", "Candlestick", "Revolver", "Rope", "Lead Pipe", "Wrench", "Poison", "Horseshoe", "Frying Pan"];
	var rooms = ["Courtyard", "Gazebo", "Drawing Room", "Dining Room", "Kitchen", "Carriage House", "Trophy Room", "Conservatory", "Studio", "Billiard Room", "Library", "Fountain"];
	var clues = [];
	clues.push(...suspects);
	clues.push(...weapons);
	clues.push(...rooms);

	var test_element = document.getElementById("test-element");
	var test_selector = $("#test-element");

	var players = [];
	var characters = [];
	var name_to_player = {};
	var current_player = parseInt(window.location.href.replace(".html", "")[window.location.href.replace(".html", "").length - 1]);

	var answers;
	var starting_hand;

	var row_height;
	var base_font_size;

	function createTabs(){
		//create tag and showplayer cards
		var item;
		var tag_row_sizes = [players.length, 0];
		var showplayer_row_sizes = [players.length - 1, 0];
		if(players.length >= 7){
			tag_row_sizes = [Math.ceil(players.length / 2), Math.floor(players.length / 2)];
		}
		if(players.length + 1 >= 7){
			showplayer_row_sizes = [Math.ceil((players.length - 1) / 2), Math.floor((players.length - 1) / 2)];
		}
		document.getElementById("tag-tab-none").style.width = (100.0 / tag_row_sizes[0]) + "%";
		for(var i = 1; i < players.length; i++){
			var index = (current_player + i) % players.length;

			//configure tag tabs
			current_tag[index] = 1;
			item = document.createElement("a");
			item.classList.add("tab");
			item.classList.add("tag");
			item.classList.add("remove");
			item.id = "tag-tab-" + index;
			if(i < tag_row_sizes[0]){
				item.style.width = (100.0 / tag_row_sizes[0]) + "%";
			}
			else{
				item.style.width = (100.0 / tag_row_sizes[1]) + "%";
			}
			item.innerText = players[index] + current_tag[index];
			document.getElementById("tag-tab-container").appendChild(item);

			//configure showplayer tabs
			item = document.createElement("a");
			if(i - 1 < showplayer_row_sizes[0]){
				item.style.width = (100.0 / showplayer_row_sizes[0]) + "%";
			}
			else{
				item.style.width = (100.0 / showplayer_row_sizes[1]) + "%";
			}
			item.classList.add("tab");
			item.classList.add("showplayer");
			item.classList.add("remove");
			item.id = "showplayer-tab-" + index;
			item.innerText = players[index];
			document.getElementById("showplayer-tab-container").appendChild(item);
		}

		//create showcard tabs
		var div = document.getElementById("showcard-tab-container");
		for(var i = 0; i < starting_hand.length; i++){
			var card = document.createElement("a");
			card.innerText = clues[starting_hand[i]];
			console.log(card.innerText);
			card.classList.add("tab");
			card.classList.add("remove");
			card.classList.add("showcard");
			card.id = "showcard-tab-" + starting_hand[i];
			div.appendChild(card);
		}

		//set the two remaining current_tab values
		current_tab["showplayer"] = document.getElementById("showplayer-tab-" + ((current_player + 1) % players.length));
		current_tab["showcard"] = document.getElementById("showcard-tab-" + starting_hand[0]);
		
		//set active tabs and onclick
		for(var key in current_tab){
			var tabs = document.getElementsByClassName(key);
			for(var i = 0; i < tabs.length; i++){
				if(tabs[i].id == current_tab[key].id){
					tabs[i].classList.toggle("active-tab");
				}
				tabs[i].onclick = function(){
					var type = this.id.split("-")[0];
					if(current_tab[type].id != this.id){
						current_tab[type].classList.toggle("active-tab");
						this.classList.toggle("active-tab");
						current_tab[type] = this;
						if(type == "status" || type == "tag"){
							if(current_tab.status.id == "status-tab-none" && current_tab.tag.id == "add-tab-none"){
								document.getElementById("input-submit").innerText = "Cancel";
							}
							else{
								document.getElementById("input-submit").innerText = "Submit";
							}
						}
						if(type == "main"){
							document.getElementById("map-container").style.display = "none";
							document.getElementById("chart-container").style.display = "none";
							document.getElementById("notes-container").style.display = "none";
							document.getElementById(this.id.split("-")[2] + "-container").style.display = "block";
						}
					}
				};
			}
		}
	}

	function createPage(first){
		document.getElementById("view-container").style.display = "block";
		document.getElementById("map-container").style.display = "none";
		document.getElementById("notes-container").style.display = "none";
		document.getElementById("chart-container").style.display = "block";
		document.getElementById("show-container").style.display = "none";
		document.getElementById("input-container").style.display = "none";
		document.getElementById("confirm-container").style.display = "none";
		current_box_num = 0;
		document.getElementById("main-edit").innerText = "Edit 0 boxes";
		var added_elements = document.getElementsByClassName("remove");
		for(var i = added_elements.length - 1; i >= 0; i--){
			added_elements[i].remove();
		}
		added_elements = document.getElementsByClassName("active-tab");
		for(var i = added_elements.length - 1; i >= 0; i--){
			added_elements[i].classList.remove("active-tab");
		}
		firebase.database().ref("/game").once('value').then(function(snapshot){
			players = snapshot.val().players.names;
			characters = snapshot.val().players.characters;
			answers = snapshot.val().answer;
			game_status = snapshot.val().status;
			for(var j = 0; j < players.length; j++){
				boxes[j] = {};
				name_to_player[players[j]] = j;
			}
			starting_hand = snapshot.val()[current_player];
			console.log(starting_hand);
			createTabs();
			document.getElementById("main-tab-chart").click();
			createTable();
			resetPath();
			if(first){
				createEdit();
				createMap();
				window.onscroll = function(){
					var header = document.getElementById("chart-header-row");
					if(window.pageYOffset > document.getElementById("chart-table").offsetTop){
						header.classList.add("fixed-header");
					}
					else{
						header.classList.remove("fixed-header");
					}
				}
			}
			updateMap(snapshot.val().map.locations);
			firebase.database().ref("/game/map/status").set(game_status);
			firebase.database().ref("/" + current_player + "/status").once('value').then(function(snapshot){
				if(snapshot.val() != game_status){
					console.log("starting new game");

					turn_history = [];
					firebase.database().ref("/" + current_player).set({}).then(function(){
						getHistory(function(){
							document.getElementById("page-container").style.opacity = 1;
							setTimeout(function(){
								setLoadingMessage("", false);
							}, 500);
						});
					});
				}
				else{
					getHistory(function(){
						document.getElementById("page-container").style.opacity = 1;
						setTimeout(function(){
							setLoadingMessage("", false);
						}, 500);
					});
				}
			});
		});
	}


	function setLoadingMessage(str, display_players){
		/*for(var i = 0; i < 9; i++){
			if(display_players && i < players.length){
				document.getElementById("player-buttons-" + i).style.display = "block";
				document.getElementById("player-buttons-" + i).style.backgroundColor = colors[characters[i]];
				document.getElementById("player-buttons-" + i).innerText = players[i];
			}
			else{
				document.getElementById("player-buttons-" + i).style.display = "none";
			}
		}*/
		document.getElementById("loading-message").innerText = str;
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
		document.getElementById("main-edit").innerText = "Edit 0 boxes";
	}


	function createTable(){
		//offscreen formatting
		for(var i = 0; i < players.length - 4; i++){
			var item = document.createElement("td");
			item.classList.add("chart");
			item.classList.add("data");
			item.classList.add("remove");
			document.getElementById("test-row").appendChild(item);
		}

		//create table
		var table = document.createElement("table");
		table.id = "chart-table";
		table.classList.add("remove");
		table.classList.add("chart");
		var container = document.getElementById("chart-container");
		container.insertBefore(table, container.firstChild);

		//set font and header row of table
		base_font_size = parseInt(window.getComputedStyle(table).fontSize.replace("px", ""));
		var row = document.createElement("tr");
		row.id = "chart-header-row";
		var item = document.createElement("td");
		item.classList.add("title");
		item.classList.add("chart");
		row.appendChild(item);
		for(var i = 0; i < players.length; i++){
			var index = (current_player + i) % players.length;
			item = document.createElement("th");
			item.classList.add("chart");
			item.style.backgroundColor = colors[characters[index]];
			item.innerText = players[index];
			row.appendChild(item);
		}
		table.appendChild(row);

		//add subsequent rows
		for(var i = 0; i < clues.length; i++){
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
			for(var j = 0; j < players.length; j++){
				var index = (current_player + j) % players.length;
				item = document.createElement("td");
				item.classList.add("chart");
				item.id = index + "d" + i;
				boxes[index][i] = {element: item, tags: [], pressed: false, status: 2, update: false};
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
					document.getElementById("main-edit").innerText = "Edit " + current_box_num + " box" + plural;
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
		if(font_size == 12){
			selector.css("font-size", font_size);
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
			var box = boxes[p][c];
			box.update = false;
			test_element.style.fontSize = base_font_size + "px";
			test_element.innerText = box.tags.join(", ");
			box.element.innerText = box.tags.join(", ");
			if(box.tags.length == 0){
				updateBoxes(p, c + 1, success);
				return;
			}
			console.log(box.element.innerText);
			testFont($("[id=" + box.element.id + "]"), base_font_size, function(){
				updateBoxes(p, c + 1, success);
			});
			return;
		}
		updateBoxes(p, c + 1, success);
	}



	function getHistory(success){
		firebase.database().ref("/" + current_player + "/history").once('value').then(function(snapshot){
			var data = snapshot.val();
			if(data == null || data.length == 0){
				firebase.database().ref("/" + current_player + "/status").set(game_status);
				for(var i = 0; i < starting_hand.length; i++){
					boxes[current_player][starting_hand[i]].pressed = true;
					boxes[current_player][starting_hand[i]].element.classList.toggle("data-pressed");
				}
				current_box_num = starting_hand.length;
				editFunction();
				document.getElementById("status-tab-1").click();
				submitEditFunction();

				for(var i = 0; i < starting_hand.length; i++){
					boxes[current_player][starting_hand[i]].pressed = true;
				}
				for(var i = 0; i < clues.length; i++){
					boxes[current_player][i].pressed = !boxes[current_player][i].pressed;
					if(boxes[current_player][i].pressed){
						boxes[current_player][i].element.classList.toggle("data-pressed");
					}
				}
				current_box_num = clues.length - starting_hand.length;
				editFunction();
				document.getElementById("status-tab-0").click();
				submitEditFunction();

				setTimeout(function(){
					success();
				}, 500);
				return;
			}
			else{
				turn_history = data;
				for(var i = 0; i < turn_history.length; i++){
					execute(turn_history[i].t, turn_history[i].s, turn_history[i].b);
				}
				updateBoxes(0, 0, success);
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
			var index = name_to_player[tag.substring(0, tag.length - 1)];
			current_tag[index] = parseInt(tag.substring(tag.length - 1)) + 1;
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

	function editFunction(){
		var tag_elements = document.getElementsByClassName("multiple-tag");
		for(var i = tag_elements.length - 1; i >= 0; i--){
			tag_elements[i].classList.remove("multiple-tag");
		}
		for(var i = 1; i < players.length; i++){
			var index = (current_player + i) % players.length;
			document.getElementById("tag-tab-" + index).innerText = players[index] + current_tag[index];
		}
		document.getElementById("status-tab-none").click();
		document.getElementById("tag-tab-none").click();
		if(current_box_num == 0){
			turn_history.push({b: [], s: null, t: null});
			//added so it can be removed upon submission
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
		document.getElementById("view-container").style.display = "none";
		document.getElementById("input-container").style.display = "block";
	}

	function submitEditFunction(){
		var selections = turn_history[turn_history.length - 1].b;
		if(selections.length == 0){
			turn_history.pop();
			clearBoxes();
			document.getElementById("input-container").style.display = "none";
			document.getElementById("view-container").style.display = "block";
			return;
		}
		if(current_tab.status.id != "status-tab-none"){
			var status = parseInt(current_tab.status.id.split("-")[2]);
			turn_history[turn_history.length - 1].s = status;
		}
		if(current_tab.tag.id != "tag-tab-none"){
			var player_index = parseInt(current_tab.tag.id.split("-")[2]);
			turn_history[turn_history.length - 1].t = players[player_index] + current_tag[player_index];
		}
		clearBoxes();
		current_tab.main.click();
		if(turn_history[turn_history.length - 1].s == null && turn_history[turn_history.length - 1].t == null){
			turn_history.pop();
			document.getElementById("input-container").style.display = "none";
			document.getElementById("view-container").style.display = "block";
		}
		else{
			execute(turn_history[turn_history.length - 1].t, turn_history[turn_history.length - 1].s, turn_history[turn_history.length - 1].b);
			firebase.database().ref("/" + current_player + '/history/' + (turn_history.length - 1)).set(turn_history[turn_history.length - 1]);
			updateBoxes(0, 0, function(){
				document.getElementById("input-container").style.display = "none";
				document.getElementById("view-container").style.display = "block";
			});
		}
	}



	function createEdit(){
		document.getElementById("main-edit").onclick = editFunction;
		document.getElementById("main-show").onclick = function(){
			document.getElementById("view-container").style.display = "none";
			document.getElementById("show-container").style.display = "block";
		};
		function show(){
			var x = parseInt(current_tab.showplayer.id.split("-")[2]);
			var y = parseInt(current_tab.showcard.id.split("-")[2]);
			turn_history.push({b: [{0: x, 1: y}], s: 3, t: null});

			clearBoxes();
			current_tab.main.click();

			execute(turn_history[turn_history.length - 1].t, turn_history[turn_history.length - 1].s, turn_history[turn_history.length - 1].b);
			firebase.database().ref("/" + current_player + '/history/' + (turn_history.length - 1)).set(turn_history[turn_history.length - 1]);
			updateBoxes(0, 0, function(){
				document.getElementById("show-container").style.display = "none";
				document.getElementById("view-container").style.display = "block";
				firebase.database().ref("/" + x + "/shown").set({p: current_player, i: y});
			});
		}
		document.getElementById("submit-show").onclick = function(){
			document.getElementById("confirm").innerText = "Confirm to show card";
			document.getElementById("confirm").onclick = show;
			document.getElementById("confirm-container").style.display = "block";
		}
		document.getElementById("cancel-show").onclick = function(){
			document.getElementById("show-container").style.display = "none";
			document.getElementById("view-container").style.display = "block";
		}
		
		document.getElementById("input-submit").onclick = submitEditFunction;
		
		document.getElementById("confirm-container").onclick = function(){
			document.getElementById("confirm-container").style.display = "none";
		};
		function clearData(){
			for(var i = 0; i < 9; i++){
				current_tag[i] = 1;
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
		function undo(){
			turn_history.pop();
			if(turn_history.length > 2){
				firebase.database().ref("/" + current_player + '/history/' + (turn_history.length - 1)).remove();
				turn_history.pop();
				clearData();
				for(var i = 0; i < turn_history.length; i++){
					execute(turn_history[i].t, turn_history[i].s, turn_history[i].b);
				}
				updateBoxes(0, 0, function(){
					document.getElementById("confirm-container").style.display = "none";
					document.getElementById("input-container").style.display = "none";
					document.getElementById("view-container").style.display = "block";
				});
			}
			else{
				document.getElementById("confirm-container").style.display = "none";
				document.getElementById("input-container").style.display = "none";
				document.getElementById("view-container").style.display = "block";
			}
		}
		document.getElementById("input-undo").onclick = function(){
			document.getElementById("confirm").innerText = "Confirm undo";
			document.getElementById("confirm").onclick = undo;
			document.getElementById("confirm-container").style.display = "block";
		};
		function guess(){
			var guesses = document.getElementsByClassName("title-0");
			if(guesses.length == 3){
				var indices = [];
				for(var i = 0; i < 3; i++){
					indices.push(parseInt(guesses[i].id.substring(1)));
				}
				indices.sort(function(a, b) {
					return a - b;
				});
				for(var i = 0; i < 3; i++){
					if(indices[i] != answers[i]){
						setLoadingMessage("Incorrect guess.", false);
						document.getElementById("page-container").style.opacity = 0;
						setTimeout(function(){
							document.getElementById("page-container").style.opacity = 1;
						}, 5000);
						setTimeout(function(){
							setLoadingMessage("", false);
						}, 5500);
						return;
					}
				}
				firebase.database().ref("/game/status").set(current_player);
			}
		}
		document.getElementById("guess").onclick = function(){
			document.getElementById("confirm").innerText = "Confirm guess";
			document.getElementById("confirm").onclick = guess;
			document.getElementById("confirm-container").style.display = "block";
		}
		var shown_first = true;
		firebase.database().ref("/" + current_player + "/shown").on('value', (snapshot) => {
			if(shown_first || snapshot.val() == null){
				shown_first = false;
			}
			else{
				var data = snapshot.val();
				console.log(data);
				setLoadingMessage("Player " + players[data.p] + " has " + clues[data.i], false);
				document.getElementById("page-container").style.opacity = 0;
				setTimeout(function(){
					clearBoxes();
					if(document.getElementById("input-container").style == "block"){
						turn_history.pop();
					}
					boxes[data.p][data.i].pressed = true;
					boxes[data.p][data.i].element.classList.toggle("data-pressed");
					current_box_num = 1;
					editFunction();
					document.getElementById("status-tab-1").click();
					submitEditFunction();
					document.getElementById("view-container").style.display = "block";
					document.getElementById("show-container").style.display = "none";
					document.getElementById("input-container").style.display = "none";
					document.getElementById("confirm-container").style.display = "none";
				}, 500);
				setTimeout(function(){
					document.getElementById("page-container").style.opacity = 1;
				}, 3000);
				setTimeout(function(){
					setLoadingMessage("", false);
				}, 3500);
			}
		});
		var game_first = true;
		firebase.database().ref("/game/status").on('value', (snapshot) => {
			if(game_first){
				game_first = false;
			}
			else if(("" + snapshot.val()).length == 1){
				var str = "";
				if(snapshot.val() == current_player){
					str = "You won!\n";
				}
				else{
					str = "Player " + players[snapshot.val()] + " has won.\n";
				}
				for(var i = 0; i < 3; i++){
					str += "\n" + clues[answers[i]];
				}
				setLoadingMessage(str, false);
				document.getElementById("page-container").style.opacity = 0;
				setTimeout(function(){
					document.getElementById("page-container").style.opacity = 1;
				}, 4000);
				setTimeout(function(){
					setLoadingMessage("", false);
				}, 4500);
			}
			else{
				console.log("Starting new game");
				setLoadingMessage("Starting new game...", false);
				document.getElementById("page-container").style.opacity = 0;
				turn_history = [];
				firebase.database().ref(current_player).set({});
				setTimeout(function(){
					createPage(false);
				}, 500);
			}
		});
	}

	createPage(true);




	var map_data;
	var map_raw_text =  `x,x,x,x,x,x,x,x,x,t5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
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

		var passages = {"t7": {dest: "t2"},
						"t2": {dest: "t7"},
						"t4": {dest: "t10"},
						"t10": {dest: "t4"},
						"p-": {dest: "p+"},
						"p+": {dest: "p-"}};


		var rows = map_raw_text.split("\n");
		for(var row = 0; row < rows.length; row++){
			var cols = rows[row].split(",");
			map_data[row] = [];
			for(var col = 0; col < cols.length; col++){
				var value = cols[col];
				if(value in passages){
					passages[value].row = row;
					passages[value].col = col;
				}
				map_data[row][col] = {"value": value, "movable": /^[tsdp]$/.test(value[0])};
			}
		}

		
		//get t and d coords
		var tcoords = {};
		var dcoords = {};
		for(var row = 0; row < map_data.length; row++){
			for(var col = 0; col < map_data[row].length; col++){
				if(map_data[row][col].value[0] == "t"){
					tcoords[map_data[row][col].value] = {"row": row, "col": col};
				}
				else if(map_data[row][col].value[0] == "d"){
					var key = map_data[row][col].value;
					if(!(key in dcoords)){
						dcoords[key] = [];
					}
					dcoords[key].push({"row": row, "col": col});
				}
			}
		}
		//get move possibilities
		for(var row = 0; row < map_data.length; row++){
			for(var col = 0; col < map_data[row].length; col++){
				if(map_data[row][col].movable){
					var value = map_data[row][col].value;
					var moves = [];
					if(value in passages){
						var dest = passages[value].dest;
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
		for(var key in tcoords){
			var room_index = parseInt(key.substring(1));
			var queue = [];
			queue.push({"row": tcoords[key].row, "col": tcoords[key].col, "prevdist": -1});
			while(queue.length > 0){
				var row = queue[0].row;
				var col = queue[0].col;
				var prevdist = queue.shift().prevdist;
				if(!(room_index in map_data[row][col].dists) || prevdist + 1 < map_data[row][col].dists[room_index]){
					map_data[row][col].dists[room_index] = prevdist + 1;
					var moves = map_data[row][col].moves;
					for(var i = 0; i < moves.length; i++){
						queue.push({"row": moves[i].row, "col": moves[i].col, "prevdist": prevdist + 1});
					}
				}

			}

		}
		configurePlayers();
		createMapTable();
		createMapButton();
	}

	var player_locations = {};

	function updateMap(new_locations){
		console.log("updating map");
		console.log(new_locations);
		for(var i = 0; i < new_locations.length; i++){
			//update locations, updating the current players location last
			var index = (current_player + 1 + i) % new_locations.length;
			if(!(index in player_locations) || player_locations[index].row != new_locations[index].row || player_locations[index].col != new_locations[index].col || index == current_player){
				if(!(index in player_locations)){
					player_locations[index] = {};
				}
				else{
					map_data[player_locations[index].row][player_locations[index].col].players.delete(index);
					map_data[player_locations[index].row][player_locations[index].col].element.style.backgroundColor = "";
					if(map_data[player_locations[index].row][player_locations[index].col].value[0] == "t"){
						updateRoomText(map_data[player_locations[index].row][player_locations[index].col]);
					}
				}
				player_locations[index].row = new_locations[index].row;
				player_locations[index].col = new_locations[index].col;
				map_data[player_locations[index].row][player_locations[index].col].players.add(index);
				if(map_data[player_locations[index].row][player_locations[index].col].value[0] == "t"){
					updateRoomText(map_data[player_locations[index].row][player_locations[index].col]);
					if(current_player == index){
						map_data[player_locations[index].row][player_locations[index].col].element.style.backgroundColor = colors[characters[index]];
						console.log(colors[characters[index]]);
						console.log(map_data[player_locations[index].row][player_locations[index].col].element);
					}
				}
				else{
					map_data[player_locations[index].row][player_locations[index].col].element.style.backgroundColor = colors[characters[index]];
					map_data[player_locations[index].row][player_locations[index].col].element.innerText = players[index];
				}
			}
		}
		console.log("New player locations");
		console.log(map_data);
	}

	function configurePlayers(){
		for(var row = 0; row < map_data.length; row++){
			for(var col = 0; col < map_data[row].length; col++){
				if(map_data[row][col].movable){
					map_data[row][col].players = new Set();
				}
			}
		}
		firebase.database().ref("/game/map/locations").on('value', (snapshot) => {
			var locations = snapshot.val();
			firebase.database().ref("/game/map/status").once('value').then(function(snapshot){
				if(game_status != snapshot.val()){
					console.log("incorrect map status");
					//firebase.database().ref("/game/map/status").set(game_status);
					return;
				}
				else{
					updateMap(locations);
				}
			});
		});
	}

	function createMapTable(){

		//create table
		var table = document.createElement("table");
		table.classList.add("map");
		var container = document.getElementById("map-container");
		container.insertBefore(table, container.firstChild);

		var room_coords = {};
		for(var row = 0; row < map_data.length; row++){
			var row_element = document.createElement("tr");
			for(var col = 0; col < map_data[row].length; col++){
				switch(map_data[row][col].value[0]){
					case "s":
					case "p":
					case "x":
					case "d":
						var item = document.createElement("td");
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
						var item = document.createElement("td");
						map_data[row][col].element = item;
						item.classList.add("room");
						var room_index = parseInt(map_data[row][col].value.substring(1));
						item.id = "room_" + room_index;
						updateRoomText(map_data[row][col]);
						room_coords[room_index] = {"row": row, "col": col};
						row_element.appendChild(item)
						break;
					case "b":
						var room_index = parseInt(map_data[row][col].value.substring(1));
						document.getElementById("room_" + room_index).colSpan = 1 + col - room_coords[room_index].col;
						document.getElementById("room_" + room_index).rowSpan = 1 + row - room_coords[room_index].row;
						break;
					default:
				}
			}
			table.appendChild(row_element);
		}
	}

	function resetPath(){
		var old_path = document.getElementsByClassName("path");
		for(var i = old_path.length - 1; i >= 0; i--){
			old_path[i].style.backgroundColor = "";
			old_path[i].classList.remove("path");
		}
	}

	var destination = null;
	var roll = null;

	function drawPath(){
		console.log("drawing path");
		var room_index = parseInt(this.id.split("_")[1]);
		resetPath();
		var row = player_locations[current_player].row;
		var col = player_locations[current_player].col;
		for(var i = 0; i < roll; i++){
			if(map_data[row][col].dists[room_index] == 0){
				if(i == 0){
					destination = {"row": row, "col": col};
					return;
				}
				map_data[row][col].element.classList.add("path");
				map_data[row][col].element.style.backgroundColor = colors[characters[current_player]];
			}
			else{
				var min_dist = 100;
				var best_move = null;
				for(var j = 0; j < map_data[row][col].moves.length; j++){
					var move = map_data[row][col].moves[j];
					if(map_data[move.row][move.col].dists[room_index] < min_dist){
						min_dist = map_data[move.row][move.col].dists[room_index];
						best_move = move;
					}
				}
				if(i == roll - 1 && map_data[best_move.row][best_move.col].players.size > 0){
					destination = {"row": row, "col": col};
					return;
				}
				row = best_move.row;
				col = best_move.col;
				map_data[row][col].element.classList.add("path");
				if(min_dist == 0 || i == roll - 1){
					map_data[row][col].element.style.backgroundColor = colors[characters[current_player]];
					destination = {"row": row, "col": col};
				}
				else{
					map_data[row][col].element.style.backgroundColor = lighter_colors[characters[current_player]];
				}
			}
		}
	}

	function createMapButton(){
		var button = document.getElementById("main-move");
		function movePlayer(){
			resetPath();
			firebase.database().ref("/game/map/locations/" + current_player).set(destination);
			document.getElementById("confirm-container").style.display = "none";
			document.getElementById("input-container").style.display = "none";
			document.getElementById("view-container").style.display = "block";
			destination = null;
			button.onclick = rollDice;
			button.innerText = "Roll";
			for(var row = 0; row < map_data.length; row++){
				for(var col = 0; col < map_data[row].length; col++){
					if(map_data[row][col].value[0] == "t"){
						map_data[row][col].element.onclick = null;
					}
				}
			}
		}
		function moveButton(){
			console.log(map_data[destination.row][destination.col].players);
			if(destination == null || map_data[destination.row][destination.col].players.has(current_player)){
				return;
			}
			document.getElementById("confirm").innerText = "Confirm move";
			document.getElementById("confirm").onclick = movePlayer;
			document.getElementById("confirm-container").style.display = "block";

		}
		function rollDice(){
			roll = 2 + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6);
			button.innerText = "Move " + roll + " spaces";
			button.onclick = moveButton;
			for(var row = 0; row < map_data.length; row++){
				for(var col = 0; col < map_data[row].length; col++){
					if(map_data[row][col].value[0] == "t"){
						map_data[row][col].element.onclick = drawPath;
					}
				}
			}
		}
		button.onclick = rollDice;
	}

	var passage_names = {7: "1", 2: "1", 4: "2", 10: "2"};

	function updateRoomText(map_data_element){
		var room_index = parseInt(map_data_element.value.substring(1));
		var text;
		if(room_index == 12){
			text = "Cloak Room<br />";
		}
		else{
			text = rooms[room_index] + "<br />";
		}
		if(room_index in passage_names){
			text += "(passage " + passage_names[room_index] + ")<br />";
		}
		var occupants = Array.from(map_data_element.players);
		var occupant_names = [];
		for(var i = 0; i < occupants.length; i++){
			occupant_names.push("<mark style='background-color:" + colors[characters[occupants[i]]] + ";'>" + players[occupants[i]] + "</mark>");
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

	function checkRoomBorder(row1, col1, row2, col2){
		if(row2 < 0 || row2 == map_data.length){
			return false;
		}
		if(col2 < 0 || col2 == map_data[row1].length){
			return false;
		}
		if(map_data[row1][col1].value[0] == "d"){
			if(map_data[row1][col1].value.substring(1) == map_data[row2][col2].value){
				return false;
			}
			if(/^[tb]$/.test(map_data[row2][col2].value[0]) && map_data[row1][col1].value.substring(1) == map_data[row2][col2].value.substring(1)){
				return false;
			}
		}
		return /^[tb]?\d+$/.test(map_data[row2][col2].value);
	}

	function createRoomBorders(item, row, col){
		var border = "2px solid black";
		if(map_data[row][col].value == "x"){
			item.style.border = border;
			return;
		}
		if(map_data[row][col].value[0] == "p"){
			return;
		}
		if(checkRoomBorder(row, col, row - 1, col)){
			item.style.borderTop = border;
		}
		if(checkRoomBorder(row, col, row + 1, col)){
			item.style.borderBottom = border;
		}
		if(checkRoomBorder(row, col, row, col - 1)){
			item.style.borderLeft = border;
		}
		if(checkRoomBorder(row, col, row, col + 1)){
			item.style.borderRight = border;
		}
	}
}

main_function();