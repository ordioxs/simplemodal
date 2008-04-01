/*
 * SimpleModal @VERSION - jQuery Plugin
 * http://www.ericmmartin.com/projects/simplemodal/
 * http://plugins.jquery.com/project/SimpleModal
 * http://code.google.com/p/simplemodal/
 *
 * Copyright (c) 2008 Eric Martin - http://ericmmartin.com
 * Idea/inspiration/code contributions from:
 *     - jQuery UI Dialog
 *     - Aaron Barker
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Revision: $Id$
 *
 */
 
 /* TODO -
 *
 * - prevent tabbing for modal dialog
 * - test external calls
 * - test var x = xxx.modal(), etc
 * - styles
 * - IE6 fixes/iframe (bgiframe?)
 * - modal positioning
 * - close button/link?
 * - persistance / save original dom element
 * - iframe support?
 * - click anywhere to close for non-modal dialogs
 * - ajax stuff... load dialog then content?
 * - esc key && dealing w/ multiple dialogs
 */
(function ($) {

	// private variables
	var smid = 0;

	// action function
	$.extend($.fn, {
		modal: function (options) {
			var args = Array.prototype.slice.call(arguments, 1);
			return this.each(function () {
				if (typeof options == 'string') {
					var elem = $(this).is('.simplemodal-data')
						? this
						: $(this).parents('.simplemodal-container').find('.simplemodal-data')[0];
					var dialog = elem ? $.data(elem, 'simplemodal') : {};
					if (dialog[options]) {
						dialog[options].apply(dialog, args);
					}
				} 
				else if (!$(this).is('.simplemodal-data')) {
					new $.modal.dialog($(this), options);
				}
			});
		}
	});

	// utility function
	$.modal = function (obj, options) {
		var element;

		// check for an ajax request - there will only be one argument, which
		// will actually be the options object and it will contain an ajax property
		if (arguments.length == 1 && obj.ajax) {
			options = obj;
			if (!options.ajax && !$.modal.defaults.ajax) {
				alert('problem');
			}
			else {
				$.ajax({
					url: options.ajax || $.modal.defaults.ajax,
					cache: options.cache || $.modal.defaults.cache,
					method: options.method || $.modal.defaults.method,
					dataType: options.dataType || $.modal.defaults.dataType,
					error: function (event, xhr) {
						alert(xhr.responseText);
					},
					success: function (data) {
						// wrap in a div for safe parsing
						element = $('<div/>').append(data);

						// call the action function
						return element.modal(options);
					}
				});
			}
		}
		else {
			// determine the datatype for content and handle accordingly
			if (typeof obj == 'object') {
				// convert to a jQuery object, if necessary
				element = obj instanceof jQuery ? obj : $(obj);
			}
			else if (typeof obj == 'string' || typeof obj == 'number') {
				// just insert the content as innerHTML
				element = $('<div/>').html(obj);
			}
			else {
				// unsupported data type
				window.console && console.log('SimpleModal Error: Unsupported data type: ' + typeof obj);
				return false;
			}

			// call the action function
			return element.modal(options);
		}
	};

	$.modal.defaults = {
		/* Callback functions */
		onOpen: null,			// called after the dialog elements are created - usually used for custom opening effects
		onShow: null,			// called after the dialog is opened - usually used for binding events to the dialog
		onClose: null,			// called when the close event is fired - usually used for custom closing effects
		/* Ajax options */
		ajax: null,				// ajax url
		cache: false,			// ajax cache (see: http://docs.jquery.com/Ajax/jQuery.ajax#options)
		method: 'GET',			// ajax method (see: http://docs.jquery.com/Ajax/jQuery.ajax#options)
		dataType: 'html',		// ajax dataType (see: http://docs.jquery.com/Ajax/jQuery.ajax#options)
		/* Options */
		autoOpen: true,		// open when instantiated or open after 'open' call
		modal: true,			// modal add overlay and prevents tabbing away from dialog
		persist: false,		// elements taken from the DOM will be re-inserted with changes made
		/* Element ID's */
		overlayId: null,		// if not provided, a unique id (simplemodal-overlay-#) will be generated
		containerId: null,	// if not provided, a unique id (simplemodal-container-#) will be generated
		dataId: null,			// if not provided, a unique id (simplemodal-data-#) will be generated
		iframeId: null			// if not provided, a unique id (simplemodal-ifram-#) will be generated

	};

	$.modal.dialog = function (element, options) {
		// alias this
		var self = this;
		
		this.element = element[0];

		// store this dialog for later use
		$.data(this.element, 'simplemodal', this);

		// merge user options with the defaults
		this.options = $.extend({}, $.modal.defaults, options);

		// set flags for callbacks - to prevent recursion
		this.oocb = this.oscb = this.occb = false;

		// get a unique id
		var uid = ++smid;

		// create the overlay
		this.overlay = $('<div/>')
			.attr('id', this.options.overlayId || 'simplemodal-overlay-' + uid)
			.addClass('simplemodal-overlay')
			.css({
				// TODO - styles
				display: 'none'
			})
			.appendTo('body');

		// create the container that holds the data
		this.container = $('<div/>')
			.attr('id', this.options.containerId || 'simplemodal-container-' + uid)
			.addClass('simplemodal-container')
			.css({
				// TODO - styles
				display: 'none'
			})
			.appendTo('body');

		// add the data to the container
		this.data = element
			.attr('id', this.options.dataId || 'simplemodal-data-' + uid)
			.addClass('simplemodal-data')
			.css({
				// TODO - styles
				display: 'none'
			})
			.appendTo(this.container);

		// open the dialog if autoOpen is true
		this.options.autoOpen && this.open();
		
		// TODO - bind events here?
	};

	$.extend($.modal.dialog.prototype, {
		open: function () {
			var self = this;
			
			// TODO - ie6 issues - create iframe?
			
			// TODO - dialog positioning ?

			// check for onOpen callback
			if ($.isFunction(self.options.onOpen) && !self.oocb) {
				self.oocb = true;
				self.options.onOpen.apply(self, self);
			}
			else {
				self.iframe && self.iframe.show();
				self.overlay.show();
				self.container.show();
				self.data.show();
			}

			// check for onShow callback
			if ($.isFunction(self.options.onShow) && !self.oscb) {
				self.oscb = true;
				self.options.onShow.apply(self, self);
			}
			else {
				// TODO - bind events here?
			}
		},
		close: function () {
			var self = this;

			// check for onClose callback
			if ($.isFunction(self.options.onClose) && !self.occb) {
				self.occb = true;
				self.options.onClose.apply(self, self);
			}
			else {
				self.data.hide();
				self.container.hide();
				self.overlay.hide();
				self.iframe && self.iframe.hide();
			}
		},
		destroy: function () {
			$.removeData(this.element, 'simplemodal');
			this.iframe && this.iframe.remove();
			this.overlay.remove();
			this.container.remove();
			this.data.remove();
			// TODO - removing object? 
			//this = {};
		}
	});
	
	// private functions

})(jQuery);