"""Router for norma-related endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from core.database.base import get_db
from features.infoleg.models.norma import NormaStructured, Division, Article
from core.utils.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()


def build_article_tree(articles: List[Article]) -> List[dict]:
    """Build a tree structure for articles with their child articles."""
    article_dict = {article.id: {
        "id": article.id,
        "ordinal": article.ordinal,
        "body": article.body,
        "order_index": article.order_index,
        "child_articles": []
    } for article in articles}
    
    # Build the tree structure
    root_articles = []
    for article in articles:
        if article.parent_article_id is None:
            root_articles.append(article_dict[article.id])
        else:
            if article.parent_article_id in article_dict:
                article_dict[article.parent_article_id]["child_articles"].append(article_dict[article.id])
    
    # Sort by order_index
    for article_data in article_dict.values():
        article_data["child_articles"].sort(key=lambda x: x["order_index"] or 0)
    
    root_articles.sort(key=lambda x: x["order_index"] or 0)
    return root_articles


def build_division_tree(divisions: List[Division]) -> List[dict]:
    """Build a tree structure for divisions with their child divisions and articles."""
    division_dict = {division.id: {
        "id": division.id,
        "name": division.name,
        "ordinal": division.ordinal,
        "title": division.title,
        "body": division.body,
        "order_index": division.order_index,
        "child_divisions": [],
        "articles": []
    } for division in divisions}
    
    # Build the tree structure
    root_divisions = []
    for division in divisions:
        if division.parent_division_id is None:
            root_divisions.append(division_dict[division.id])
        else:
            if division.parent_division_id in division_dict:
                division_dict[division.parent_division_id]["child_divisions"].append(division_dict[division.id])
    
    # Sort by order_index
    for division_data in division_dict.values():
        division_data["child_divisions"].sort(key=lambda x: x["order_index"] or 0)
    
    root_divisions.sort(key=lambda x: x["order_index"] or 0)
    return root_divisions


@router.get("/norma/{norma_id}/")
async def get_norma_by_id(norma_id: int, db: Session = Depends(get_db)):
    """
    Get a single norma with all its divisions and articles recursively.
    
    Args:
        norma_id: The ID of the norma to retrieve
        db: Database session
        
    Returns:
        JSON with norma metadata and nested divisions/articles
    """
    logger.info(f"Fetching norma with ID: {norma_id}")
    
    # Query the norma with all related data
    norma = db.query(NormaStructured).filter(
        NormaStructured.id == norma_id
    ).first()
    
    if not norma:
        logger.warning(f"Norma with ID {norma_id} not found")
        raise HTTPException(status_code=404, detail="Norma not found")
    
    # Get all divisions for this norma
    divisions = db.query(Division).filter(
        Division.norma_id == norma_id
    ).options(
        joinedload(Division.articles)
    ).all()
    
    # Get all articles for all divisions
    division_ids = [d.id for d in divisions]
    articles = []
    if division_ids:
        articles = db.query(Article).filter(
            Article.division_id.in_(division_ids)
        ).all()
    
    # Build the response structure
    response = {
        "id": norma.id,
        "infoleg_id": norma.infoleg_id,
        "titulo_resumido": norma.titulo_resumido,
        "jurisdiccion": norma.jurisdiccion,
        "clase_norma": norma.clase_norma,
        "tipo_norma": norma.tipo_norma,
        "sancion": norma.sancion.isoformat() if norma.sancion else None,
        "publicacion": norma.publicacion.isoformat() if norma.publicacion else None,
        "estado": norma.estado,
        "divisions": []
    }
    
    # Build division tree
    division_tree = build_division_tree(divisions)
    
    # Add articles to each division
    for division_data in division_tree:
        division_articles = [a for a in articles if a.division_id == division_data["id"]]
        division_data["articles"] = build_article_tree(division_articles)
    
    response["divisions"] = division_tree
    
    logger.info(f"Successfully retrieved norma {norma_id} with {len(divisions)} divisions and {len(articles)} articles")
    return response
