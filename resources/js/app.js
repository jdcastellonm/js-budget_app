var budgetController = (function() {
    // constructors for expenses and income instances
    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };
    var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };
    // methods for percentage calculations
    Expense.prototype.calculatePercent = function (totalIncome) {
        if (totalIncome > 0)
        this.percentage = Math.round((this.value / totalIncome) * 100);
        else
        this.percentage = -1;
    }
    Expense.prototype.getPercent = function () {
        return this.percentage;
    }

    // data values
    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percent: -1
    };

    // calculate the sums of expenses or incomes
    var calculateTotal = function(type) {
        var sum = 0;
        data.allItems[type].forEach(function(current) {
            sum += current.value;
        });
        
        // update the totals
        data.totals[type] = sum;
    }
    // public function to create new income/expense entries
    return {
        addItem: function (type, desc, val) {
            var newItem, id;

            // create next id, set to n + 1
            if (data.allItems[type].length > 0) {
                id = data.allItems[type][data.allItems[type].length -1].id + 1;
            }
            else {
                id = 0;
            }

            // create the new entry
            switch (type) {
                case 'exp':
                    newItem = new Expense(id, desc, val);
                    break;
                case 'inc':
                    newItem = new Income(id, desc, val);
                    break;
                default:
                    break;
            }

            // add entry to data array
            data.allItems[type].push(newItem);
            return newItem;
        },
        calculateBudget: function () {
            // calculate the sums
            calculateTotal('exp');
            calculateTotal('inc');
            
            // calculate the budget
            data.budget = data.totals.inc - data.totals.exp;

            // get the percentage of expenses
            if (data.totals.inc > 0)
            data.percent = Math.round((data.totals.exp / data.totals.inc) * 100);
            else
            data.percent = -1;
        },
        calculatePercents: function() {
            data.allItems.exp.forEach(function(current) {
                current.calculatePercent(data.totals.inc);
            });
        },
        deleteItem: function (type, id) { // delete entry from memory
            var ids, index;

            ids = data.allItems[type].map(function (current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                data.allItems[type].splice(index, 1);
            }
        },
        getBudget: function () { // obtain budget data for other controllers
            return {
                budget: data.budget,
                totalIncome: data.totals.inc,
                totalExpenses:data.totals.exp,
                percent: data.percent
            };
        },
        getPercentages: function() {
            var arr_percentages = data.allItems.exp.map(function(current) {
                return current.getPercent();
            });
            return arr_percentages;
        },
        test: function () {
            console.log(data);
        }
    }
})();

var UIController = (function () {
    // set the document strings to be used
   var DOMstrings = {
       inputType: '.add__type',
       inputDescription: '.add__description',
       inputValue: '.add__value',
       inputBtn: '.add__btn',
       incomeContainer:'.income__list',
       expensesContainer: '.expenses__list',
       budgetLabel: '.budget__value',
       incomeLabel: '.budget__income--value',
       expensesLabel: '.budget__expenses--value',
       percentLabel: '.budget__expenses--percentage',
       container: '.container',
       expensesPercentLabel: '.item__percentage',
       dateLabel: '.budget__title--month'
   };

   // format the numbers to currency
   var formatNumber = function (number, type) {
    return (type === 'exp' ? '-' : '+') + '$' + number.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
   };
    // create a forEach function that takes node lists
    var nodeListForEach = function (list, callback_func) {
        for (var i = 0; i < list.length; i++) {
            callback_func(list[i], i);
        }
    };
   
   return {
       getInput: function () { // return the element values
           return {
               type: document.querySelector(DOMstrings.inputType).value,
               description: document.querySelector(DOMstrings.inputDescription).value,
               value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
           };
       },
       getDOMstrings: function () { // return the document strings to be used on other controllers
           return DOMstrings;
       },
       addListItem: function (entry, type) {
           var html, new_html, element;
           // create the html with placeholder for list entries
           if (type === 'inc') {
               element = DOMstrings.incomeContainer;
               html =  '<div class="item" id="inc-%id%"><div class="item__description">%desc%</div><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div>';
           }
           else if (type === 'exp') {
               element = DOMstrings.expensesContainer;
               html = '<div class="item" id="exp-%id%"><div class="item__description">%desc%</div><div class="item__value">%value%</div><div class="item__percentage"></div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div>';
           }
           // create the new html string that will be loaded on the page
           new_html = html.replace('%id%', entry.id);
           new_html = new_html.replace('%desc%', entry.description);
           new_html = new_html.replace('%value%', formatNumber(entry.value, type));

           // load the html into the dom
           document.querySelector(element).insertAdjacentHTML('beforeend', new_html);
       },
       displayBudget: function(data) {
           // update the values on the page
           var type = data.budget > 0 ? 'inc' : 'exp';

           document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(data.budget, type);
           document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(data.totalIncome, 'inc');
           document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(data.totalExpenses, 'exp');
           if (data.percent > 0)
           document.querySelector(DOMstrings.percentLabel).textContent = data.percent + '%';
           else
           document.querySelector(DOMstrings.percentLabel).textContent = '--';
       },
       displayPercentages: function(percentages) {
           var fields = document.querySelectorAll(DOMstrings.expensesPercentLabel);

           nodeListForEach(fields, function(current, index) {
               if (percentages[index] > 0)
               current.textContent = percentages[index] + '%';
               else
               current.textContent = "--";
           });
       },
       displayMonth: function () {
           // set the date to display on page
           var now = new Date();
           var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
           var month = now.getMonth();
           var year = now.getFullYear();
           document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
       },
       clearFields: function() {
           var fields, fieldsArray;

           // obtain array of elements to clear. make sure to convert the nodelist to an array
           fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
           fieldsArray = Array.prototype.slice.call(fields);

           // clear the values
           fieldsArray.forEach(function (current, index, array) {
               current.value = "";
           });

           // set focus back to the description field
           fieldsArray[0].focus();

       },
       deleteListItem: function (selectedID) { // delete entry from the page
           var element = document.getElementById(selectedID);
           element.parentNode.removeChild(element);
       },
       changedType: function() { // toggle the red outlines on expenses
           var fields = document.querySelectorAll(
               DOMstrings.inputType + ',' + DOMstrings.inputDescription + ',' + DOMstrings.inputValue
           );

           nodeListForEach(fields, function(current) {
               current.classList.toggle('red-focus');
           })
           document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
       }
   }
})();

