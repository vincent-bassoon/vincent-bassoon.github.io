var firebaseConfig = {
	apiKey: "AIzaSyDLaFMHhQ8uEr6_jQm7xFp3vMe9CM-dQ8k",
	authDomain: "bingo-1a701.firebaseapp.com",
	databaseURL: "https://bingo-1a701.firebaseio.com",
	projectId: "bingo-1a701",
	storageBucket: "bingo-1a701.appspot.com",
	messagingSenderId: "147839705128",
	appId: "1:147839705128:web:3e5b336258561124ef151d",
	measurementId: "G-NE327E9M0P"
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

function openOverlay() {
	document.getElementById("overlay").style.display = "block";
}

function closeOverlay() {
	document.getElementById("overlay").style.display = "none";
}

function check_line(buttons, start, increment){
	for(var i = 0; i < 5; i++){
		if(start != 12 && !buttons[start].classList.contains("activeSpace")){
			return false;
		}
		start += increment;
	}
	return true;
}

function check_win(buttons, button_num){
	var x_num = button_num % 5;
	var y_num = button_num - x_num;
	if(check_line(buttons, x_num, 5)){
		return true;
	}
	if(check_line(buttons, y_num, 1)){
		return true;
	}
	if(button_num % 6 == 0 && check_line(buttons, 0, 6)){
		return true;
	}
	if(button_num > 0 && button_num % 4 == 0 && check_line(buttons, 4, 4)){
		return true;
	}
	return false;
}

function fail(text){
	document.getElementsByClassName("overlay-content")[0].children[0].innerText = text;
	openOverlay();
}

function get_data(){
	firebase.database().ref('spaces').once('value').then(function(snapshot){
		var data = snapshot.val();
		if(data != null){
			run(data);
		}
		else{
			fail("No Data Found");
		}
	}, function(error){
		fail("Cannot Access Data");
	});
}

function run(data){
	if(data.length < 25){
		var og_data_length = data.length;
		for(var i = 0; i < 25 - og_data_length; i++){
			data.push(data[Math.floor(Math.random() * og_data_length)]);
		}
	}
	var buttons = [];
	for(var x = 0; x < 5; x++){
		for(var y = 0; y < 5; y++){
			buttons[5 * x + y] = document.getElementById(x + "" + y + "button");
			if(x == 2 && y == 2){
				buttons[5 * x + y].innerText = "Free Space";
				buttons[5 * x + y].classList.toggle("activeCenter");
			}
			else{
				buttons[5 * x + y].innerText = data.splice(Math.floor(Math.random() * data.length), 1);
				buttons[5 * x + y].addEventListener("click", function(){
					this.classList.toggle("activeSpace");
					if(check_win(buttons, this.num)){
						openOverlay();
					}
				});
			}
		}
	}
}

get_data();
