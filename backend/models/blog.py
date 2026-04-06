from typing import Optional

from pydantic import BaseModel


class BlogPostBase(BaseModel):
    title: str
    titlePt: str
    excerpt: str
    excerptPt: str
    content: str
    contentPt: str
    date: str
    tag: str
    author: str
    coverImage: Optional[str] = None


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BlogPostBase):
    pass


class BlogPostOut(BlogPostBase):
    id: str
