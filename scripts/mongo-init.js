// MongoDB initialization script for Docker
db = db.getSiblingDB('parkbnb');

db.createCollection('users');
db.createCollection('listings');
db.createCollection('bookings');

print('Database parkbnb initialized successfully!');

