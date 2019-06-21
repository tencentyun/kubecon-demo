CREATE TABLE IF NOT EXISTS `user` (
  id int primary key auto_increment,
  name varchar(128) NOT NULL unique,
  hash varchar(128) NOT NULL
) ENGINE=InnoDB