'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var http = require("http");

var app = express();
app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

// recommended to inject access tokens as environmental variables, e.g.
var token = process.env.FB_PAGE_ACCESS_TOKEN;

var buttons = [
	              {
	                "type":"element_share",
	              	"share_contents": { 
			          "attachment": {
			            "type": "template",
			            "payload": {
			              "template_type": "generic",
			              "elements": [
			                {
			                  "title": "I had an amazing chat with SUSI. Do you wanna chat too?",
			                  "buttons": [
			                    {
			                      "type": "web_url",
			                      "url": "https://m.me/asksusisu", 
			                      "title": "Chat with SUSI AI"
			                    }
			                  ]
			                }
			              ]
			            }
			          }
			        }
	              } 
	          ];

function messengerCodeGenerator(){
	request({
			url: 'https://graph.facebook.com/v2.6/me/messenger_codes',
			qs: {access_token:token},
			method: 'POST',
			json: {
					type: "standard",
					image_size: 1000
			}
		}, function(error, response, body) {
			if (error) {
				console.log('Error sending messages: ', error);
			} else if (response.body.error) {
				console.log('Error: ', response.body.error);
			}
			else{
				console.log('Messenger code - '+response.body);
			}
		});
}

function sendTextMessage(sender, text, flag) {
	var messageData;
	if(flag === 1){
		messageData = { attachment: text };
	}
	else{
		messageData = {text:text};
	}
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error);
		} else if (response.body.error) {
			console.log('Error: ', response.body.error);
		}
		typingIndicator(sender,0);
	});
}

function sendGenericMessage(sender, title, subtitle, image_url) {
	var messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [{
					"title": title,
					"subtitle": subtitle,
					"image_url": image_url
				}]
			}
		}
	};
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {
				/* The phone_number field can also be used instead of id field here, to message the owner of that phone number:
				 * phone_number: "FILL_HERE_PHONE_NUMBER",
				 * till now this feature can be used for developers, testers and admins of the ask susi fb page.
				 */
				id:sender
			},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

// Add a get started button to the messenger
function addGetStartedButton(){
	request({
		url: 'https://graph.facebook.com/v2.6/me/messenger_profile',
		qs: {access_token:token},
		method: 'POST',
		json: { 
		  "get_started":{
		    "payload":"GET_STARTED_PAYLOAD"
		  }
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

function typingIndicator(sender, flag){
	var typingState;
	if(flag === 1)
	{
		typingState = {
		  "recipient":{
		  	"id":sender
		  },
		  "sender_action":"typing_on"
		};
	}
	else{
		typingState = {
		  "recipient":{
		  	"id":sender
		  },
		  "sender_action":"typing_off"
		};
	}
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: typingState
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	});
}

function persistentMenuGenerator(){
	request({
		url: 'https://graph.facebook.com/v2.6/me/messenger_profile',
		qs: {access_token:token},
		method: 'POST',
		json: {
				  "persistent_menu":[
				    {
				      "locale":"default",
				      "composer_input_disabled":false,
				      "call_to_actions":[
				        {
				          "type":"postback",
				          "title":"Latest News",
	                      "payload":"latest_news"
				        },{
				          "type":"web_url",
				          "title":"Visit Repository",
				          "url":"https://github.com/fossasia/susi_server",
				          "webview_height_ratio":"full"
				        }
				      ]
				    }
				  ]
				}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		} else {
			console.log(JSON.stringify(response.body));
		}
	})	
}

function deletePersistentMenu(){
	request({
		url: 'https://graph.facebook.com/v2.6/me/messenger_profile',
		qs: {access_token:token},
		method: 'DELETE',
		json: {
		  "fields":[
		    "persistent_menu"
		  ]
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		} else {
			console.log(JSON.stringify(response.body));
		}
	})
}

deletePersistentMenu();
persistentMenuGenerator();

app.get('/', function (req, res) {
	res.send('Susi says Hello.');
});

// for facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
		res.send(req.query['hub.challenge']);
	}
	res.send('Error, wrong token');
});

addGetStartedButton();
messengerCodeGenerator();

