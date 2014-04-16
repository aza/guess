var jsdom = require('jsdom'),
    _ = require('underscore')

function getTimelineByUser(handle, onDone){

	var tweetElsToJson = function( tweetEls ){
		tweetEls = [tweetEls[0]]
		_(tweetEls).each(function(tweetEl){
			console.log( tweetEl.innerHTML )
		})
	}

	jsdom.env({
		url: 'https://mobile.twitter.com/' + handle,
		done: function(err, window){
			//console.log( window.document.body.innerHTML )
			var tweetEls = window.document.querySelectorAll('.timeline .tweet .tweet-text')
			tweetElsToJson( tweetEls )
			
		}
	})

}

getTimelineByUser('aza')