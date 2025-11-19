from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


# class model for post
class Post(models.Model):
    """
    user: User,
    title: str
    content: str
    image: Image
    time_stamp: date auto add
    """

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="posts")
    title = models.CharField(max_length=40, null=False,)
    content = models.TextField(null=False,)
    image = models.ImageField(upload_to="images/", null=True, blank=True)
    time_stamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.title} - {self.content} - {self.time_stamp}"


# like model to keep track is user like or thislike post
class Like(models.Model):
    """
    user: User
    post: Post
    value: 
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="posts")
    value = models.CharField(max_length=7, choices=[("up", "Upvote"), ("down", "Downvote")])

    def __str__(self):
        return f"{self.user} - {self.post} - {self.value}"
    
