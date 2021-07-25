// Import and require inquirer
const inquirer = require('inquirer');
// Import and require mysql2
const mysql = require('mysql2');

// Get the password from an envurionment variable or leave it empty if it is not specified
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';

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