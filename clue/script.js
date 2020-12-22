var titles = {};
var boxes = {};
var players = ["V", "C", "T", "J"];
var current_tab;
var current_box_num = 0;
var row_height;
var base_font_size;

function createTabs(){
	var tabs = {};
	var tab_ids = ["all", "known", "unknown"];
	for(var i = 0; i < tab_ids.length; i++){
		tabs[tab_ids[i]] = document.getElementById(tab_ids[i]);
	}
	current_tab = tabs["all"];
	current_tab.classList.add("active-tab");
	for(var key in tabs){
		tabs[key].onclick = function(){
			current_tab.classList.toggle("active-tab");
			this.classList.toggle("active-tab");
			current_tab = this;
		};
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
	var names = [];
	names.push(...suspects);
	names.push(...weapons);
	names.push(...rooms);

	for(var i = 0; i < names.length; i++){
		row = document.createElement("tr");
		item = document.createElement("td");
		item.id = "t" + i;
		item.innerText = names[i];
		item.classList.add("title");
		if(weapons.includes(names[i])){
			item.classList.add("weapon");
		}
		titles[item.id] = item;
		row.appendChild(item);
		for(var j = 0; j < 4; j++){
			item = document.createElement("td");
			item.id = j + "d" + i;
			boxes[item.id] = {element: item, tags: [], pressed: false, column: players[j], clue: names[i]};
			item.onclick = function(){
				this.classList.toggle("data-pressed");
				boxes[this.id].pressed = !boxes[this.id].pressed;
				if(boxes[this.id].pressed){
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

function configureButtons(){
	function clearBoxes(){
		for(var id in boxes){
			if(boxes[id].pressed){
				boxes[id].pressed = false;
				boxes[id].element.classList.toggle("data-pressed");
			}
		}
		current_box_num = 0;
		document.getElementById("edit").innerText = "Edit 0 boxes";
	}
	function close(){
		clearBoxes();
		var field = document.getElementById("field");
		field.blur();
		field.value = "";
		document.getElementById("input-container").style.display = "none";
	}
	document.getElementById("edit").onclick = function(){
		var string = "";
		if(current_box_num == 0){
			string = "No boxes selected";
		}
		else{
			for(var i = 0; i < 4; i++){
				var clues = [];
				for(var j = 0; j < 30; j++){
					if(boxes[i + "d" + j].pressed){
						clues.push(boxes[i + "d" + j].clue);
					}
				}
				if(clues.length > 0){
					string += players[i] + ":\n" + clues.join("\n") + "\n";
				}
			}
		}
		document.getElementById("selections").innerText = string;
		document.getElementById("input-container").style.display = "block";
		document.getElementById("field").focus();
	};
	document.getElementById("clear").onclick = clearBoxes;
	document.getElementById("cancel").onclick = close;
	document.getElementById("submit-tag").onclick = function(){
		if(document.getElementById("field").value.trim() != ""){
			for(var i = 0; i < 4; i++){
				for(var j = 0; j < 30; j++){
					var box = boxes[i + "d" + j];
					if(box.pressed){
						box.tags.push(document.getElementById("field").value.trim());
						box.element.innerText = box.tags.join(", ");
						var font_size = base_font_size;
						box.element.style.fontSize = font_size + "px";
						while(font_size > 8 && box.element.offsetHeight > row_height){
							font_size--;
							box.element.style.fontSize = font_size + "px";
						}
					}
				}
			}
		}
		close();
	};
}

createTabs();
createTable();
configureButtons();