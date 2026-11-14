from fastapi import APIRouter, HTTPException

from .. import db
from ..schemas import PostIn

router = APIRouter(prefix="/api/posts", tags=["community"])


@router.get("")
def list_posts():
    return db.list_posts()


@router.post("", status_code=201)
def create_post(post: PostIn):
    return db.add_post(post.text, post.type, post.crop, db.get_farm())


@router.post("/{post_id}/helpful")
def toggle_helpful(post_id: int):
    post = db.toggle_helpful(post_id)
    if post is None:
        raise HTTPException(404, "Post not found")
    return post
