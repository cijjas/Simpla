#!/usr/bin/env python3
"""
Bulk-importer for the Infoleg CSV snapshots.

• Reads every *.csv in the folder you pass on the CLI.
• Upserts look-up tables (tipos_norma, clases_norma, organismos).
• Upserts normas, preserving counts (modificada_por_count / modifica_a_count).
• Loads true modification links from the complementary CSVs
   (…modificadas… and …modificatorias…).
"""

import argparse
import glob
import os
import re
import sys
from datetime import datetime

import pandas as pd
from sqlalchemy import text

# ❶ Remove "from sqlalchemy.dialects.postgresql import insert" – we won't use it.
# from sqlalchemy.dialects.postgresql import insert  # <-- REMOVED

# ───────────────────────────────────────────────────────────────────────────────
# DB connection (expects you already have an SQLAlchemy Engine called `engine`)
# ───────────────────────────────────────────────────────────────────────────────
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import engine  # noqa: E402  (local import after sys.path hack)

DATE_COLS = ["fecha_sancion", "fecha_boletin"]

# Mapping from CSV column → (table_name, fk_column_in_normas)
LOOKUPS = {
    "tipo_norma":  ("tipos_norma",   "tipo_norma_id"),
    "clase_norma": ("clases_norma",  "clase_norma_id"),
    "organismo_origen": ("organismos", "organismo_id"),
}


# ─────────────────────────── helper: load/insert lookup ───────────────────────
def upsert_lookup(col_name: str, values: pd.Series) -> dict:
    """
    Insert new lookup rows (if any) and return a {text_value: id} mapping.
    """
    tbl, _ = LOOKUPS[col_name]
    unique_vals = (
        values.dropna()
        .astype(str)
        .str.strip()
        .loc[lambda s: s.ne("")]
        .unique()
    )

    # Insert each unique value with ON CONFLICT (nombre) DO NOTHING
    with engine.begin() as conn:
        for val in unique_vals:
            conn.execute(
                text(
                    f"""INSERT INTO {tbl} (nombre)
                        VALUES (:v)
                        ON CONFLICT (nombre) DO NOTHING
                    """
                ),
                {"v": val},
            )

    # Now read the full table to build a Python dict {nombre → id}
    df_map = pd.read_sql(f"SELECT id, nombre FROM {tbl}", engine)
    return df_map.set_index("nombre")["id"].to_dict()


# ──────────────────────────── load normas CSVs ────────────────────────────────
def process_normas_csv(path: str):
    # Force numero_norma to string to avoid mixed‑dtype warnings
    df = pd.read_csv(path, dtype={"numero_norma": str}, low_memory=False)

    # ---- Clean text columns ----
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].fillna("").str.strip()

    # Remove duplicate id_norma rows
    df = df.drop_duplicates(subset="id_norma", keep="last")

    # Convert date columns
    for col in DATE_COLS:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce").dt.date

    # ---- Upsert look-ups and map them to IDs ----
    for src_col, (tbl, fk_col) in LOOKUPS.items():
        if src_col in df.columns:
            mapping = upsert_lookup(src_col, df[src_col])
            df[fk_col] = df[src_col].map(mapping)
        else:
            # If the CSV has no such column, fill with None
            df[fk_col] = None

    # We treat modificada_por / modifica_a as simple *counts*, not relationships
    df.rename(
        columns={
            "modificada_por": "modificada_por_count",
            "modifica_a": "modifica_a_count",
        },
        inplace=True,
    )
    if "modificada_por_count" not in df.columns:
        df["modificada_por_count"] = 0
    if "modifica_a_count" not in df.columns:
        df["modifica_a_count"] = 0

    df["modificada_por_count"] = pd.to_numeric(
        df["modificada_por_count"], errors="coerce"
    ).fillna(0).astype(int)
    df["modifica_a_count"] = pd.to_numeric(
        df["modifica_a_count"], errors="coerce"
    ).fillna(0).astype(int)

    # Drop original text columns for lookups
    df = df.drop(columns=list(LOOKUPS.keys()), errors="ignore")

    # ---- Upsert into normas ----
    with engine.begin() as conn:
        tmp_table = "_normas_tmp"
        df.to_sql(tmp_table, conn, if_exists="replace", index=False)

        cols = [c for c in df.columns if c != "id_norma"]
        update_set = ",\n                ".join(f"{c}=EXCLUDED.{c}" for c in cols)

        conn.execute(
            text(
                f"""
                INSERT INTO normas ({", ".join(df.columns)})
                SELECT {", ".join(df.columns)} FROM {tmp_table}
                ON CONFLICT (id_norma) DO UPDATE
                SET {update_set}
                """
            )
        )
        conn.execute(text(f"DROP TABLE {tmp_table}"))

    print(f"✔  {len(df):>6} normas   ←  {os.path.basename(path)}")


# ───────────────────────────── load relations ────────────────────────────────
def process_relations_csv(path: str):
    # Force nro_norma to string to avoid mixed‑dtype warnings (even if we later drop it)
    df = pd.read_csv(path, dtype={"nro_norma": str}, low_memory=False)

    # Normalise column names (the two complementary files name them differently)
    col_map = {
        "id_norma_modificatoria": "norma_modificadora",
        "id_norma_modificada": "norma_modificada",
    }
    df.rename(columns=col_map, inplace=True)

    # Only keep the main columns; ensure integers
    rels = df[["norma_modificadora", "norma_modificada"]].dropna().astype(int)

    # We label the relationship "modifica"
    rels["tipo_relacion"] = "modifica"
    rels.drop_duplicates(inplace=True)

    # Insert with ON CONFLICT DO NOTHING to avoid duplicates
    with engine.begin() as conn:
        tmp_table = "_rel_tmp"
        rels.to_sql(tmp_table, conn, if_exists="replace", index=False)

        conn.execute(
            text(
                f"""
                INSERT INTO relaciones_normativas
                (norma_modificadora, norma_modificada, tipo_relacion)
                SELECT norma_modificadora, norma_modificada, tipo_relacion
                FROM {tmp_table}
                ON CONFLICT (norma_modificadora, norma_modificada, tipo_relacion) DO NOTHING
                """
            )
        )
        conn.execute(text(f"DROP TABLE {tmp_table}"))

    print(f"✔  {len(rels):>6} relaciones ←  {os.path.basename(path)}")


# ─────────────────────────────── main CLI ────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(
        description="Import all Infoleg CSVs in a folder into the DB."
    )
    ap.add_argument("folder", help="Path containing the CSV snapshots")
    args = ap.parse_args()

    csvs = glob.glob(os.path.join(args.folder, "*.csv"))
    if not csvs:
        print("No CSV files found.")
        sys.exit(1)

    # 1) Normas CSV first (so that rows exist for the relationships)
    for path in csvs:
        # This pattern ensures we only process the main normative CSV here
        if re.search(r"normativa-nacional", path, re.IGNORECASE):
            process_normas_csv(path)

    # 2) Then process the relation CSVs
    for path in csvs:
        # Any CSV with "modificadas" or "modificatorias" in its name
        if re.search(r"(modificadas|modificatorias)", path, re.IGNORECASE):
            process_relations_csv(path)

    print("\n✅  Import finished at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))


if __name__ == "__main__":
    main()