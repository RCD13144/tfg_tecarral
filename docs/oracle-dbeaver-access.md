# DBeaver Access to Oracle PostgreSQL

This setup keeps PostgreSQL closed to the public Internet and allows access
from DBeaver on a Windows laptop through an SSH tunnel only.

## Security model

- `postgres` is **not** published in `docker-compose.prod.yml`
- Oracle Cloud **must not** expose `5432`
- DBeaver connects to the VM over `SSH`
- PostgreSQL credentials for DBeaver are **separate** from the app credentials

## 1. Confirm PostgreSQL stays private

Current production expectation in `backend/tecarral-api/docker-compose.prod.yml`:

- `postgres` has **no** `ports:` section
- `api` connects internally with:
  - `DB_HOST=postgres`
  - `DB_PORT=5432`

Do not add any Oracle or iptables rule for `5432`.

## 2. Create a dedicated DBeaver database user

1. Copy `backend/tecarral-api/deploy/oracle/create-dbeaver-role.sql.example`
   to the VM outside the repo or edit a temporary copy there.
2. Replace:
   - `REPLACE_WITH_A_LONG_UNIQUE_PASSWORD`
3. Run it from `~/apps/tecarral-api/backend/tecarral-api`:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \
  exec -T postgres psql -U tecarral_user -d tecarral < /tmp/create-dbeaver-role.sql
```

Expected result:

- role `tecarral_dbeaver` exists
- it can connect, read and modify data in `public`
- it cannot create roles, databases or become superuser

## 3. Harden SSH on the VM

1. Copy `backend/tecarral-api/deploy/oracle/99-tecarral-ssh-hardening.conf.example`
   to:

```bash
/etc/ssh/sshd_config.d/99-tecarral-ssh-hardening.conf
```

2. Validate and reload:

```bash
sudo sshd -t
sudo systemctl reload ssh
```

3. Before closing your current session, open a second terminal from Windows
   and verify SSH still works with your key.

Recommended Oracle Cloud rule:

- keep `22` open only to your public IP if it is stable
- otherwise keep `22` open but with key-only auth and no passwords

## 4. Configure DBeaver on Windows

Create a PostgreSQL connection with:

- Host: `127.0.0.1`
- Port: `5432`
- Database: `tecarral`
- Username: `tecarral_dbeaver`
- Password: the password set in the SQL file

Enable `Use SSH Tunnel`:

- SSH Host: your Oracle VM public IP or host
- SSH Port: `22`
- SSH User: `ubuntu`
- Authentication: `Public Key`
- Private key: your Windows SSH private key or `.pem`
- Remote host: `127.0.0.1`
- Remote port: `5432`

This means:

- DBeaver runs on your laptop
- SSH connects to the VM
- the tunnel reaches PostgreSQL locally inside the VM path
- PostgreSQL is never exposed directly to the Internet

## 5. Validation

### Confirm PostgreSQL is closed publicly

From Windows:

```powershell
Test-NetConnection api.tecarralops.com -Port 5432
```

Expected:

- connection fails

### Confirm SSH tunnel works

In DBeaver:

- test connection should succeed
- schemas and tables should load

### Confirm the app still works

From Windows:

```powershell
curl https://api.tecarralops.com/
```

Expected:

- API responds normally

### Confirm permissions are limited

In DBeaver, verify:

- `SELECT`, `INSERT`, `UPDATE`, `DELETE` work on app tables
- creating a database fails
- creating a role fails

## 6. What not to do

- Do not add `5432:5432` to production Docker
- Do not open `5432` in Oracle Security Lists or NSGs
- Do not reuse the backend app user for DBeaver
- Do not leave SSH password authentication enabled
