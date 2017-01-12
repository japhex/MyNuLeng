;(function($) {

	$.fullwidthAudioPlayer = {version: '2.0.1', author: 'Rafael Dery'};

	jQuery.fn.fullwidthAudioPlayer = function(arg) {

		var options = $.extend({},$.fn.fullwidthAudioPlayer.defaults,arg);

		var $elem,
			$body = $('body'),
			$wrapper,
			$main,
			$wrapperToggle,
			$actions,
			$timeBar,
			$playlistWrapper,
			playlistCreated,
			paused,
			player,
			currentTime,
			totalHeight = 0,
			loadingIndex = -1,
			currentVolume = 1,
			currentIndex = -1,
			isPopupWin = false,
			playlistIsOpened = false,
			popupMode = false,
			playAddedTrack = false,
			playerDestroyed = false,
			loopTrack = false,
			localStorageAvailable,
			anonymFuncs = {},
			//stores all tracks
			tracks = [];

		function _init(elem) {

			// @@include('../envato/evilDomain.js')

			$elem = $(elem).hide();

			//check if script is executed in the popup window
			isPopupWin = elem.id == 'fap-popup';

			if(_detectMobileBrowsers(true)) {

				if(options.hideOnMobile) { return false; }
				options.autoPlay = false;
				options.volume = false;
				options.popup = true;
				options.wrapperPosition = options.wrapperPosition === 'popup' ? 'bottom' : options.wrapperPosition;

			}

			localStorageAvailable = _localStorageAvailable();

			if(window.localStorage.getItem('fap-keep-closed') == 1 && options.keepClosedOnceClosed && localStorageAvailable) {
				options.opened = false;
			}

			//check if a popup window exists
			playlistCreated = Boolean(window.fapPopupWin);
			if(!options.autoPopup) { playlistCreated = true; }
			paused = !options.autoPlay;

			_documentTrackHandler();

			totalHeight = options.playlist ? options.height+options.playlistHeight : options.height;

			if(options.wrapperPosition == "popup" && !isPopupWin) {

				options.layout = 'fullwidth';
				popupMode = true;
				if(options.autoPopup && !window.fapPopupWin) {
					_addTrackToPopup($elem.html(), options.autoPlay);
				}

				return false;
			}

			//init soundcloud
			if(window.SC && options.soundCloudClientID && options.soundCloudClientID.length > 0) {
				SC.initialize({
					client_id: options.soundCloudClientID
				});
			}

			anonymFuncs.loadHTML = function(html) {

				var wrapperClass = options.wrapperPosition.replace('#', '');
				$wrapper = $($.parseHTML(html)).addClass('fap-animated fap-position-'+wrapperClass);
				$main = $wrapper.children('.fap-main');
				$wrapperToggle = $main.children('.fap-toggle');
				$actions = $main.find('.fap-actions');
				$timeBar = $main.find('.fap-timebar');
				$playlistWrapper = $main.find('.fap-playlist-wrapper .fap-list');

				if(options.wrapperPosition.substring(0, 1) === '#') {
					$(options.wrapperPosition).html($wrapper.addClass('fap-custom-element'));
				}
				else {
					$body.append($wrapper);
				}


				/**
			     * Gets fired as soon as the HTML has been loaded.
			     *
			     * @event FancyProductDesigner#templateLoad
			     * @param {Event} event
			     * @param {string} URL - The URL of the loaded template.
			     */
				$elem.trigger('templateLoad', [this.url]);

				_setup();

			};

			$.post(options.htmlURL, anonymFuncs.loadHTML);

		};

		function _setup() {

			//SET COLORS AND LAYOUT
			$main.find('.fap-toolbar > div').css('height', options.height);
			$main.find('.fap-track-info .fap-cover-wrapper').css({
				'borderColor': options.strokeColor,
				width: $main.find('.fap-track-info .fap-cover-wrapper').outerHeight()
			});
			$playlistWrapper.parents('.fap-playlist-wrapper:first').css('height', options.playlistHeight);

			//position main wrapper
			$wrapper.addClass(isPopupWin ? 'fap-popup-enabled' : 'fap-alignment-'+options.mainPosition);

			$wrapper.css('color', options.mainColor);
			$main.find('.fap-sub-title, .fap-links > a').css('color', options.metaColor);

			if(options.layout == "fullwidth") {

				$wrapper.addClass('fap-fullwidth')
				.css({
					background: options.wrapperColor,
					'borderColor': options.strokeColor
				});

			}
			else if(options.layout == "boxed") {

				$wrapper.addClass('fap-boxed');
				$main.css({
					background: options.wrapperColor,
					'borderColor': options.strokeColor
				});

			}

			$main.children('.fap-toggle').css({
				background: options.wrapperColor,
				'borderColor': options.strokeColor
			});

			$wrapper.find('.fap-preloader').css({
				background: options.wrapperColor,
			}).find('.fap-loading-text').html(options.loadingText);

			$wrapper.find('.fap-spinner > div, .fap-progress-bar, .fap-volume-indicator').css({
				background: options.mainColor,
			});

			$wrapper.find('.fap-volume-scrubber, .fap-buffer-bar').css({
				background: options.fillColor,
			});

			$wrapper.find('.fap-loading-bar').css({
				'borderColor': options.fillColor,
			});


			//SET LABELS
			$main.find('.fap-share-fb').html(options.facebookText);
			$main.find('.fap-share-tw').html(options.twitterText);
			$main.find('.fap-download').html(options.downloadText);

			$actions.find('.fap-open-popup').click(function() {

				popupMode = true;
				options.selectedIndex = currentIndex;

				var html = '';
				for(var i=0; i < tracks.length; ++i) {
					var track = tracks[i];
					html += '<a href="'+(track.permalink ? track.permalink_url : track.stream_url)+'" title="'+(track.title)+'" target="'+(track.permalink_url)+'" rel="'+(track.artwork_url)+'"></a>';

					if(track.meta && track.meta.length) {
						html += '<span>'+(track.meta)+'</span>';
					}
				}

				_addTrackToPopup(html, !paused, false);

				$.fullwidthAudioPlayer.clear();
				$wrapper.remove();


			}).toggle(Boolean(options.popup && !isPopupWin) && !_detectMobileBrowsers(true));

			//create visual playlist if requested
			$actions.find('.fap-toggle-playlist').toggle(Boolean(options.playlist));
			$playlistWrapper.parents('.fap-playlist-wrapper:first').toggle(Boolean(options.playlist));
			if(Boolean(options.playlist)) {

				if(options.wrapperPosition == 'top') {
					$playlistWrapper.parents('.fap-playlist-wrapper:first').insertBefore($main.children('.fap-toolbar'));
				}

				$main.find('.fap-scroll-area').mCustomScrollbar();

				if(!isPopupWin) {

					//playlist switcher
					$actions.find('.fap-toggle-playlist').click(function() {
						$.fullwidthAudioPlayer.setPlayerPosition(playlistIsOpened ? 'closePlaylist' : 'openPlaylist', true)

					});

				}

				$main.find('.fap-playlist-wrapper .fap-empty').click(function() {

					$.fullwidthAudioPlayer.clear();

				});

				$playlistWrapper.on('click', '.fap-title', function() {

					var $listItem = $(this).parent();
					if($listItem.hasClass('fap-prevent-click')) {
						$listItem.removeClass('fap-prevent-click');
					}
					else {
						var index = $playlistWrapper.children('.fap-item').index($listItem);
						$.fullwidthAudioPlayer.selectTrack(index, true);
					}

				});

				$playlistWrapper.on('click', '.fap-remove', function() {

					var $listItem = $(this).parents('.fap-item:first'),
						index = $playlistWrapper.children('.fap-item').index($listItem);

					tracks.splice(index, 1);
					$listItem.remove();

					if(index == currentIndex) {
						currentIndex--;
						index = index == tracks.length ? 0 : index;
					    $.fullwidthAudioPlayer.selectTrack(index, paused ? false : true);
					}
					else if(index < currentIndex) {
						currentIndex--;
					}

					if(options.storePlaylist && localStorageAvailable) { window.localStorage.setItem('fap-playlist', JSON.stringify(tracks)); }

				});

				//make playlist sortable
				if(options.sortable) {

					var oldIndex;
					$playlistWrapper.sortable({axis: 'y'}).on('sortstart', function(evt, ui) {

						ui.item.addClass('fap-prevent-click');
						oldIndex = $playlistWrapper.children('.fap-item').index(ui.item);

					});

					$playlistWrapper.sortable({axis: 'y'}).on('sortupdate', function(evt, ui) {

						var targetIndex = $playlistWrapper.children('.fap-item').index(ui.item);
						var item = tracks[oldIndex];
						var currentTitle = tracks[currentIndex].title;
						tracks.splice(oldIndex, 1);
						tracks.splice(targetIndex, 0, item);
						_updateTrackIndex(currentTitle);

						if(options.storePlaylist && localStorageAvailable) { window.localStorage.setItem('fap-playlist', JSON.stringify(tracks)); }
					});

				}

				$main.find('.fap-shuffle').click(function() {
					_shufflePlaylist();
				}).toggle(Boolean(options.shuffle));

				$main.find('.fap-loop').click(function() {

					loopTrack = !loopTrack;
					$(this).css('border-color', options.strokeColor)
					.toggleClass('fap-enabled');

				});

			}

			//volume
			$main.find('.fap-volume-scrubber').click(function(evt) {

				var value = (evt.pageX - $(this).offset().left) / $main.find('.fap-volume-scrubber').width();
				$.fullwidthAudioPlayer.volume(value);

			});

			$main.find('.fap-volume-icon').dblclick(function() {
				if($(this).children('span').hasClass('fap-icon-volume')) {
					$.fullwidthAudioPlayer.volume(0);
				}
				else {
					$.fullwidthAudioPlayer.volume(100);
				}
			});
			$main.find('.fap-volume-wrapper').toggle(Boolean(options.volume));

			//timebar
			$timeBar.find('.fap-buffer-bar, .fap-progress-bar').click(function(evt) {

				var progress = (evt.pageX - $(this).parent().offset().left) / $timeBar.width();
				player.seek(progress * player.duration());
				_setSliderPosition(progress);

			});

			$main.find('.fap-links').toggleClass('fap-hidden', !Boolean(options.socials));

			$main.find('.fap-skip-previous').click(function() {
				$.fullwidthAudioPlayer.previous();
			});
			$main.find('.fap-skip-next').click(function() {
				$.fullwidthAudioPlayer.next();
			});
			$main.find('.fap-play-pause').click(function() {
				$.fullwidthAudioPlayer.toggle();
			});

			//switcher handler
			$wrapperToggle.click(function() {

				$.fullwidthAudioPlayer.setPlayerPosition(options.opened ? 'close' : 'open', true);

			});

			//set default wrapper position
			var defaultPos = options.opened ? 'open' : 'close';
			$.fullwidthAudioPlayer.setPlayerPosition(isPopupWin ? 'openPlaylist' : defaultPos, !isPopupWin);

			//add tracks from init element and all autoenqueue elements
			if(options.xmlPath) {

				//get playlists from xml file
				$.ajax({ type: "GET", url: options.xmlPath, dataType: "xml", cache: false, success: function(xml) {

					var playlists = $(xml).find('playlists'),
					    playlistId = options.xmlPlaylist ? playlistId = options.xmlPlaylist : playlistId = playlists.children('playlist:first').attr('id');

					_createInitPlaylist(playlists.children('playlist[id="'+playlistId+'"]').children('track'));

					//check if custom xml playlists are set in the HTML document
					$('.fap-xml-playlist').each(function(i, playlist) {
						var $playlist = $(playlist);
						$playlist.append('<h3>'+playlist.title+'</h3><ul class="fap-my-playlist"></ul>');
						//get the start playlist
						playlists.children('playlist[id="'+playlist.id+'"]').children('track').each(function(j, track) {
							var $track = $(track);
							var targetString = $track.attr('target') ? 'target="'+$track.attr('target')+'"' : '';
							var relString = $track.attr('rel') ? 'rel="'+$track.attr('rel')+'"' : '';
							var metaString = $track.find('meta') ? 'data-meta="#'+playlist.id+'-'+j+'"' : '';
							$playlist.children('ul').append('<li><a href="'+$track.attr('href')+'" title="'+$track.attr('title')+'" '+targetString+' '+relString+' '+metaString+'>'+$track.attr('title')+'</a></li>');
							$playlist.append('<span id="'+playlist.id+'-'+j+'">'+$track.find('meta').text()+'</span>');
						});
					});

				},
				error: function() {
					alert("XML file could not be loaded. Please check the XML path!");
				}
			  });

			}
			else {

				_createInitPlaylist( $elem.children('a').toArray().concat($('.fap-single-track[data-autoenqueue="yes"]').toArray()) );

			}

			$elem.trigger('setupDone');

		};

		function _createInitPlaylist(initTracks) {

			if(options.storePlaylist && localStorageAvailable) {
				var initFromBrowser = Boolean(window.localStorage.getItem('fap-playlist'));
			}

			initTracks = initFromBrowser ? JSON.parse(window.localStorage.getItem('fap-playlist')) : initTracks;

			$body.on('fap-tracks-stored', function() {

				++loadingIndex;
				if(loadingIndex < initTracks.length) {

					//get stored playlist from browser when available
					if(initFromBrowser) {
						var initTrack = initTracks[loadingIndex];
						$.fullwidthAudioPlayer.addTrack(initTrack.stream_url, initTrack.title, initTrack.meta, initTrack.artwork_url, initTrack.permalink_url, options.autoPlay);
					}
					else { //get playlist from DOM
						var initTrack = $(initTracks[loadingIndex]);

						var trackUrl = initTrack.data('href') ? initTrack.data('href') : initTrack.attr('href'),
							trackTitle = initTrack.data('title') ? initTrack.data('title') : initTrack.attr('title'),
							trackTarget = initTrack.data('target') ? initTrack.data('target') : initTrack.attr('target'),
							trackRel = initTrack.data('rel') ? initTrack.data('rel') : initTrack.attr('rel');

						$.fullwidthAudioPlayer.addTrack(
							trackUrl,
							trackTitle,
							options.xmlPath ? initTrack.children('meta').text() : $elem.find(initTrack.data('meta')).html(),
							trackRel,
							trackTarget,
							options.autoPlay
						);

					}
				}
				else {

					$body.off('fap-tracks-stored');
					if(options.randomize) { _shufflePlaylist(); }

					ready();

				}

			}).trigger('fap-tracks-stored');

		};

		function ready() {

			//register keyboard events
			if(options.keyboard) {
				$(document).keyup(function(evt) {
					switch (evt.which) {
						case 32:
						$.fullwidthAudioPlayer.toggle();
						break;
						case 39:
						$.fullwidthAudioPlayer.next();
						break;
						case 37:
						$.fullwidthAudioPlayer.previous();
						break;
						case 38:
						$.fullwidthAudioPlayer.volume(currentVolume+.05);
						break;
						case 40:
						$.fullwidthAudioPlayer.volume(currentVolume-.05);
						break;
					}
				});
			}

			$wrapper.children('.fap-preloader').fadeOut();

			//fire on ready handler
			$elem.trigger('onFapReady');
			playlistCreated = true;

			//start playing track when addTrack method is called
			$body.on('fap-tracks-stored', function(evt, trackIndex) {
				if(playAddedTrack) { $.fullwidthAudioPlayer.selectTrack(trackIndex, playAddedTrack); }
			});

			//select first track when playlist has tracks
		    $.fullwidthAudioPlayer.selectTrack(options.selectedIndex, _detectMobileBrowsers(true) ? false : options.autoPlay);
			options.autoPlay ? $elem.trigger('onFapPlay') : $elem.trigger('onFapPause');

		};


		//*********************************************
		//************** API METHODS ******************
		//*********************************************

		//removes all tracks from the playlist and stops playing - states: open, close, openPlaylist, closePlaylist
		$.fullwidthAudioPlayer.setPlayerPosition = function(state, animated) {

			$wrapper.removeClass('fap-open fap-close fap-openPlaylist fap-closePlaylist')
			.addClass('fap-'+state)
			.toggleClass('fap-animated', animated);

			var posType = options.wrapperPosition == 'top' ? 'top' : 'bottom';
			if(state == 'open') {

				$wrapperToggle.html(options.closeLabel);

				if(options.wrapperPosition == 'top' && options.animatePageOnPlayerTop) {
					$body.toggleClass('fap-animated', animated)
					.css('marginTop', $main.find('.fap-toolbar').height());
				}

				$wrapper.css(posType, options.playlist ? -options.playlistHeight : 0);

				if(options.keepClosedOnceClosed && localStorageAvailable) {
					window.localStorage.setItem('fap-keep-closed', 0);
				}

				options.opened = true;

			}
			else if(state == 'close') {

				if(options.wrapperPosition == 'top' && options.animatePageOnPlayerTop) {
					$body.toggleClass('fap-animated', animated)
					.css('marginTop', 0);
				}

				$wrapperToggle.html(options.openLabel);
				$wrapper.css(posType, -$wrapper.outerHeight());

				if(options.keepClosedOnceClosed && localStorageAvailable) {
					window.localStorage.setItem('fap-keep-closed', 1);
				}

				options.opened = playlistIsOpened = false;

			}
			else if(state == 'openPlaylist') {

				if(options.wrapperPosition == 'top' && options.animatePageOnPlayerTop) {
					$body.toggleClass('fap-animated', animated)
					.css('marginTop', $wrapper.outerHeight());
				}

				$wrapper.css(posType, 0);
				playlistIsOpened = true;
			}
			else if(state == "closePlaylist") {

				if(options.wrapperPosition == 'top' && options.animatePageOnPlayerTop) {
					$body.toggleClass('fap-animated', animated)
					.css('marginTop', $main.find('.fap-toolbar').height());
				}

				$wrapper.css(posType, -options.playlistHeight);
				playlistIsOpened = false;
			}

		};

		//select a track by index
		$.fullwidthAudioPlayer.selectTrack = function(index, playIt) {

			playIt = Boolean(playIt);

			if(tracks.length <= 0) {
				$.fullwidthAudioPlayer.clear();
				return false;
			}

			if(index == currentIndex) {
				$.fullwidthAudioPlayer.toggle();
				return false;
			}
			else if(index < 0) { currentIndex = tracks.length - 1; }
			else if(index >= tracks.length) {
				currentIndex = 0;
				playIt = options.loopPlaylist;
			}
			else { currentIndex = index; }

			paused = !playIt;

			var isSoundcloud = RegExp('http(s?)://soundcloud').test(tracks[currentIndex].permalink_url);

			//destroy player
			if(player) {
				player.unload();
				playerDestroyed = true;
			}

			$main.find('.fap-cover-wrapper').toggle(Boolean(tracks[currentIndex].artwork_url));
			$main.find('.fap-cover-wrapper img').attr('src', tracks[currentIndex].artwork_url);
			$main.find('.fap-meta .fap-title').html(tracks[currentIndex].title);
			$main.find('.fap-meta .fap-sub-title').html(isSoundcloud ? tracks[currentIndex].genre : tracks[currentIndex].meta);

			if(tracks[currentIndex].permalink_url) {

				$main.find('.fap-links').show();
				var facebookLink = 'http://www.facebook.com/sharer.php?u='+encodeURIComponent(tracks[currentIndex].permalink_url);
				var twitterLink = 'http://twitter.com/share?url='+encodeURIComponent(tracks[currentIndex].permalink_url)+'&text='+encodeURIComponent(tracks[currentIndex].title)+'';

				$main.find('.fap-share-fb').attr('href', facebookLink);
				$main.find('.fap-share-tw').attr('href', twitterLink);
				$main.find('.fap-sc').attr('href', tracks[currentIndex].permalink_url);

			}
			else {
				$main.find('.fap-links').hide();
			}

			$timeBar.find('.fap-progress-bar').width(0);
			$timeBar.find('.fap-total-time, .fap-current-time').text('00:00:00');

			if(options.playlist) {

				$playlistWrapper.children('.fap-item').removeClass('fap-active').css('background', 'transparent')
				.eq(currentIndex).addClass('fap-active').css('background', options.fillColor);

				$playlistWrapper.parents('.fap-scroll-area:first')
				.mCustomScrollbar('scrollTo', $playlistWrapper.children('.fap-item').eq(0).outerHeight(true) * currentIndex);

			}

			//options for howl
			var howlOptions = {
				format: ['mp3'],
				autoplay: playIt,
				preload: options.autoLoad,
				volume: currentVolume,
				onseek: function() {
					_log("onseek");
				},
				onload: function() {

					playerDestroyed = false;
					_log("onload");

				},
				onplay: function() {

					_togglePlayIcon(false);
					paused = false;

					 // Start upating the progress of the track.
					 requestAnimationFrame(_onPlaying.bind(_onPlaying));

					 _log("onplay");

				},
				onpause: function() {

					_togglePlayIcon(true);
					paused = true;

					_log("onpause");

				},
				onstop: function() {

					_togglePlayIcon(true);
					paused = true;

					_log("onstop");

				},
				onloaderror: function() {

					_log("Track could not be loaded! Please check the URL: "+tracks[currentIndex].stream_url);

				},
				onend: function() {

					_togglePlayIcon(true);

					console.log(loopTrack);
					if(loopTrack) {
						player.seek(0);
						player.play();
					}
					else if(options.playNextWhenFinished && !playerDestroyed) {
						$.fullwidthAudioPlayer.next();
					}
					else {
						player.stop();
						paused = true;
					}

					_log("onend");

				},
				onxhrprogress: function(evt) {

					$timeBar.find('.fap-buffer-bar').width(Math.round((evt.loaded / evt.total) * 100)+'%');

					_log('Bytes loaded: '+ evt.loaded + ', Total bytes: '+evt.total + ', Process in %: '+Math.round(evt.loaded / evt.total * 100));

				}
			};

			if(isSoundcloud) {

				$main.find('.fap-sc').show();
				$main.find('.fap-download').toggle(tracks[currentIndex].downloadable);
				if(tracks[currentIndex].downloadable) {
					$main.find('.fap-download').attr('href', tracks[currentIndex].download_url+'?client_id='+options.soundCloudClientID);
				}

				$.extend(howlOptions, {src: [tracks[currentIndex].stream_url+'?client_id='+options.soundCloudClientID]});

			}
			else {
				$main.find('.fap-download, .fap-sc').hide();
				$.extend(howlOptions, {src: [tracks[currentIndex].stream_url]});
			}

			howlOptions = $.extend({}, howlOptions, options.howlOptions);
			player = new Howl(howlOptions);

			if(!options.opened && (playIt && options.openPlayerOnTrackPlay)  && !isPopupWin ) {
				$.fullwidthAudioPlayer.setPlayerPosition('open', true);
			}

			$elem.trigger('onFapTrackSelect', [ tracks[currentIndex], playIt ]);

		};

		//global method for playing the current track
		$.fullwidthAudioPlayer.play = function() {

			if(currentIndex == -1) {
				$.fullwidthAudioPlayer.next();
			}
			if(tracks.length > 0) {

				player.play();
				$elem.trigger('onFapPlay');
			}

		};

		//global method for pausing the current track
		$.fullwidthAudioPlayer.pause = function() {

			if(tracks.length > 0) {

				player.pause();
				$elem.trigger('onFapPause');

			}

		};

		//global method for pausing/playing the current track
		$.fullwidthAudioPlayer.toggle = function() {
			if(paused) {
				$.fullwidthAudioPlayer.play();
			}
			else {
				$.fullwidthAudioPlayer.pause();
			}
		};

		//global method for playing the previous track
		$.fullwidthAudioPlayer.previous = function() {

			if(tracks.length > 0) {
				$.fullwidthAudioPlayer.selectTrack(currentIndex-1, true);
			}

		};

		//global method for playing the next track
		$.fullwidthAudioPlayer.next = function() {

			if(tracks.length > 0) {
				$.fullwidthAudioPlayer.selectTrack(currentIndex+1, true);
			}

		};

		$.fullwidthAudioPlayer.volume = function(value) {

			if(tracks.length > 0) {

				if(value < 0 ) value = 0;
				if(value > 1 ) value = 1;
				currentVolume = value;

				if(player) { player.volume(currentVolume); }
				$main.find('.fap-volume-indicator').width(value * $main.find('.fap-volume-scrubber').width());

				$main.find('.fap-volume-icon > span')
				.toggleClass('fap-icon-volume', value != 0)
				.toggleClass('fap-icon-volume-off', value == 0);

			}

		};

		//global method for adding a track to the playlist
		$.fullwidthAudioPlayer.addTrack = function(trackUrl, title, meta, cover, linkUrl, playIt) {

			if(trackUrl == null || trackUrl == '') {
				alert('The track with the title "'+title+'" does not contain a track resource!');
				return false;
			}

			title = title === undefined ? '' : title;
			meta = meta === undefined ? '' : meta;
			cover = cover === undefined ? '' : cover;
			linkUrl = linkUrl === undefined ? '' : linkUrl;
			playIt = playIt === undefined ? false : playIt;

			//add to popup
			if(popupMode && window.fapPopupWin && !window.fapPopupWin.closed) {
				window.fapPopupWin.addTrack(trackUrl,title,meta,cover,linkUrl, playIt);
				window.fapPopupWin.focus();
				return false;
			}

			var base64Matcher = new RegExp("^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$");
			if(base64Matcher.test(trackUrl)) {
				trackUrl = Base64.decode(trackUrl);
			}

			playAddedTrack = playIt;

			function _tracksReceived(data, error) {

				var trackIndex = -1, temp = -1;
				if(data && error === undefined) {

					if(Array.isArray(data)) {

						for(var i=0; i<data.length; ++i) {
							temp = _storeTrackDatas(data[i]);
							trackIndex = temp < trackIndex ? temp : trackIndex;
							if(i == 0) { trackIndex = temp; }
						}

					}
					else {
						trackIndex = _storeTrackDatas(data);
					}

				}

				$elem.trigger('onFapTracksAdded', [tracks]);
				$body.trigger('fap-tracks-stored', [trackIndex]);

			};

			var addTrackObj = {
				stream_url: trackUrl,
				title: title,
				meta: meta,
				artwork_url: cover,
				permalink_url:linkUrl
			};

			if(RegExp('http(s?)://soundcloud').test(trackUrl) || RegExp('http(s?)://official.fm').test(trackUrl)) { //soundcloud or official.fm

				if(!options.soundCloudClientID && options.soundCloudClientID.length == 0) {
					alert('Please enter a SoundCloud Client ID to use tracks from SoundCloud. More infos can be found in the doc!');
					return;
				}

				new FAPSoundObject(addTrackObj, _tracksReceived);
			}
			else {

				_tracksReceived(addTrackObj);

			}

		};

		//pop up player
		$.fullwidthAudioPlayer.popUp = function(enqueuePageTracks) {

			enqueuePageTracks = typeof enqueuePageTracks !== 'undefined' ? enqueuePageTracks : true;

			if(popupMode) {
				if(!window.fapPopupWin || window.fapPopupWin.closed) {
					_addTrackToPopup('', false, enqueuePageTracks);
				}
				else {
					window.fapPopupWin.focus();
				}
			}

		};

		//removes all tracks from the playlist and stops playing
		$.fullwidthAudioPlayer.clear = function() {

			//reset everything
			$main.find('.fap-cover-wrapper').hide();
			$main.find('.fap-title, .fap-sub-title').html('');
			$main.find('.fap-links').hide();
			$timeBar.find('.fap-progress-bar').width(0);
			$timeBar.children('.fap-current-time, .fap-total-time').text('00:00:00');

			paused = true;
			currentIndex = -1;

			if($playlistWrapper) {
			    $playlistWrapper.empty();
			}
			tracks = [];

			if(player) {
				player.pause();
			}

			$elem.trigger('onFapClear');

		};

		//store track datas from soundcloud
		function _storeTrackDatas(data) {

			//search if a track with a same title already exists
			var trackIndex = tracks.length;

			for(var i= 0; i < tracks.length; ++i) {
				if(data.stream_url == tracks[i].stream_url) {
					trackIndex = i;
					return trackIndex;
					break;

				}
			}

			tracks.push(data);
			_createPlaylistTrack(data.artwork_url, data.title);

			if(options.storePlaylist && localStorageAvailable) { window.localStorage.setItem('fap-playlist', JSON.stringify(tracks)); }

			return trackIndex;
		};

		//player playing
		function _onPlaying() {

		    _setTimes(player.seek() || 0, player.duration());

		    if (player.playing()) {
				requestAnimationFrame(_onPlaying.bind(_onPlaying));
		    }

		};

		//update the current and total time
		function _setTimes(position, duration) {

			if(typeof position === 'number') {

				var time = _convertTime(position);
				if(currentTime != time) {

					$timeBar.children('.fap-current-time').text(time);
					$timeBar.children('.fap-total-time').text(_convertTime(duration));
					_setSliderPosition(position / duration);

				}

				currentTime = time;
			}

		};

		//set the time slider position
		function _setSliderPosition(playProgress) {

		    $timeBar.find('.fap-progress-bar').width(playProgress * $timeBar.width());

		};

		function _shufflePlaylist() {

			if($playlistWrapper) {
				$playlistWrapper.empty();
			}

			//action for the shuffle button
			if(currentIndex != -1) {

				var tempTitle = tracks[currentIndex].title;
				tracks.shuffle();
				_updateTrackIndex(tempTitle);
				for(var i=0; i < tracks.length; ++i) {
					_createPlaylistTrack(tracks[i].artwork_url, tracks[i].title);
				}
				$playlistWrapper.children('.fap-item').eq(currentIndex).addClass('fap-active').css('background', options.fillColor);
				$playlistWrapper.parents('.fap-scroll-area:first').mCustomScrollbar('scrollTo', 0);

			}
			//action for randomize option
			else {

				tracks.shuffle();
				for(var i=0; i < tracks.length; ++i) {
					_createPlaylistTrack(tracks[i].artwork_url, tracks[i].title);
				}

			}

			if(options.storePlaylist && localStorageAvailable) { window.localStorage.setItem('fap-playlist', JSON.stringify(tracks)); }

		};

		//converts seconds into a well formatted time
		function _convertTime(second) {

			second = Math.abs(second);
			var val = new Array();
			val[0] = Math.floor(second/3600%24);//hours
			val[1] = Math.floor(second/60%60);//mins
			val[2] = Math.floor(second%60);//secs
			var stopage = true;
			var cutIndex  = -1;
			for(var i = 0; i < val.length; i++) {
				if(val[i] < 10) val[i] = "0" + val[i];
				if( val[i] == "00" && i < (val.length - 2) && !stopage) cutIndex = i;
				else stopage = true;
			}
			val.splice(0, cutIndex + 1);
			return val.join(':');
		};

		//create a new playlist item in the playlist
		function _createPlaylistTrack(cover, title) {

			if(!options.playlist) { return false; }
            var coverDom = cover ? '<img src="'+cover+'" />' : '<div class="fap-cover-replace-small"></div>';

			$playlistWrapper.append('<div class="fap-item fap-clearfix">'+coverDom+'<span class="fap-title">'+title+'</span><span class="fap-remove"><span class="fap-icon-close"></span></span></div>');

		};

		function _togglePlayIcon(play) {

			$main.find('.fap-icon-play').toggleClass('fap-hidden', !play);
			$main.find('.fap-icon-pause').toggleClass('fap-hidden', play);

		};

		//array shuffle
		function _arrayShuffle(){
		  var tmp, rand;
		  for(var i =0; i < this.length; i++){
			rand = Math.floor(Math.random() * this.length);
			tmp = this[i];
			this[i] = this[rand];
			this[rand] = tmp;
		  }
		};
		Array.prototype.shuffle = _arrayShuffle;

		function _updateTrackIndex(title) {
			for(var i=0; i < tracks.length; ++i) {
				if(tracks[i].title == title) { currentIndex = i; }
			}
		};

		function _detectMobileBrowsers(includeIpad) {

			return includeIpad ? /Android|webOS|iPhone|iPod|iPad|BlackBerry/i.test(navigator.userAgent) : /Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent);

		};

		function _localStorageAvailable() {

			localStorageAvailable = true;
			//execute this because of a ff issue with localstorage
			try {
				window.localStorage.length;
				window.localStorage.setItem('fap-storage', 'just-testing');
				//window.localStorage.clear();
			}
			catch(error) {
				localStorageAvailable = false;
				//In Safari, the most common cause of this is using "Private Browsing Mode". You are not able to save products in your browser.
			}

			return localStorageAvailable;

		};

		function _log(value) {

			if(options.debug && window.console && window.console.log) {
				console.log(value);
			}

		}

		function _createHtmlFromNode(node) {

			var trackUrl = node.data('href') ? node.data('href') : node.attr('href'),
				trackTitle = node.data('title') ? node.data('title') : node.attr('title'),
				trackTarget = node.data('target') ? node.data('target') : node.attr('target'),
				trackRel = node.data('rel') ? node.data('rel') : node.attr('rel');

			var html = '<a href="'+trackUrl+'" title="'+(trackTitle ? trackTitle : '')+'" target="'+(trackTarget ? trackTarget : '')+'" rel="'+(trackRel ? trackRel : '')+'" data-meta="'+(node.data('meta') ? node.data('meta') : '')+'"></a>';
			if(node.data('meta')) {
				var metaText = $('body').find(node.data('meta')).html() ? $('body').find(node.data('meta')).html() : '';
				html += '<span id="'+node.data('meta').substring(1)+'">'+metaText+'</span>';
			}
			return html;

		};

		function _addTrackToPopup(html, playIt, enqueuePageTracks, clearPlaylist) {

			enqueuePageTracks = typeof enqueuePageTracks !== 'undefined' ? enqueuePageTracks : true;
			clearPlaylist = typeof clearPlaylist !== 'undefined' ? clearPlaylist : false;
			selectIndex = typeof selectIndex !== 'undefined' ? selectIndex : 0;

			if( !window.fapPopupWin || window.fapPopupWin.closed ) {

				var windowWidth = 980;
				var centerWidth = (window.screen.width - windowWidth) / 2;
    			var centerHeight = (window.screen.height - totalHeight) / 2;
    			var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;

				window.fapPopupWin = window.open(options.popupUrl, '', 'menubar=no,toolbar=no,location=yes,status=no,width='+windowWidth+',height='+totalHeight+',left='+centerWidth+',top='+centerHeight+'');

				if(window.fapPopupWin == null) {
					alert(options.popupBlockerText);
				}

				$(window.fapPopupWin).load(function() {

					window.fapPopupWin.resizeTo(windowWidth, totalHeight);
					window.fapPopupWin.document.title = options.popupTitle;

					var interval = setInterval(function() {
						if(window.setupDone) {

							//var missingHeight = Math.abs($(window.fapPopupWin.document).find('.fap-wrapper').offset().top);
							var missingHeight = Math.abs(totalHeight - window.fapPopupWin.innerHeight);
							window.fapPopupWin.resizeTo(windowWidth, (totalHeight + missingHeight));

							//timeout fot safari fix
							/*if(isSafari) {

								setTimeout(function() {
									missingHeight = Math.abs($(window.fapPopupWin.document).find('.fap-wrapper').offset().top);
									window.fapPopupWin.resizeTo(windowWidth, (totalHeight + missingHeight));
								}, 10);

							}*/

							clearInterval(interval);

						}
					}, 50);


					if(enqueuePageTracks) {
						$('.fap-single-track[data-autoenqueue="yes"]').each(function(i, item) {
							var node = $(item);
							html += _createHtmlFromNode(node);
					    });
					}

					options.autoPlay = playIt;
					window.fapPopupWin.initPlayer(options, html);
					playlistCreated = true;

				});

			}
			else {

				if(clearPlaylist) {
					window.fapPopupWin.clear();
				}

				var $node = $(html);

				var trackUrl = $node.data('href') ? $node.data('href') : $node.attr('href'),
					trackTitle = $node.data('title') ? $node.data('title') : $node.attr('title'),
					trackTarget = $node.data('target') ? $node.data('target') : $node.attr('target'),
					trackRel = $node.data('rel') ? $node.data('rel') : $node.attr('rel');

				$.fullwidthAudioPlayer.addTrack(
					trackUrl,
					trackTitle,
					($node.data('meta') ? $('body').find($node.data('meta')).html() : ''),
					trackRel,
					trackTarget,
					playIt
				);

			}

		}

		function _documentTrackHandler() {

			$body.on('click', '.fap-my-playlist li a, .fap-my-playlist li span, .fap-single-track, .fap-add-playlist', _addTrackFromDocument);

			function _addTrackFromDocument(evt) {

				evt.preventDefault();

				if(!playlistCreated) { return false; }

				var node = $(this),
					playIt = true,
					clearPlaylist = false;

				if(node.data('enqueue')) {
					playIt = node.data('enqueue') == 'yes' ? false : true;
				}

				if(node.data('clear')) {
					clearPlaylist = node.data('clear') == 'yes';
				}

				if(popupMode) {

					//adding whole plalist to the player
					if(node.hasClass('fap-add-playlist')) {
						var playlistId = node.data('playlist'),
							tracks = jQuery('[data-playlist="'+playlistId+'"]').find('.fap-single-track'),
							html = _createHtmlFromNode($(tracks.get(0)));

						if(tracks.size() == 0) { return false; }

						//add first track to pop-up to open it
						_addTrackToPopup(html, playIt, clearPlaylist);
						tracks.splice(0, 1);

						window.fapReady = window.fapPopupWin.addTrack != undefined;
						//start interval for adding the playlist into the pop-up player
						var interval = setInterval(function() {
							if(window.fapReady) {
								clearInterval(interval);
								tracks.each(function(i, item) {
									_addTrackToPopup(item, playIt, clearPlaylist);
							    });
							}
						}, 50);
					}
					//adding a single track to the player
					else {
						var html = _createHtmlFromNode(node);
						_addTrackToPopup(html, playIt);
					}

				}
				else {

					//adding whole plalist to the player
					if(node.hasClass('fap-add-playlist')) {

						var playlistId = node.data('playlist'),
							tracks = jQuery('[data-playlist="'+playlistId+'"]').find('.fap-single-track');


						if(clearPlaylist) {
							$.fullwidthAudioPlayer.clear();
						}

						if(tracks.size() == 0) { return false; }

						loadingIndex = -1;

						function _addTrackFromPlaylist() {
							++loadingIndex;
							if(loadingIndex < tracks.size()) {

								var $track = tracks.eq(loadingIndex);

								var trackUrl = $track.data('href') ? $track.data('href') : $track.attr('href'),
									trackTitle = $track.data('title') ? $track.data('title') : $track.attr('title'),
									trackTarget = $track.data('target') ? $track.data('target') : $track.attr('target'),
									trackRel = $track.data('rel') ? $track.data('rel') : $track.attr('rel');

								$.fullwidthAudioPlayer.addTrack(
									trackUrl,
									trackTitle,
									$body.find($track.data('meta')).html(),
									trackRel,
									trackTarget,
									(loadingIndex == 0 && playIt)
								);

							}
							else {
								$body.off('fap-tracks-stored', _addTrackFromPlaylist);
							}
						};

						$body.on('fap-tracks-stored', _addTrackFromPlaylist);
						_addTrackFromPlaylist();

					}
					//adding a single track to the player
					else {

						var trackUrl = node.data('href') ? node.data('href') : node.attr('href'),
							trackTitle = node.data('title') ? node.data('title') : node.attr('title'),
							trackTarget = node.data('target') ? node.data('target') : node.attr('target'),
							trackRel = node.data('rel') ? node.data('rel') : node.attr('rel');

						$.fullwidthAudioPlayer.addTrack(
							trackUrl,
							trackTitle,
							$body.find(node.data('meta')).html(),
							trackRel,
							trackTarget,
							playIt
						);

					}

				}

			};

		};

		return this.each(function() {_init(this)});

	};

	//OPTIONS
	$.fn.fullwidthAudioPlayer.defaults = {
		wrapperPosition: 'bottom', //top, bottom, popup or since V2.0.0 you can define a custom element as container e.g. #my-fap-container
		mainPosition: 'center', //left, center or right
		wrapperColor: '#f0f0f0', //background color of the wrapper
		mainColor: '#3c3c3c',
		fillColor: '#e3e3e3',
		metaColor: '#666666',
		strokeColor: '#e0e0e0',
		twitterText: 'Share on Twitter',
		facebookText: 'Share on Facebook',
		downloadText: 'Download',
		layout: 'fullwidth', //V1.5 - fullwidth or boxed
		popupUrl: 'popup.html', //- since V1.3
		height: 80, // the height of the wrapper
		playlistHeight: 200, //set the playlist height for the scrolling
		opened: true, //default state - opened or closed
		volume: true, // show/hide volume control
		playlist: true, //show/hide playlist
		autoLoad: true, //preloads the audio file
		autoPlay: false, //enable/disbale autoplay
		playNextWhenFinished: true, //plays the next track when current one has finished
		keyboard: true, //enable/disable the keyboard shortcuts
		socials: true, //hide/show social links
		autoPopup: false, //pop out player in a new window automatically - since V1.3
		randomize: false, //randomize default playlist - since V1.3
		shuffle: true, //show/hide shuffle button - since V1.3
		sortable: false, //sortable playlist
		xmlPath: '', //the xml path
		xmlPlaylist: '', //the ID of the playlist which should be loaded into player from the XML file
		hideOnMobile: false, //1.4.1 - Hide the player on mobile devices
		loopPlaylist: true, //1.5 - When end of playlist has been reached, start from beginning
		storePlaylist: false, //1.5 - Stores the playlist in the browser
		keepClosedOnceClosed: false, //1.6 - Keeps the player closed, once the user closed it
		animatePageOnPlayerTop: false, //1.6.1 - moves the whole page when the player is at the top, so the player does not overlap anything from the page
		openLabel: '+', //1.6.1 - the label for the close button
		closeLabel: '&times;', //1.6.1 - the label for the open button
		openPlayerOnTrackPlay: false, //1.6.1 - opens the player when a track starts playing
		popup: true, //1.6.1 - enable popup button in the player
		selectedIndex: 0, // 1.6.1 - set start track by index when the player is created
		htmlURL: 'html/fwap.html', //2.0.0 - set the URL to the file containing all relevant HTML
		loadingText: 'Loading Playlist', // 2.0.0 - set the loading text
		popupTitle : 'Fullwidth Audio Player', // 2.0.0 - set the title of the popup player
		popupBlockerText: 'Pop-Up Music Player can not be opened. Your browser is blocking Pop-Ups. Please allow Pop-Ups for this site to use the Music Player.', // 2.0.0 - set the text for popup blocker
		howlOptions: {}, // 2.0.0 - set some custom options for howl (audio library) https://github.com/goldfire/howler.js#core
		debug: false, // 2.0.0 - makes some logs in the console
		soundCloudClientID: '' // 2.0.1 - you need to register an own soundcloud app and enter your client ID to avoid rate limits https://developers.soundcloud.com/docs/api/rate-limits#play-requests
	};

})(jQuery);