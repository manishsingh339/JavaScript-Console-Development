	 
var iframe = null;
var availableSuggestion = [];

var JSConsole = {	
	cmdCache: {},
	commandHistory: [],	
	position: 0,
	consoleFun: [ "console.warn", "console.error", "console.debug", "console.info", "console.log" ],
	
 /**
  * This function will be called while keyup event in the command box.
  * Base ased on the key it perform the logical operation.
  * @param {e} object - e evnt object of keyup event.  
  */
	executeKeyUpAction: function(e){		
		var whichKey = e.which,
			inputBox = $("#cmd-input"),
			cmd = inputBox.val().trim(),
			autoCompleteBox = true;
			
			autoCompleteBox = ($("#ui-id-1").css('display') === 'block' || $("#ui-id-1").css('display') === 'inline-block');
				
		switch(whichKey){
			case 13: 
				cmd && JSConsole.runCommand(cmd);
			break;

			case 38: // Up Arrow Press
					if(autoCompleteBox)
						return false;
					JSConsole.position--;
					var cmdFromCache = JSConsole.commandHistory[JSConsole.position];
					cmdFromCache && inputBox.val(cmdFromCache);								
			break;

			case 40: // For Arrow Down Key
					if(autoCompleteBox)
						return false;								
					JSConsole.position++;
					var cmdFromCache = JSConsole.commandHistory[JSConsole.position];
					cmdFromCache && inputBox.val(cmdFromCache);												
			break;

			default:
				JSConsole.autoComplete(cmd);
			break;
		}		
	},

   /**
  	* This function observes the and split into some patrs if required.
  	* This function calls the some function to get list of command for autocomplete.
  	* @param {command} string - command contains input command given by user.  
  	*/
	autoComplete: function(command){
		var cmdParts = command.split('.');
		var prop = [];
		if (command.substr(-1) !== '.') {
		 	prop = JSConsole.getProps(cmdParts.slice(0, cmdParts.length - 1).join('.') || 'window', cmdParts[cmdParts.length - 1]);
		}else {
		 	prop = JSConsole.getProps(command.substr(0, command.length - 1));
		}
		JSConsole.updateSuggestionList(prop);  		 
	},

   /**
  	* This function return the list of command to autoComplete function.
  	* This first search in the cache for getting autocomplete command suggestion,
  	* if command not found in the cache then it call function to return all related
  	* commands for the user input.
  	* @param {command} string - command contains input command given by user.  
  	* @param {command} filter - filter contains filter for command searching.  
  	*/
	getProps: function(command,filter){ 
		var props = [];
  		if(!JSConsole.cmdCache[command]) { // For checking command in the cache.		
    		try {      
      			var result =  iframe.contentWindow.eval(command);            			
				for(var prop in result) {
    				props.push(prop);
				}
				props = props.sort();				
				JSConsole.cmdCache[command] = props;								
    		} catch (e) {
      			props = [];
    		}
  		}else if(filter){   // For filtering the commands 		
		    for (var i = 0, p; i < JSConsole.cmdCache[command].length, p = JSConsole.cmdCache[command][i]; i++) {
		      if (p.indexOf(filter) === 0) {
		        if (p != filter) {
		          props.push(p);
		        }
		      }
		    }
		    props = props.sort();
  		}else{
  			props = JSConsole.cmdCache[command];
  		}   		
  		return props; 
	},

   /**
  	* This function runs the command, update history, and log the command in the 
  	* web page.  	
  	* @param {cmd} string - cmd contains input command given by user.  
  	*/
	runCommand: function(cmd){
		try {
			var cmdResultUl = $('#cmd-result');
			cmdResultUl.append('<li><span class="cmd-pre">Command >> </span><div class="cmd-display">'+cmd +'</div></li>');										
			JSConsole.commandHistory.push(cmd);					
			JSConsole.position = JSConsole.commandHistory.length;
			$("#cmd-input").val('');
			var result = iframe.contentWindow.eval(cmd);										
			for (var i = 0; i < JSConsole.consoleFun.length; i++) {
				if(cmd.indexOf(JSConsole.consoleFun[i]) != -1){
					var message =cmd.substring(cmd.indexOf('(')+1, cmd.indexOf(')'));
					console.log(message);
					break;
				}
			};
			cmdResultUl.append('<li class="end"><span class="return-pre">Return << </span><div class="cmd-display">'+result +'</div></li>');
		} catch(e) {
			cmdResultUl.append('<li class="end"><span class="err-pre">Error: </span><div class="cmd-display">'+e.message +'</div></li>');					
		}
		$('.cmd-output').animate({ scrollTop: $('#cmd-result').height()}, 'slow', function () {});
		JSConsole.updateSuggestionList(JSConsole.cmdCache.window);
	},

   /**
  	* This function updates the suggestion list for the commands. 
  	* @param {list} array - list contains list of commands. 
  	*/
	updateSuggestionList: function(list){
		availableSuggestion = list;
	},

   /**
  	* This function overrides the console.log function to show the logs in web page.
  	* @param {message} string - message contains message to display. 
  	*/
	overrideConsole: function(message){
		if (typeof console  != "undefined") 
  			if (typeof console.log != 'undefined')
    			console.olog = console.log;
			else
  				console.olog = function() {}; 
			console.log = function(message) {
  				console.olog(message);
  				$('#cmd-result').append('<li><span class="return-pre"> </span><div class="cmd-display">'+message +'</div></li>');  			
			};
		console.warn = console.error = console.debug = console.info =  console.log
	}
};

// Keyup event for command input box.
$("#cmd-input").keyup(function(e){	
	JSConsole.executeKeyUpAction(e);	
});

$(function(){	   		
		// Craeting iframe and appending to the body of html page.				
		iframe = document.createElement('iframe');
		$('body').append(iframe);		
		$('iframe').hide();

		// Putting all properties of window in a array(keys).
		var keys = [];
		for(var prop in window) {
    		keys.push(prop);
		}
		
		// Assigning array(keys) to cmdCache object for caching and autocomplete.
		JSConsole.cmdCache.window = keys;		
		availableSuggestion = JSConsole.cmdCache.window;
		JSConsole.overrideConsole();
		
		// Initializing the jQuery-ui autocomplete for command.
    	$("#cmd-input").autocomplete({
      		source: function( request, response ) {
      			var terms = request.term.split('.'),
      				lastTerm = terms[terms.length - 1];
          		response( $.ui.autocomplete.filter(
            			  availableSuggestion, lastTerm ) );
        	},
      		select: function(event, ui) {
      			if(event.which== 13){
      				return false;
      			}
      			var cmdInput = $("#cmd-input"),
      				val = cmdInput.val(),
      				lastDotPosition = val.lastIndexOf('.'),
      				term = val.split('.');
      			
      			if(term.length !== 1){
      				val = val.substring(0,lastDotPosition+1);
      				val = val + event.toElement.textContent;
      				cmdInput.val(val);
      				return false;
      			}      			
      		},
      		 focus: function( event, ui ) {
      		 	event.preventDefault()
      		 }
    	});
});
