# TwinDay XAMPP backend

1. Import `../database/schema.sql` in phpMyAdmin or with the XAMPP MariaDB client.
2. Copy this `backend` folder to `C:\xampp\htdocs\twinday-api`.
3. Confirm Apache and MySQL/MariaDB are running in XAMPP.
4. The registration endpoint will be available at `http://127.0.0.1/twinday-api/api/register.php`.
5. To create each super admin, run `C:\xampp\php\php.exe tools/create_super_admin.php` from the copied backend folder. The tool is CLI-only and is not exposed through Apache.

The login endpoint returns a temporary 7-day token. Protected API requests send it in the `X-Auth-Token` header.

The default configuration expects XAMPP's local `root` user with an empty password. Change `api/config.php` if your MariaDB credentials differ.
