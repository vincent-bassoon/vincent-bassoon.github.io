function ai_main_function(current_player, data){
	let DATA = data;
	let desired_guess;
	let map_data;
	let game = [];
	let players = [];

	let suspects = ["Col. Mustard", "Prof. Plum", "Mr. Green", "Miss Scarlet", "Mrs. Peacock", "Mrs. White", "Mme. Rose", "Sgt. Gray", "M. Brunette", "Miss Peach"];
	let weapons = ["Knife", "Candlestick", "Revolver", "Rope", "Lead Pipe", "Wrench", "Poison", "Horseshoe", "Frying Pan"];
	let rooms = ["Courtyard", "Gazebo", "Drawing Room", "Dining Room", "Kitchen", "Carriage House", "Trophy Room", "Conservatory", "Studio", "Billiard Room", "Library", "Fountain"];
	let clues = [];
	clues.push(...suspects);
	clues.push(...weapons);
	clues.push(...rooms);
	
	let boxes = {};

	let active_tags = {};
	let current_tag = null;
	let current_tag_index = 0;

	let map_rooms = 13;


	let turn_queue = {
		queue: [],
		remove: function(){
			if(this.queue.length == 0){
				return;
			}
			let item = this.queue.shift();
			if(item.render){
				let queue = [];
				updateQueueFromTurn(queue, item.turn, item.pause);
				updateChartQueue(queue);
			}
			else{
				updateTurn(item.turn, item.pause);
			}
		},
		addTurn: function(turn, pause){
			this.queue.push({"turn": turn, "pause": pause, "render": true});
			this.queue.push({"turn": turn, "pause": pause, "render": false});
			if(this.queue.length == 2){
				this.remove();
			}
		}
	}


	function createPage(data){
		if(data.status == -1){
			return;
		}
		players = data.players;
		for(let i = 0; i < players.length; i++){
			players[i].was_moved = false;
			players[i].final_guess = false;
		}
		answers = data.answer;
		game = {"status": data.status, "turn": data.turn};
		if("history" in data){
			game.history = data.history;
		}
		else{
			game.history = {};
		}

		for(let j = 0; j < players.length; j++){
			boxes[j] = {};
		}

		createTable();
		createMap();

		updateGameHistory();
		createTurnListener();
	}

	function createTable(){

		//add subsequent rows
		for(let i = 0; i < clues.length; i++){
			for(let j = 0; j < players.length; j++){
				let index = (current_player + j) % players.length;
				boxes[index][i] = {id: index + "d" + i, tags: new Set(), pressed: false, status: 2, update: false};
			}
		}
	}

	function updateQueueFromTurn(queue, turn, pause){
		if(turn.phase == players.length + 1){
			return;
		}
		let showing_player = getPlayerFromCard(turn.shown);
		if(turn.phase == players.length){
			if(turn.guess[0] == suspects.length){
				return;
			}
			if(turn.shown == clues.length){
				let last_phase = (turn.player + players.length - 1) % players.length;
				if(last_phase != current_player){
					queue.push([last_phase, turn.guess[0], 0]);
					queue.push([last_phase, turn.guess[1], 0]);
					queue.push([last_phase, turn.guess[2], 0]);
				}
			}
			else if(turn.player == current_player){
				queue.push([showing_player, turn.shown, 1]);
			}
			else if(showing_player == current_player){
				queue.push([turn.player, turn.shown, 3]);
			}
			else{
				queue.push([showing_player, turn.guess[0], turn.guess[1], turn.guess[2]]);
			}
		}
		else if(turn.phase > -1 && turn.phase != turn.player && turn.phase != ((turn.player + 1) % players.length)){
			let last_phase = (turn.phase + players.length - 1) % players.length;
			if(last_phase != current_player){
				queue.push([last_phase, turn.guess[0], 0]);
				queue.push([last_phase, turn.guess[1], 0]);
				queue.push([last_phase, turn.guess[2], 0]);
			}
		}
	}

	function updateGameHistory(){
		for(let i = 0; i < players.length; i++){
			players[i].location = {"row": 14, "col": 9};
			map_data[players[i].location.row][players[i].location.col].players.add(i);
			updateMap(i, players[i].location);
		}
		let queue = [];
		for(let i = 0; i < players[current_player].hand.length; i++){
			queue.push([current_player, players[current_player].hand[i], 1]);
		}
		updateChartQueue(queue, false);
		let dates = [];
		for(let date in game.history){
			dates.push(date);
		}
		dates.sort(function(a, b){
			return a - b;
		});
		for(let i = 0; i < dates.length; i++){
			let turns = expandTurn(decodeTurn(game.history[dates[i]]));
			for(let j = 0; j < turns.length; j++){
				turn_queue.addTurn(turns[j], false);
			}
		}
	}

	function createTurnListener(){
		let turn_first_call = true;
		firebase.database().ref("/game/turn").on('value', (snapshot) => {
			if(turn_first_call){
				turn_first_call = false;
				let turns = expandTurn(decodeTurn(snapshot.val()));
				for(let i = 0; i < turns.length; i++){
					turn_queue.addTurn(turns[i], (i == turns.length - 1));
				}
			}
			else{
				turn_queue.addTurn(decodeTurn(snapshot.val()), true);
			}
		});
	}

	function getRoom(player){
		//this iteration excludes the cloak room
		for(let i = 0; i < rooms.length; i++){
			if(players[player].location.row == map_room_coords[i].row && players[player].location.col == map_room_coords[i].col){
				return i;
			}
		}
		return -1;
	}

	function generateDesiredGuess(){
		let possible_guesses = {0: [], 1: [], 2: []};
		for(let i = 0; i < clues.length; i++){
			let found = false;
			for(let j = 1; j < players.length; j++){
				if(boxes[(current_player + j) % players.length][i].status == 1){
					found = true;
				}
			}
			if(!found){
				if(i < suspects.length){
					possible_guesses[0].push(i);
				}
				else if(i < suspects.length + weapons.length){
					possible_guesses[1].push(i);
				}
				else{
					possible_guesses[2].push(i);
				}
			}
		}
		let guess = [];
		for(let i = 0; i < 3; i++){
			guess.push(possible_guesses[i][Math.floor(Math.random() * possible_guesses[i].length)]);
		}
		return guess;
	}

	function getAnswer(){
		let possible_guesses = {0: [], 1: [], 2: []};
		for(let i = 0; i < clues.length; i++){
			let found = false;
			for(let j = 0; j < players.length; j++){
				if(boxes[j][i].status == 1){
					found = true;
				}
			}
			if(!found){
				if(i < suspects.length){
					possible_guesses[0].push(i);
				}
				else if(i < suspects.length + weapons.length){
					possible_guesses[1].push(i);
				}
				else{
					possible_guesses[2].push(i);
				}
			}
		}
		for(let i = 0; i < 3; i++){
			if(possible_guesses[i].length != 1){
				return [suspects.length, suspects.length + weapons.length, clues.length];
			}
		}
		return [possible_guesses[0][0], possible_guesses[1][0], possible_guesses[2][0]];
	}

	function updateTurn(turn, pause){
		console.log("Updating turn: player " + turn.player + ", phase " + turn.phase);
		let showing_player = getPlayerFromCard(turn.shown);

		switch(turn.phase){
		case -3:
			if(current_player == turn.player && pause){
				setTimeout(function(){
					desired_guess = generateDesiredGuess();
					if(players[current_player].was_moved && getRoom(current_player) == desired_guess[2] - suspects.length - weapons.length){
						updateTurnFirebase(encodeTurn(turn.player, -1, turn.roll, [], clues.length, getRoom(turn.player)));
					}
					else{
						turn.roll = 2 + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6);
						updateTurnFirebase(encodeTurn(turn.player, -2, turn.roll, [], clues.length, map_rooms));
					}
					turn_queue.remove();
				}, 500);
			}
			else{
				turn_queue.remove();
			}
			break;
		case -2:
			if(current_player == turn.player){
				if(pause){
					setTimeout(function(){
						let possible_rooms = [];
						let scores = [];
						for(let i = 0; i < rooms.length; i++){
							if(map_data[players[current_player].location.row][players[current_player].location.col].dists[i] > 0){
								possible_rooms.push(i);
								scores.push(0);
							}
						}
						let sum = 0;
						for(let i = 0; i < possible_rooms.length; i++){
							let found = false;
							for(let j = 1; j < players.length; j++){
								if(boxes[(current_player + j) % players.length][suspects.length + weapons.length + possible_rooms[i]].status == 1){
									scores[i] = j;
									found = true;
									j = players.length;
								}
							}
							if(!found){
								if(map_data[players[current_player].location.row][players[current_player].location.col].dists[possible_rooms[i]] <= turn.roll){
									scores[i] = 3000 * players.length;
								}
								else{
									scores[i] = 30 * players.length;
								}
							}
							sum += scores[i];
							console.log(clues[possible_rooms[i] + suspects.length + weapons.length] + " with score: " + scores[i]);
						}
						let choice = Math.random() * sum;
						sum = 0;
						let desired_room = -1;
						for(let i = 0; i < possible_rooms.length; i++){
							sum += scores[i];
							if(sum > choice){
								desired_room = possible_rooms[i];
								i = possible_rooms.length;
							}
						}
						console.log("Selected " + clues[desired_room + suspects.length + weapons.length]);
						updateMap(current_player, calculatePath(current_player, turn.roll, desired_room));
						if(getRoom(current_player) == -1){
							updateTurnFirebase(encodeTurn(turn.player, players.length, turn.roll, [], clues.length, desired_room));
						}
						else{
							updateTurnFirebase(encodeTurn(turn.player, -1, turn.roll, [], clues.length, desired_room));
						}
					}, 1000);
				}
				else{
					updateMap(turn.player, calculatePath(turn.player, turn.roll, turn.map_room));
					turn_queue.remove();
				}
			}
			else{
				turn_queue.remove();
			}
			break;
		case -1:
			if(current_player == turn.player && pause){
				setTimeout(function(){
					desired_guess = generateDesiredGuess();
					let room_index = getRoom(current_player);
					desired_guess[2] = room_index + suspects.length + weapons.length;
					console.log(desired_guess);
					updateTurnFirebase(encodeTurn(turn.player, (current_player + 1) % players.length, turn.roll, [desired_guess[0], desired_guess[1], desired_guess[2]], clues.length, turn.map_room));
					turn_queue.remove();
				}, 1000);
			}
			else if(current_player != turn.player){
				updateMap(turn.player, calculatePath(turn.player, turn.roll, turn.map_room));
				turn_queue.remove();
			}
			else{
				turn_queue.remove();
			}
			break;
		case players.length:
			if(current_player == turn.player && pause){
				let guess = getAnswer();
				if(guess[0] == suspects.length){
					setTimeout(function(){
						firebase.database().ref("/game/history/" + Date.now()).set(encodeTurn(turn.player, turn.phase, turn.roll, turn.guess, turn.shown, turn.map_room));
						passTurn();
					}, 1000);
				}
				else{
					setTimeout(function(){
						for(let i = 0; i < 3; i++){
							if(guess[i] != answers[i]){
								firebase.database().ref("/game/history/" + Date.now()).set(encodeTurn(turn.player, turn.phase, turn.roll, turn.guess, turn.shown, turn.map_room));
								updateTurnFirebase(encodeTurn(turn.player, players.length + 1, turn.roll, guess, -1, map_rooms));
								turn_queue.remove();
								return;
							}
						}
						firebase.database().ref("/game/status").set(current_player);
					}, 4000);
				}
			}	
			else if(current_player != turn.player && turn.guess[0] == suspects.length){
				updateMap(turn.player, calculatePath(turn.player, turn.roll, turn.map_room));
				turn_queue.remove();
			}
			else{
				turn_queue.remove();
			}
			break;
		case (players.length + 1):
			players[turn.player].final_guess = true;
			if(current_player == turn.player && pause){
				setTimeout(function(){
					firebase.database().ref("/game/history/" + Date.now()).set(encodeTurn(turn.player, players.length + 1, turn.roll, turn.guess, -1, map_rooms));
					passTurn(turn);
					turn_queue.remove();
				}, 1000);
			}
			else{
				turn_queue.remove();
			}
			break;
		default:
			if(turn.phase == (turn.player + 1) % players.length){
				for(let i = 0; i < players.length; i++){
					if(players[i].character == turn.guess[0]){
						let room_coord = map_room_coords[turn.guess[2] - suspects.length - weapons.length]
						if(players[i].location.row != room_coord.row || players[i].location.col != room_coord.col){
							updateMap(i, room_coord);
							players[i].was_moved = true;
						}
						i = players.length;
					}
				}
			}
			if(current_player == turn.player){
				turn_queue.remove();
			}
			else if(turn.phase == current_player && pause){
				let valid_responses = [];
				for(let i = 0; i < players[current_player].hand.length; i++){
					for(let j = 0; j < 3; j++){
						if(players[current_player].hand[i] == turn.guess[j]){
							valid_responses.push(turn.guess[j]);
						}
					}
				}
				console.log("valid responses: ", valid_responses);
				if(valid_responses.length == 0){
					setTimeout(function(){
						let next_phase = (turn.phase + 1) % players.length;
						if(next_phase == turn.player){
							next_phase = players.length;
						}
						updateTurnFirebase(encodeTurn(turn.player, next_phase, turn.roll, turn.guess, clues.length, turn.map_room));
						turn_queue.remove();
					}, 1000);
				}
				else{
					let current_response = valid_responses[Math.floor(Math.random() * valid_responses.length)];
					let better_responses = [];
					for(let i = 0; i < players.length; i++){
						for(let j = 0; j < valid_responses.length; j++){
							if(boxes[(turn.player + i) % players.length][valid_responses[j]].status == 3){
								better_responses.push(valid_responses[j]);
							}
						}
						if(better_responses.length > 0){
							console.log("Better Responses with player " + ((turn.player + i) % players.length) + ": ", better_responses);
							current_response = better_responses[Math.floor(Math.random() * better_responses.length)];
							i = players.length;
						}
					}
					setTimeout(function(){
						console.log("Showing card " + current_response);
						updateTurnFirebase(encodeTurn(turn.player, players.length, turn.roll, turn.guess, current_response, turn.map_room));
						turn_queue.remove();
					}, 1000);
				}
			}
			else{
				turn_queue.remove();
			}
			break;
		}
	}

	function passTurn(turn){
		for(let i = 0; i < players.length; i++){
			let next_player = (current_player + 1 + i) % players.length;
			if(!players[next_player].final_guess){
				updateTurnFirebase(encodeTurn(next_player, -3, 2, [], -1, map_rooms));
				turn_queue.remove();
				return;
			}
		}
	}
	


	function checkChart(queue){
		//Check for max hand size of other players, fully white rows, if something is already the answer
		for(let i = 0; i < players.length; i++){
			let hand = 0;
			let all_tags = new Set();
			for(let j = 0; j < clues.length; j++){
				if(boxes[i][j].status == 1){
					hand++;
				}
				for(let tag of boxes[i][j].tags){
					all_tags.add(tag);
				}
			}
			let counted_tags = new Set();
			for(let tag of all_tags){
				let overlap = false;
				for(let id of active_tags[tag]){
					let xy = id.split("d");
					xy[0] = parseInt(xy[0]);
					xy[1] = parseInt(xy[1]);
					for(let tag1 of counted_tags){
						if(boxes[xy[0]][xy[1]].tags.has(tag1)){
							overlap = true;
						}
					}
				}
				if(!overlap){
					counted_tags.add(tag);
				}
			}
			if(hand + counted_tags.size == players[i].hand.length){
				let add_pause = true;
				for(let j = 0; j < clues.length; j++){
					if(boxes[i][j].status == 2 && boxes[i][j].tags.size == 0){
						queue.push([i, j, 0]);
					}
				}
			}
		}
		for(let i = 0; i < players.length; i++){
			let hand = clues.length;
			for(let j = 0; j < clues.length; j++){
				if(boxes[i][j].status == 0){
					hand--;
				}
			}
			if(hand == players[i].hand.length){
				let add_pause = true;
				for(let j = 0; j < clues.length; j++){
					if(boxes[i][j].status == 2){
						queue.push([i, j, 1]);
					}
				}
			}
		}
		for(let i = 0; i < clues.length; i++){
			let answer = true;
			let not_answer = false;
			for(let j = 0; j < players.length; j++){
				if(boxes[j][i].status != 0){
					answer = false;
				}
				if(boxes[j][i].status == 1){
					not_answer = true;
				}
			}
			let new_status;
			if(answer){
				new_status = 0;
				//if one suspect is the answer, then some player must have every other suspect
				let start, end;
				if(i < suspects.length){
					start = 0;
					end = suspects.length;
				}
				else if(i < weapons.length + suspects.length){
					start = suspects.length;
					end = suspects.length + weapons.length;
				}
				else{
					start = suspects.length + weapons.length;
					end = clues.length;
				}
				for(let j = start; j < end; j++){
					let num_unknown = 0;
					let player_unknown = -1;
					for(let k = 0; k < players.length; k++){
						if(boxes[k][j].status == 1){
							player_unknown = -1;
							num_unknown = -1;
							k = players.length;
						}
						else if(boxes[k][j].status == 2){
							num_unknown++;
							player_unknown = k;
						}
					}
					if(num_unknown == 1 && player_unknown != -1){
						queue.push([player_unknown, j, 1]);
					}
				}
			}
		}
		if(queue.length > 0){
			updateChartQueue(queue);
			return;
		}
		turn_queue.remove();
	}

	function updateChartQueueBackend(queue, pause){
		if(queue[0].length == 3){
			let box = boxes[queue[0][0]][queue[0][1]];
			if(box.status == queue[0][2]){
				queue.splice(0, 1);
				updateChartQueue(queue);
				return;
			}
			box.status = queue[0][2];
			if(box.status == 1){
				for(let tag of box.tags){
					active_tags[tag].delete(box.id);
					for(let id of active_tags[tag]){
						let xy = id.split("d");
						xy[0] = parseInt(xy[0]);
						xy[1] = parseInt(xy[1]);
						boxes[xy[0]][xy[1]].tags.delete(tag);
					}
					active_tags[tag].clear();
				}
				box.tags.clear();
				for(let i = 1; i < players.length; i++){
					let index = (queue[0][0] + i) % players.length;
					if(boxes[index][queue[0][1]].status == 2){
						queue.push([index, queue[0][1], 0]);
					}
				}
			}
			else if(box.status == 0){
				for(let tag of box.tags){
					active_tags[tag].delete(box.id);
					if(active_tags[tag].size == 1){
						for(let id of active_tags[tag]){
							let xy = id.split("d");
							xy[0] = parseInt(xy[0]);
							xy[1] = parseInt(xy[1]);
							queue.push([xy[0], xy[1], 1]);
						}
					}
				}
				box.tags.clear();
			}
		}
		else{
			let available_boxes = 0;
			for(let i = 1; i < 4; i++){
				if(boxes[queue[0][0]][queue[0][i]].status == 1){
					available_boxes = -1;
					i = 4;
				}
				else if(boxes[queue[0][0]][queue[0][i]].status == 2){
					available_boxes++;
				}
			}
			if(available_boxes == -1){
				queue.splice(0, 1);
				updateChartQueue(queue);
				return;
			}
			else if(available_boxes == 1){
				for(let i = 1; i < 4; i++){
					if(boxes[queue[0][0]][queue[0][i]].status == 2){
						queue.push([queue[0][0], queue[0][i], 1]);
						queue.splice(0, 1);
						updateChartQueue(queue);
						return;
					}
				}
			}
			current_tag = String.fromCharCode(97 + (current_tag_index % 26));
			if(current_tag_index >= 26){
				current_tag = current_tag + Math.floor(current_tag_index / 26);
			}
			current_tag_index++;
			active_tags[current_tag] = new Set();
			for(let i = 1; i < 4; i++){
				let box = boxes[queue[0][0]][queue[0][i]];
				if(box.status == 2){
					box.tags.add(current_tag);
					active_tags[current_tag].add(box.id);
				}
			}
		}
		queue.splice(0, 1);
		updateChartQueue(queue);
		return;
	}

	function updateChartQueue(queue){
		console.log("\tQueue length: ", queue.length);
		if(queue.length == 0){
			checkChart(queue);
			return;
		}
		updateChartQueueBackend(queue);
	}






	let map_raw_text =  `x,x,x,x,x,x,x,x,x,t5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
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

		let passages = {"t7": {dest: "t2"},
						"t2": {dest: "t7"},
						"t4": {dest: "t10"},
						"t10": {dest: "t4"},
						"p-": {dest: "p+"},
						"p+": {dest: "p-"}};


		let rows = map_raw_text.split("\n");
		for(let row = 0; row < rows.length; row++){
			let cols = rows[row].split(",");
			map_data[row] = [];
			for(let col = 0; col < cols.length; col++){
				let value = cols[col];
				if(value in passages){
					passages[value].row = row;
					passages[value].col = col;
				}
				map_data[row][col] = {"value": value, "movable": /^[tsdp]$/.test(value[0])};
			}
		}

		
		//get t and d coords
		let tcoords = {};
		let dcoords = {};
		for(let row = 0; row < map_data.length; row++){
			for(let col = 0; col < map_data[row].length; col++){
				if(map_data[row][col].value[0] == "t"){
					tcoords[map_data[row][col].value] = {"row": row, "col": col};
				}
				else if(map_data[row][col].value[0] == "d"){
					let key = map_data[row][col].value;
					if(!(key in dcoords)){
						dcoords[key] = [];
					}
					dcoords[key].push({"row": row, "col": col});
				}
			}
		}
		//get move possibilities
		for(let row = 0; row < map_data.length; row++){
			for(let col = 0; col < map_data[row].length; col++){
				if(map_data[row][col].movable){
					let value = map_data[row][col].value;
					let moves = [];
					if(value in passages){
						let dest = passages[value].dest;
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
		for(let key in tcoords){
			let room_index = parseInt(key.substring(1));
			let queue = [];
			queue.push({"row": tcoords[key].row, "col": tcoords[key].col, "prevdist": -1});
			while(queue.length > 0){
				let row = queue[0].row;
				let col = queue[0].col;
				let prevdist = queue.shift().prevdist;
				if(!(room_index in map_data[row][col].dists) || prevdist + 1 < map_data[row][col].dists[room_index]){
					map_data[row][col].dists[room_index] = prevdist + 1;
					let moves = map_data[row][col].moves;
					for(let i = 0; i < moves.length; i++){
						queue.push({"row": moves[i].row, "col": moves[i].col, "prevdist": prevdist + 1});
					}
				}

			}

		}
		configurePlayers();
		createMapTable();
	}

	let map_room_coords;

	function updateMap(player, new_location, draw){
		console.log("updating map for player " + player);
		if(!("location" in players[player])){
			players[player].location = new_location;
			map_data[players[player].location.row][players[player].location.col].players.add(player);
		}
		else{
			let old_row = players[player].location.row, old_col = players[player].location.col;
			if(old_row != new_location.row || old_col != new_location.col){
				map_data[old_row][old_col].players.delete(player);
				players[player].location = new_location;
				map_data[players[player].location.row][players[player].location.col].players.add(player);
			}
		}
	}

	function configurePlayers(){
		for(let row = 0; row < map_data.length; row++){
			for(let col = 0; col < map_data[row].length; col++){
				if(map_data[row][col].movable){
					map_data[row][col].players = new Set();
				}
			}
		}
	}

	function createMapTable(){
		map_room_coords = {};
		let room_index;
		for(let row = 0; row < map_data.length; row++){
			for(let col = 0; col < map_data[row].length; col++){
				if(map_data[row][col].value[0] == "t"){
					room_index = parseInt(map_data[row][col].value.substring(1));
					map_room_coords[room_index] = {"row": row, "col": col};
				}
			}
		}
	}

	function calculatePath(player, roll, room_index){
		console.log("calculating path");
		let row = players[player].location.row;
		let col = players[player].location.col;
		if(map_room_coords[room_index].row == row && map_room_coords[room_index].col == col){
			return {"row": row, "col": col};
		}
		for(let i = 0; i < roll; i++){
			if(map_data[row][col].dists[room_index] == 0){
				return {"row": row, "col": col};
			}
			else{
				let min_dist = 100;
				let move, best_move = null;
				for(let j = 0; j < map_data[row][col].moves.length; j++){
					move = map_data[row][col].moves[j];
					if(map_data[move.row][move.col].dists[room_index] <= min_dist || best_move == null){
						if(map_data[move.row][move.col].dists[room_index] < min_dist || map_data[move.row][move.col].players.size <= map_data[best_move.row][best_move.col].players.size){
							min_dist = map_data[move.row][move.col].dists[room_index];
							best_move = move;
						}
					}
				}
				if(i == roll - 1 && map_data[best_move.row][best_move.col].players.size > 0){
					if(map_data[best_move.row][best_move.col].value[0] != "t"){
						return {"row": row, "col": col};
					}
				}
				row = best_move.row;
				col = best_move.col;
				if(min_dist == 0 || i == roll - 1){
					return {"row": row, "col": col};
				}
			}
		}
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


	function updateTurnFirebase(encoded_turn){
		turn_queue.remove();
		firebase.database().ref("/game/turn").set(encoded_turn);
	}

	function decodeTurn(turn_data){
		let temp = {};
		temp.shown = turn_data % (clues.length + 1);
		turn_data = (turn_data - temp.shown) / (clues.length + 1);
		temp.map_room = turn_data % (map_rooms + 1);
		turn_data = (turn_data - temp.map_room) / (map_rooms + 1);
		temp.roll = turn_data % 11 + 2;
		turn_data = (turn_data - (temp.roll - 2)) / 11;
		temp.guess = [];
		temp.guess[2] = turn_data % (rooms.length + 1);
		turn_data = (turn_data - temp.guess[2]) / (rooms.length + 1);
		temp.guess[1] = turn_data % (weapons.length + 1);
		turn_data = (turn_data - temp.guess[1]) / (weapons.length + 1);
		temp.guess[0] = turn_data % (suspects.length + 1);
		turn_data = (turn_data - temp.guess[0]) / (suspects.length + 1);
		temp.phase = turn_data % (5 + players.length) - 3;
		turn_data = (turn_data - (temp.phase + 3)) / (5 + players.length);
		temp.player = turn_data;
		temp.guess[2] += suspects.length + weapons.length;
		temp.guess[1] += suspects.length;
		return temp;
	}

	function createTurn(player, phase, roll, guess, shown, map_room){
		if(guess.length == 0){
			guess = [suspects.length, weapons.length, rooms.length];
		}
		else{
			guess = [guess[0], guess[1], guess[2]];
		}
		return {"player": player, "phase": phase, "roll": roll, "guess": guess, "shown": shown, "map_room": map_room};
	}

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
		let data = (((((player * (5 + players.length)) + phase + 3) * (suspects.length + 1) + guess[0]) * (weapons.length + 1) + guess[1]) * (rooms.length + 1) + guess[2]);
		return ((data * 11 + roll - 2) * (map_rooms + 1) + map_room) * (clues.length + 1) + shown;
	}

	function expandTurn(turn){
		console.log("Expanding ", turn);
		let turns = [];
		let showing_player = getPlayerFromCard(turn.shown);
		console.log("Showing player ", showing_player);
		if(turn.phase == players.length + 1){
			turns.push(createTurn(turn.player, turn.phase, turn.roll, turn.guess, turn.shown, turn.map_room));
			console.log(turns);
			return turns;
		}
		if(turn.phase > -3){
			turns.push(createTurn(turn.player, -3, turn.roll, [], clues.length, map_rooms));
		}
		if(turn.phase > -2){
			turns.push(createTurn(turn.player, -2, turn.roll, [], clues.length, turn.map_room));
		}
		if(turn.phase > -1 && !(turn.phase == players.length && turn.guess[0] == suspects.length)){
			turns.push(createTurn(turn.player, -1, turn.roll, [], clues.length, turn.map_room));
			let index = 1;
			while(index < players.length){
				let phase = (turn.player + index) % players.length;
				if(phase == turn.phase || ((turn.player + index - 1) % players.length) == showing_player){
					index = players.length;
				}
				else{
					turns.push(createTurn(turn.player, phase, turn.roll, turn.guess, clues.length, turn.map_room));
					index++;
				}
			}
		}
		turns.push(createTurn(turn.player, turn.phase, turn.roll, turn.guess, turn.shown, turn.map_room));
		console.log(turns);
		return turns;
	}
	

	function getPlayerFromCard(shown){
		if(shown == clues.length){
			return -1;
		}
		for(let i = 0; i < players.length; i++){
			for(let j = 0; j < players[i].hand.length; j++){
				if(shown == players[i].hand[j]){
					return i;
				}
			}
		}
	}
	createPage(DATA);
}