/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
		uuid: function () { //think this sets the dataid attribute. Example: data-id="724930eb-5908-4747-8905-20eea0cd50f0"
			/*jshint bitwise:false */
			var i, random;
			var uuid = ''; 

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) { //passes in util.store('todos-jquery', this.todos);
			if (arguments.length > 1) { // Arguments contains values of arguments passed into function - find length and if greater than 1 
				return localStorage.setItem(namespace, JSON.stringify(data)); // Stores in local storage - namespace = todos-jquery and JSON.stringify(data) takes the this.todos object and converts it into a json friendly string to send to server
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		init: function () {
			this.todos = util.store('todos-jquery');
			this.todoTemplate = Handlebars.compile($('#todo-template').html()); // Create handlebar elements visible in html file 
			this.footerTemplate = Handlebars.compile($('#footer-template').html()); // Create handlebar elements visible in html file 
			this.bindEvents(); //Binds event listeners

			new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');
		},
		bindEvents: function () { // This section adds event listeners to the relevant id's, classes and properties
			$('#new-todo').on('keyup', this.create.bind(this)); // Create an event handlender that listens for  a keyboard press
			$('#toggle-all').on('change', this.toggleAll.bind(this)); // create eh if toggle all id input changes 
			$('#footer').on('click', '#clear-completed', this.destroyCompleted.bind(this));
			$('#todo-list')
				.on('change', '.toggle', this.toggle.bind(this))
				.on('dblclick', 'label', this.edit.bind(this))
				.on('keyup', '.edit', this.editKeyup.bind(this))
				.on('focusout', '.edit', this.update.bind(this))
				.on('click', '.destroy', this.destroy.bind(this));
		},
		render: function () {
			var todos = this.getFilteredTodos(); // to display todos it initially runs getFilteredTodos - this checks to see if the filter is set to all, active, completed and reutrns the correct todos
			$('#todo-list').html(this.todoTemplate(todos)); // Adds the handlebar section visible in the HTML file to the #todo-list element (starts with {{#this}})
			$('#main').toggle(todos.length > 0); // Shows the main element section if todos is has one of more
			$('#toggle-all').prop('checked', this.getActiveTodos().length === 0); //
			this.renderFooter(); 
			$('#new-todo').focus();
			util.store('todos-jquery', this.todos);
		},
		renderFooter: function () {
			var todoCount = this.todos.length; // stores number of todos
			var activeTodoCount = this.getActiveTodos().length; // counts number of active todos
			var template = this.footerTemplate({ //footer template object - below is displayed using handlebars, the property is referenced in the html file: {{activeTodoCount}}
				activeTodoCount: activeTodoCount, // 
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			$('#footer').toggle(todoCount > 0).html(template); // hides footer if todoCount is 0
		},
		toggleAll: function (e) {
			var isChecked = $(e.target).prop('checked'); // This returns a the value of a property "checked": <input class="toggle" type="checkbox" checked>

			this.todos.forEach(function (todo) { // This loops through todos and makes .completed = to isChecked variable above
				todo.completed = isChecked;
			});

			this.render();
		},
		getActiveTodos: function () {
			return this.todos.filter(function (todo) { // gets todos and retruns those which aren't completed
				return !todo.completed; 
			});
		},
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) { // gets todos and retruns those which aren completed
				return todo.completed;
			});
		},
		getFilteredTodos: function () { // This looks for todos equal to active or completed and returns todos
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
		destroyCompleted: function () {
			this.todos = this.getActiveTodos(); // This gets the active todos - the one's that haven't been checked off and sets them to todos. The completed todos one gone.
			this.filter = 'all';
			this.render();
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function (el) {
			var id = $(el).closest('li').data('id'); // Gets closest li of selected element and gets the data from the id - b9e2d0f5-b7a2-4f88-b26d-8b941501a4c0
			var todos = this.todos;
			var i = todos.length;

			while (i--) { // Loops over todos - if todo id matches selected element id return todo id
				if (todos[i].id === id) {
					return i;
				}
			}
		},
		create: function (e) {
			var $input = $(e.target);
			var val = $input.val().trim(); // value from input, trim removes whitespace form beginning and end of string 

			if (e.which !== ENTER_KEY || !val) { // checks if enter keys is not pressed
				return;
			}

			this.todos.push({ // This creates an object and pushes to todos store
				id: util.uuid(), // runs data id
				title: val, // stores val as title
				completed: false // sets completed to false
			});

			$input.val(''); // clears input

			this.render();
		},
		toggle: function (e) {
			var i = this.indexFromEl(e.target); // passes element index
			this.todos[i].completed = !this.todos[i].completed; // changes to opposition of whatever's set for completed
			this.render();
		},
		edit: function (e) {
			var $input = $(e.target).closest('li').addClass('editing').find('.edit'); // adds .editing class and finds nearesting input with class .edit
			$input.val($input.val()).focus(); // takes $input
		},
		editKeyup: function (e) {
			if (e.which === ENTER_KEY) {
				e.target.blur();
			}

			if (e.which === ESCAPE_KEY) {
				$(e.target).data('abort', true).blur();
			}
		},
		update: function (e) {
			var el = e.target;
			var $el = $(el);
			var val = $el.val().trim();

			if (!val) {
				this.destroy(e);
				return;
			}

			if ($el.data('abort')) {
				$el.data('abort', false);
			} else {
				this.todos[this.indexFromEl(el)].title = val;
			}

			this.render();
		},
		destroy: function (e) {
			this.todos.splice(this.indexFromEl(e.target), 1); // Removes 
			this.render();
		}
	};

	App.init();
});