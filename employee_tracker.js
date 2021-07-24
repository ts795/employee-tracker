// Import and require inquirer
const inquirer = require('inquirer');
// Import and require mysql2
const mysql = require('mysql2/promise');

// Get the password from an envurionment variable or leave it empty if it is not specified
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';

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
                return dbConnection.query("INSERT INTO department (name) VALUES (?)", [response.department_name]);
            })
            .then(([rows, fields]) => {
                return dbConnection;
            })
            .then(function (db) {
                return getNextAction(db);
            })
            .then((dbConnection) => dbConnection)
            .catch(err => console.error(err));
    }
    )
}

// Display the contents of a table to the console
function showTableContents(dbConnection, tableName) {
    return new Promise(function (resolve, reject) {
        var query = `SELECT * FROM ${tableName}`;
        dbConnection.query(query)
            .then(([rows, fields]) => {
                console.table(rows);
                return dbConnection;
            })
            .then(function (db) {
                return getNextAction(db);
            })
            .then((dbConnection) => dbConnection)
            .catch(err => console.error(err));
    });
}

console.log(`Connected to the employee_db database.`)

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
                }
            })
            .then((db) => resolve(db))
            .catch((db) => reject(db));
    });
};

//Connect to database
mysql.createConnection(
    {
        host: 'localhost',
        // MySQL username,
        user: 'root',
        // MySQL password
        password: MYSQL_PASSWORD,
        database: 'employee_db'
    }
)
    .then((db) => getNextAction(db))
    .then((db) => db.close());