var controller = (function (budgetCtrl, UICtrl) {
    var setupEventListeners = function () {
        // get the document strings form the UI controller
        var DOM = UICtrl.getDOMstrings();

        // check button event
        document.querySelector(DOM.inputBtn).addEventListener('click', addItem);

        // enter key event
        document.addEventListener('keypress', function (e) {
        if (e.keyCode === 13 || e.which === 13) {
            addItem();
        } 
        });

        // delete button event
        document.querySelector(DOM.container).addEventListener('click', deleteItem);

        // change the border color of fields to red/blue on type change
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    }

    // function to add new entries when button is clicked
    var addItem = function () {
        var input, newItem;
        input = UICtrl.getInput();  // get the user entered data

        // validate the user input then add entries
        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);   // send new entry to the budget controller
            UICtrl.addListItem(newItem, input.type);
            UICtrl.clearFields(); // clear the fields and set focus to description field
    
            // update the budget
            updateBudget();
            updatePercents();
        }
        // console.log(UICtrl.getInput());
    }

    // function to delete entries when 'x' button is clicked
    var deleteItem = function (e) {
        var entryID, splitID, type, id, event;

        // get the element of the entry using event delegation. target = icon
        // entryID = e.target.parentNode.parentNode.parentNode.parentNode.id; // <-- does not work in firefox, as e.target returns the button, not the icon

        // this works on both chrome and firefox. traverses up the DOM tree till it finds an element with 'id' attritibute, which will be the div containing the entry
        e = e.target;
        while (!e.getAttribute('id')) {
            e = e.parentNode;
        }
        entryID = e.id;
        if (entryID) {
            splitID = entryID.split('-'); // get the type and id from the html id tags
            type = splitID[0];
            id = parseInt(splitID[1]);

            budgetCtrl.deleteItem(type, id);
            UICtrl.deleteListItem(entryID);
            updateBudget();
            updatePercents();
        }
    }

    // function that updates the budget on screen when button is clicked
    var updateBudget = function () {
        budgetCtrl.calculateBudget();
        var budget = budgetCtrl.getBudget();
        UICtrl.displayBudget(budget);
    }

    // function that updates the percentages on the page
    var updatePercents = function () {
        budgetCtrl.calculatePercents();
        var percentages = budgetCtrl.getPercentages();
        UICtrl.displayPercentages(percentages);
        console.log(percentages);
    }

    return {
        init: function () {
            console.log('app started');
            setupEventListeners();
            UICtrl.displayMonth();
            UICtrl.displayBudget( // set the starting values to zero
            {
                budget: 0,
                totalIncome: 0,
                totalExpenses:0,
                percent: -1
            });
        }
    }

})(budgetController, UIController);
controller.init();