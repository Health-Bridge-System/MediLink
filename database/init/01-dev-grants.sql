-- Development only: Prisma Migrate creates a temporary "shadow" database
-- to check migrations, so the app user needs rights beyond `medilink`.
GRANT ALL PRIVILEGES ON *.* TO 'medilink'@'%';
FLUSH PRIVILEGES;
