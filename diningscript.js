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
	
function set_menu(final_menu, date){
	var menuObject = {
		date: date,
		menu: final_menu
	};
	firebase.database().ref('menu-ref').set(menuObject).then(function(snapshot){
		console.log("Successful firebase storage");
     	   }, function(error){
		console.log('Failed firebase storage, error: ' + error);
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

function not_preposition(text){
	return text != "and" && text != "with";
}

function title_case(str) {
	var splitStr = str.trim().toLowerCase().split(' ');
	for (var i = 0; i < splitStr.length; i++) {
		if(not_preposition(splitStr[i])){
			splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
		}
	}
	return splitStr.join(' '); 
}

function process_text(final_menu, finished, servery, text_content, date){
	var x = [];
	var y = [];
	var meal = null;
	var temp = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
	var days = [];
	for(var i = 0; i < 7; i++){
		days[i] = {day:temp[i], index:i};
	}
	var menu_temp = [[], [], [], [], [], [], []]
	var closed = false;
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
				if(days.length == 0 && meal != null){
					i = text_content.length;
				}
			}
		}
		if(text.str.toLowerCase().includes("menu")){
			if(text.str.toLowerCase().trim() == "lunch menu"){
				meal = 1;
				text_content.splice(i, 1);
				i -= 1;
			}
			else if(text.str.toLowerCase().trim() == "dinner menu"){
				meal = 2;
				text_content.splice(i, 1);
				i -= 1;
			}
			if(days.length == 0 && meal != null){
				i = text_content.length;
			}
		}
		if(text.str.toLowerCase().includes("available")){
			closed = true;
		}
	}
	if(closed){
		final_menu[servery][meal] = menu_temp;
		finished[servery][meal] = true;
		var done = true;
		for(var servery in finished){
			if(!finished[servery][1] || !finished[servery][2]){
				done = false;
			}
		}
		if(done){
			set_menu(final_menu, date);
			configure_ui(final_menu);
		}
		return;
	}
	var test_order = [3, 4, 5, 6, 0, 1, 2];
	for(var i = 0; i < text_content.length; i++){
		if(valid_menu_item(text_content[i].str)){
			text_content[i].str = title_case(text_content[i].str);
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
		if(!finished[servery][1] || !finished[servery][2]){
			done = false;
		}
	}
	if(done){
		set_menu(final_menu, date);
		configure_ui(final_menu);
	}
}

function scrape_menu(url, final_menu, finished, servery, date){
	var pdfjsLib = window['pdfjs-dist/build/pdf'];
	pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';
	var loadingTask = pdfjsLib.getDocument(url);
	loadingTask.promise.then(function(pdf){
		console.log('PDF loaded');
		for(var pageNumber = 2; pageNumber <= 3; pageNumber++){
			pdf.getPage(pageNumber).then(function(page){
				page.getTextContent().then(function(textContent){
					process_text(final_menu, finished, servery, textContent.items, date);
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
	var final_menu = [];
	var finished = [];
	for(var i = 0; i < serveries.length; i++){
		finished[serveries[i]] = [];
		finished[serveries[i]][1] = false;
		finished[serveries[i]][2] = false;
		final_menu[serveries[i]] = [];
		final_menu[serveries[i]][0] = [[], [], [], [], []];
		final_menu[serveries[i]][1] = [[], [], [], [], [], [], []];
		final_menu[serveries[i]][2] = [[], [], [], [], [], [], []];
	}
	final_menu["seibel"][0][5] = [];
	final_menu["north"][0][5] = [];
	var x = new XMLHttpRequest();
	x.open("GET", "https://cors-anywhere.herokuapp.com/http://dining.rice.edu/undergraduate-dining/college-serveries/weekly-menus/");
	x.onreadystatechange = function(){
		if(x.readyState == 4 && x.status == 200){
			var date = null;
  			var links = new DOMParser().parseFromString(x.responseText, "text/html").links;
			var valid_links = [];
  			for(var i = 0; i < links.length; i++){
  				if(links[i].href.substring(links[i].href.length - 4) == ".pdf"){
					if(date == null){
						var regex = /[0-9]{1,2}[^0-9][0-9]{1,2}[^0-9][0-9]{2,4}/;
						var result = regex.exec(links[i].href)[0].split(/[^0-9]/);
						if(result.length == 3){
							if(result[2].length == 2){
								result[2] = "20" + result[2];
							}
							for(var j = 0; j < 3; j++){
								result[j] = parseInt(result[j]);
							}
							date = new Date(result[2], result[0], result[1]).getTime();
						}
					}
					for(var j = 0; j < serveries.length; j++){
						if(links[i].href.toLowerCase().includes(serveries[j])){
							var url = "https://cors-anywhere.herokuapp.com/" + links[i].href;
							valid_links.push({"url":url, "servery":serveries[j]});
							j = serveries.length;
						}
					}
				}
			}
			if(date == null){
				console.log("No date found in url");
			}
			else{
				for(var i = 0; i < valid_links.length; i++){
					scrape_menu(valid_links[i].url, final_menu, finished, valid_links[i].servery, date);
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
		schedule[day] = [week_breakfast, week_lunch, week_dinner];
	}
	schedule[4] = [week_breakfast, week_lunch, friday_dinner];
	schedule[5] = [weekend_breakfast, weekend_lunch, saturday_dinner];
	schedule[6] = [{str: "ERROR", end: new Time(0, 0)}, weekend_lunch, sunday_dinner];
	
	return schedule;
}
	
function configure_ui(final_menu){
	var serveries = ["baker", "north", "west", "south", "seibel", "sid"];
	var schedule = create_schedule();
	
	var now = new Date();
	var current_day = (now.getDay() + 6) % 7;
	var current_meal = 2;
	for(var i = 0; i < 3; i++){
		if(schedule[current_day][i].end.is_after(now)){
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
			update_all(final_menu, current_day, current_meal, serveries, schedule, panels);
		});
	}	
	day_buttons[current_day].classList.toggle("activeTab");
	var temp = day_buttons[current_day].innerText;
	day_buttons[current_day].innerText = "<b>" + temp + "</b>";
	
	var meal_buttons = [];
	for(var i = 0; i < 3; i++){
		meal_buttons[i] = document.getElementById(i + "_meal_button");
		meal_buttons[i].addEventListener("click", function(){
			meal_buttons[current_meal].classList.toggle("activeTab");
			current_meal = parseInt(this.id[0]);
			this.classList.toggle("activeTab");
			update_all(final_menu, current_day, current_meal, serveries, schedule, panels);
		});
	}
	meal_buttons[current_meal].classList.toggle("activeTab");
	var temp = meal_buttons[current_meal].innerText;
	meal_buttons[current_meal].innerText = "<b>" + temp + "</b>";
	
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
	
	update_all(final_menu, current_day, current_meal, serveries, schedule, panels);
}



function update_all(final_menu, current_day, current_meal, serveries, schedule, panels){
	for(var i = 0; i < serveries.length; i++){
		if(current_meal == 0){
			if(final_menu[serveries[i]][current_meal] == undefined){
				panels[serveries[i]].innerHTML = "Closed";
			}
			else if(final_menu[serveries[i]][current_meal][current_day] == undefined){
				panels[serveries[i]].innerHTML = "Closed";
			}
			else{
				panels[serveries[i]].innerHTML = schedule[current_day][current_meal].str;
			}
		}
		else if(final_menu[serveries[i]][current_meal][current_day] == undefined){
			panels[serveries[i]].innerHTML = "Closed";
		}
		else if(final_menu[serveries[i]][current_meal][current_day].length == 0){
			panels[serveries[i]].innerHTML = "Closed";
		}
		else{
			panels[serveries[i]].innerHTML = schedule[current_day][current_meal].str + "<br />" +
			    final_menu[serveries[i]][current_meal][current_day].join("<br />");
		}
	}
}

get_validated_menu(configure_ui, scrape_all_menus);
