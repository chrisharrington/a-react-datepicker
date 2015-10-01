"use strict";

(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined")
        module.exports = factory();
    if (typeof define === "function" && define.amd)
        define(factory);
    global.AReactDatepicker = factory();
}(this || window, function () {
    var React = typeof require === "function" ? require("react") : window.React;

    var DateUtilities = {
        pad: function(value, length) {
            while (value.length < length)
                value = "0" + value;
            return value;
        },

        clone: function(date) {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
        },

        toString: function(date) {
            return date.getFullYear() + "-" + DateUtilities.pad((date.getMonth()+1).toString(), 2) + "-" + DateUtilities.pad(date.getDate().toString(), 2);
        },

        toDayOfMonthString: function(date) {
            return DateUtilities.pad(date.getDate().toString());
        },

        toMonthAndYearString: function(date) {
            var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            return months[date.getMonth()] + " " + date.getFullYear();
        },

        moveToDayOfWeek: function(date, dayOfWeek) {
            while (date.getDay() !== dayOfWeek)
                date.setDate(date.getDate()-1);
            return date;
        },

        isSameDay: function(first, second) {
            return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
        },

        isBefore: function(first, second) {
            return first.getTime() < second.getTime();
        },

        isAfter: function(first, second) {
            return first.getTime() > second.getTime();
        }
    };

    var DatePicker = React.createClass({displayName: "exports",
    	getInitialState: function() {
            var def = this.props.selected || new Date();
    		return {
    			view: DateUtilities.clone(def),
                selected: DateUtilities.clone(def),
    			minDate: null,
    			maxDate: null,
                id: this.getUniqueIdentifier()
    		};
    	},

    	componentDidMount: function() {
    		document.addEventListener("click", this.hideOnDocumentClick);
    	},

        componentWillUnmount: function() {
            document.removeEventListener("click", this.hideOnDocumentClick);
        },

        hideOnDocumentClick: function(e) {
            if (e.target.className !== "date-picker-trigger-" + this.state.id && !this.parentsHaveClassName(e.target, "ardp-calendar-" + this.state.id))
                this.hide();
        },

        getUniqueIdentifier: function() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                  .toString(16)
                  .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },

    	parentsHaveClassName: function(element, className) {
    		var parent = element;
    		while (parent) {
    			if (parent.className && parent.className.indexOf(className) > -1)
    				return true;

    			parent = parent.parentNode;
    		}

            return false;
    	},

    	setMinDate: function(date) {
    		this.setState({ minDate: date });
    	},

    	setMaxDate: function(date) {
    		this.setState({ maxDate: date });
    	},

    	onSelect: function(day) {
            this.setState({ selected: day });
    		this.hide();

            if (this.props.onSelect)
            this.props.onSelect(day);
    	},

    	show: function() {
            var trigger = this.refs.trigger.getDOMNode(),
                rect = trigger.getBoundingClientRect(),
                isTopHalf = rect.top > window.innerHeight/2,
                calendarHeight = 203;

            this.refs.calendar.show({
                top: isTopHalf ? (rect.top + window.scrollY - calendarHeight - 3) : (rect.top + trigger.clientHeight + window.scrollY + 3),
                left: rect.left
            });
    	},

    	hide: function() {
    		this.refs.calendar.hide();
    	},

    	render: function() {
    		return React.createElement("div", {className: "ardp-date-picker"},
    			React.createElement("input", {ref: "trigger", type: "text", className: "date-picker-trigger-" + this.state.id, readOnly: true, value: DateUtilities.toString(this.state.selected), onClick: this.show}),

    			React.createElement(Calendar, {ref: "calendar", id: this.state.id, view: this.state.view, selected: this.state.selected, onSelect: this.onSelect, minDate: this.state.minDate, maxDate: this.state.maxDate})
    		);
    	}
    });

    var Calendar = React.createClass({displayName: "Calendar",
        getInitialState: function() {
            return {
                visible: false
            };
        },

        onMove: function(view, isForward) {
    		this.refs.weeks.moveTo(view, isForward);
    	},

    	onTransitionEnd: function() {
    		this.refs.monthHeader.enable();
    	},

        show: function(position) {
            this.setState({
                visible: true,
                style: {
                    top: position.top,
                    left: position.left
                }
            });
        },

        hide: function() {
            if (this.state.visible)
                this.setState({ visible: false });
        },

        render: function() {
    		return React.createElement("div", {ref: "calendar", className: "ardp-calendar-" + this.props.id + " calendar" + (this.state.visible ? " calendar-show" : " calendar-hide"), style: this.state.style },
    			React.createElement(MonthHeader, {ref: "monthHeader", view: this.props.view, onMove: this.onMove}),
    			React.createElement(WeekHeader, null),
    			React.createElement(Weeks, {ref: "weeks", view: this.props.view, selected: this.props.selected, onTransitionEnd: this.onTransitionEnd, onSelect: this.props.onSelect, minDate: this.props.minDate, maxDate: this.props.maxDate})
    		);
    	}
    });

    var MonthHeader = React.createClass({displayName: "MonthHeader",
    	getInitialState: function() {
    		return {
    			view: DateUtilities.clone(this.props.view),
    			enabled: true
    		};
    	},

        moveBackward: function() {
            var view = DateUtilities.clone(this.state.view);
            view.setMonth(view.getMonth()-1);
    		this.move(view, false);
        },

        moveForward: function() {
            var view = DateUtilities.clone(this.state.view);
            view.setMonth(view.getMonth()+1);
    		this.move(view, true);
        },

    	move: function(view, isForward) {
    		if (!this.state.enabled)
    			return;

    		this.setState({
    			view: view,
    			enabled: false
    		});

    		this.props.onMove(view, isForward);
    	},

    	enable: function() {
    		this.setState({ enabled: true });
    	},

    	render: function() {
    		var enabled = this.state.enabled;
    		return React.createElement("div", {className: "month-header"},
                React.createElement("i", {className: (enabled ? "" : " disabled"), onClick: this.moveBackward}, String.fromCharCode(9664)),
                React.createElement("span", null, DateUtilities.toMonthAndYearString(this.state.view)),
                React.createElement("i", {className: (enabled ? "" : " disabled"), onClick: this.moveForward}, String.fromCharCode(9654))
    		);
    	}
    });

    var WeekHeader = React.createClass({displayName: "WeekHeader",
    	render: function() {
    		return React.createElement("div", {className: "week-header"},
                React.createElement("span", null, "Sun"),
                React.createElement("span", null, "Mon"),
                React.createElement("span", null, "Tue"),
                React.createElement("span", null, "Wed"),
                React.createElement("span", null, "Thu"),
                React.createElement("span", null, "Fri"),
                React.createElement("span", null, "Sat")
    		);
    	}
    });

    var Weeks = React.createClass({displayName: "Weeks",
    	getInitialState: function() {
    		return {
    			view: DateUtilities.clone(this.props.view),
    			other: DateUtilities.clone(this.props.view),
    			sliding: null
    		};
    	},

    	componentDidMount: function() {
    		this.refs.current.getDOMNode().addEventListener("transitionend", this.onTransitionEnd);
    	},

    	onTransitionEnd: function() {
    		this.setState({
    			sliding: null,
    			view: DateUtilities.clone(this.state.other)
    		});

    		this.props.onTransitionEnd();
    	},

        getWeekStartDates: function(view) {
            view.setDate(1);
    		view = DateUtilities.moveToDayOfWeek(DateUtilities.clone(view), 0);

            var current = DateUtilities.clone(view);
            current.setDate(current.getDate()+7);

            var starts = [view],
    			month = current.getMonth();

    		while (current.getMonth() === month) {
    			starts.push(DateUtilities.clone(current));
                current.setDate(current.getDate()+7);
    		}

    		return starts;
        },

    	moveTo: function(view, isForward) {
    		this.setState({
    			sliding: isForward ? "left" : "right",
    			other: DateUtilities.clone(view)
    		});
    	},

    	render: function() {
    		return React.createElement("div", {className: "weeks"},
    			React.createElement("div", {ref: "current", className: "current" + (this.state.sliding ? (" sliding " + this.state.sliding) : "")},
    				this.renderWeeks(this.state.view)
    			),
    			React.createElement("div", {ref: "other", className: "other" + (this.state.sliding ? (" sliding " + this.state.sliding) : "")},
    				this.renderWeeks(this.state.other)
    			)
    		);
    	},

    	renderWeeks: function(view) {
    		var starts = this.getWeekStartDates(view),
    			month = starts[1].getMonth();

    		return starts.map(function(s, i) {
    			return React.createElement(Week, {key: i, start: s, month: month, selected: this.props.selected, onSelect: this.props.onSelect, minDate: this.props.minDate, maxDate: this.props.maxDate});
    		}.bind(this));
    	}
    });

    var Week = React.createClass({displayName: "Week",
        buildDays: function(start) {
            var days = [DateUtilities.clone(start)],
                clone = DateUtilities.clone(start);
            for (var i = 1; i <= 6; i++) {
                clone = DateUtilities.clone(clone);
                clone.setDate(clone.getDate()+1);
                days.push(clone);
            }
            return days;
        },

        isOtherMonth: function(day) {
            return this.props.month !== day.month();
        },

        getDayClassName: function(day) {
            var className = "day";
            if (DateUtilities.isSameDay(day, new Date()))
                className += " today";
            if (this.props.month !== day.getMonth())
                className += " other-month";
            if (this.props.selected && DateUtilities.isSameDay(day, this.props.selected))
                className += " selected";
    		if (this.isDisabled(day))
    			className += " disabled";
            return className;
        },

    	onSelect: function(day) {
    		if (!this.isDisabled(day))
    			this.props.onSelect(day);
    	},

    	isDisabled: function(day) {
    		var minDate = this.props.minDate,
    			maxDate = this.props.maxDate;

    		return (minDate && DateUtilities.isBefore(day, minDate)) || (maxDate && DateUtilities.isAfter(day, maxDate));
    	},

    	render: function() {
            var days = this.buildDays(this.props.start);
    		return React.createElement("div", {className: "week"},
                days.map(function(day, i) {
                    return React.createElement("div", {key: i, onClick: this.onSelect.bind(null, day), className: this.getDayClassName(day)}, DateUtilities.toDayOfMonthString(day))
                }.bind(this))
    		);
    	}
    });

    return DatePicker;
}));
