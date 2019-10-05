function Pdf2TextClass(){
     var self = this;
     this.complete = 0;
     this.pdfToText = function("http://dining.rice.edu/wp-content/uploads/2019/09/Baker-Menu-WEB-9.30.19.pdf", callbackPageDone, callbackAllDone){
     console.assert( data  instanceof ArrayBuffer  || typeof data == 'string' );
     PDFJS.getDocument( data ).then( function(pdf) {
     var div = document.getElementById('viewer');

     var total = pdf.numPages;
     callbackPageDone( 0, total );        
     var layers = {};        
     for (i = 1; i <= total; i++){
        pdf.getPage(i).then( function(page){
        var n = page.pageNumber;
        page.getTextContent().then( function(textContent){
          if( null != textContent.bidiTexts ){
            var page_text = "";
            var last_block = null;
            for( var k = 0; k < textContent.bidiTexts.length; k++ ){
                var block = textContent.bidiTexts[k];
                if( last_block != null && last_block.str[last_block.str.length-1] != ' '){
                    if( block.x < last_block.x )
                        page_text += "\r\n"; 
                    else if ( last_block.y != block.y && ( last_block.str.match(/^(\s?[a-zA-Z])$|^(.+\s[a-zA-Z])$/) == null ))
                        page_text += ' ';
                }
                page_text += block.str;
                last_block = block;
            }

            textContent != null && console.log("page " + n + " finished."); //" content: \n" + page_text);
            layers[n] =  page_text + "\n\n";
          }
          ++ self.complete;
          callbackPageDone( self.complete, total );
          if (self.complete == total){
            window.setTimeout(function(){
              var full_text = "";
              var num_pages = Object.keys(layers).length;
              for( var j = 1; j <= num_pages; j++)
                  full_text += layers[j] ;
              callbackAllDone(full_text);
            }, 1000);              
          }
        }); // end  of page.getTextContent().then
      }); // end of page.then
    } // of for
  });
 }; // end of pdfToText()
}; // end of class

function callbackPageDone(num1, num2){
  console.log(num1, num2)
}

function callbackAllDone(num1, num2){
  console.log(num1, num2)
}
