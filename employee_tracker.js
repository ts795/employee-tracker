// Import and require inquirer
const inquirer = require('inquirer');
// Import and require mysql2
const mysql = require('mysql2');
// Import console.table
const cTable = require('console.table');

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

// Delete a role
function deleteARole(dbConnection) {
    return new Promise(function (resolve, reject) {
        // Get all roles
        var query = "select * from role";
        dbConnection.promise().query(query)
            .then(function ([rows, fields]) {
                var role_list = rows.map((row) => row.title);
                return inquirer.prompt([
                    {
                        type: 'list',
                        message: "Which role do you want to delete?",
                        name: "role",
                        choices: role_list
                    }
                ]);
            })
            .then(function (response) {
                var query = "DELETE FROM role WHERE title = ?";
                return dbConnection.promise().query(query, [response.role])
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

// Delete a department
function deleteADepartment(dbConnection) {
    return new Promise(function (resolve, reject) {
        // Get all departments
        var query = "select * from department";
        dbConnection.promise().query(query)
            .then(function ([rows, fields]) {
                var department_list = rows.map((row) => row.name);
                return inquirer.prompt([
                    {
                        type: 'list',
                        message: "Which department do you want to delete?",
                        name: "department",
                        choices: department_list
                    }
                ]);
            })
            .then(function (response) {
                var query = "DELETE FROM department WHERE name = ?";
                return dbConnection.promise().query(query, [response.department])
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

// View employees by department
function viewEmployeesByDepartment(dbConnection) {
    var userInputs = null;
    return new Promise(function (resolve, reject) {
        // Get all departments
        var query = "select * from department";
        dbConnection.promise().query(query)
            .then(function ([rows, fields]) {
                var department_list = rows.map((row) => row.name);
                return inquirer.prompt([
                    {
                        type: 'list',
                        message: "Which department do you want to display employees for?",
                        name: "department",
                        choices: department_list
                    }
                ]);
            })
            .then(function (response) {
                var query = "select e.first_name, e.last_name from employee as e join role as r on e.role_id = r.id join department as d on r.department_id = d.id where d.name=?";
                return dbConnection.promise().query(query, [response.department])
            })
            .then(function ([rows, fields]) {
                console.table(rows);
                return;
            })
            .then(function () {
                return getNextAction(dbConnection);
            })
            .then(function () {
                resolve();
                return dbConnection;
            });
    });
}

// View employees by Manager
function viewEmployeesByManager(dbConnection) {
    var userInputs = null;
    return new Promise(function (resolve, reject) {
        // Get all managers
        var query = "select DISTINCT e2.first_name as manager_first_name, e2.last_name as manager_last_name FROM employee e1 JOIN employee e2 ON e1.manager_id = e2.id";
        dbConnection.promise().query(query)
            .then(function ([rows, fields]) {
                var managers_list = rows.map((row) => row.manager_first_name + " " + row.manager_last_name);
                return inquirer.prompt([
                    {
                        type: 'list',
                        message: "Which manager do you want to display employees for?",
                        name: "manager",
                        choices: managers_list
                    }
                ]);
            })
            .then(function (response) {
                var { firstName, lastName } = getFirstAndLastFromFullName(response.manager);
                var query = "select e1.first_name, e1.last_name  FROM employee e1 JOIN employee e2 ON e1.manager_id = e2.id where e2.first_name = ? AND e2.last_name = ?";
                return dbConnection.promise().query(query, [firstName, lastName])
            })
            .then(function ([rows, fields]) {
                console.table(rows);
                return;
            })
            .then(function () {
                return getNextAction(dbConnection);
            })
            .then(function () {
                resolve();
                return dbConnection;
            });
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

// Update an employee's manager
function updateAnEmployeeManager(dbConnection) {
    var userInputs = null;
    return new Promise(function (resolve, reject) {
        // Get a list of the employees
        getAllEmployees(dbConnection)
            .then(function (employeeNames) {
                return inquirer.prompt([
                    {
                        type: 'list',
                        message: "Which employee's manager do you want to update?",
                        name: "employee_to_update",
                        choices: employeeNames
                    },
                    {
                        type: 'input',
                        message: "Who is the employee's new manager?",
                        name: "new_manager"
                    }
                ]);
            })
            .then(function (response) {
                userInputs = response;
                var { firstName, lastName } = getFirstAndLastFromFullName(response.new_manager);
                return lookupID(dbConnection, `SELECT id FROM employee WHERE first_name = ? AND last_name = ?`, [firstName, lastName]);
            })
            .then(function (id) {
                // Update the Manager's ID for the employee
                var { firstName, lastName } = getFirstAndLastFromFullName(userInputs.employee_to_update);
                return dbConnection.promise().query("UPDATE employee SET manager_id = ? WHERE first_name = ? AND last_name = ?", [id, firstName, lastName]);
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
                var { firstName, lastName } = getFirstAndLastFromFullName(userResponse.manager);
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
                    choices: ["view all departments", "view all roles", "view all employees", "add a department", "add a role", "add an employee", "update an employee role", "update an employee's manager", "view employees by manager", "view employees by department", "delete a department", "delete a role", "quit"],
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
                    case "update an employee's manager":
                        return updateAnEmployeeManager(db);
                    case "view employees by manager":
                        return viewEmployeesByManager(db);
                    case "view employees by department":
                        return viewEmployeesByDepartment(db);
                    case "delete a department":
                        return deleteADepartment(db);
                    case "delete a role":
                        return deleteARole(db);
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