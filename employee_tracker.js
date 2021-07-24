const inquirer = require('inquirer');

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
                        break;
                    default:
                        getNextAction().then(() => resolve())
                        break;
                }
            })
    });
};

getNextAction().then((response) => console.log("Exiting"));