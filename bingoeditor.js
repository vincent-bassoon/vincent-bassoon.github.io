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
			buttons[5 * y + x] = document.getElementById(x + "" + y + "button");
			if(x == 2 && y == 2){
				var container = document.createElement("span");
				container.innerText = "Free Space";
				buttons[5 * y + x].appendChild(container);
				buttons[5 * y + x].classList.toggle("activeCenter");
			}
			else{
				var container = document.createElement("span");
				container.innerText = data.splice(Math.floor(Math.random() * data.length), 1);
				buttons[5 * y + x].appendChild(container);
				buttons[5 * y + x].addEventListener("click", function(){
					this.classList.toggle("activeSpace");
					if(check_win(buttons, this.dataset.num)){
						openOverlay();
					}
				});
			}
		}
	}
	$('.boardSpace').textfill({});
}

get_data();
