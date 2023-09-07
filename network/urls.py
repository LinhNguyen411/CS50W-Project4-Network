
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    #API routers
    path("posts", views.posting, name="posting"),
    path("posts/<str:postbox>/<int:page_number>", views.postbox, name = "postbox"),
    path("posts/<int:post_id>/edit", views.post,name="post"),
    path("posts/<int:post_id>/like",  views.like, name="like"),
    path("posts/<int:post_id>/comment", views.comment, name="comment"),

    path("users/<str:username>", views.user, name="user"),
    path("users/<str:username>/follow", views.follow, name="follow")
]
