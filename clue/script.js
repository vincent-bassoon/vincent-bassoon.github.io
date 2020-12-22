var titles = {};
var boxes = {};
var players = ["V", "C", "T", "J"];
var current_tab;
var current_box_num = 0;

function createUI(){
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
	var table = document.getElementById("table");
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

	document.getElementById("edit").onclick = function(){
		var string = "Selected:\n";
		if(current_box_num == 0){
			string += "\tNone\n";
		}
		else{
			for(var i = 0; i < 4; i++){
				var clues = [];
				for(var j = 0; j < names.length; j++){
					if(boxes[i + "d" + j].pressed){
						clues.push(boxes[i + "d" + j].clue);
					}
				}
				if(clues.length > 0){
					string += "\tColumn " + players[i] + ": " + clues.join(", ") + "\n";
				}
			}
		}
		document.getElementById("selections").innerText = string;
		document.getElementById("input-container").style.display = "block";
		document.getElementById("field").focus();
	};
	document.getElementById("clear").onclick = function(){
		for(var id in boxes){
			if(boxes[id].pressed){
				boxes[id].pressed = false;
				boxes[id].element.classList.toggle("data-pressed");
			}
		}
		current_box_num = 0;
		document.getElementById("edit").innerText = "Edit 0 boxes";
	};

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
			boxes[item.id] = {element: item, pressed: false, column: players[j], clue: names[i]};
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

}

createUI();