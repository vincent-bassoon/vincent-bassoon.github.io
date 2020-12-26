var firebaseConfig = {
    apiKey: "AIzaSyD9njoN659jBaO-Ov6sQI33Q5xi9kRl3jw",
    authDomain: "clue-51aa1.firebaseapp.com",
    projectId: "clue-51aa1",
    storageBucket: "clue-51aa1.appspot.com",
    messagingSenderId: "314308110149",
    appId: "1:314308110149:web:73d763dd4c6d554714802c",
    measurementId: "G-092MCPQDB9"
  };

  firebase.initializeApp(firebaseConfig);
  firebase.analytics();


var boxes = {0: {}, 1: {}, 2: {}, 3: {}};
var players = ["C", "T", "J", "V"];
var clues;
var current_tab = {top: document.getElementById("top-tab-all"),
				   status: document.getElementById("status-tab-none"),
				   add: document.getElementById("add-tab-none"),
				   edit: document.getElementById("edit-tab-none")};
var current_tag = {1: 1, 2: 1, 3: 1};
var shared_tags = [];
var current_box_num = 0;
var row_height;
var base_font_size;
var change_history = [];
var test_element = document.getElementById("test_element");

var player_initial = test_element.innerText;
while(players[0] != player_initial.toUpperCase()){
	players.unshift(players.pop());
}

function getHistory(){
	firebase.database().ref(player_initial + "/history").once('value').then(function(snapshot){
		var data = snapshot.val();
		if(data != null){
			change_history = data;
			for(var i = 0; i < change_history.length; i++){
				execute(change_history[i].a, change_history[i].s);
			}
		}
		else{
			console.log("null data from server");
		}
		document.getElementById("opacity-container").style.opacity = 1;
		setTimeout(function(){
			document.getElementById("loading-message").innerText = "";
		}, 500);
	}, function(error){
		console.log("Could not obtain data from server");
	});
}

