import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

from .models import User, Post, Follow, Like, Comment
from django.core.paginator import Paginator

def index(request):
    return render(request, "network/index.html")

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
    
@csrf_exempt
@login_required
def posting(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    data = json.loads(request.body)
    content = data.get("content", "")
    post = Post(user = request.user, content = content)
    post.save()
    return JsonResponse({"message": "Posting successfully."}, status=201)

@csrf_exempt
def postbox(request, postbox, page_number):
    if postbox == 'index':
        posts = Post.objects.all()
    elif postbox == 'follow':
        follows = Follow.objects.filter(user = request.user).values("following")
        posts = Post.objects.filter(user__in = follows)
    else:
        try:
            user = User.objects.get(username = postbox)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found."}, status = 404) 
        posts = Post.objects.filter(user = user)
    posts = posts.order_by("-timestamp").all()
    p = Paginator(posts, 10)
    page = p.page(page_number)
    range = list(p.page_range)
    return JsonResponse({"posts": [post.serialize() for post in page],"range": range, "has_previous": page.has_previous(), "has_next": page.has_next()}, safe=False)

@csrf_exempt
@login_required
def post(request, post_id):
    try:
        post = Post.objects.get(id = post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status = 404)
    if request.method == "GET":
        return JsonResponse(post.serialize())
    elif request.method == "PUT":
        data = json.loads(request.body)
        if data.get("content") is not None:
            post.content = data["content"]
        post.save()
        return HttpResponse(status = 204)
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)

@csrf_exempt
@login_required
def comment(request, post_id):
    try:
        post = Post.objects.get(id = post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status = 404)
    if request.method == "GET":
        comments = Comment.objects.filter(post = post)
        return JsonResponse([comment.serialize() for comment in comments])
    elif request.method == "PUT":
        data = json.loads(request.body)
        if data.get("content") is not None:
            com = Comment(post = post, user = request.user, content = data["content"])
            com.save()
        return HttpResponse(status = 204)
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)

@csrf_exempt
def like(request, post_id):
    try:
        post = Post.objects.get(id = post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status = 404)
    if request.method == "GET":
        if not Like.objects.filter(post = post).exists():
            postlike = Like(post = post)
            postlike.save()
        users = Like.objects.filter(post = post).values("users")
        if users[0]['users'] == None:
            total_like = 0
        else:
            total_like = users.count()
        if request.user.is_authenticated and  users.filter(users = request.user).exists():
            is_liked = True
        else:
            is_liked = False
        return JsonResponse({"total_like" : total_like, "is_liked": is_liked})
    elif request.method == "PUT":
        data = json.loads(request.body)
        like_obj = Like.objects.get(post = post)
        if data["liked"] == True:
            like_obj.users.add(request.user)
        else:
            like_obj.users.remove(request.user)
        like_obj.save()
        return HttpResponse(status = 204)

    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)

def user(request, username):
    try:
        user = User.objects.get(username = username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status = 404)
    return JsonResponse(user.serialize())

@csrf_exempt
def follow(request, username):
    try:
        user = User.objects.get(username = username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status = 404)
    if request.method == "GET":
        if not Follow.objects.filter(user = user).exists():
            user_follow = Follow(user = user)
            user_follow.save()
        users = Follow.objects.filter(user = user).values("following")
        if users[0]['following'] == None:
            following = 0
        else:
            following = users.count()
        is_followed = False
        if request.user.is_authenticated:
            current_user = Follow.objects.filter(user = request.user).values('following')
            if current_user.filter(following = user).exists():
                is_followed = True
        followers = Follow.objects.filter(following = user).count()
        return JsonResponse({"following" : following, "followers": followers, "is_followed": is_followed})
    elif request.method == "PUT":
        data = json.loads(request.body)
        follow_obj = Follow.objects.get(user = request.user)
        if data["followed"] == True:
            follow_obj.following.add(user)
        else:
            follow_obj.following.remove(user)
        follow_obj.save()
        return HttpResponse(status = 204)

    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)
