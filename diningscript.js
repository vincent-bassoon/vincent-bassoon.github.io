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

function get_validated_menu(success, fail){
	var post_time = function(current_time){
		firebase.database().ref('menu-ref').once('value').then(function(snapshot){
			var data = snapshot.val();
			if(data != null && data.date != undefined && (current_time - data.date) / (1000 * 60 * 60 * 24) <= 7){
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

function valid_menu_item(text){
	text = text.trim();
	if(text.includes("=")){
		return false;
	}
	if(text.length <= 3){
		return false;
	}
	if(!/[a-z]/i.test(text)){
		return false;
	}
	return true;
}

function process_text(final_menu, finished, servery, text_content){
	var x = [];
	var y = [];
	var meal = "NONE";
	var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
	var menu_temp = [[], [], [], [], [], [], []]
	for(var i = 0; i < text_content.length; i++){
		var text = text_content[i];
		for(var j = 0; j < days.length; j++){
			if(text.str == days[j].day){
				x[days[j].index] = text.transform[4] + text.width / 2;
				y[days[j].index] = text.transform[5];
				days.splice(j, 1);
				j = 7;
				text_content.splice(i, 1);
				i -= 1;
				if(days.length == 0 && meal != "NONE"){
					i = text_content.length;
				}
			}
		}
		if(text.str.includes("Menu")){
			if(text.str.toLowerCase().trim() == "lunch menu"){
				meal = "Lunch";
				text_content.splice(i, 1);
				i -= 1;
			}
			else if(text.str.toLowerCase().trim() == "dinner menu"){
				meal = "Dinner";
				text_content.splice(i, 1);
				i -= 1;
			}
			if(days.length == 0 && meal != "NONE"){
				i = text_content.length;
			}
		}
	}
	var test_order = [3, 4, 5, 6, 0, 1, 2];
	for(var i = 0; i < text_content.length; i++){
		if(valid_menu_item(text_content[i].str)){
			for(var j = 0; j < 7; j++){
				var day_index = test_order[j]
				if(text_content[i].transform[5] < y[day_index] && text_content[i].transform[4] < x[day_index]){
					var insert_index = 0;
					for(var h = 0; h < menu_temp[day_index].length; h++){
						if(menu_temp[day_index][h].y > text_content[i].transform[5]){
							insert_index += 1;
						}
						else{
							h = menu_temp[day_index].length;
						}
					}
					menu_temp[day_index].splice(insert_index, 0, {str:text_content[i].str, y:text_content[i].transform[5]});
					j = 7;
				}
			}
		}
	}
	var menu = final_menu[servery][meal]
	for(var i = 0; i < menu_temp.length; i++){
		for(var j = 0; j < menu_temp[i].length; j++){
			menu[i].push(menu_temp[i][j].str);
		}
	}
	finished[servery][meal] = true;
	var done = true;
	for(var servery in finished){
		if(!finished[servery]["Lunch"] || !finished[servery]["Dinner"]){
			done = false;
		}
	}
	if(done){
		configure_ui(final_menu);
	}
}

function scrape_menu(url, final_menu, finished, servery){
	var pdfjsLib = window['pdfjs-dist/build/pdf'];
	pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';
	var loadingTask = pdfjsLib.getDocument(url);
	loadingTask.promise.then(function(pdf){
		console.log('PDF loaded');
		for(var pageNumber = 2; pageNumber <= 3; pageNumber++){
			pdf.getPage(pageNumber).then(function(page){
				page.getTextContent().then(function(textContent){
					process_text(final_menu, finished, servery, textContent.items);
				}, function(reason){
					console.error(reason);
				});
			}, function(reason){
				console.error(reason);
			});
		}
	}, function(reason){
		console.error(reason);
	});
}

function scrape_all_menus(){
	var serveries = ["baker", "north", "west", "south", "seibel", "sid"];
	var final_menu = {};
	var finished = {};
	for(var i = 0; i < serveries.length; i++){
		finished[serveries[i]] = {"Lunch": false, "Dinner": false};
		final_menu[serveries[i]] = {"Lunch": [[], [], [], [], [], [], []], "Dinner": [[], [], [], [], [], [], []]};
	}
	var x = new XMLHttpRequest();
	x.open("GET", "https://cors-anywhere.herokuapp.com/http://dining.rice.edu/undergraduate-dining/college-serveries/weekly-menus/");
	x.onreadystatechange = function(){
		if(x.readyState == 4 && x.status == 200){
  			var links = new DOMParser().parseFromString(x.responseText, "text/html").links;
  			for(var i = 0; i < links.length; i++){
  				if(links[i].href.substring(links[i].href.length - 4) == ".pdf"){
					for(var j = 0; j < serveries.length; j++){
						if(links[i].href.toLowerCase().includes(serveries[j])){
							var url = "https://cors-anywhere.herokuapp.com/" + links[i].href;
							scrape_menu(url, final_menu, finished, serveries[j]);
							j = serveries.length;
						}
					}
				}
			}
		}
	};
	x.send(null);
}

class Time{
	constructor(hours, minutes) {
		this.hours = hours;
		this.minutes = minutes;
	}
	is_after(date){
		var this_time = 3600 * this.hours + 60 * this.minutes;
		var date_time = 3600 * date.getHours() + 60 * date.getMinutes() + date.getSeconds();
		return date_time < this_time;
	}
}

function create_schedule(){
	var schedule = {};
	
	var week_breakfast = {str: "7:30 AM to 10:30 AM", end: new Time(10, 30)};
	var week_lunch = {str: "11:30 AM to 1:30 PM", end: new Time(13, 30)};
	var week_dinner = {str: "5:30 PM to 7:30 PM", end: new Time(19, 30)};
	var friday_dinner = {str: "5:30 PM to 7:00 PM", end: new Time(19, 0)};
	var weekend_breakfast = {str: "9:00 AM to 11:00 AM", end: new Time(11, 0)};
	var weekend_lunch = {str: "11:30 AM to 2:00 PM", end: new Time(14, 0)};
	var saturday_dinner = {str: "4:45 PM to 6:15 PM", end: new Time(18, 15)};
	var sunday_dinner = {str: "5:00 PM to 7:00 PM", end: new Time(19, 0)};
	
	for(var day = 0; day < 4; day++){
		schedule[day] = {"Breakfast": week_breakfast, "Lunch": week_lunch, "Dinner": week_dinner};
	}
	schedule[4] = {"Breakfast": week_breakfast, "Lunch": week_lunch, "Dinner": friday_dinner};
	schedule[5] = {"Breakfast": weekend_breakfast, "Lunch": weekend_lunch, "Dinner": saturday_dinner};
	schedule[6] = {"Breakfast": {str: "ERROR", end: new Time(0, 0)}, "Lunch": weekend_lunch, "Dinner": sunday_dinner};
	
	return schedule;
}
	
function configure_ui(final_menu){
	var serveries = ["baker", "north", "west", "south", "seibel", "sid"];
	var meals = ["Breakfast", "Lunch", "Dinner"];
	var schedule = create_schedule();
	
	var now = new Date();
	var current_day = (now.getDay() - 1) % 7;
	var current_meal = 2;
	for(var i = 0; i < 3; i++){
		if(schedule[current_day][meals[i]].end.is_after(now)){
			current_meal = i;
			i = 3;
		}
	}
	
	var panels = {};
	for(var i = 0; i < serveries.length; i++){
		panels[serveries[i]] = document.getElementById(serveries[i] + " panel");
	}
	
	var day_buttons = [];
	for(var i = 0; i < 7; i++){
		day_buttons[i] = document.getElementById(i + "_day_button");
		day_buttons[i].addEventListener("click", function(){
			day_buttons[current_day].classList.toggle("activeTab");
			current_day = parseInt(this.id[0]);
			this.classList.toggle("activeTab");
			update_all(final_menu, current_day, meals[current_meal], serveries, schedule, panels);
		});
	}	
	day_buttons[current_day].classList.toggle("activeTab");
	
	var meal_buttons = [];
	for(var i = 0; i < meals.length; i++){
		meal_buttons[i] = document.getElementById(i + "_meal_button");
		meal_buttons[i].addEventListener("click", function(){
			meal_buttons[current_meal].classList.toggle("activeTab");
			current_meal = parseInt(this.id[0]);
			this.classList.toggle("activeTab");
			update_all(final_menu, current_day, meals[current_meal], serveries, schedule, panels);
		});
	}
	meal_buttons[current_meal].classList.toggle("activeTab");
	
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
	
	update_all(final_menu, current_day, meals[current_meal], serveries, schedule, panels);
}



function update_all(final_menu, current_day, current_meal, serveries, schedule, panels){
	for(var i = 0; i < serveries.length; i++){
		if(final_menu[serveries[i]][current_meal][current_day].length == 0){
			panels[serveries[i]].innerHTML = "Closed";
		}
		else{
			panels[serveries[i]].innerHTML = schedule[current_day][current_meal].str + "<br />" +
			    final_menu[serveries[i]][current_day][current_meal].join("<br />");
		}
	}
}

console.log("uh");
//get_validated_menu(configure_ui, scrape_all_menus);
