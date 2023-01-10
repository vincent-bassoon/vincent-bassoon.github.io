var countDownDate = new Date("Mar 28, 2023 18:00:00 GMT-0500").getTime();
var done = false;

var x = setInterval(function() {
	var now = new Date().getTime();
	var distance = countDownDate - now;

	if (distance < 0) {
		clearInterval(x);
		document.getElementById("timer").innerHTML = "The Clam Has Landed";
		done = true;
		document.getElementById("loading-container").style.opacity = 1;
		return;
	}
	else{
		var units = {};
		units[0] = Math.floor(distance / (1000 * 60 * 60 * 24));
		units[1] = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		units[2] = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
		units[3] = Math.floor((distance % (1000 * 60)) / 1000);

		names = ["day", "hour", "minute", "second"];
		var display = "";
		for(var i = 0; i < 4; i++){
			display += units[i] + " " + names[i];
			if(units[i] != 1){
				display += "s";
			}
			if(i != 3){
				display += ", ";
			}
		}

		document.getElementById("timer").innerHTML = "The Clam will arrive in <p></p><p></p> " + display + "<p></p><p></p>";
	}
	if(!done){
		done = true;
		document.getElementById("loading-container").style.opacity = 1;
	}
}, 1000);
