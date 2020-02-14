function openOverlay() {
	document.getElementById("overlay").style.display = "block";
}

function closeOverlay() {
	document.getElementById("overlay").style.display = "none";
}

function check_line(buttons, start, increment){
	for(var i = 0; i < 5; i++){
		if(start != 12 && buttons[start].classList.contains("activeSpace")){
			return false;
		}
		start += increment;
	}
	return true;
}

function check_win(buttons){
	for(var i = 0; i < 5; i++){
		if(check_line(buttons, i, 5)){
			return true;
		}
		if(check_line(buttons, 5 * i, 1)){
			return true;
		}
	}
	if(check_line(buttons, 0, 6)){
		return true;
	}
	if(check_line(buttons, 4, 4)){
		return true;
	}
}

function run(){
	var buttons = [];
	for(var x = 0; x < 5; x++){
		for(var y = 0; y < 5; y++){
			buttons[5 * x + y] = document.getElementById(x + "" + y + "button");
			if(x == 2 && y == 2){
				buttons[5 * x + y].classList.toggle("activeCenter");
			}
			else{
				buttons[5 * x + y].addEventListener("click", function(){
					this.classList.toggle("activeSpace");
					if(check_win(buttons)){
						openOverlay();
					}
				});
			}
		}
	}
}

run();
