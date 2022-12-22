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
	var suspects = ["Col. Mustard", "Prof. Plum", "Mr. Green", "Miss Scarlet", "Mrs. Peacock", "Mrs. White", "Mme. Rose", "Sgt. Gray", "M. Brunette", "Miss Peach"];
	var initial_player_names = ["J", "T", "V", "C"];
	var player_count = initial_player_names.length;

	var initial_player_order = [];
	let index = Math.floor(Math.random() * player_count);
	for(let i = 0; i < player_count; i++){
		initial_player_order.push((index + i) % player_count);
	}

	var characters = {};
	for(let i = 0; i < suspects.length; i++){
		characters[i] = -1;
	}

	var weapons = ["Knife", "Candlestick", "Revolver", "Rope", "Lead Pipe", "Wrench", "Poison", "Horseshoe", "Frying Pan"];
	var rooms = ["Courtyard", "Gazebo", "Drawing Room", "Dining Room", "Kitchen", "Carriage House", "Trophy Room", "Conservatory", "Studio", "Billiard Room", "Library", "Fountain"];
	var clues = [];
	var map_rooms = 13;
	clues.push(...suspects);
	clues.push(...weapons);
	clues.push(...rooms);

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
		let data = (((((player * (5 + player_count)) + phase + 3) * (suspects.length + 1) + guess[0]) * (weapons.length + 1) + guess[1]) * (rooms.length + 1) + guess[2]);
		return ((data * 11 + roll - 2) * (map_rooms + 1) + map_room) * (clues.length + 1) + shown;
	}

	function removeCharacter(player){
		for(let i = 0; i < suspects.length; i++){
			if(characters[i] == player){
				characters[i] = -1;
				return;
			}
		}
	}

	function switchCharacter(player){
		for(let i = 0; i < suspects.length; i++){
			if(characters[i] == player){
				characters[i] = -1;
				for(let j = 1; j < suspects.length; j++){
					let index = (i + j) % suspects.length;
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
		let index = Math.floor(Math.random() * suspects.length);
		for(let i = 0; i < suspects.length; i++){
			index = (index + 1) % suspects.length;
			if(characters[index] == -1){
				characters[index] = player;
				return index;
			}
		}
	}

	function createPlayerInfo(){
		for(let j = 0; j < 9; j++){
			let div = document.createElement("div");
			div.id = "player-info-" + j;

			//Create character type (human/ai) input
			let tab = document.createElement("a");
			tab.classList.add("tab");
			tab.classList.add("playertype");
			tab.id = "playertype-" + j;
			tab.innerText = "Human"
			if(j >= player_count){
				div.classList.add("hide");
			}
			tab.onclick = function(){
				if(this.innerText == "Human"){
					this.innerText = "AI";
				}
				else{
					this.innerText = "Human";
				}
			}
			div.appendChild(tab);

			//reuse tab for character tab
			tab = document.createElement("a");
			tab.classList.add("tab");
			tab.classList.add("third");
			tab.id = "character-" + j;
			if(j < player_count){
				let character = initial_player_order[j];
				characters[initial_player_order[j]] = j
				div.style.backgroundColor = colors[character];
				tab.innerText = suspects[character];
			}
			else{
				div.classList.add("hide");
			}
			tab.onclick = function(){
				let player = parseInt(this.id.split("-")[1]);
				let character = switchCharacter(player);
				let div = document.getElementById("player-info-" + player)
				div.style.backgroundColor = colors[character];
				document.getElementById("character-" + player).innerText = suspects[character];
			}
			div.appendChild(tab);

			//name input
			let input = document.createElement("input");
			if(j < player_count){
				input.value = initial_player_names[initial_player_order[j]];
			}
			input.size = 10;
			input.type = "text";
			input.classList.add("playername");
			input.id = "playername-" + j;
			input.placeholder = "Enter name";
			div.appendChild(input);
			document.getElementById("player-info-container").appendChild(div);
		}
	}

	createPlayerInfo();

	var current_tab = document.getElementById("playercount-tab-" + player_count);
	current_tab.classList.toggle("active-tab");
	var tabs = document.getElementsByClassName("playercount");
	for(let i = 0; i < tabs.length; i++){
		tabs[i].onclick = function(){
			if(current_tab.id != this.id){
				current_tab.classList.toggle("active-tab");
				this.classList.toggle("active-tab");
				current_tab = this;
				let new_player_count = parseInt(this.id.split("-")[2]);
				if(new_player_count < player_count){
					for(let j = new_player_count; j < player_count; j++){
						document.getElementById("player-info-" + j).classList.add("hide");
						removeCharacter(j);
					}
				}
				else if(player_count < new_player_count){
					for(let j = player_count; j < new_player_count; j++){
						let character = addCharacter(j);
						let div = document.getElementById("player-info-" + j)
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
		let index, temp_value;
		for(let i = array.length; i > 0; i--){
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


		let player_to_character = {};
		for(let i = 0; i < suspects.length; i++){
			if(characters[i] != -1){
				player_to_character[characters[i]] = i;
			}
		}
		let players = {};
		for(let i = 0; i < player_count; i++){
			let player = {};
			player.name = document.getElementById("playername-" + i).value;
			player.character = player_to_character[i];
			player.is_human = (document.getElementById("playertype-" + i).innerText == "Human");
			players[i] = player;
		}

		let game = {"answer": []};
		game.answer.push(Math.floor(Math.random() * suspects.length));
		game.answer.push(suspects.length + Math.floor(Math.random() * weapons.length));
		game.answer.push(suspects.length + weapons.length + Math.floor(Math.random() * rooms.length));

		//create and shuffle cards
		let cards = [];
		for(let i = 0; i < 31; i++){
			cards.push(i);
		}
		for(let i = 0; i < 3; i++){
			cards.splice(game.answer[2 - i], 1);
		}
		shuffle(cards);

		//deal cards: humans always given priority over AI, last human player given priority over first
		let deal_order = [];
		for(let i = 0; i < player_count; i++){
			players[i].hand = [];
			if(players[i].is_human){
				deal_order.splice(0, 0, i);
			}
			else{
				deal_order.push(i);
			}
		}
		let index = 0;
		while(cards.length > 0){
			players[deal_order[index % player_count]].hand.push(cards.pop());
			index++;
		}
		game.status = -1;
		game.turn = encodeTurn(0, -3, 2, [], clues.length, map_rooms);
		console.log(game.turn)
		/*
			phases
			-3: needs to roll
			-2: needs to move (game is the number rolled)
			-1: needs to ask question
			0-9: waiting for player 0-9 to respond (game is a stringified csv of the guess)
			=number of players: needs to decide whether to make a guess
		*/
		game.players = players;
		game.history = [];
		console.log(game);
		firebase.database().ref("/game").set(game);

		setTimeout(function(){
			reset_button.innerText = "Start Prepared Game";
			reset_button.onclick = function(){
				reset_button.innerText = "Starting...";
				reset_button.onclick = null;
				firebase.database().ref("/game/status").set(Date.now());
				setTimeout(function(){
					reset_button.innerText = "Prepare New Game";
					reset_button.onclick = reset;
				}, 1000);
			};
		}, 500);
	};

}

main_function();