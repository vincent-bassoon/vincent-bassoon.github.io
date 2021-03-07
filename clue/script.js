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

const messaging = firebase.messaging();

function initialize(){

	messaging.getToken({ vapidKey: 'BI56U_-65I1qf2tjba9bv6vYA_uVSVGXLgOACLv275CXwupMSd_lvyGp3Vg7jfJbVHkrxXkZBRs3dUcATQKILS0' }).then((currentToken) => {
	  if (currentToken) {
	    // Send the token to your server and update the UI if necessary
	    // ...
	    console.log("gungus");
	  } else {
	    // Show permission request UI
	    console.log('No registration token available. Request permission to generate one.');
	    // ...
	  }
	}).catch((err) => {
	  console.log('An error occurred while retrieving token. ', err);
	  // ...
	});
}

if('serviceWorker' in navigator) {
	window.addEventListener('load', function() {
		navigator.serviceWorker.register('firebase-messaging-sw.js').then(function(registration) {
			// Registration was successful
			console.log('ServiceWorker registration successful with scope: ', registration.scope);
			initialize();
		}, function(err) {
			// registration failed :(
			console.log('ServiceWorker registration failed: ', err);
		});
	});
}

var titles = {};
var boxes = {0: {}, 1: {}, 2: {}, 3: {}};
var players = ["C", "T", "J", "V"];
var clues;
var current_tab = {top: document.getElementById("top-tab-all"),
				   status: document.getElementById("status-tab-none"),
				   add: document.getElementById("add-tab-none")};
var current_tag = {};
var current_box_num = 0;
var row_height;
var base_font_size;
var turn_history = [];
var tag_history = [];
var test_element = document.getElementById("test_element");

var player_initial = test_element.innerText;
while(players[0] != player_initial.toUpperCase()){
	players.unshift(players.pop());
}
for(var i = 1; i < 4; i++){
	current_tag[players[i]] = 1;
}

function getHistory(){
	firebase.database().ref(player_initial).once('value').then(function(snapshot){
		var data = snapshot.val();
		if(data != null){
			turn_history = data;
			for(var i = 0; i < turn_history.length; i++){
				execute(turn_history[i].t, turn_history[i].s, turn_history[i].b);
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
						document.getElementById("border-0").classList.remove("hide");
						document.getElementById("border-1").classList.remove("hide");
					}
					else{
						var category_found = {0: false, 1: false, 2: false};
						for(var i = 0; i < 30; i++){
							var known = false;
							for(var j = 0; j < 4; j++){
								if(boxes[j][i].status == 1){
									known = true;
								}
							}
							if((this.id == "top-tab-known") == known){
								document.getElementById("r" + i).classList.remove("hide");
								if(i < 10){
									category_found[0] = true;
								}
								else if(i < 18){
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
		for(var j = 0; j < 4; j++){
			item = document.createElement("td");
			item.id = j + "d" + i;
			boxes[j][i] = {element: item, tags: [], pressed: false, status: 2};
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
								updateTagText(box2);
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
		updateTagText(box);
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
	for(var i = 0; i < 30; i++){
		var answer = true;
		var not_answer = false;
		for(var j = 0; j < 4; j++){
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
	if(status == 1){
		for(var i = 0; i < selections.length; i++){
			for(var j = 0; j < 4; j++){
				if(boxes[j][selections[i][1]].status == 2 && boxes[j][selections[i][1]].tags.length == 0){
					boxes[j][selections[i][1]].status = 0;
					boxes[j][selections[i][1]].element.classList.add("data-0");
				}
			}
		}
	}
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

function configureEdit(){
	document.getElementById("edit").onclick = function(){
		var tag_elements = document.getElementsByClassName("multiple-tag");
		for(var i = tag_elements.length - 1; i >= 0; i--){
			tag_elements[i].classList.remove("multiple-tag");
		}
		for(var i = 1; i < 4; i++){
			document.getElementById("add-tab-" + i).innerText = players[i] + current_tag[players[i]];
		}
		document.getElementById("status-tab-none").click();
		document.getElementById("add-tab-none").click();
		if(current_box_num == 0){
			turn_history.push({b: [], s: null, t: null});
		}
		else{
			var selections = [];
			for(var i = 0; i < 4; i++){
				for(var j = 0; j < 30; j++){
					if(boxes[i][j].pressed){
						selections.push({0: i, 1: j});
					}
				}
			}
			turn_history.push({b: selections, t: null, s: null});
		}
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
	document.getElementById("clear").onclick = clearBoxes;
	document.getElementById("submit").onclick = function(){
		var selections = turn_history[turn_history.length - 1].b;
		if(selections.length == 0){
			turn_history.pop();
			clearBoxes();
			document.getElementById("input-container").style.display = "none";
			document.getElementById("main-container").style.display = "block";
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
		if(turn_history[turn_history.length - 1].s == null && turn_history[turn_history.length - 1].t == null){
			turn_history.pop();
		}
		else{
			execute(turn_history[turn_history.length - 1].t, turn_history[turn_history.length - 1].s, turn_history[turn_history.length - 1].b);
			firebase.database().ref(player_initial + '/' + (turn_history.length - 1)).set(turn_history[turn_history.length - 1]);
		}
		clearBoxes();
		current_tab.top.click();
		document.getElementById("input-container").style.display = "none";
		document.getElementById("main-container").style.display = "block";
	}
	function clearData(){
		for(var i = 1; i < 4; i++){
			current_tag[players[i]] = 1;
		}
		for(var j = 0; j < 30; j++){
			if(titles[j].status != 2){
				titles[j].element.classList.remove("title-" + titles[j].status);
			}
			titles[j].status = 2;
			for(var i = 0; i < 4; i++){
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
		document.getElementById("input-container").style.display = "none";
		document.getElementById("main-container").style.display = "block";
	}
	document.getElementById("settings-tab-reset").onclick = function(){
		document.getElementById("confirm-container").style.display = "block";
		document.getElementById("confirm-tab").innerText = "Confirm reset";
		document.getElementById("confirm-tab").onclick = reset;
	};
	function undo(){
		turn_history.pop();
		firebase.database().ref(player_initial + '/' + (turn_history.length - 1)).remove();
		turn_history.pop();
		clearData();
		for(var i = 0; i < turn_history.length; i++){
			execute(turn_history[i].t, turn_history[i].s, turn_history[i].b);
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