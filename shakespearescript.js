function byte_pairs(dict){
    
}


function get_words(dict){
    var dict = {};
    var done = [];
    var search_key = "Numbers indicate the total occurences of each word form.";
    for(var i = 0; i < 26; i++){
        done[i] = false;
        var x = new XMLHttpRequest();
    	x.open("GET", "https://cors-anywhere.herokuapp.com/https://www.opensourceshakespeare.org/concordance/wordformlist.php?Letter=" + 
           String.fromCharCode(i + 65) + "&pleasewait=1&msg=sr");
    	x.onreadystatechange = function(){
	    	if(x.readyState == 4 && x.status == 200){
	    		var text = new DOMParser().parseFromString(x.responseText, "text/html").documentElement.innerText;
                text = text.substring(text.indexOf(search_key) + search_key.length);
                var start = 0;
                var end = 0;
                var line;
                var letter = String.fromCharCode(i + 97);
                while((end = text.indexOf("\n", start)) !== -1){
                    line = text.substring(start, end);
                    if(text.charAt(0) == letter){
                        var index = text.indexOf(" (");
                        dict[text.substring(0, index)] = parseInt(text.substring(index + 2, text.length - 1));
                    }
                    start = end + 1;
                }
                done[i] = true;
                for(var i = 0; i < 26; i++){
                    if(!(i in done || done[i])){
                        return;
                    }
                }
                byte_pairs(dict);
	    	}
	    };
	    x.send(null);
    }
}
