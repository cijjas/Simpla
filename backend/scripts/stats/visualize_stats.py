#!/usr/bin/env python3
"""
visualize_stats.py

Carga el JSON generado y:
  • lo imprime formateado en consola
  • muestra gráficos variados según el tipo de estadística:
    - "Normas por tipo": gráfico de barras
    - "Top 10 Organismos Origen": gráfico de barras
    - "Normas por Fecha de Sanción": serie temporal
    - "Distribución de Clase de Norma": gráfico de torta (pie chart)

Uso:
  python visualize_stats.py --in data_sample/infoleg_stats.json
"""
import argparse
import json
import pprint
from pathlib import Path

def main() -> None:
    ap = argparse.ArgumentParser(description="Visualización de estadísticas Infoleg")
    ap.add_argument(
        "--in", dest="input", required=True, type=Path,
        help="Ruta al JSON de estadísticas generado"
    )
    args = ap.parse_args()

    # Carga y muestra en consola
    stats = json.loads(args.input.read_text(encoding="utf-8"))
    pprint.pp(stats, sort_dicts=False)

    # Gráficos con matplotlib
    try:
        import matplotlib.pyplot as plt

        # 1) Normas por tipo (barra)
        tipos, counts = zip(*stats["count_by_tipo_norma"].items())
        plt.figure()
        plt.bar(tipos, counts)
        plt.xticks(rotation=45, ha="right")
        plt.title("Normas por tipo")
        plt.tight_layout()

        # 2) Top 10 Organismos Origen (barra)
        orgs, counts_org = zip(*stats["top_organismos_origen"].items())
        plt.figure()
        plt.bar(orgs, counts_org)
        plt.xticks(rotation=90, ha="right")
        plt.title("Top 10 Organismos Origen")
        plt.tight_layout()

        # 3) Normas por Fecha de Sanción (línea)
        if "normas_per_day" in stats:
            fechas = list(stats["normas_per_day"].keys())
            valores = list(stats["normas_per_day"].values())
            plt.figure()
            plt.plot(fechas, valores, marker="o")
            plt.xticks(rotation=45, ha="right")
            plt.title("Normas por Fecha de Sanción")
            plt.tight_layout()

        # 4) Distribución de Clase de Norma (torta)
        if "clase_norma_distribution" in stats:
            clases, counts_cls = zip(*stats["clase_norma_distribution"].items())
            plt.figure()
            plt.pie(counts_cls, labels=clases, autopct='%1.1f%%', startangle=90)
            plt.axis('equal')  # Círculo perfecto
            plt.title("Distribución de Clase de Norma")
            plt.tight_layout()

        # Mostrar todas las figuras juntas
        plt.show()

    except ImportError:
        print("\n(matplotlib no instalado: se omitió el gráfico)")

if __name__ == "__main__":
    main()
