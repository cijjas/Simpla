import pandas as pd
import os
import sys
from sqlalchemy import create_engine, text
import re

# Añadir directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importar configuración de base de datos
from db import engine

def extraer_ids_normas(valor):
    """
    Extrae IDs de normas de los campos modificada_por y modifica_a
    """
    if not valor or valor == '0' or pd.isna(valor):
        return []
    
    # Separamos por posibles delimitadores
    ids = re.split(r'[,;|]', str(valor))
    return [
        str(int(float(id_norma.strip())))  # forces 1.0 → 1
        for id_norma in ids if id_norma.strip() and id_norma.strip() != '0'
    ]

def importar_datos(archivo_csv):
    """
    Importa datos desde archivo CSV a la base de datos y genera relaciones
    
    Args:
        archivo_csv: Ruta al archivo CSV de normas
    """
    try:
        print(f"Importando normas desde {archivo_csv}...")
        # Leer datos de normas
        df_normas = pd.read_csv(archivo_csv)
        
        # Limpiar datos
        for col in df_normas.select_dtypes(include='object').columns:
            df_normas[col] = df_normas[col].fillna('')
        df_normas.drop_duplicates(subset='id_norma', keep='last', inplace=True)

        # Convertir fechas
        date_columns = ['fecha_sancion', 'fecha_boletin']
        for col in date_columns:
            if col in df_normas.columns:
                df_normas[col] = pd.to_datetime(df_normas[col], errors='coerce')
        
        # Insertar normas en la base de datos
        print("Insertando normas en la base de datos...")
        df_normas.to_sql('normas_temp', engine, if_exists='replace', index=False)
        
        # Transferir a la tabla principal evitando duplicados
        with engine.connect() as conn:
            conn.execute(text("""
            INSERT INTO normas 
            SELECT * FROM normas_temp
            ON CONFLICT (id_norma) DO UPDATE 
            SET 
                tipo_norma = EXCLUDED.tipo_norma,
                numero_norma = EXCLUDED.numero_norma,
                clase_norma = EXCLUDED.clase_norma,
                organismo_origen = EXCLUDED.organismo_origen,
                fecha_sancion = EXCLUDED.fecha_sancion,
                numero_boletin = EXCLUDED.numero_boletin,
                fecha_boletin = EXCLUDED.fecha_boletin,
                pagina_boletin = EXCLUDED.pagina_boletin,
                titulo_resumido = EXCLUDED.titulo_resumido,
                titulo_sumario = EXCLUDED.titulo_sumario,
                texto_resumido = EXCLUDED.texto_resumido,
                observaciones = EXCLUDED.observaciones,
                texto_original = EXCLUDED.texto_original,
                texto_actualizado = EXCLUDED.texto_actualizado,
                modificada_por = EXCLUDED.modificada_por,
                modifica_a = EXCLUDED.modifica_a
            """))
            conn.execute(text("DROP TABLE normas_temp"))
            conn.commit()
        
        print(f"Normas importadas correctamente.")
        
        # Procesar relaciones
        print("Generando relaciones normativas...")
        relaciones = []
        
        # Procesar relaciones de "modificada_por"
        for _, norma in df_normas.iterrows():
            # Normas que modifican a esta
            modificadores = extraer_ids_normas(norma['modificada_por'])
            for modificador in modificadores:
                relaciones.append({
                    'norma_modificadora': modificador,
                    'norma_modificada': norma['id_norma'],
                    'tipo_relacion': 'modifica'
                })
            
            # Normas que esta modifica
            modificados = extraer_ids_normas(norma['modifica_a'])
            for modificado in modificados:
                relaciones.append({
                    'norma_modificadora': norma['id_norma'],
                    'norma_modificada': modificado,
                    'tipo_relacion': 'modifica'
                })
        
        # Crear DataFrame de relaciones
        if relaciones:
            df_relaciones = pd.DataFrame(relaciones)
            
            # Asegurar que todas las normas referenciadas existen
            ids_validos = set(df_normas['id_norma'].astype(str))
            df_relaciones = df_relaciones[
                df_relaciones['norma_modificadora'].astype(str).isin(ids_validos) &
                df_relaciones['norma_modificada'].astype(str).isin(ids_validos)
            ]
            
            # Eliminar duplicados
            df_relaciones.drop_duplicates(inplace=True)
            
            # Insertar relaciones en la base de datos
            print(f"Insertando {len(df_relaciones)} relaciones en la base de datos...")
            df_relaciones.to_sql('relaciones_temp', engine, if_exists='replace', index=False)
            
            # Transferir a la tabla principal evitando duplicados
            with engine.connect() as conn:
                conn.execute(text("""
                INSERT INTO relaciones_normativas 
                (norma_modificadora, norma_modificada, tipo_relacion)
                SELECT 
                    norma_modificadora, 
                    norma_modificada, 
                    tipo_relacion
                FROM relaciones_temp
                ON CONFLICT (norma_modificadora, norma_modificada, tipo_relacion) DO NOTHING
                """))
                conn.execute(text("DROP TABLE relaciones_temp"))
                conn.commit()
            
            print(f"Relaciones importadas correctamente.")
        else:
            print("No se encontraron relaciones para importar.")
        
    except Exception as e:
        print(f"Error al importar datos: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    # Verificar argumentos
    if len(sys.argv) != 2:
        print("Uso: python import_data.py archivo_normas.csv")
        sys.exit(1)
    
    archivo_csv = sys.argv[1]
    
    if importar_datos(archivo_csv):
        print("Importación completada con éxito.")
    else:
        print("La importación falló.")
        sys.exit(1)