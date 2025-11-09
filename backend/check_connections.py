import sqlite3

conn = sqlite3.connect('app_metadata.db')
cursor = conn.cursor()

print("\n=== CONNECTIONS TABLE ===")
cursor.execute('SELECT id, name, type, workspace_id, is_active, created_by FROM connections')
rows = cursor.fetchall()

if rows:
    print(f"{'ID':<5} | {'Name':<30} | {'Type':<15} | {'Workspace':<10} | {'Active':<7} | {'Created By':<10}")
    print("-" * 100)
    for row in rows:
        print(f"{row[0]:<5} | {row[1]:<30} | {row[2]:<15} | {row[3]:<10} | {row[4]:<7} | {row[5]:<10}")
    print(f"\nTotal connections: {len(rows)}")
else:
    print("No connections found in the database.")

conn.close()
