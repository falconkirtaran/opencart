function getURLVar(key) {
	var value = [];

	var query = String(document.location).split('?');

	if (query[1]) {
		var part = query[1].split('&');

		for (i = 0; i < part.length; i++) {
			var data = part[i].split('=');

			if (data[0] && data[1]) {
				value[data[0]] = data[1];
			}
		}

		if (value[key]) {
			return value[key];
		} else {
			return '';
		}
	}
}

function outerWidth(el) {
	var width = el.offsetWidth;
	var style = getComputedStyle(el);
	width += parseInt(style.marginLeft) + parseInt(style.marginRight);
	return width;
}

var ready = (callback) => {
	if (document.readyState != "loading") callback();
	else document.addEventListener("DOMContentLoaded", callback);
}

ready(() => {
	document.querySelectorAll('form').forEach(x => x.dispatchEvent(new Event('reset')));
	
	// Highlight any found errors
	document.querySelectorAll('.text-danger').forEach(x => {
		x.parentElement.querySelectorAll('input, button, textarea, select').forEach(y => {
			if (y.classList.contains('form-control')) y.classList.add('is-invalid');
		});
	});

	// Currency
	document.querySelectorAll('#form-currency .dropdown-item').forEach(x => {
		x.addEventListener('click', function(e) {
			e.preventDefault();
			document.querySelectorAll('#form-currency input[name=\'code\']').forEach(y => y.value = (x.getAttribute('href')));
			document.querySelector('#form-currency').submit();
		});
	});

	/* Search */
	var searchBox = document.querySelector('#search input[name=\'search\']');
	var searchBoxClickEvent = function(e) {
		var url = document.querySelector('base').getAttribute('href') + 'index.php?route=product/search';
		var value = document.querySelector('header #search input[name=\'search\']').value;
		if (value) url += '&search=' + encodeURIComponent(value);
		location = url;
	}

	searchBox.parentElement.querySelector('button').addEventListener('click', searchBoxClickEvent);

	searchBox.addEventListener('keydown', e => {
		if (e.keyCode == 13) searchBoxClickEvent(e);
	});

	// Menu
	document.querySelectorAll('#menu .dropdown-menu').forEach(x => {
		var menu = querySelector('#menu');
		var menuLeft = menu.getBoundingClientRect().left + document.body.scrollLeft;
		var dropdownLeft = menu.parentElement.getBoundingClientRect().left + document.body.scrollLeft;
		var i = (dropdownLeft + outerWidth(x)) - (menuLeft + outerWidth(menu));
		if (i<0) x.style.marginLeft = '-' + (i + 10) + 'px';
	});

	// Product List
	var listViewOnClick = function() {
		document.querySelectorAll('#content .product-grid > .clearfix').forEach(y => y.parentNode.removeChild(y));
		document.querySelectorAll('#content .row > .product-grid').forEach(y => y.setAttribute('class', 'product-layout product-list col-12'));
		document.querySelectorAll('#grid-view').forEach(y => y.classList.remove('active'));
		document.querySelectorAll('#list-view').forEach(y => y.classList.add('active'));
		localStorage.setItem('display', 'list');
	};
	document.querySelectorAll('#list-view').forEach(x => x.addEventListener('click', listViewOnClick));

	// Product Grid
	var gridViewOnClick = function() {
		var cols = document.querySelectorAll('#column-right, #column-left').length;
		var productList = document.querySelectorAll('#content .product-list');

		if (cols == 2) productList.forEach(x => x.setAttribute('class', 'product-layout product-grid col-lg-6 col-md-6 col-sm-12 col-sm-12'));
		else if (cols == 1) productList.forEach(x => x.setAttribute('class', 'product-layout product-grid col-lg-4 col-md-4 col-sm-6 col-12'));
		else productList.forEach(x => x.setAttribute('class', 'product-layout product-grid col-lg-3 col-md-3 col-sm-6 col-12'));

		document.querySelectorAll('#grid-view').forEach(y => y.classList.add('active'));
		document.querySelectorAll('#list-view').forEach(y => y.classList.remove('active'));
		localStorage.setItem('display', 'grid');
	};
	document.querySelectorAll('#grid-view').forEach(x => x.addEventListener('click', gridViewOnClick));

	if (localStorage.getItem('display') == 'list') {
		listViewOnClick();
		document.querySelectorAll('#list-view').forEach(x => x.classList.add('active'));
	} else {
		gridViewOnClick();
		document.querySelectorAll('#grid-view').forEach(x => x.classList.add('active'));
	}

	// Cookie Policy
	document.querySelectorAll('#button-cookie').forEach(x => x.addEventListener('click', async e => {
		e.preventDefault();
		x.classList.add('disabled');
		var resetText = x.innerText;
		x.innerText = x.getAttribute('data-loading-text');
		try {
			var httpResp = await fetch('index.php?route=common/cookie/agree');
			if (httpResp.ok) {
				var resp = await httpResp.json();
				if (resp['success']) {
					var cookieDialogue = document.querySelector('#cookie');
					cookieDialogue.slideUp(400, cookieDialogue.remove);
				}
			}
		} catch (e) {}
		x.classList.remove('disabled');
		x.innerText = resetText;
	}));
});

