var boxes = {0: {}, 1: {}, 2: {}, 3: {}};
var selected_boxes;
var players = ["V", "C", "T", "J"];
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

function configureEdit(){
	document.getElementById("edit").onclick = function(){
		for(var i = 1; i < 4; i++){
			document.getElementById("add-tab-" + i).innerText = players[i] + current_tag[i];
		}
		document.getElementById("status-tab-none").click();
		document.getElementById("add-tab-none").click();
		document.getElementById("edit-tab-none").click();
		selected_boxes = [];
		var string = "";
		if(current_box_num == 0){
			string = "No boxes selected";
			document.getElementById("edit-title").style.display = "none";
			document.getElementById("edit-tab-container").style.display = "none";
		}
		else{
			selected_boxes = [];
			document.getElementById("edit-title").style.display = "block";
			for(var i = 0; i < 4; i++){
				var selected_clues = [];
				for(var j = 0; j < 30; j++){
					if(boxes[i][j].pressed){
						selected_clues.push(clues[j]);
						selected_boxes.push(boxes[i][j]);
					}
				}
				if(selected_clues.length > 0){
					string += players[i] + ":\n" + selected_clues.join("\n") + "\n";
				}
			}
			shared_tags = [];
			if(selected_boxes.length == 0){
				document.getElementById("edit-title").innerText = "No tags found";
				document.getElementById("edit-tab-container").style.display = "none";
			}
			else{
				for(var i = 0; i < selected_boxes[0].tags.length; i++){
					var found = true;
					for(var j = 1; j < selected_boxes.length; j++){
						if(!selected_boxes[j].tags.includes(selected_boxes[0].tags[i])){
							found = false;
							j = selected_boxes.length;
						}
					}
					if(found){
						shared_tags.push(selected_boxes[0].tags[i]);
					}
				}
				if(shared_tags.length == 0){
					document.getElementById("edit-title").innerText = "No tags found";
					document.getElementById("edit-tab-container").style.display = "none";
				}
				else{
					var msg = "Edit tags: ";
					if(selected_boxes.length > 1){
						msg = "Edit shared tags: ";
					}
					msg += shared_tags.join(", ");
					document.getElementById("edit-title").innerText = msg;
					document.getElementById("edit-tab-container").style.display = "block";
				}
			}
		}
		document.getElementById("selections").innerText = string;
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
		box.element.innerText = box.tags.join(", ");
		var font_size = base_font_size;
		box.element.style.fontSize = font_size + "px";
		while(font_size > 8 && box.element.offsetHeight > row_height){
			font_size--;
			box.element.style.fontSize = font_size + "px";
		}
	}
	document.getElementById("submit").onclick = function(){
		if(current_tab.status.id != "status-tab-none"){
			var status = parseInt(current_tab.status.id.split("-")[2]);
			var add_class, remove_class;
			if(status == 0){
				add_class = "data-no";
				remove_class = "data-yes";
			}
			else{
				add_class = "data-yes";
				remove_class = "data-no";
			}
			for(var i = 0; i < selected_boxes.length; i++){
				selected_boxes[i].status = status;
				selected_boxes[i].element.classList.remove(remove_class);
				selected_boxes[i].element.classList.add(add_class);
			}
		}
		if(current_tab.add.id != "add-tab-none"){
			var player_index = parseInt(current_tab.add.id.split("-")[2]);
			var tag = players[player_index] + current_tag[player_index];
			current_tag[player_index]++;
			for(var i = 0; i < selected_boxes.length; i++){
				selected_boxes[i].tags.push(tag);
				updateTagText(selected_boxes[i]);
			}
		}
		if(shared_tags.length != 0 && current_tab.edit.id != "edit-tab-none"){
			if(current_tab.edit.id == "edit-tab-delete"){
				for(var h = 0; h < shared_tags.length; h++){
					for(var i = 0; i < 4; i++){
						for(var j = 0; j < 30; j++){
							var update = false;
							for(k = 0; k < boxes[i][j].tags.length; k++){
								if(boxes[i][j].tags[k] == shared_tags[h]){
									boxes[i][j].tags.splice(k, 1);
									k--;
									update = true;
								}
							}
							if(update){
								updateTagText(boxes[i][j]);
							}
						}
					}
				}
			}
			if(current_tab.edit.id == "edit-tab-remove"){
				for(var h = 0; h < shared_tags.length; h++){
					for(var i = 0; i < selected_boxes.length; i++){
						var update = false;
						for(var j = 0; j < selected_boxes[i].tags.length; j++){
							if(selected_boxes[i].tags[j] == shared_tags[h]){
								selected_boxes[i].tags.splice(j, 1);
								j--;
								update = true;
							}
						}
						if(update){
							updateTagText(selected_boxes[i]);
						}
					}
				}
			}
		}
		clearBoxes();
		document.getElementById("input-container").style.display = "none";
	}
}

createTabs();
createTable();
configureEdit();