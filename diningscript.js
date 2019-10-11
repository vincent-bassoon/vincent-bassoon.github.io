function accessWeb(){
  var x = new XMLHttpRequest();
	x.open("GET", "http://dining.rice.edu/undergraduate-dining/college-serveries/weekly-menus/");
	x.onreadystatechange = function(){
		if(x.readyState == 4 && x.status == 200){
  		     console.log(x.responseText);
 		}
	};
	x.send(null);
}