function updateTab(element){
	var type = element.id.split("-")[0];
	if(current_tab[type].id != element.id){
		current_tab[type].classList.toggle("active-tab");
		element.classList.toggle("active-tab");
		current_tab[type] = element;
	}
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
					if(this.id == "top-tab-all"){
						for(var i = 0; i < 30; i++){
							document.getElementById("r" + i).classList.remove("hide");
						}
					}
					else{
						for(var i = 0; i < 30; i++){
							var known = false;
							for(var j = 0; j < 4; j++){
								if(boxes[j][i].status == 1){
									known = true;
								}
							}
							if((this.id == "top-tab-known") == known){
								document.getElementById("r" + i).classList.remove("hide");
							}
							else{
								document.getElementById("r" + i).classList.add("hide");
							}
						}
					}
				}
			}
			else if(tabs[i].id == "status-tab-1"){
				tabs[i].onclick = function(){
					updateTab(this);
					document.getElementById("edit-tab-delete").click();
				};
			}
			else if(key == "status"){
				tabs[i].onclick = function(){
					updateTab(this);
					document.getElementById("edit-tab-none").click();
				};
			}
			else{
				tabs[i].onclick = function(){
					updateTab(this);
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
	for(var i = 0; i < 4; i++){
		item = document.createElement("th");
		item.innerText = players[i];
		row.appendChild(item);
	}
	table.appendChild(row);
	var suspects = "Col. Mustard,Prof. Plum,Mr. Green,Mrs. Peacock,Miss Scarlet,Mrs. White,Mme. Rose,Sgt. Gray,M. Brunette,Miss Peach".split(",");
	var weapons = "Knife,Candlestick,Revolver,Rope,Lead Pipe,Wrench,Poison,Horseshoe".split(",");
	var rooms = "Courtyard,Gazebo,Drawing Room,Dining Room,Kitchen,Carriage House,Trophy Room,Conservatory,Studio,Billiard Room,Library,Fountain".split(",");
	clues = [];
	clues.push(...suspects);
	clues.push(...weapons);
	clues.push(...rooms);

	for(var i = 0; i < clues.length; i++){
		row = document.createElement("tr");
		row.id = "r" + i;
		item = document.createElement("td");
		item.id = "t" + i;
		item.innerText = clues[i];
		item.classList.add("title");
		if(weapons.includes(clues[i])){
			item.classList.add("weapon");
		}
		row.appendChild(item);
		for(var j = 0; j < 4; j++){
			item = document.createElement("td");
			item.id = j + "d" + i;
			boxes[j][i] = {element: item, tags: [], pressed: false, status: -1};
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
	row_height = item.offsetHeight;
}

function execute(actions, selections){
	var tag;
	if(actions.add != null){
		tag = players[actions.add.player_index] + actions.add.current_tag;
		current_tag[actions.add.player_index] = actions.add.current_tag + 1;
	}
	for(var i = 0; i < selections.length; i++){
		var box = boxes[selections[i][0]][selections[i][1]];
		if(actions.status != null){
			box.status = actions.status;
			box.element.classList.remove("data-no");
			box.element.classList.remove("data-yes");
			if(actions.status == 0){
				box.element.classList.add("data-no");
			}
			else if(actions.status == 1){
				box.element.classList.add("data-yes");
			}
		}
		if(actions.add != null){
			box.tags.push(tag);
			updateTagText(box);
		}
	}
	if(actions.edit != null){
		for(var i = 0; i < actions.edit.length; i++){
			var box = boxes[actions.edit[i][0]][actions.edit[i][1]];
			for(var j = 0; j < actions.edit[i].tag_indices.length; j++){
				box.tags.splice(actions.edit[i].tag_indices[j], 1);
			}
				updateTagText(box);
		}
	}
}

function configureEdit(){
	document.getElementById("edit").onclick = function(){
		for(var i = 1; i < 4; i++){
			document.getElementById("add-tab-" + i).innerText = players[i] + current_tag[i];
		}
		document.getElementById("status-tab-none").click();
		document.getElementById("add-tab-none").click();
		document.getElementById("edit-tab-none").click();
		var string = "";
		if(current_box_num == 0){
			change_history.push({s: [], a: null});
			string = "No boxes selected";
			document.getElementById("edit-title").style.display = "none";
			document.getElementById("edit-tab-container").style.display = "none";
		}
		else{
			var selections = [];
			document.getElementById("edit-title").style.display = "block";
			for(var i = 0; i < 4; i++){
				var selected_clues = [];
				for(var j = 0; j < 30; j++){
					if(boxes[i][j].pressed){
						selected_clues.push(clues[j]);
						selections.push({0: i, 1: j});
					}
				}
				if(selected_clues.length > 3){
					selected_clues.splice(3, selected_clues.length);
					selected_clues[2] += "...";
				}
				if(selected_clues.length > 0){
					string += players[i] + ":\t" + selected_clues.join(", ") + "\n";
				}
			}
			change_history.push({s: selections, a: null});
			shared_tags = [];
			if(selections.length == 0){
				document.getElementById("edit-title").innerText = "No tags found";
				document.getElementById("edit-tab-container").style.display = "none";
			}
			else{
				var box1 = boxes[selections[0][0]][selections[0][1]];
				for(var i = 0; i < box1.tags.length; i++){
					var found = true;
					for(var j = 1; j < selections.length; j++){
						var box2 = boxes[selections[j][0]][selections[j][1]];
						if(!box2.tags.includes(box1.tags[i])){
							found = false;
							j = selections.length;
						}
					}
					if(found){
						shared_tags.push(box1.tags[i]);
					}
				}
				if(shared_tags.length == 0){
					document.getElementById("edit-title").innerText = "No tags found";
					document.getElementById("edit-tab-container").style.display = "none";
				}
				else{
					var msg = "Edit tags: ";
					if(selections.length > 1){
						msg = "Edit shared tags: ";
					}
					msg += shared_tags.join(", ");
					document.getElementById("edit-title").innerText = msg;
					document.getElementById("edit-tab-container").style.display = "block";
				}
			}
		}
		document.getElementById("selections").innerText = string;
		document.getElementById("main-container").style.display = "none";
		document.getElementById("input-container").style.display = "block";
	};
	function clearBoxes(){
		for(var i = 0; i < 4; i++){
			for(var j = 0; j < 30; j++){
				if(boxes[i][j].pressed){
					boxes[i][j].pressed = false;
					boxes[i][j].element.classList.toggle("data-pressed");
				}
			}
		}
		current_box_num = 0;
		document.getElementById("edit").innerText = "Edit 0 boxes";
	}
	function updateTagText(box){
		console.log("update tag text: ");
		box.element.innerText = box.tags.join(", ");
		test_element.innerText = box.tags.join(", ");
		var font_size = base_font_size;
		box.element.style.fontSize = font_size + "px";
		test_element.style.fontSize = font_size + "px";
		while(font_size > 8 && test_element.offsetHeight > row_height){
			console.log("font decrease");
			font_size--;
			test_element.style.fontSize = font_size + "px";
		}
		console.log(test_element.offsetHeight + " " + row_height);
		box.element.style.fontSize = font_size + "px";
	}
	document.getElementById("clear").onclick = clearBoxes;
	document.getElementById("submit").onclick = function(){
		var actions = {status: null, add: null, edit: null};
		var selections = change_history[change_history.length - 1].s;
		if(selections.length == 0){
			change_history.pop();
			clearBoxes();
			document.getElementById("input-container").style.display = "none";
			document.getElementById("main-container").style.display = "block";
			return;
		}
		if(current_tab.status.id != "status-tab-none"){
			var status = parseInt(current_tab.status.id.split("-")[2]);
			if(status == 2){
				status = -1;
			}
			actions.status = status;
		}
		if(current_tab.add.id != "add-tab-none"){
			var player_index = parseInt(current_tab.add.id.split("-")[2]);
			actions.add = {"player_index": player_index, "current_tag": current_tag[player_index]};
		}
		if(shared_tags.length != 0 && current_tab.edit.id != "edit-tab-none"){
			actions.edit = [];
			if(current_tab.edit.id == "edit-tab-delete"){
				for(var h = 0; h < shared_tags.length; h++){
					for(var i = 0; i < 4; i++){
						for(var j = 0; j < 30; j++){
							var list = null;
							for(k = 0; k < boxes[i][j].tags.length; k++){
								if(boxes[i][j].tags[k] == shared_tags[h]){
									if(list == null){
										list = [];
										actions.edit.push({0: i, 1: j, "tag_indices": list});
									}
									list.unshift(k);
								}
							}
						}
					}
				}
			}
			if(current_tab.edit.id == "edit-tab-remove"){
				for(var h = 0; h < shared_tags.length; h++){
					for(var i = 0; i < selections.length; i++){
						var box = boxes[selections[i][0]][selections[i][1]];
						var list = null;
						for(var j = 0; j < box.tags.length; j++){
							if(box.tags[j] == shared_tags[h]){
								if(list == null){
									list = [];
									actions.edit.push({0: selections[i][0], 1: selections[i][1], "tag_indices": list});
								}
								list.unshift(j);
							}
						}
					}
				}
			}
		}
		if(actions.status == null && actions.edit == null && actions.add == null){
			change_history.pop();
		}
		else{
			change_history[change_history.length - 1].a = actions;
			execute(change_history[change_history.length - 1].a, change_history[change_history.length - 1].s);
			firebase.database().ref(player_initial + '/history/' + (change_history.length - 1)).set(change_history[change_history.length - 1]);
		}
		clearBoxes();
		document.getElementById("input-container").style.display = "none";
		document.getElementById("main-container").style.display = "block";
	}
	function clearData(){
		for(var i = 0; i < 4; i++){
			current_tag[i] = 1;
			for(var j = 0; j < 30; j++){
				boxes[i][j].tags = [];
				boxes[i][j].status = -1;
				boxes[i][j].element.classList.remove("data-no");
				boxes[i][j].element.classList.remove("data-yes");
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
		change_history = [];
		firebase.database().ref(player_initial + '/history').set(change_history);
		document.getElementById("confirm-container").style.display = "none";
		document.getElementById("input-container").style.display = "none";
		document.getElementById("main-container").style.display = "block";
	}
	document.getElementById("settings-tab-reset").onclick = function(){
		document.getElementById("confirm-container").style.display = "block";
		document.getElementById("confirm-tab").innerText = "Confirm reset";
		document.getElementById("confirm-tab").onclick = reset;
	};
	function undo(){
		change_history.pop();
		firebase.database().ref(player_initial + '/history/' + (change_history.length - 1)).remove();
		change_history.pop();
		clearData();
		for(var i = 0; i < change_history.length; i++){
			execute(change_history[i].a, change_history[i].s);
		}
		document.getElementById("confirm-container").style.display = "none";
		document.getElementById("input-container").style.display = "none";
		document.getElementById("main-container").style.display = "block";
	}
	document.getElementById("settings-tab-undo").onclick = function(){
		document.getElementById("confirm-container").style.display = "block";
		document.getElementById("confirm-tab").innerText = "Confirm undo";
		document.getElementById("confirm-tab").onclick = undo;
	};
}

createTabs();
createTable();
configureEdit();
getHistory();