function usingCartButton(n) {
	var cartButton = document.querySelector('#cart > button');
	cartButton.classList.add('disabled');
	var cartButtonResetText = cartButton.innerText;
	cartButton.innerText = cartButton.getAttribute('data-loading-text');
	n();
	cartButton.classList.remove('disabled');
	cartButton.innerText = cartButtonResetText;
};

// Cart add remove functions
var cart = {
	'add': function(product_id, quantity) {
		usingCartButton(() => {
			$.ajax({
				url: 'index.php?route=checkout/cart/add',
				type: 'post',
				data: 'product_id=' + product_id + '&quantity=' + (typeof(quantity) != 'undefined' ? quantity : 1),
				dataType: 'json',
				success: function(json) {
					$('.text-danger, .toast').remove();
					$('.form-control').removeClass('is-invalid');

					if (json['redirect']) {
						location = json['redirect'];
					}

					if (json['success']) {
						html  = '<div id="toast" class="toast">';
						html += '  <div class="toast-header">';
						html += '    <strong class="mr-auto"><i class="fas fa-shopping-cart"></i> Shopping Cart</strong>';
						html += '    <button type="button" class="ml-2 mb-1 close" data-dismiss="toast">&times;</button>';
						html += '  </div>';
						html += '  <div class="toast-body">' + json['success'] + '</div>';
						html += '</div>';

						$('body').append(html);

						$('#toast').toast({'delay': 3000});

						$('#toast').toast('show');

						// Need to set timeout otherwise it wont update the total
						$('#cart').parent().load('index.php?route=common/cart/info');
					}
				},
				error: function(xhr, ajaxOptions, thrownError) {
					alert(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
				}
			});
		});
	},
	'update': function(key, quantity) {
		usingCartButton(() => {
			$.ajax({
				url: 'index.php?route=checkout/cart/edit',
				type: 'post',
				data: 'key=' + key + '&quantity=' + (typeof(quantity) != 'undefined' ? quantity : 1),
				dataType: 'json',
				success: function(json) {
					if (getURLVar('route') == 'checkout/cart' || getURLVar('route') == 'checkout/checkout') {
						location = 'index.php?route=checkout/cart';
					} else {
						$('#cart').parent().load('index.php?route=common/cart/info');
					}
				},
				error: function(xhr, ajaxOptions, thrownError) {
					alert(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
				}
			});
		});
	},
	'remove': function(key) {
		usingCartButton(() => {
			$.ajax({
				url: 'index.php?route=checkout/cart/remove',
				type: 'post',
				data: 'key=' + key,
				dataType: 'json',
				success: function(json) {
					if (getURLVar('route') == 'checkout/cart' || getURLVar('route') == 'checkout/checkout') {
						location = 'index.php?route=checkout/cart';
					} else {
						$('#cart').parent().load('index.php?route=common/cart/info');
					}
				},
				error: function(xhr, ajaxOptions, thrownError) {
					alert(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
				}
			});
		});
	}
};

var voucher = {
	'add': function() {
	},
	'remove': function(key) {
		usingCartButton(() => {
			$.ajax({
				url: 'index.php?route=checkout/cart/remove',
				type: 'post',
				data: 'key=' + key,
				dataType: 'json',
				success: function(json) {
					if (getURLVar('route') == 'checkout/cart' || getURLVar('route') == 'checkout/checkout') {
						location = 'index.php?route=checkout/cart';
					} else {
						$('#cart').parent().load('index.php?route=common/cart/info');
					}
				},
				error: function(xhr, ajaxOptions, thrownError) {
					alert(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
				}
			});
		});
	}
};

var wishlist = {
	'add': function(product_id) {
		usingCartButton(() => {
			$.ajax({
				url: 'index.php?route=account/wishlist/add',
				type: 'post',
				data: 'product_id=' + product_id,
				dataType: 'json',
				success: function(json) {
					$('#toast').remove();

					if (json['redirect']) {
						location = json['redirect'];
					}

					if (json['success']) {
						html  = '<div id="toast" class="toast">';
						html += '  <div class="toast-header">';
						html += '    <strong class="mr-auto"><i class="fas fa-shopping-cart"></i> Shopping Cart</strong>';
						html += '    <button type="button" class="ml-2 mb-1 close" data-dismiss="toast">&times;</button>';
						html += '  </div>';
						html += '  <div class="toast-body">' + json['success'] + '</div>';
						html += '</div>';

						$('body').append(html);

						$('#toast').toast({'delay': 3000});

						$('#toast').toast('show');
					}

					$('#wishlist-total span').html(json['total']);
					$('#wishlist-total').attr('title', json['total']);
				},
				error: function(xhr, ajaxOptions, thrownError) {
					alert(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
				}
			});
		});
	},
	'remove': function() {
	}
};

var compare = {
	'add': function(product_id) {
		$.ajax({
			url: 'index.php?route=product/compare/add',
			type: 'post',
			data: 'product_id=' + product_id,
			dataType: 'json',
			success: function(json) {
				$('#toast').remove();

				if (json['success']) {
					html  = '<div id="toast" class="toast">';
					html += '  <div class="toast-header">';
					html += '    <strong class="mr-auto"><i class="fas fa-shopping-cart"></i> Shopping Cart</strong>';
					html += '    <button type="button" class="ml-2 mb-1 close" data-dismiss="toast">&times;</button>';
					html += '  </div>';
					html += '  <div class="toast-body">' + json['success'] + '</div>';
					html += '</div>';

					$('body').append(html);

					$('#toast').toast({'delay': 3000});

					$('#toast').toast('show');

					$('#compare-total').html(json['total']);
				}
			},
			error: function(xhr, ajaxOptions, thrownError) {
				alert(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
			}
		});
	},
	'remove': function() {

	}
};

/* Agree to Terms */
$(document).delegate('.agree', 'click', function(e) {
	e.preventDefault();

	$('#modal-agree').remove();

	var element = this;

	$.ajax({
		url: $(element).attr('href'),
		type: 'get',
		dataType: 'html',
		success: function(data) {
			html = '<div id="modal-agree" class="modal fade">';
			html += '  <div class="modal-dialog">';
			html += '    <div class="modal-content">';
			html += '      <div class="modal-header">';
			html += '        <h4 class="modal-title">' + $(element).text() + '</h4>';
			html += '        <button type="button" class="close" data-dismiss="modal">&times;</button>';
			html += '      </div>';
			html += '      <div class="modal-body">' + data + '</div>';
			html += '    </div>';
			html += '  </div>';
			html += '</div>';

			$('body').append(html);

			$('#modal-agree').modal('show');
		}
	});
});

// Chain ajax calls.
class Chain {
	constructor() {
		this.start = false;
		this.data = [];
	}

	attach(call) {
		this.data.push(call);

		if (!this.start) {
			this.execute();
		}
	}

	execute() {
		if (this.data.length) {
			this.start = true;

			(this.data.shift())().done(function() {
				chain.execute();
			});
		} else {
			this.start = false;
		}
	}
}

var chain = new Chain();

// Autocomplete */
(function($) {
	$.fn.autocomplete = function(option) {
		return this.each(function() {
			this.timer = null;
			this.items = new Array();

			$.extend(this, option);

			$(this).attr('autocomplete', 'off');

			// Focus
			$(this).on('focus', function() {
				this.request();
			});

			// Blur
			$(this).on('blur', function() {
				setTimeout(function(object) {
					object.hide();
				}, 200, this);
			});

			// Keydown
			$(this).on('keydown', function(event) {
				switch (event.keyCode) {
					case 27: // escape
						this.hide();
						break;
					default:
						this.request();
						break;
				}
			});

			// Click
			this.click = function(event) {
				event.preventDefault();

				value = $(event.target).parent().attr('data-value');

				if (value && this.items[value]) {
					this.select(this.items[value]);
				}
			};

			// Show
			this.show = function() {
				var pos = $(this).position();

				$(this).siblings('ul.dropdown-menu').css({
					top: pos.top + $(this).outerHeight(),
					left: pos.left
				});

				$(this).siblings('ul.dropdown-menu').show();
			};

			// Hide
			this.hide = function() {
				$(this).siblings('ul.dropdown-menu').hide();
			};

			// Request
			this.request = function() {
				clearTimeout(this.timer);

				this.timer = setTimeout(function(object) {
					object.source($(object).val(), $.proxy(object.response, object));
				}, 200, this);
			};

			// Response
			this.response = function(json) {
				html = '';

				if (json.length) {
					for (i = 0; i < json.length; i++) {
						this.items[json[i]['value']] = json[i];
					}

					for (i = 0; i < json.length; i++) {
						if (!json[i]['category']) {
							html += '<li data-value="' + json[i]['value'] + '"><a href="#">' + json[i]['label'] + '</a></li>';
						}
					}

					// Get all the ones with a categories
					var category = new Array();

					for (i = 0; i < json.length; i++) {
						if (json[i]['category']) {
							if (!category[json[i]['category']]) {
								category[json[i]['category']] = new Array();
								category[json[i]['category']]['name'] = json[i]['category'];
								category[json[i]['category']]['item'] = new Array();
							}

							category[json[i]['category']]['item'].push(json[i]);
						}
					}

					for (i in category) {
						html += '<li class="dropdown-header">' + category[i]['name'] + '</li>';

						for (j = 0; j < category[i]['item'].length; j++) {
							html += '<li data-value="' + category[i]['item'][j]['value'] + '"><a href="#">&nbsp;&nbsp;&nbsp;' + category[i]['item'][j]['label'] + '</a></li>';
						}
					}
				}

				if (html) {
					this.show();
				} else {
					this.hide();
				}

				$(this).siblings('ul.dropdown-menu').html(html);
			};

			$(this).after('<ul class="dropdown-menu"></ul>');
			$(this).siblings('ul.dropdown-menu').delegate('a', 'click', $.proxy(this.click, this));
		});
	};
})(window.jQuery);

+function($) {
	'use strict';

	// BUTTON PUBLIC CLASS DEFINITION
	// ==============================

	var Button = function(element, options) {
		this.$element = $(element)
		this.options = $.extend({}, Button.DEFAULTS, options)
		this.isLoading = false
	}

	Button.VERSION = '3.3.5'

	Button.DEFAULTS = {
		loadingText: 'loading...'
	}

	Button.prototype.setState = function(state) {
		var d = 'disabled'
		var $el = this.$element
		var val = $el.is('input') ? 'val' : 'html'
		var data = $el.data()

		state += 'Text'

		if (data.resetText == null) $el.data('resetText', $el[val]())

		// push to event loop to allow forms to submit
		setTimeout($.proxy(function() {
			$el[val](data[state] == null ? this.options[state] : data[state])

			if (state == 'loadingText') {
				this.isLoading = true
				$el.addClass(d).attr(d, d)
			} else if (this.isLoading) {
				this.isLoading = false
				$el.removeClass(d).removeAttr(d)
			}
		}, this), 0)
	}

	Button.prototype.toggle = function() {
		var changed = true
		var $parent = this.$element.closest('[data-toggle="buttons"]')

		if ($parent.length) {
			var $input = this.$element.find('input')
			if ($input.prop('type') == 'radio') {
				if ($input.prop('checked')) changed = false
				$parent.find('.active').removeClass('active')
				this.$element.addClass('active')
			} else if ($input.prop('type') == 'checkbox') {
				if (($input.prop('checked')) !== this.$element.hasClass('active')) changed = false
				this.$element.toggleClass('active')
			}
			$input.prop('checked', this.$element.hasClass('active'))
			if (changed) $input.trigger('change')
		} else {
			this.$element.attr('aria-pressed', !this.$element.hasClass('active'))
			this.$element.toggleClass('active')
		}
	}


	// BUTTON PLUGIN DEFINITION
	// ========================

	function Plugin(option) {
		return this.each(function() {
			var $this = $(this)
			var data = $this.data('bs.button')
			var options = typeof option == 'object' && option

			if (!data) $this.data('bs.button', (data = new Button(this, options)))

			if (option == 'toggle') data.toggle()
			else if (option) data.setState(option)
		})
	}

	var old = $.fn.button

	$.fn.button = Plugin
	$.fn.button.Constructor = Button


	// BUTTON NO CONFLICT
	// ==================

	$.fn.button.noConflict = function() {
		$.fn.button = old
		return this
	}


	// BUTTON DATA-API
	// ===============

	$(document).on('click.bs.button.data-api', '[data-toggle^="button"]', function(e) {
		var $btn = $(e.target);

		if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn');

		Plugin.call($btn, 'toggle');

		if (!($(e.target).is('input[type="radio"]') || $(e.target).is('input[type="checkbox"]'))) e.preventDefault();
	}).on('focus.bs.button.data-api blur.bs.button.data-api', '[data-toggle^="button"]', function(e) {
		$(e.target).closest('.btn').toggleClass('focus', /^focus(in)?$/.test(e.type));
	});
}(jQuery);
