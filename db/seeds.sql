INSERT INTO department (id, name)
VALUES (1, "Engineering"),
       (2, "Shipping"),
       (3, "Manufacturing");

INSERT INTO role (id, title, salary, department_id)
VALUES (1, "Software Engineer", "40000", 1),
       (2, "Hardware Engineer", "41000", 1),
       (3, "Mechanical Engineer", "42000", 1),
       (4, "Clerk", "43000", 2),
       (5, "Truck Driver", "44000", 2),
       (6, "Shipping Manager", "45000", 2),
       (7, "Assembler", "46000", 3),
       (8, "Inspector", "47000", 3),
       (9, "Supply Chain Manager", "48000", 3);

INSERT INTO employee (id, first_name, last_name, role_id, manager_id)
VALUES (1, "Allen", "Adams", 1, null),
       (2, "Barbara", "Bailey", 2, 1),
       (3, "Charles", "Clarke", 3, 1),
       (4, "David", "Duncan", 4, 1),
       (5, "Edward", "Everett", 5, 4),
       (6, "Fiona", "Franklin", 6, 4),
       (7, "George", "Garrison", 7, 1),
       (8, "Henry", "Hamilton", 8, 7),
       (9, "Irene", "Irvington", 9, 7);