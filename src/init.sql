CREATE TABLE categories (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(128) NOT NULL UNIQUE
);

CREATE TABLE coctails (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(128) NOT NULL UNIQUE,
  category INTEGER NOT NULL,
  instructions TEXT NOT NULL,

  FOREIGN KEY (category) REFERENCES categories (id)
);

CREATE TABLE ingredients (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(128) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  contains_alcohol BOOLEAN NOT NULL DEFAULT FALSE,
  photo_url VARCHAR(256) NULL
);

CREATE TABLE coctail_contents (
  coctail_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  amount FLOAT NOT NULL,

  PRIMARY KEY (coctail_id, ingredient_id),
  FOREIGN KEY (coctail_id) REFERENCES coctails (id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients (id)
);
