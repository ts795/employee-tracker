// Import and require inquirer
const inquirer = require('inquirer');
// Import and require mysql2
const mysql = require('mysql2');

// Get the password from an envurionment variable or leave it empty if it is not specified
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';

//Connect to database
const db = mysql.createConnection(
    {
        host: 'localhost',
        // MySQL username,
        user: 'root',
        // MySQL password
        password: MYSQL_PASSWORD,
        database: 'employee_db'
    },
    console.log(`Connected to the employee_db database.`)
);

function getNextAction() {
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
                        resolve();
                        return;
                    case "view all departments":
                        db.promise().query("SELECT * FROM department")
                            .then(([rows, fields]) => {
                                console.log("\n");
                                console.table(rows);
                            })
                            .catch(console.log);
                        break;
                }
                getNextAction().then(() => resolve())
            })
    });
};

getNextAction().then(() => db.end());