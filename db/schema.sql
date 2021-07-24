-- Create a database for holding employee information --
DROP DATABASE IF EXISTS employee_db;
CREATE DATABASE employee_db;

USE employee_db;

-- Table for departments --
CREATE TABLE department (
  id INT NOT NULL,
  name VARCHAR(30),
  PRIMARY KEY (id)
);

-- Table for roles for employees --
CREATE TABLE role (
  id INT NOT NULL,
  title VARCHAR(30),
  salary DECIMAL,
  department_id INT,
  FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE SET NULL,
  PRIMARY KEY (id)
);

-- Table for employees --
CREATE TABLE employee (
  id INT NOT NULL,
  first_name VARCHAR(30),
  last_name VARCHAR(30),
  role_id INT,
  manager_id INT,
  FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE SET NULL,
  FOREIGN KEY (manager_id) REFERENCES employee(id) ON DELETE SET NULL,
  PRIMARY KEY (id)
);