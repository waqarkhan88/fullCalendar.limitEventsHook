fullCalendar.limitEventsHook
============================

A jquery plugin like utility to hook with arshaw's Full calendar to limit number of events and show a more button which shows all the events of that day in popup. Currently works only with Month view.


Sample:
=======

	var myEventHook = new limitEventsHook({
	
		eventsLimit: 3,
		clickHandler: function(dayCell, eventsList) {
			var dialogBox = $("<div></div>");
			var eventsListUI = $("<ul></ul>");
			$(eventsList).each(function() {
				eventsListUI.append($("<li></li>").text(this.title));
			});
			$(dialogBox).append(eventsListUI);
			$(dialogBox).attr("title", "Events list for " + $(dayCell).data("date"));
			$(dialogBox).dialog({
				height: 300,
				width: 400,
				modal: true
			});
		}
	});

	$('#calendar').fullCalendar({
		editable: true,
		events: 'someurl',
		viewRender: myEventHook.hookByViewRender
	});
