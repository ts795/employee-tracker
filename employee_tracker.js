// Import and require inquirer
const inquirer = require('inquirer');
// Import and require mysql2
const mysql = require('mysql2');

// Get the password from an envurionment variable or leave it empty if it is not specified
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';

// Get a first name and last name from a full name
function getFirstAndLastFromFullName(fullNameInput) {
    var returnVal = { firstName: '', lastName: '' };
    // remove trailing and leading whitespaces
    var fullName = fullNameInput.trim();
    // Get the first and last name from the full name by splitting on spaces
    var splitName = fullName.split(" ");
    if (splitName.length >= 1) {
        returnVal.firstName = splitName[0];
    }
    if (splitName.length >= 2) {
        returnVal.lastName = splitName[splitName.length - 1]
    }
    return returnVal;
}

// Get all employees
function getAllEmployees(dbConnection) {
    return new Promise(function (resolve, reject) {
        var query = `SELECT * FROM employee`;
        dbConnection.promise().query(query)
            .then(function ([rows, fields]) {
                // create a list of employee names to display and sort it by alphabetical order
                var employeeNames = rows.map(row => row.first_name + " " + row.last_name);
                resolve(employeeNames);
                return;
            })
            .catch(err => console.error(err));
    });
}

// Update an employee's role
function updateAnEmployeeRole(dbConnection) {
    var userInputs = null;
    return new Promise(function (resolve, reject) {
        // Get a list of the employees
        getAllEmployees(dbConnection)
            .then(function (employeeNames) {
                return inquirer.prompt([
                    {
                        type: 'list',
                        message: "Which employee's role do you want to update?",
                        name: "employee_to_update",
                        choices: employeeNames
                    },
                    {
                        type: 'input',
                        message: "What is the employee's new role?",
                        name: "new_role"
                    }
                ]);
            })
            .then(function (response) {
                // Lookup the ID for the role
                userInputs = response;
                return lookupID(dbConnection, `SELECT id FROM ROLE WHERE title = ?`, [response.new_role]);
            })
            .then(function (id) {
                // Update the role for the employee
                var { firstName, lastName } = getFirstAndLastFromFullName(userInputs.employee_to_update);
                return dbConnection.promise().query("UPDATE employee SET role_id = ? WHERE first_name = ? AND last_name = ?", [id, firstName, lastName]);
            })
            .then(function ([rows, fields]) {
                return getNextAction(dbConnection);
            })
            .then(function () {
                resolve();
                return dbConnection;
            });
    });
}

// Add an employee to the database
function addAnEmployee(dbConnection) {
    return new Promise(function (resolve, reject) {
        var userResponse = {};
        var role_id = null;
        var firstName = "";
        var lastName = "";
        inquirer
            .prompt([
                {
                    type: 'input',
                    message: "What is the employee's first name?",
                    name: 'first_name',
                },
                {
                    type: 'input',
                    message: "What is the employee's last name?",
                    name: 'last_name',
                },
                {
                    type: 'input',
                    message: "What is the employee's role?",
                    name: 'role',
                },
                {
                    type: 'input',
                    message: "Who is the employee's manager?",
                    name: 'manager',
                },
            ],
            )
            .then(function (response) {
                // Save the user response
                userResponse = response;
                // Get the ID for the role
                return lookupID(dbConnection, `SELECT id FROM ROLE WHERE title = ?`, [response.role]);
            })
            .then(function (id) {
                // Save the ID for the role
                role_id = id;
                // Get the ID for the manager
                // Get the first and last name from the user's input
                // remove trailing and leading whitespaces
                var fullName = userResponse.manager.trim();
                // Get the first and last name from the full name by splitting on spaces
                var splitName = fullName.split(" ");
                if (splitName.length >= 1) {
                    firstName = splitName[0];
                }
                if (splitName.length >= 2) {
                    lastName = splitName[splitName.length - 1]
                }

                return lookupID(dbConnection, `SELECT id FROM employee WHERE first_name = ? AND last_name = ?`, [firstName, lastName]);
            })
            .then(function (manager_id) {
                return dbConnection.promise().query("INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)", [userResponse.first_name, userResponse.last_name, role_id, manager_id]);
            })
            .then(([rows, fields]) => {
                return dbConnection;
            })
            .then(function (db) {
                return getNextAction(db);
            })
            .then(function (dbConnection) {
                resolve();
                return dbConnection
            })
            .catch(err => console.error(err));
    }
    );
}

