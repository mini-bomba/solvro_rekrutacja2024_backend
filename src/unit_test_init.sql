INSERT INTO categories (id, name) 
VALUES (1, 'test category 1'), (2, 'another test category');

INSERT INTO ingredients (id, name, description, contains_alcohol, photo_url)
VALUES (1, 'test ingredient 1', 'description!!!!', FALSE, NULL),
(2, 'a second ingredient', 'this one has alcohol', TRUE, 'https://minibomba.pro/icons/mini_bomba.png');

INSERT INTO coctails (id, name, category, instructions)
VALUES (1, 'test coctail 1', 2, 'test, test, and test');

INSERT INTO coctail_contents (coctail_id, ingredient_id, amount)
VALUES (1, 2, 3);

