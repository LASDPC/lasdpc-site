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


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BlogPostBase):
    pass


class BlogPostOut(BlogPostBase):
    id: str
