/*!
 * LimitEventsHook v1.0
 * (c) 2014 Waqar Ali Khan
 */
 
 /*
 * Use fullcalendar.limitEventsHook.css for styling.
 * A Hook to limit events to a specified number.
 */
 
var limitEventsHook = (function ($, Hashtable) {
    // private variables
    var hookAttached;
	var eventsLimit;
	var isEventResizing;
	var eventRenderMap;
	var moreBtnClickHandler;

    // constructor
    var limitEventsHook = function (options) {
		hookAttached = false;
		eventsLimit = (options && options.eventsLimit) ? parseInt(options.eventsLimit) : 3;
		moreBtnClickHandler = (options && options.clickHandler) ? options.clickHandler : null;
		isEventResizing = false;
		eventRenderMap = new Hashtable();
    };

    // prototype
    limitEventsHook.prototype = {
        constructor: limitEventsHook,
		hookByViewRender: function (view, element) {
			if(view.name.toLowerCase() === "month") {
				if(!hookAttached) {
					view.calendar.options.eventDrop = eventDropHook;
					view.calendar.options.eventResize = eventResizeFinishedHook;
					view.calendar.options.eventResizeStart = eventResizeStartHook;
					view.calendar.options.eventRender = eventRenderHook;
					
					hookAttached = true;
				}

				viewRenderFinishedHook(view);
			}
		}
    };
	
	// private methods
	
	var eventDropHook = function(event, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view) {
		resetAllLimitEventsData(view);
	};
	
	var viewRenderFinishedHook = function(view) {
		resetAllLimitEventsData(view);
	};
	
	var eventResizeFinishedHook = function(event, dayDelta, minuteDelta, revertFunc, jsEvent, ui, view) {
		//console.log("Event Resized!, Event: " + event.id);
		isEventResizing = false;
		resetAllLimitEventsData(view);
	};
	
	var eventResizeStartHook = function(event, jsEvent, ui, view) {
		//console.log("Event Resize Start!, Event: " + event.id);
		isEventResizing = true;
	};
	
	var eventRenderHook = function(event, element, view) {
		//console.log("Event render!, Event: " + event.id);
		if(!isEventResizing) {
						
			if(!eventRenderMap.get(event)) {
				eventRenderMap.put(event, 0);
			}
							
			var startPos = view.dateToCell(event.start), 
				endPos = (!event.end ? view.dateToCell(event.start) : view.dateToCell(event.end));
				
			if(startPos.row < 0) {
				startPos.row = 0;
				startPos.col = 0;
			}
			
			if(endPos.row >= view.getRowCnt()) {
				endPos.row = view.getRowCnt() - 1;
				endPos.col = view.getColCnt() - 1;
			}
			
			predictEventVisibility(event, startPos, endPos, view);
				
			var currentRow = startPos.row + eventRenderMap.get(event);
			
			var columnStart = 0, columnEnd = view.getColCnt() - 1;
			
			if(currentRow == startPos.row) {
				columnStart = startPos.col;
			}
			
			if(currentRow == endPos.row) {
				columnEnd = endPos.col;
			}
			
			//console.log("Event: " + event.id + ", Row#: " + (currentRow + 1) + ", StartCol: " + columnStart + ", EndCol: " + columnEnd);
			
			if(currentRow >= 0) {
				
				var calendarRow = $(view.element).find("tr").eq(currentRow + 1);
				
				for(var i = columnStart; i <= columnEnd; i++) {
					var currentCalendarCol = $(calendarRow).find("td").eq(i);
					
					if(!$.data(currentCalendarCol.get(0), "events")) {
						$.data(currentCalendarCol.get(0), "events", [event]);
					} else {
						$.data(currentCalendarCol.get(0), "events").push(event);
					}
					
					//console.log("Row: ") ;console.log(calendarRow.get(0)) ; console.log("Col: "); console.log(currentCalendarCol.get(0)); console.log("Data: ") ; console.log($.data(currentCalendarCol.get(0), "events"));
					
					var thisDayEvents = $.data(currentCalendarCol.get(0), "events");
					var thisDayVisibleEvents = [];
					$(thisDayEvents).each(function() {
						if(!this.isHidden) {
							thisDayVisibleEvents.push(this);
						}
					});
					if(thisDayVisibleEvents.length > eventsLimit || event.isHidden) {
						event.isHidden = true;
						var placeHolder = $(currentCalendarCol).find("div:first");
						var viewMoreBtn = $(placeHolder).find(".view-more");
						if(viewMoreBtn.length <= 0) {
							var btn = $("<div class='view-more'><span><a>more...</a></span></div>");
							$(placeHolder).prepend(btn);
							viewMoreBtn = btn;
							$.data(viewMoreBtn.get(0), "hiddenEvents", []);
							$(viewMoreBtn).on("click", function() {
								var currentDayCell = $(this).parents("td").get(0);
								var eventsList = $.data(currentDayCell, "events");
								
								if(moreBtnClickHandler) {
									moreBtnClickHandler(currentDayCell, eventsList);
								}
								
							});
						}
						
						viewMoreBtn = $(viewMoreBtn).get(0);
						
						//$.data(viewMoreBtn, "hiddenEvents").push(event);
						
						//$(viewMoreBtn).text("(" + $.data(viewMoreBtn, "hiddenEvents").length + ") more...");
					}
				}
				
				eventRenderMap.put(event, eventRenderMap.get(event) + 1);
			}
			
			return !event.isHidden;
		}
	};
	
	var resetAllLimitEventsData = function(view) {
		eventRenderMap = new Hashtable();
		
		var calendarRows = $(view.element).find("tr:gt(0)");
		for(var rowI = 0; rowI < view.getRowCnt(); rowI++) {
			var currentRow = calendarRows.get(rowI);
			var rowCols = $(currentRow).find("td");
			
			for(var colI = 0; colI < view.getColCnt(); colI++) {
				var currentCol = $(rowCols).get(colI);
				
				$.data($(currentCol).get(0), "events", null);
				$(currentCol).find(".view-more").remove();
			}
		}
		
		$(view.calendar.clientEvents()).each(function() {
			delete this.isHidden;
		});
	};
	
	var predictEventVisibility = function(event, startPos, endPos, view) {
		
		for(var rowI = startPos.row; rowI <= endPos.row; rowI++) {
			
			var columnStart = 0, columnEnd = view.getColCnt() - 1;
			
			if(rowI == startPos.row) {
				columnStart = startPos.col;
			}
			
			if(rowI == endPos.row) {
				columnEnd = endPos.col;
			}
			
			var calendarRow = $(view.element).find("tr").eq(rowI + 1);

			for(var i = columnStart; i <= columnEnd; i++) {
				var currentCalendarCol = $(calendarRow).find("td").eq(i);
				
				var thisDayEvents = $.data(currentCalendarCol.get(0), "events");
				var thisDayVisibleEvents = [];
				
				if(thisDayEvents) {
					thisDayEvents = thisDayEvents.slice();
					if($.inArray(event, thisDayEvents) < 0) thisDayEvents.push(event);
					$(thisDayEvents).each(function() {
						if(!this.isHidden) {
							thisDayVisibleEvents.push(this);
						}
					});
				}
				
				if(thisDayVisibleEvents.length > eventsLimit || event.isHidden) {
					event.isHidden = true;
				}
			}
		}
	};

    // return module
    return limitEventsHook;
})(jQuery, Hashtable);