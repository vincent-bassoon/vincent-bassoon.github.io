var firebaseConfig = {
    apiKey: "AIzaSyD9njoN659jBaO-Ov6sQI33Q5xi9kRl3jw",
    authDomain: "clue-51aa1.firebaseapp.com",
    databaseURL: "https://clue-51aa1-default-rtdb.firebaseio.com",
    projectId: "clue-51aa1",
    storageBucket: "clue-51aa1.appspot.com",
    appId: "1:314308110149:web:73d763dd4c6d554714802c",
    measurementId: "G-092MCPQDB9"
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

function main_function(){
	var players = ["c", "t", "j", "v"];
	var suspects = ["Col. Mustard", "Prof. Plum", "Mr. Green", "Mrs. Peacock", "Miss Scarlet", "Mrs. White", "Mme. Rose", "Sgt. Gray", "M. Brunette", "Miss Peach"];
	var weapons = ["Knife", "Candlestick", "Revolver", "Rope", "Lead Pipe", "Wrench", "Poison", "Horseshoe", "Frying Pan"];
	var rooms = ["Courtyard", "Gazebo", "Drawing Room", "Dining Room", "Kitchen", "Carriage House", "Trophy Room", "Conservatory", "Studio", "Billiard Room", "Library", "Fountain"];
	var clues = [];
	clues.push(...suspects);
	clues.push(...weapons);
	clues.push(...rooms);

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

		var hands = {"answer": []};
		hands.answer.push(Math.floor(Math.random() * suspects.length));
		hands.answer.push(suspects.length + Math.floor(Math.random() * weapons.length));
		hands.answer.push(suspects.length + weapons.length + Math.floor(Math.random() * rooms.length));
		var cards = [];
		for(var i = 0; i < 31; i++){
			cards.push(i);
		}
		for(var i = 0; i < 3; i++){
			cards.splice(hands.answer[2 - i], 1);
		}
		shuffle(cards);
		for(var i = 0; i < 4; i++){
			hands[players[i]] = cards.splice(0, 7);
		}
		hands["status"] = Date.now();
		console.log(hands);
		firebase.database().ref("/game").set(hands);

		setTimeout(function(){
			reset_button.innerText = "Start New Game";
			reset_button.onclick = reset;
		}, 500);
	};

}

main_function();