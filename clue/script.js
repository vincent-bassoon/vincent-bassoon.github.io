var elements = {};

function createUI(){
	var table = document.getElementById("table");
	var suspects = "Col. Mustard,Prof. Plum,Mr. Green,Mrs. Peacock,Miss Scarlet,Mrs. White,Mme. Rose,Sgt. Gray,M. Brunette,Miss Peach".split(",");
	var weapons = "Knife,Candlestick,Revolver,Rope,Lead Pipe,Wrench,Poison,Horseshoe".split(",");
	var rooms = "Courtyard,Gazebo,Drawing Room,Dining Room,Kitchen,Carriage House,Trophy Room,Conservatory,Studio,Billiard Room,Library,Fountain".split(",");
	var names = [];
	names.push(...suspects);
	names.push(...weapons);
	names.push(...rooms);
	for(var i = 0; i < names.length; i++){
		var row = document.createElement("tr");
		var item = document.createElement("td");
		item.innerText = names[i];
		item.classList.add("title");
		if(weapons.includes(names[i])){
			item.classList.add("weapon");
		}
		elements["t" + i] = item;
		row.appendChild(item);
		for(var j = 0; j < 4; j++){
			item = document.createElement("td");
			item.onclick = function(){this.classList.toggle("data-pressed")};
			item.classList.add("data");
			elements[j + "d" + i] = item;
			row.appendChild(item);
		}
		table.appendChild(row);
	}

}

createUI();