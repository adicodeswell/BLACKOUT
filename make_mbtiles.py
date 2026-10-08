import sqlite3

def create_dummy_mbtiles(filename):
    conn = sqlite3.connect(filename)
    c = conn.cursor()
    c.execute('CREATE TABLE metadata (name text, value text);')
    c.execute('CREATE TABLE tiles (zoom_level integer, tile_column integer, tile_row integer, tile_data blob);')
    
    metadata = [
        ('name', 'Kolkata Dummy'),
        ('type', 'baselayer'),
        ('version', '1.1'),
        ('description', 'Dummy MBTiles for Kolkata'),
        ('format', 'png'),
        ('bounds', '-180.0,-85.0511,180.0,85.0511'),
        ('center', '88.3639,22.5726,10')
    ]
    c.executemany('INSERT INTO metadata VALUES (?,?)', metadata)
    
    # We won't insert actual PNG blobs to save space, MapLibre will just render nothing or fail gracefully on empty tiles
    
    conn.commit()
    conn.close()

create_dummy_mbtiles('android/app/src/main/assets/kolkata.mbtiles')
