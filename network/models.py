from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email
        }

class Post(models.Model):
    user = models.ForeignKey(User, on_delete= models.CASCADE)
    content = models.TextField(default=None)
    timestamp = models.DateTimeField(auto_now_add= True)

    def serialize(self):
        return {
            "id": self.id,
            "user" : self.user.serialize(),
            "content" : self.content,
            "timestamp" : self.timestamp.strftime("%b %d %Y, %I:%M %p")
        }

class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    users =  models.ManyToManyField(User)

    def serialize(self):
        return {
            "id": self.id,
            "post" : self.post,
            "users" : self.users,
        }

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    content = models.TextField(default=None)

    def serialize(self):
        return {
            "id": self.id,
            "user" : self.user,
            "post" : self.post,
            "content": self.content
        }

class Follow(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="follower")
    following = models.ManyToManyField(User, related_name="follow")

    def serialize(self):
        return {
            "id": self.id,
            "user" : self.user,
            "following": self.following
        }
