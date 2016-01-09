-- Drop Table items;
-- Drop Table renter;
-- Drop Table trusts;

-- Table : "items"
Create Table items(id serial primary key, title varchar(120), renter bigint);

-- Table : "renter"
Create Table renter(id serial primary key, name varchar(80), email varchar(255), mobile varchar(14));

-- Table : "trusts"
Create Table trusts(id serial primary key, renter bigint, trust_on bigint);