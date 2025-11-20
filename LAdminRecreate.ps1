# Create new admin user
docker exec -it LibreChat npm run create-user -- java@guru.com "Java Guru" jguru "Duravittoll@110"

# Set as admin
docker exec -it chat-mongodb mongosh LibreChat --eval "db.users.updateOne({email: 'java@guru.com'}, {`$set: {role: 'ADMIN', emailVerified: true}})"

# Verify
docker exec -it chat-mongodb mongosh LibreChat --eval "db.users.findOne({email: 'java@guru.com'}, {email: 1, role: 1, emailVerified: 1})"