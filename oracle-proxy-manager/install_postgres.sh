#!/bin/bash
set -e

DB_NAME="whatsapp_warming"
DB_USER="kaio"
DB_PASS="Whatsapp_2024!" # Secure password

echo "🛠️ Installing PostgreSQL..."
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

echo "🛑 Stopping PostgreSQL for configuration..."
sudo systemctl stop postgresql

# explicit detection
PG_VER=$(ls /etc/postgresql/ | head -n 1)
if [ -z "$PG_VER" ]; then
    echo "❌ PostgreSQL version not found!"
    exit 1
fi
echo "🔍 Detected PostgreSQL Version: $PG_VER"

CONF_DIR="/etc/postgresql/$PG_VER/main"
CONF_FILE="$CONF_DIR/postgresql.conf"
HBA_FILE="$CONF_DIR/pg_hba.conf"

echo "🛑 Stopping PostgreSQL..."
sudo systemctl stop postgresql

# Backup (only if not exists)
if [ ! -f "$CONF_FILE.bak" ]; then
    sudo cp "$CONF_FILE" "$CONF_FILE.bak"
fi
if [ ! -f "$HBA_FILE.bak" ]; then
    sudo cp "$HBA_FILE" "$HBA_FILE.bak"
fi

echo "⚙️ Writing Config to $CONF_FILE..."
sudo bash -c "cat > $CONF_FILE <<EOF
# -----------------------------
# PostgreSQL Configuration (Modified for 1GB RAM)
# -----------------------------

data_directory = '/var/lib/postgresql/$PG_VER/main'
hba_file = '$HBA_FILE'
ident_file = '$CONF_DIR/pg_ident.conf'
external_pid_file = '/var/run/postgresql/$PG_VER-main.pid'

listen_addresses = '*'          # Allow external connections
port = 5432
max_connections = 50            # Reduced connections
shared_buffers = 128MB          # Low memory footprint
effective_cache_size = 256MB
maintenance_work_mem = 32MB
checkpoint_completion_target = 0.5
wal_buffers = 4MB
default_statistics_target = 100
random_page_cost = 4.0
effective_io_concurrency = 2
work_mem = 2MB
min_wal_size = 1GB
max_wal_size = 2GB

# Logging
log_timezone = 'UTC'
datestyle = 'iso, mdy'
timezone = 'UTC'
lc_messages = 'C.UTF-8'
lc_monetary = 'C.UTF-8'
lc_numeric = 'C.UTF-8'
lc_time = 'C.UTF-8'
default_text_search_config = 'pg_catalog.english'
EOF"

echo "🔓 Configuring Access Control..."
# Allow external connections with password
sudo bash -c "echo 'host    all             all             0.0.0.0/0               md5' >> $HBA_FILE"

echo "🔥 Opening Port 5432..."
sudo iptables -I INPUT -p tcp --dport 5432 -j ACCEPT
sudo netfilter-persistent save || echo "Netfilter persistent not installed, skipping save"

echo "🚀 Starting PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo "👤 Creating User and Database..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" || echo "User might already exist"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || echo "Database might already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "✅ PostgreSQL Installed & Configured!"
echo "📡 Connection String: postgres://$DB_USER:$DB_PASS@157.151.26.190:5432/$DB_NAME"
