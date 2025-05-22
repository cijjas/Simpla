#!/usr/bin/env python3
"""
compute_stats.py

Convierte un CSV de Infoleg en un JSON con estadísticas descriptivas
(puede integrarse luego como endpoint o seed de dashboards).

Uso:
  python compute_stats.py \
      --csv data_sample/base-infoleg-normativa-nacional-muestreo.csv \
      --out data_sample/infoleg_stats.json
"""
import argparse, json
from pathlib import Path
import pandas as pd


def load_dataset(csv_path: Path) -> pd.DataFrame:
    """Carga el CSV con los tipos de dato apropiados."""
    date_cols = ["fecha_sancion", "fecha_boletin"]
    return pd.read_csv(csv_path, parse_dates=date_cols, low_memory=False)


def compute_stats(df: pd.DataFrame) -> dict:
    """Devuelve un diccionario con estadísticas clave."""
    stats: dict[str, object] = {}

    # ▸ conteos básicos
    stats["total_normas"]          = int(len(df))
    stats["count_by_tipo_norma"]   = df["tipo_norma"].value_counts().to_dict()
    stats["top_organismos_origen"] = (
        df["organismo_origen"].value_counts().head(10).to_dict()
    )

    # ▸ normas por día de sanción
    if "fecha_sancion" in df.columns:
        per_day = (
            df.groupby(df["fecha_sancion"].dt.date)["id_norma"].count().to_dict()
        )
        stats["normas_per_day"] = {str(k): int(v) for k, v in per_day.items()}

    # ▸ modificatorias
    stats["num_that_modify_others"] = int(df["modifica_a"].notna().sum())
    stats["num_modified_by_others"] = int(
        (df["modificada_por"].fillna(0).astype(int) > 0).sum()
    )

    # ▸ páginas del Boletín
    if "pagina_boletin" in df.columns:
        pages = df["pagina_boletin"].dropna().astype(int)
        if not pages.empty:
            stats["pagina_boletin_stats"] = {
                "min":   int(pages.min()),
                "max":   int(pages.max()),
                "mean":  round(float(pages.mean()), 2),
            }

    # ▸ distribución de clase_norma (cuando aplique)
    if "clase_norma" in df.columns:
        stats["clase_norma_distribution"] = (
            df["clase_norma"].dropna().value_counts().to_dict()
        )

    return stats


def main() -> None:
    ap = argparse.ArgumentParser(description="CSV → JSON de estadísticas Infoleg")
    ap.add_argument("--csv", required=True, type=Path, help="Ruta al CSV de Infoleg")
    ap.add_argument("--out", required=True, type=Path, help="Archivo destino .json")
    args = ap.parse_args()

    df    = load_dataset(args.csv)
    stats = compute_stats(df)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✔ Estadísticas escritas en {args.out.resolve()}")


if __name__ == "__main__":
    main()