// Add a role to the database
function addARole(dbConnection) {
    return new Promise(function (resolve, reject) {
        var userResponse = {};
        inquirer
            .prompt([
                {
                    type: 'input',
                    message: 'What is the name of the role?',
                    name: 'role_name',
                },
                {
                    type: 'input',
                    message: 'What is the salary of the role?',
                    name: 'salary',
                },
                {
                    type: 'input',
                    message: 'Which department does the role belong to?',
                    name: 'department',
                },
            ],
            )
            .then(function (response) {
                // Save the user response so it can be used once the department ID is determined
                userResponse = response;
                return lookupID(dbConnection, `SELECT id FROM DEPARTMENT WHERE name = ?`, [response.department]);
            })
            .then(function (id) {
                return dbConnection.promise().query("INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)", [userResponse.role_name, userResponse.salary, id]);
            })
            .then(([rows, fields]) => {
                return dbConnection;
            })
            .then(function (db) {
                return getNextAction(db);
            })
            .then(function (dbConnection) {
                resolve();
                return dbConnection
            })
            .catch(err => console.error(err));
    }
    );
}

// Add a department to the database
function addADepartment(dbConnection) {
    return new Promise(function (resolve, reject) {
        inquirer
            .prompt([
                {
                    type: 'input',
                    message: 'What is the name of the department?',
                    name: 'department_name',
                },
            ],
            )
            .then(function (response) {
                return dbConnection.promise().query("INSERT INTO department (name) VALUES (?)", [response.department_name]);
            })
            .then(([rows, fields]) => {
                return dbConnection;
            })
            .then(function (db) {
                return getNextAction(db);
            })
            .then(function (dbConnection) {
                resolve();
                return dbConnection
            })
            .catch(err => console.error(err));
    }
    )
}

// Execute query for looking up the ID of a department, role, or employee
function lookupID(dbConnection, query, queryArgs) {
    return new Promise(function (resolve, reject) {
        dbConnection.promise().query(query, queryArgs)
            .then(([rows, fields]) => {
                var id = null;
                if (rows.length !== 0) {
                    id = rows[0].id;
                }
                return resolve(id);
            })
            .catch(err => console.error(err));
    });
}

// Display the contents of a table to the console
function showTableContents(dbConnection, tableName) {
    return new Promise(function (resolve, reject) {
        var query = `SELECT * FROM ${tableName}`;
        dbConnection.promise().query(query)
            .then(([rows, fields]) => {
                console.table(rows);
                return dbConnection;
            })
            .then(function (db) {
                return getNextAction(db);
            })
            .then(function (dbConnection) {
                resolve();
                return dbConnection
            })
            .catch(err => console.error(err));
    });
}

function getNextAction(db) {
    return new Promise(function (resolve, reject) {
        inquirer
            .prompt([
                {
                    type: 'list',
                    message: 'What would you like to do?',
                    choices: ["view all departments", "view all roles", "view all employees", "add a department", "add a role", "add an employee", "update an employee role", "quit"],
                    name: 'choice',
                    loop: false
                }
            ])
            .then(function (response) {
                switch (response.choice) {
                    case "quit":
                        return db;
                    case "view all departments":
                        return showTableContents(db, "department");
                    case "view all roles":
                        return showTableContents(db, "role");
                    case "view all employees":
                        return showTableContents(db, "employee");
                    case "add a department":
                        return addADepartment(db);
                    case "add a role":
                        return addARole(db);
                    case "add an employee":
                        return addAnEmployee(db);
                    case "update an employee role":
                        return updateAnEmployeeRole(db);
                }
            })
            .then((db) => resolve(db))
            .catch((db) => reject(db));
    });
};

//Connect to database
var db = mysql.createConnection(
    {
        host: 'localhost',
        // MySQL username,
        user: 'root',
        // MySQL password
        password: MYSQL_PASSWORD,
        database: 'employee_db'
    }
);

console.log(`Connected to the employee_db database.`)

getNextAction(db).
    then(() => console.log("Exiting"))
    .then(() => db.end());