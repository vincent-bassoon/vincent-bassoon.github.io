var firebaseConfig = {
	apiKey: "AIzaSyAdcYmXMFmCUsOW1_Nr1jJwk_qmwN70bzw",
	authDomain: "rice-dining.firebaseapp.com",
	databaseURL: "https://rice-dining.firebaseio.com",
	projectId: "rice-dining",
	storageBucket: "rice-dining.appspot.com",
	messagingSenderId: "956318821917",
	appId: "1:956318821917:web:d5e61fd5ad9b1a585220f4",
	measurementId: "G-8104NPVNCC"
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

function saveToFirebase(final_menu, current_time) {
	var menuObject = {
		time: current_time,
		menu: final_menu
	};
	firebase.database().ref('menu-ref').set(menuObject).then(function(snapshot){
		console.log("successful firebase storage");
        }, function(error){
		console.log('error' + error);
        });
}

function get_validated_menu(success, fail){
	var post_time = function(current_time){
		firebase.database().ref('menu-ref').once('value').then(function(snapshot){
			var data = snapshot.val();
			if(data.date != undefined && (current_time - data.date) / (1000 * 60 * 60 * 24) <= 7){
				success(data.menu);
			}
			else{
				fail();
			}
		}, function(error){
			console.log("Could not obtain menu from server");
			fail();
		});
	};
	firebase.database().ref('/.info/serverTimeOffset').once('value').then(function(snapshot){
		post_time(snapshot.val() + Date.now());
	}, function(error){
		console.log("Could not obtain time from server, using client time");
		post_time(Date.now());
	});
}
	
function set_menu(final_menu, date, success){
	var menuObject = {
		date: date,
		menu: final_menu
	};
	firebase.database().ref('menu-ref').set(menuObject).then(function(snapshot){
		console.log("Successful firebase storage");
		success(final_menu);
     	   }, function(error){
		console.log('Failed firebase storage, error: ' + error);
		success(final_menu);
        });
}



function scrape_menu(url, menu){
	
}

function scrape_all_menus(){
	var serveries = ["baker", "north", "west", "south", "seibel", "sid"];
	var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
	var test_order = [3, 4, 5, 6, 0, 1, 2];
	
	var final_menu = {};
	var finished = {};
	for(var i = 0; i < serveries.length; i++){
		finished[serveries[i]] = false;
		final_menu[serveries[i]] = {"Lunch": [[], [], [], [], [], [], []], "Dinner": [[], [], [], [], [], [], []]};
	}
	
	
	var x = new XMLHttpRequest();
	x.open("GET", "https://cors-anywhere.herokuapp.com/http://dining.rice.edu/undergraduate-dining/college-serveries/weekly-menus/");
	x.onreadystatechange = function(){
		if(x.readyState == 4 && x.status == 200){
  			var links = new DOMParser().parseFromString(x.responseText, "text/html").links;
  			for(var i = 0; i < links.length; i++){
  				if(links[i].href.substring(links[i].href.length - 4) == ".pdf"){
					for(var i = 0; i < serveries.length; i++){
						if(links[i].href.toLowerCase().includes(serveries[i])){
							var url = "https://cors-anywhere.herokuapp.com/" + links[i].href;
							scrape_menu(url, final_menu[serveries[i]], finished, serveries[i]);
							i = serveries.length;
						}
					}
				}
			}
		}
	};
	x.send(null);
}
	
	
	
function configure_ui(final_menu){
	current_day = 0;
	DAY_BUTTONS[current_day].classList.toggle("activeTab");
	LUNCH_BUTTON.classList.toggle("activeTab");
	for(var i = 0; i < SERVERIES.length; i++){
		PANELS[SERVERIES[i]] = document.getElementById(SERVERIES[i] + " panel");
	}
	var acc = document.getElementsByClassName("accordion");
	for(var i = 0; i < acc.length; i++) {
		acc[i].classList.toggle("activeAcc");
		acc[i].addEventListener("click", function() {
			this.classList.toggle("activeAcc");
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

function update_all_day(element){
  	DAY_BUTTONS[current_day].classList.toggle("activeTab");
	element.classList.toggle("activeTab");
	current_day = parseInt(element.id.charAt(0));
	var day = current_day;
	var meal = "Lunch";
	if(DINNER_BUTTON.classList.contains("activeTab")){
		meal = "Dinner";
	}
	for(var i = 0; i < SERVERIES.length; i++){
		update_panel(SERVERIES[i], meal, day);
	}
}

function update_all(meal, element){
	var day = current_day;
	if(meal == "Lunch" && !LUNCH_BUTTON.classList.contains("activeTab")){
		LUNCH_BUTTON.classList.toggle("activeTab");
		DINNER_BUTTON.classList.toggle("activeTab");
		for(var i = 0; i < SERVERIES.length; i++){
			update_panel(SERVERIES[i], meal, day);
		}
	}
	else if(meal == "Dinner" && !DINNER_BUTTON.classList.contains("activeTab")){
		DINNER_BUTTON.classList.toggle("activeTab");
		LUNCH_BUTTON.classList.toggle("activeTab");
		for(var i = 0; i < SERVERIES.length; i++){
			update_panel(SERVERIES[i], meal, day);
		}
	}
}

function update_panel(servery, meal, day){
	if(FINAL_MENU[servery][meal][day].length == 0){
		PANELS[servery].innerHTML = "Closed";
	}
	else{
		PANELS[servery].innerHTML = FINAL_MENU[servery][meal][day].join("<br />");
	}
}

function initialize_panel(servery, meal){
	var day = current_day;
	if(meal == "Lunch" && !LUNCH_BUTTON.classList.contains("activeTab")){
		update_panel(servery, meal, day);
	}
	else if(meal == "Dinner" && !DINNER_BUTTON.classList.contains("activeTab")){
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

get_validated_menu(configure_ui, scrape_all_menus);
