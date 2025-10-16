'use client';

import { useState, useEffect } from 'react';
import { Division, Article as NormaArticle } from '../api/normas-api';

export function useNormaExpansion(divisions: Division[] | undefined) {
  const [expandedDivisions, setExpandedDivisions] = useState<Set<number>>(
    new Set(),
  );
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(
    new Set(),
  );

  // Initialize all divisions as expanded by default
  useEffect(() => {
    if (divisions) {
      const allDivisionIds = new Set<number>();
      const allArticleIds = new Set<number>();

      const collectIds = (divs: Division[]) => {
        divs.forEach(div => {
          allDivisionIds.add(div.id);

          const collectArticleIds = (articles: NormaArticle[]) => {
            articles.forEach(art => {
              allArticleIds.add(art.id);
              if (art.child_articles.length > 0) {
                collectArticleIds(art.child_articles);
              }
            });
          };

          collectArticleIds(div.articles);

          if (div.child_divisions.length > 0) {
            collectIds(div.child_divisions);
          }
        });
      };

      collectIds(divisions);
      setExpandedDivisions(allDivisionIds);
      setExpandedArticles(allArticleIds);
    }
  }, [divisions]);

  const toggleDivision = (divisionId: number) => {
    const newExpanded = new Set(expandedDivisions);
    if (newExpanded.has(divisionId)) {
      newExpanded.delete(divisionId);
    } else {
      newExpanded.add(divisionId);
    }
    setExpandedDivisions(newExpanded);
  };

  const toggleArticle = (articleId: number) => {
    const newExpanded = new Set(expandedArticles);
    if (newExpanded.has(articleId)) {
      newExpanded.delete(articleId);
    } else {
      newExpanded.add(articleId);
    }
    setExpandedArticles(newExpanded);
  };

  const expandAll = () => {
    if (!divisions) return;
    const allDivisionIds = new Set<number>();
    const allArticleIds = new Set<number>();

    const collectIds = (divs: Division[]) => {
      divs.forEach(div => {
        allDivisionIds.add(div.id);

        const collectArticleIds = (articles: NormaArticle[]) => {
          articles.forEach(art => {
            allArticleIds.add(art.id);
            if (art.child_articles.length > 0) {
              collectArticleIds(art.child_articles);
            }
          });
        };

        collectArticleIds(div.articles);

        if (div.child_divisions.length > 0) {
          collectIds(div.child_divisions);
        }
      });
    };

    collectIds(divisions);
    setExpandedDivisions(allDivisionIds);
    setExpandedArticles(allArticleIds);
  };

  const collapseAll = () => {
    setExpandedDivisions(new Set());
    setExpandedArticles(new Set());
  };

  return {
    expandedDivisions,
    expandedArticles,
    toggleDivision,
    toggleArticle,
    expandAll,
    collapseAll,
  };
}
