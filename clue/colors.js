var hsl =  [[58, 54, 50],//   Col. Mustard
			[281, 43, 50],//  Prof. Plum
			[110, 45, 50],//  Mr. Green
			[3, 57, 50],//    Miss Scarlet
			[189, 77, 50],//  Mrs. Peacock
			[38, 40, 89],//   Mrs. White
			[304, 88, 75],//  Mme. Rose
			[0, 0, 75],//     Sgt. Gray
			[25, 17, 50],//     M. Brunette
			[22, 77, 75]];//  Miss Peach"];

var colors = [];
for(var i = 0; i < hsl.length; i++){
	colors[i] = "hsl(" + hsl[i][0] + ", " + hsl[i][1] + "%, " + hsl[i][2] + "%)";
}
var lighter_colors = [];
for(var i = 0; i < hsl.length; i++){
	lighter_colors[i] = "hsl(" + hsl[i][0] + ", " + hsl[i][1] + "%, " + (hsl[i][2] + 15) + "%)";
}