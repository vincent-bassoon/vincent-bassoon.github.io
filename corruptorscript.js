function byte_pairs(dict){
    console.log(dict);
}

function process(text, dict, done, letter_index){
	var data = text.split(")");
	var temp;
	data.splice(data.length - 1, 1);
	for(var i = 0; i < data.length; i++){
		temp = data[i].split(" (");
		dict[temp[0]] = parseInt(temp[1]);
	}
	done[letter_index] = true;
	for(var i = 0; i < 26; i++){
		if(!(i in done && done[i])){
			return;
		}
	}
	byte_pairs(dict);
}

function get_words(){
	var dict = {};
	var done = [];
	var start_key = "of each word form.";
	var end_key = "Back to the concordance menu";
	for(var i = 0; i < 26; i++){
		done[i] = false;
		var x = new XMLHttpRequest();
		x.open("GET", "https://cors-anywhere.herokuapp.com/https://www.opensourceshakespeare.org/concordance/wordformlist.php?Letter=" + 
			   String.fromCharCode(i + 65) + "&pleasewait=1&msg=sr");
		x.onreadystatechange = function(){
			console.log(String.fromCharCode(i + 65), "ATTEMPT");
			if(x.readyState == 4 && x.status == 200){
				console.log(String.fromCharCode(i + 65), "SUCCESS");
				var text = new DOMParser().parseFromString(x.responseText, "text/html").documentElement.innerText;
				text = text.substring(text.indexOf(start_key) + start_key.length, text.indexOf(end_key)).trim();
                process(text, dict, done, i);
	    	}
	    };
	    x.send(null);
    }
}
