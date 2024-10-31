INSERT INTO categories (id, name) 
VALUES (1, 'test category 1'), (2, 'another test category');

INSERT INTO ingredients (id, name, description, contains_alcohol, photo_url)
VALUES (1, 'test ingredient 1', 'description!!!!', FALSE, NULL),
       (2, 'a second ingredient', 'this one has alcohol', TRUE, 'https://minibomba.pro/icons/mini_bomba.png'),
       (3, 'another one', 'no alcohol, pikczer', FALSE, 'pikczer url here or smth idk'),
       (4, 'one more', 'alcohol, no photo', TRUE, NULL);

INSERT INTO coctails (id, name, category, instructions)
VALUES (1, 'test coctail 1', 2, 'test, test, and test'),
       (2, 'test coctail 2', 2, 'just add a bit of testing');

INSERT INTO coctail_contents (coctail_id, ingredient_id, amount)
VALUES (1, 2, 3);

