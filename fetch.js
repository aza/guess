var request = require('request'),
		OAuth2 = require('OAuth').OAuth2,
		qs = require('querystring'),
		Firebase = require('firebase'),
		_ = require('underscore')

function Twitter(config, onDone){
	
	var self = this,
			querySize = 200

	var oauth2 = new OAuth2(
		config.consumer_key,
		config.consumer_secret,
		'https://api.twitter.com/',
		null,
		'oauth2/token',
		null
	)

	oauth2.getOAuthAccessToken('', {'grant_type':'client_credentials'}, function(e, accessToken ){
		console.log( accessToken )


		self.getTimeline = function(options, callback){
			console.log( "ACCESS TOKEN", accessToken )

			var params = {
				screen_name: options.handle,
				count: querySize
			}

			params = _(params).extend(options)

			request({
				url: 'https://api.twitter.com/1.1/statuses/user_timeline.json?' + qs.stringify(params),
				headers: { Authorization: 'Bearer ' + accessToken}
			}, function(err, res, body){
				if (callback) callback( JSON.parse(body) )
			})
		}

		self.storeFullTimeline = function(handle){
			var ref = new Firebase('https://twitterml.firebaseio.com/users/'+handle)

			ref.child('tweetRange').once('value', function(data){
				var tweetRange = data.val()
				
				if( tweetRange == null ) tweetRange = { oldest: 0, newest: 0 }

				var fetchOlderTweets = function(){
					// Get older posts
					var oldTweetOptions = {handle:handle}
					if( tweetRange.oldest != 0 ) oldTweetOptions.max_id = tweetRange.oldest				
					self.getTimeline(oldTweetOptions, storeTweets)
				}

				var fetchNewestTweets = function(){
					// Get the newest posts
					var newTweetOptions = {handle:handle}
					if( tweetRange.newest != 0 ) newTweetOptions.max_id = tweetRange.newest				
					self.getTimeline(newTweetOptions, storeTweets)
				}

				var storeTweets = function( tweets ){
					var goingOlder = false
					_(tweets).each(function(tweet){
						// Reverse the order. Top is newest, bottom is last.
						ref.child('tweets').child(tweet.id).setWithPriority(tweet, -tweet.id)

						if( tweet.id < tweetRange.oldest || tweetRange.oldest == 0 ){
							tweetRange.oldest = tweet.id
							goingOlder = true
						}

						if( tweet.id > tweetRange.newest || tweetRange.newest == 0 ){
							tweetRange.newest = tweet.id
						}

						ref.child('tweetRange').set( tweetRange )
					})

					// If we are fetching older tweets, and we got the full size of the query
					// then it means there is more to fetch.
					console.log( "Is going older?", goingOlder, "Num tweets fetched", tweets.length )
					if( goingOlder && tweets.length != 0 ){
						console.log( 'Fetching Older Tweets...')
						fetchOlderTweets()
					}
					
				}

				fetchNewestTweets()
				fetchOlderTweets()
				

			})



		}

		onDone.apply( self )
	})
}

var creds = {
	consumer_key:'RFbXVk9AK22Zxrv4stHtDOISq',
	consumer_secret:'nFwzQUh3muar9OGm4nDVvQ6DXVHq0wEu41II0dSjNHrohbS0CI'
}

var twit = new Twitter(creds, function(){
	this.storeFullTimeline('jawbone')
})



