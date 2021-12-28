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
	var suspects = ["Col. Mustard", "Prof. Plum", "Mr. Green", "Mrs. Peacock", "Miss Scarlet", "Mrs. White", "Mme. Rose", "Sgt. Gray", "M. Brunette", "Miss Peach"];
	var player_count = 4;
	var colors = ["#c4c03b", "#bc5de8", "#38c738", "#34c6e0", "#fc4c4c", "white", "#f77eef", "#b0b0b0", "#8f6363", "#f0ae89"];
	var characters = {};
	for(var i = 0; i < suspects.length; i++){
		characters[i] = -1;
	}

	var weapons = ["Knife", "Candlestick", "Revolver", "Rope", "Lead Pipe", "Wrench", "Poison", "Horseshoe", "Frying Pan"];
	var rooms = ["Courtyard", "Gazebo", "Drawing Room", "Dining Room", "Kitchen", "Carriage House", "Trophy Room", "Conservatory", "Studio", "Billiard Room", "Library", "Fountain"];
	var clues = [];
	clues.push(...suspects);
	clues.push(...weapons);
	clues.push(...rooms);

	function removeCharacter(player){
		for(var i = 0; i < suspects.length; i++){
			if(characters[(player + i) % suspects.length] == player){
				characters[(player + i) % suspects.length] = -1;
				return;
			}
		}
	}

	function switchCharacter(player){
		for(var i = 0; i < suspects.length; i++){
			if(characters[(player + i) % suspects.length] == player){
				characters[(player + i) % suspects.length] = -1;
				for(var j = 1; j < suspects.length; j++){
					var index = (player + i + j) % suspects.length;
					if(characters[index] == -1){
						characters[index] = player;
						return index;
					}
				}
				return;
			}
		}
	}

	function addCharacter(player){
		for(var i = 0; i < suspects.length; i++){
			if(characters[(player + i) % suspects.length] == -1){
				characters[(player + i) % suspects.length] = player;
				return (player + i) % suspects.length;
			}
		}
	}

	function createPlayerInfo(){
		for(var j = 0; j < 9; j++){
			var div = document.createElement("div");
			div.id = "player-info-" + j;
			var tab = document.createElement("a");
			tab.classList.add("tab");
			tab.classList.add("half");
			tab.id = "character-" + j;
			if(j < player_count){
				var character = addCharacter(j);
				div.style.backgroundColor = colors[character];
				tab.innerText = suspects[character];
			}
			else{
				div.classList.add("hide");
			}
			tab.onclick = function(){
				var player = parseInt(this.id.split("-")[1]);
				var character = switchCharacter(player);
				var div = document.getElementById("player-info-" + player)
				div.style.backgroundColor = colors[character];
				document.getElementById("character-" + player).innerText = suspects[character];
			}
			div.appendChild(tab);
			var input = document.createElement("input");
			input.type = "text";
			input.classList.add("playername");
			input.id = "playername-" + j;
			input.placeholder = "Enter player " + (j + 1) + " name";
			div.appendChild(input);
			document.getElementById("player-info-container").appendChild(div);
		}
	}

	createPlayerInfo();

	var current_tab = document.getElementById("playercount-tab-" + player_count);
	current_tab.classList.toggle("active-tab");
	var tabs = document.getElementsByClassName("playercount");
	for(var i = 0; i < tabs.length; i++){
		tabs[i].onclick = function(){
			if(current_tab.id != this.id){
				current_tab.classList.toggle("active-tab");
				this.classList.toggle("active-tab");
				current_tab = this;
				var new_player_count = parseInt(this.id.split("-")[2]);
				if(new_player_count < player_count){
					for(var j = new_player_count; j < player_count; j++){
						document.getElementById("player-info-" + j).classList.add("hide");
						removeCharacter(j);
					}
				}
				else if(player_count < new_player_count){
					for(var j = player_count; j < new_player_count; j++){
						var character = addCharacter(j);
						var div = document.getElementById("player-info-" + j)
						div.style.backgroundColor = colors[character];
						document.getElementById("character-" + j).innerText = suspects[character];
						div.classList.remove("hide");
					}
				}
				player_count = new_player_count
			}
		};
	}

	var reset_button = document.getElementById("reset-button");
	function reset(){
		document.getElementById("confirm-container").style.display = "block";
	};
	reset_button.onclick = reset;

	document.getElementById("confirm-container").onclick = function(){
		document.getElementById("confirm-container").style.display = "none";
	};
	function shuffle(array) {
		var index, temp_value;
		for(var i = array.length; i > 0; i--){
			index = Math.floor(Math.random() * i);

			temp_value = array[i - 1];
			array[i - 1] = array[index];
			array[index] = temp_value;
		}
	}
	document.getElementById("confirm").onclick = function(){
		document.getElementById("confirm-container").style.display = "none";
		reset_button.innerText = "Starting...";
		reset_button.onclick = null;

		var players = [];
		for(var i = 0; i < player_count; i++){
			players.push(document.getElementById("playername-" + i).value);
		}

		var data = {"answer": []};
		data.answer.push(Math.floor(Math.random() * suspects.length));
		data.answer.push(suspects.length + Math.floor(Math.random() * weapons.length));
		data.answer.push(suspects.length + weapons.length + Math.floor(Math.random() * rooms.length));
		var cards = [];
		for(var i = 0; i < 31; i++){
			cards.push(i);
		}
		for(var i = 0; i < 3; i++){
			cards.splice(data.answer[2 - i], 1);
		}
		shuffle(cards);
		for(var i = 0; i < player_count; i++){
			data[i] = [];
		}
		var index = Math.floor(Math.random() * player_count);
		while(cards.length > 0){
			data[index % player_count].push(cards.pop());
			index++
		}
		data["status"] = Date.now();
		data["players"] = players;
		console.log(data);
		firebase.database().ref("/game").set(data);

		setTimeout(function(){
			reset_button.innerText = "Start New Game";
			reset_button.onclick = reset;
		}, 500);
	};

}

main_function();