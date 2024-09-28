import sqlite3
import json

def get_terminal_data():
    # Conexión a la base de datos SQLite
    conn = sqlite3.connect('control_base/filtro_base/baseprueba.db')
    cursor = conn.cursor()

    # Consulta a la tabla 'wks'
    cursor.execute('SELECT id, host, hostname, filial FROM wks')
    rows = cursor.fetchall()

    # Convertir los datos a formato JSON
    terminals = []
    for row in rows:
        terminal = {
            'id': row[0],
            'host': row[1],
            'hostname': row[2],
            'filial': row[3],
            'status': 'updated'  # Asignar un estado de ejemplo
        }
        terminals.append(terminal)

    conn.close()
    return json.dumps(terminals)

if __name__ == '__main__':
    print(get_terminal_data())
