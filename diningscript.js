var PANELS = {};
var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
var SERVERIES = ["baker", "north", "west", "south", "seibel", "sid"];
var TEST_ORDER = [3, 4, 5, 6, 0, 1, 2];
var LUNCH_BUTTON = document.getElementById("Lunch");
var DINNER_BUTTON = document.getElementById("Dinner");

var FINAL_MENU = {};


function initialize(){
	for(var i = 0; i < SERVERIES.length; i++){
		FINAL_MENU[SERVERIES[i]] = {};
		FINAL_MENU[SERVERIES[i]]["Lunch"] = [];
		FINAL_MENU[SERVERIES[i]]["Dinner"] = [];
	}
	LUNCH_BUTTON.classList.toggle("active");
	for(var i = 0; i < SERVERIES.length; i++){
		PANELS[SERVERIES[i]] = document.getElementById(SERVERIES[i] + " panel");
	}
	var acc = document.getElementsByClassName("accordion");
	for(var i = 0; i < acc.length; i++) {
		acc[i].classList.toggle("active");
		acc[i].addEventListener("click", function() {
			this.classList.toggle("active");
			var panel = this.nextElementSibling;
			if (panel.style.display === "block") {
				panel.style.display = "none";
			}
			else {
				panel.style.display = "block";
			}
		});
	}
}

function accessWeb(){
 	var x = new XMLHttpRequest();
	x.open("GET", "https://cors-anywhere.herokuapp.com/http://dining.rice.edu/undergraduate-dining/college-serveries/weekly-menus/");
	x.onreadystatechange = function(){
		if(x.readyState == 4 && x.status == 200){
  			links = new DOMParser().parseFromString(x.responseText, "text/html").links;
  			for(var i = 0; i < links.length; i++){
  				if(links[i].href.substring(links[i].href.length - 4) == ".pdf"){
					accessMenu("https://cors-anywhere.herokuapp.com/" + links[i].href);
				}
			}
		}
	};
	x.send(null);
}

function valid_menu_item(text){
	text = text.trim();
	if(text.includes("=")){
		return false;
	}
	if(text.length <= 3){
		return false;
	}
	if(text == "Lunch Menu" || text == "Dinner Menu"){
		return false;
	}
	for(var j = 0; j < 7; j++){
		if(text == DAYS[j]){
			return false;
		}
	}
	if(!/[a-z]/i.test(text)){
		return false;
	}
	return true;
}

function update_all(meal, element){
	var day = 0;
	if(meal == "Lunch" && !LUNCH_BUTTON.classList.contains("active")){
		LUNCH_BUTTON.classList.toggle("active");
		for(var i = 0; i < SERVERIES.length; i++){
			update_panel(SERVERIES[i], meal, day);
		}
	}
	else if(meal == "Dinner" && !DINNER_BUTTON.classList.contains("active")){
		DINNER_BUTTON.classList.toggle("active");
		for(var i = 0; i < SERVERIES.length; i++){
			update_panel(SERVERIES[i], meal, day);
		}
	}
}

function update_panel(servery, meal, day){
	if(FINAL_MENU[servery][meal][day].length = 0){
		PANELS[servery].innerHTML = "Closed";
	}
	else{
		PANELS[servery].innerHTML = FINAL_MENU[servery][meal][day].join("<br />");
	}
}

function initialize_panel(servery, meal){
	var day = 0;
	if(meal == "Lunch" && !LUNCH_BUTTON.classList.contains("active")){
		update_panel(servery, meal, day);
	}
	else if(meal == "Dinner" && !DINNER_BUTTON.classList.contains("active")){
		update_panel(servery, meal, day);
	}
}

function accessMenu(url){
	var servery;
	for(var i = 0; i < SERVERIES.length; i++){
		if(url.toLowerCase().includes(SERVERIES[i])){
			servery = SERVERIES[i];
			i = SERVERIES.length;
		}
	}
	var pdfjsLib = window['pdfjs-dist/build/pdf'];
	pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';
	var loadingTask = pdfjsLib.getDocument(url);
	loadingTask.promise.then(function(pdf){
		console.log('PDF loaded');
		for(var pageNumber = 2; pageNumber <= 3; pageNumber++){
			pdf.getPage(pageNumber).then(function(page){
				page.getTextContent().then(function(textContent){
					textContent = textContent.items;
					var menu = [[], [], [], [], [], [], []];
					var x = [];
					var y = [];
					var meal = "NONE";
					var days = [];
					for(var i = 0; i < 7; i++){
						days.push({day:DAYS[i], index:i});
					}
					for(var i = 0; i < textContent.length; i++){
						var text = textContent[i];
						for(var j = 0; j < days.length; j++){
							if(text.str == days[j].day){
								x[days[j].index] = text.transform[4] + text.width / 2;
								y[days[j].index] = text.transform[5];
								days.splice(j, 1);
								if(days.length == 0 && meal != "NONE"){
									i = textContent.length;
								}
							}
						}
						if(text.str.includes("Menu")){
							if(text.str.toLowerCase().trim() == "lunch menu"){
								meal = "Lunch";
							}
							else if(text.str.toLowerCase().trim() == "dinner menu"){
								meal = "Dinner";
							}
						}
					}
					for(var i = 0; i < textContent.length; i++){
						if(valid_menu_item(textContent[i].str)){
							for(var j = 0; j < 7; j++){
								var index = TEST_ORDER[j]
								if(textContent[i].transform[5] < y[index] && textContent[i].transform[4] < x[index]){
									var insert_index = 0;
									for(var h = 0; h < menu[index].length; h++){
										if(menu[index][h].y > textContent[i].transform[5]){
											insert_index += 1;
										}
										else{
											h = menu[index].length;
										}
									}
									menu[index].splice(insert_index, 0, {str:textContent[i].str, y:textContent[i].transform[5]});
									j = 7;
								}
							}
						}
					}
					var temp = [];
					for(var i = 0; i < menu.length; i++){
						temp.push([]);
						for(var j = 0; j < menu[i].length; j++){
							temp[i].push(menu[i][j].str);
						}
					}
					FINAL_MENU[servery][meal] = temp;
					initialize_panel(servery, meal);
				});
			});
		}
	}, function(reason){
		console.error(reason);
	});
}

initialize();
accessWeb();
