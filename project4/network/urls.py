
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("update/<int:post_id>/<str:value>", views.update_vote, name="update_vote"),
    path("post/<int:post_id>", views.get_post, name="post"),
    path("add_post", views.add_post, name="add_post"),
    path("profile/<str:username>", views.profile, name="profile"),
    path("follow/<str:username>", views.follow, name="follow"),
    path("following", views.following, name="following")
]
