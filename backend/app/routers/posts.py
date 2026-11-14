from fastapi import APIRouter, HTTPException

from .. import db
from ..schemas import CommentIn, PostIn

router = APIRouter(prefix="/api/posts", tags=["community"])


@router.get("")
def list_posts():
    return db.list_posts()


@router.post("", status_code=201)
def create_post(post: PostIn):
    return db.add_post(post.text, post.type, post.crop, db.get_farm(), post.image)


@router.post("/{post_id}/helpful")
def toggle_helpful(post_id: int):
    post = db.toggle_helpful(post_id)
    if post is None:
        raise HTTPException(404, "Post not found")
    return post


@router.post("/{post_id}/comments")
def add_comment(post_id: int, comment: CommentIn):
    post = db.add_comment(post_id, comment.text, db.get_farm())
    if post is None:
        raise HTTPException(404, "Post not found")
    return post
