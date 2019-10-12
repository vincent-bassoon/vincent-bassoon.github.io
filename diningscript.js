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

var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function valid_menu_item(item){
	if(item.contains("=")){
		return false;
	}
	if(item.length <= 3){
		return false;
	}
	//make sure item isn't a day of the week or Lunch or whatever
	return true;
}

function accessMenu(url){
	var pdfjsLib = window['pdfjs-dist/build/pdf'];
	pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';
	var loadingTask = pdfjsLib.getDocument(url);
	loadingTask.promise.then(function(pdf){
		console.log('PDF loaded');
		for(var pageNumber = 2; pageNumber <= 3; pageNumber++){
			pdf.getPage(pageNumber).then(function(page){
				page.getTextContent().then(function(textContent){
					var menu = [[], [], [], [], [], [], []];
					var x = [];
					var y = [];
					for(var i = 0; i < textContent.length; i++){
						var text = textContent[i];
						for(var j = 0; j < 7; j++){
							if(text.str == DAYS[j]){
								x[j] = text.transform[4];
								y[j] = text.transform[5];
							}
						}
					}
					for(var i = 0; i < textContent.length; i++){
						if(valid_menu_item(textContent[i].str)){
							for(var j = 0; j < 7; j++){
								if(textContent[i].transform[5] < y[j] && textContent[i].transform[4] < x[j]){
									//iterate over menu[j], add item in order with items of menu[j]
								}
							}
						}
					}
				});
			});
		}
	}, function(reason){
		console.error(reason);
	});
}

accessWeb();
