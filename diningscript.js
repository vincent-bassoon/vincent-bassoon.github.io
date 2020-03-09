var firebaseConfig = {
	apiKey: "AIzaSyAdNM2uoacPc9U5NL0JUwkIiLbVVtz-cBw",
	authDomain: "rice-dining-5385e.firebaseapp.com",
	databaseURL: "https://rice-dining-5385e.firebaseio.com",
	projectId: "rice-dining-5385e",
	storageBucket: "rice-dining-5385e.appspot.com",
	messagingSenderId: "47441205715",
	appId: "1:47441205715:web:2d1df72e915e88a0e67726",
	measurementId: "G-J1X5JGY8RK"
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

function get_validated_menu(final_menu, status, serveries, info, fail){
	firebase.database().ref('menu-ref').once('value').then(function(snapshot){
		var data = snapshot.val();
		if(data != null && data.date != undefined && data.date == info.date){
			for(var i = 0; i < serveries.length; i++){
				final_menu[serveries[i]] = data.menu[serveries[i]];
				status.finished[serveries[i]][1] = true;
				status.finished[serveries[i]][2] = true;
			}
			update_all(final_menu, status, serveries, info);
			var refresh = document.getElementById("refresh button");
			refresh.classList.toggle("activeRefresh");
			refresh.innerHTML = "Validate menus from rice dining website<br>(will take a moment)";
		}
		else{
			fail(final_menu, status, serveries, info);
		}
	}, function(error){
		console.log("Could not obtain menu from server");
		fail(final_menu, status, serveries, info);
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

function process_text(final_menu, status, serveries, servery, text_content, info){
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
		if(text.str.toLowerCase().includes("day")){
			for(var j = 0; j < days.length; j++){
				if(text.str == days[j].day){
					x[days[j].index] = text.transform[4] + text.width / 2;
					y[days[j].index] = text.transform[5];
					j = 7;
					text_content.splice(i, 1);
					i -= 1;
				}
			}
		}
		else if(text.str.toLowerCase().includes("menu")){
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
	}
	var test_order = [3, 4, 5, 6, 0, 1, 2];
	var closed_days = [false, false, false, false, false, false, false];
	for(var i = 0; i < text_content.length; i++){
		if(valid_menu_item(text_content[i].str)){
			closed = false;
			if(text_content[i].str.toLowerCase().includes("available")){
				closed = true;
			}
			text_content[i].str = title_case(text_content[i].str);
			for(var j = 0; j < 7; j++){
				var day_index = test_order[j]
				if(text_content[i].transform[5] < y[day_index] && text_content[i].transform[4] < x[day_index]){
					if(closed){
						menu_temp[day_index] = [];
						closed_days[day_index] = closed;
					}
					else if(!closed_days[day_index]){
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
					}
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
	status.finished[servery][meal] = true;
	var done = true;
	for(var i = 0; i < serveries.length; i++){
		if(!status.finished[serveries[i]][1] || !status.finished[serveries[i]][2]){
			done = false;
		}
	}
	if(done){
		set_menu(final_menu, info.date);
		update_all(final_menu, status, serveries, info);
		var refresh = document.getElementById("refresh button");
		refresh.classList.toggle("activeRefresh");
		refresh.innerHTML = "Validate menus from rice dining website<br>(will take a moment)";
	}
}

function scrape_menu(url, final_menu, status, serveries, servery, info){
	status.messages[servery] = "Retrieving menu from rice dining website...";
	var pdfjsLib = window['pdfjs-dist/build/pdf'];
	pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';
	var loadingTask = pdfjsLib.getDocument(url);
	loadingTask.promise.then(function(pdf){
		console.log('PDF loaded');
		for(var pageNumber = 2; pageNumber <= 3; pageNumber++){
			pdf.getPage(pageNumber).then(function(page){
				page.getTextContent().then(function(textContent){
					process_text(final_menu, status, serveries, servery, textContent.items, info);
				}, function(reason){
					console.error(reason);
					status.messages[servery] = "Error:<br>Failed to retrieve menu from rice dining website";
					status.finished[servery].error = true;
				});
			}, function(reason){
				console.error(reason);
				status.messages[servery] = "Error:<br>Failed to retrieve menu from rice dining website";
				status.finished[servery].error = true;
			});
		}
	}, function(reason){
		console.error(reason);
		status.messages[servery] = "Error:<br>Failed to retrieve menu from rice dining website";
		status.finished[servery].error = true;
	});
}

function create_error_schedule(servery, final_menu){
	for(var i = 0; i < 4; i++){
		final_menu[servery][1][i] = [["Error:"], ["Invalid link on rice dining website"]];
		final_menu[servery][2][i] = [["Error:"], ["Invalid link on rice dining website"]];
	}
	final_menu[servery][1][4] = [["Error:"], ["Invalid link on rice dining website"]];
	if(servery != "baker" && servery != "sid"){
		final_menu[servery][2][4] = [["Error:"], ["Invalid link on rice dining website"]];
		final_menu[servery][1][6] = [["Error:"], ["Invalid link on rice dining website"]];
		final_menu[servery][2][6] = [["Error:"], ["Invalid link on rice dining website"]];
	}
	if(servery == "north" || servery == "seibel"){
		final_menu[servery][1][5] = [["Error:"], ["Invalid link on rice dining website"]];
		final_menu[servery][2][5] = [["Error:"], ["Invalid link on rice dining website"]];
	}
	
}

function find_servery(serveries, text){
	if(!text.includes("kitchen") && !text.includes("servery")){
		return null;
	}
	for(var i = 0; i < serveries.length; i++){
		if(text.includes(serveries[i])){
			return serveries[i];
		}
	}
	return null;
}

function scrape_all_menus(final_menu, status, serveries, info){
	var x = new XMLHttpRequest();
	x.open("GET", "https://cors-anywhere.herokuapp.com/https://dining.rice.edu");
	x.onreadystatechange = function(){
		if(x.readyState == 4 && x.status == 200){
  			var links = new DOMParser().parseFromString(x.responseText, "text/html").links;
			var valid_links = [];
			var servery = null;
  			for(var i = 0; i < links.length; i++){
				servery = find_servery(serveries, links[i].innerText.toLowerCase());
				if(servery != null){
					if(links[i].href.toLowerCase().includes(servery)){
						if(links[i].href.substring(links[i].href.length - 4) != ".pdf"){
							status.finished[servery][1] = true;
							status.finished[servery][2] = true;
							update_all(final_menu, status, serveries, info);
						}
						else{
							var link_temp = links[i].href.substring(links[i].href.lastIndexOf("/"))
							var date_string = /\d{1,2}\.\d{1,2}\.\d{2}/.exec(link_temp)[0];
							var result = date_string.split(".");
							var full_date = new Date(2000 + parseInt(result[2]), parseInt(result[0] - 1), parseInt(result[1]));
							if(info.date == full_date.getTime()){
								var url = "https://cors-anywhere.herokuapp.com/" + links[i].href.replace(/.+io/, "dining.rice.edu");
								valid_links.push({"url":url, "servery":servery});
							}
							else{
								status.finished[servery][1] = true;
								status.finished[servery][2] = true;
								status.finished[servery].error = true;
								status.messages[servery] = "Error:<br>No up-to-date menu found on rice dining website";
								update_all(final_menu, status, serveries, info);
							}
						}
					}
					else{
						create_error_schedule(servery, final_menu);
						status.finished[servery][1] = true;
						status.finished[servery][2] = true;
						status.finished[servery].error = true;
						update_all(final_menu, status, serveries, info);
					}
				}
			}
			for(var i = 0; i < valid_links.length; i++){
				scrape_menu(valid_links[i].url, final_menu, status, serveries, valid_links[i].servery, info);
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
	
function configure_ui(){
	var serveries = ["baker", "north", "west", "south", "seibel", "sid"];
	var info = {};
	info.schedule = create_schedule();
	
	var now = new Date();
	info.current_time = Date.now();
	
	var day_diff = (now.getDay() + 6) % 7;
	var temp = new Date();
	temp.setHours(0, 0, 0, 0);
	temp.setDate(temp.getDate() - day_diff);
	info.date = temp.getTime();
	
	document.getElementById("day_header").innerText = "Week of " + temp.toLocaleDateString();
	
	var status = {};
	status.current_day = (now.getDay() + 6) % 7;
	status.current_meal = 2;
	
	for(var i = 0; i < 3; i++){
		if(info.schedule[status.current_day][i].end.is_after(now)){
			status.current_meal = i;
			i = 3;
		}
	}
	
	info.panels = {};
	for(var i = 0; i < serveries.length; i++){
		info.panels[serveries[i]] = document.getElementById(serveries[i] + " panel");
	}
	
	status.finished = [];
	status.messages = {};
	for(var i = 0; i < serveries.length; i++){
		status.messages[serveries[i]] = "Loading...";
	}
	var final_menu = [];
	for(var i = 0; i < serveries.length; i++){
		status.finished[serveries[i]] = [];
		status.finished[serveries[i]][1] = false;
		status.finished[serveries[i]][2] = false;
		status.finished[serveries[i]].error = false;
		final_menu[serveries[i]] = [];
		final_menu[serveries[i]][0] = [[0], [0], [0], [0], [0]];
		final_menu[serveries[i]][1] = [[], [], [], [], [], [], []];
		final_menu[serveries[i]][2] = [[], [], [], [], [], [], []];
	}
	final_menu["seibel"][0][5] = [0];
	final_menu["north"][0][5] = [0];
	
	var refresh = document.getElementById("refresh button");
	refresh.addEventListener("click", function(){
		this.classList.toggle("activeRefresh");
		this.innerHTML = "Loading...";
		for(var i = 0; i < serveries.length; i++){
			status.messages[serveries[i]] = "Loading...";
		}
		var final_menu = [];
		for(var i = 0; i < serveries.length; i++){
			status.finished[serveries[i]] = [];
			status.finished[serveries[i]][1] = false;
			status.finished[serveries[i]][2] = false;
			status.finished[serveries[i]].error = false;
			final_menu[serveries[i]] = [];
			final_menu[serveries[i]][0] = [[0], [0], [0], [0], [0]];
			final_menu[serveries[i]][1] = [[], [], [], [], [], [], []];
			final_menu[serveries[i]][2] = [[], [], [], [], [], [], []];
		}
		final_menu["seibel"][0][5] = [0];
		final_menu["north"][0][5] = [0];
		scrape_all_menus(final_menu, status, serveries, info);
	});
	
	var day_buttons = [];
	for(var i = 0; i < 7; i++){
		day_buttons[i] = document.getElementById(i + "_day_button");
		day_buttons[i].addEventListener("click", function(){
			day_buttons[status.current_day].classList.toggle("activeTab");
			status.current_day = parseInt(this.id[0]);
			this.classList.toggle("activeTab");
			update_all(final_menu, status, serveries, info);
		});
	}	
	day_buttons[status.current_day].classList.toggle("activeTab");
	var temp = day_buttons[status.current_day].innerText;
	day_buttons[status.current_day].innerHTML = "<b>" + temp + "</b>";
	
	var meal_buttons = [];
	for(var i = 0; i < 3; i++){
		meal_buttons[i] = document.getElementById(i + "_meal_button");
		meal_buttons[i].addEventListener("click", function(){
			meal_buttons[status.current_meal].classList.toggle("activeTab");
			status.current_meal = parseInt(this.id[0]);
			this.classList.toggle("activeTab");
			update_all(final_menu, status,  serveries, info);
		});
	}
	meal_buttons[status.current_meal].classList.toggle("activeTab");
	var temp = meal_buttons[status.current_meal].innerText;
	meal_buttons[status.current_meal].innerHTML = "<b>" + temp + "</b>";
	
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
	
	update_all(final_menu, status, serveries, info);
	get_validated_menu(final_menu, status, serveries, info, scrape_all_menus);
}



function update_all(final_menu, status, serveries, info){
	for(var i = 0; i < serveries.length; i++){
		if(status.finished[serveries[i]].error){
			info.panels[serveries[i]].innerHTML = status.messages[serveries[i]];
		}
		else if(status.current_meal == 0){
			if(!status.finished[serveries[i]][1] || !status.finished[serveries[i]][2]){
				info.panels[serveries[i]].innerHTML = status.messages[serveries[i]];
			}
			else if(final_menu[serveries[i]][status.current_meal][status.current_day] == undefined){
				info.panels[serveries[i]].innerText = "Closed";
			}
			else{
				info.panels[serveries[i]].innerText = info.schedule[status.current_day][status.current_meal].str;
			}
		}
		else if(!status.finished[serveries[i]][status.current_meal]){
			info.panels[serveries[i]].innerHTML = status.messages[serveries[i]];
		}
		else if(final_menu[serveries[i]][status.current_meal][status.current_day] == undefined){
			info.panels[serveries[i]].innerText = "Closed";
		}
		else if(final_menu[serveries[i]][status.current_meal][status.current_day].length <= 1){
			info.panels[serveries[i]].innerText = "Closed";
		}
		else{
			info.panels[serveries[i]].innerHTML = info.schedule[status.current_day][status.current_meal].str + "<br />" +
			    final_menu[serveries[i]][status.current_meal][status.current_day].join("<br />");
		}
	}
}

configure_ui();