// to post data
app.post('/webhook/', function (req, res) {
	var messaging_events = req.body.entry[0].messaging;
	typingIndicator(req.body.entry[0].messaging[0].sender.id,1);
	for (var i = 0; i < messaging_events.length; i++) {
		var event = req.body.entry[0].messaging[i];
		console.log(JSON.stringify(event)+'\n');
		var sender = event.sender.id;
		if (event.message && event.message.text) {
			var text = event.message.text;
			if (text === 'image') {
				// Sample testing URL
				sendGenericMessage(sender, 'Map Location', 'This is the location', 'http://loklak.org/vis/map.png?mlat=17.77262&mlon=78.2728192&zoom=12');
				// Images are sent similar to this.
				// Implement actual logic later here.
				continue
			}

			// Construct the query for susi
			var queryUrl = 'http://api.asksusi.com/susi/chat.json?q='+encodeURI(text);
			var message = '';
			// Wait until done and reply
			request({
				url: queryUrl,
				json: true
			}, function (error, response, body) {
				if (!error && response.statusCode === 200) {
					if(body.answers[0])
					{
						if(body.answers[0].actions[1]){
							if(body.answers[0].actions[1].type === 'rss'){
								sendTextMessage(sender, "I found this on the web:", 0);
								var arr = [];
								var metaCnt = body.answers[0].metadata.count;
								for(var i=0;i<((metaCnt>10)?10:metaCnt);i++){
									arr.push(
										{
											"title": body.answers[0].data[i].title,
											"subtitle": body.answers[0].data[i].link,
											"buttons": buttons
										}
									);
								}
								message = {
									"type": "template",
									"payload": 
									{
										"template_type": "genric",
										"elements": arr
									}
								};
								sendTextMessage(sender, message, 1);
							}
						}
						else{
							if(body.answers[0].actions[0].type === 'table'){
								var colNames = body.answers[0].actions[0].columns;
								if((body.answers[0].metadata.count)>10)
									sendTextMessage(sender, "Due to message limit, only some results are shown:", 0);
								else
									sendTextMessage(sender, "Results are shown below:", 0);
								var metaCnt = body.answers[0].metadata.count;
								var arr = [];
								for(var i=0;i<((metaCnt>10)?10:metaCnt);i++){
									var titleStr = '';
									var subtitleStr = '';
									for(var cN in colNames){
										if(titleStr !== '')
											break;
										titleStr = subtitleStr;
										subtitleStr = body.answers[0].data[i][cN]; 	
									}
									arr.push(
										{
											"title": subtitleStr,
											"subtitle": titleStr,
											"buttons": buttons             
										}
									);
								}
								message = {
									"type": "template",
									"payload": 
									{
										"template_type": "genric",
										"elements": arr
									}
								};
								sendTextMessage(sender, message, 1);
							}
							else
							{
								var messageTitle = body.answers[0].actions[0].expression;
								message = {
									"type": "template",
									"payload": 
									{
										"template_type": "generic",
										"elements": [
														{
					            							"title": messageTitle,
					            							"buttons": buttons
					            						}
					            		]
									}
								};
								
								sendTextMessage(sender, message, 1);
							}
						}
					}
				} else {
					message = 'Oops, Looks like Susi is taking a break, She will be back soon';
					sendTextMessage(sender, message,0);
				}
			});
		}
		else if (event.postback) {
			if(event.postback.payload === 'start_chatting')
        		sendTextMessage(sender, "You can ask me anything. Your questions are my food and I am damn hungry!");
        	else if(event.postback.payload === 'GET_STARTED_PAYLOAD'){
        		var messageData = {
	              "type":"template",
	              "payload":{
	                "template_type":"generic",
	                "elements":[
	                   {
	                    "title":"Welcome to SUSI AI",
	                    "subtitle":"I am built by open source community Fossasia. Also, I am evolving continuously.",
	                    "buttons":[
	                      {
	                        "type":"web_url",
	                        "url":"https://github.com/fossasia/susi_server",
	                        "title":"View Repository"
	                      },{
	                        "type":"postback",
	                        "title":"Start Chatting",
	                        "payload":"start_chatting"
	                      }              
	                    ]      
	                  }
	                ]
	              }
	            }
	          	sendTextMessage(sender, messageData, 1);
        	}
        	else if(event.postback.payload === 'latest_news'){
        		// Construct the query for susi
				var queryUrl = 'http://api.asksusi.com/susi/chat.json?q=news';
				var message = '';
				// Wait until done and reply
				request({
					url: queryUrl,
					json: true
				}, function (error, response, body) {
					if (!error && response.statusCode === 200) {
						var messageTitle = body.answers[0].actions[0].expression;
						message = {
							"type": "template",
							"payload": 
							{
								"template_type": "generic",
								"elements": [
												{
			            							"title": messageTitle,
			            							"buttons": buttons
			            						}
			            		]
							}
						};
						
						sendTextMessage(sender, message, 1);
					} 
					else {
						message = 'Oops, Looks like Susi is taking a break, She will be back soon';
						sendTextMessage(sender, message,0);
					}
				});
        	}
			continue;
		}
		else{
			typingIndicator(sender,0);	
		}
	}
	res.sendStatus(200)
})

// Getting Susi up and running.
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'));
});

// to keep heroku active
setInterval(function() {
  https.get(process.env.HerokuUrl);
}, 1200000);
