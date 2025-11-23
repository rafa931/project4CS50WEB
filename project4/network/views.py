import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt

from .models import User, Post, Like, Follow

from django.core.paginator import Paginator


def index(request):
    all_posts = Post.objects.all().order_by('-time_stamp')
    paginator = Paginator(all_posts, 10)
    page_number = request.GET.get('page')
    posts = paginator.get_page(page_number)
    # get all votes
    for post in posts:
        up_votes = Like.objects.filter(post=post, value="up").count()
        down_votes = Like.objects.filter(post=post, value="down").count()
        post.votes = up_votes - down_votes
        post.user_post = False
        if request.user.is_authenticated:
            try:
                # get if poster is of the user
                post.user_post = (post.user == request.user)

                post.user_vote = Like.objects.get(
                    user=request.user, post=post).value
            except:
                post.user_vote = None
        else:
            post.user_vote = None

    return render(request, "network/index.html",
                  {"posts": posts
                   })


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
    if request.user.is_authenticated:
        return HttpResponseRedirect(reverse("index"))

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


# update votes view
def update_vote(request, post_id, value):
    if request.method == "PUT" and request.user.is_authenticated:
        post = Post.objects.get(id=post_id)
        user = request.user
        value = value.split("-")
        value = value[0]
        # check if user has a vote in that post
        try:
            user_vote = Like.objects.get(user=user, post=post)
            if value == user_vote.value:
                # remove his vote
                user_vote.delete()
            else:
                # update his value
                user_vote.value = value
                user_vote.save()
        except Like.DoesNotExist:
            # add vote if not exisit for user with that post
            Like(user=request.user, post=post, value=value).save()

        votes = update_like(post_id=post_id)
        return JsonResponse({"success": True, "message": {"value": value, "post_id": post_id, "likes": votes}}, status=200)
    else:
        return JsonResponse({"success": False, "message": "unnotarized"}, status=403)


# add post view
def add_post(request):
    if request.method == "POST" and request.user.is_authenticated:
        title = request.POST.get("title")
        content = request.POST.get("content")
        image = request.FILES.get("image")
        # check for form fields are not empty
        if not title or not content:
            message = "The title or content of the post can't be empty, please fill the inputs"
            return render(request, "network/index.html", {
                "message": message
            })

        # create the post
        post = Post(
            user=request.user,
            title=title,
            content=content,
            image=image
        )
        post.save()
        return HttpResponseRedirect(reverse("index"))

    return render(request, "network/add_post.html")


# get post_view
def get_post(request, post_id):
    post = Post.objects.get(id=post_id)
    try:
        post.user_vote = Like.objects.get(user=request.user, post=post).value
    except:
        post.user_vote = None

    if post.user == request.user:
        post.user_post = True

    post.votes = update_like(post_id)

    return render(request, "network/post.html",
                  {"post": post})


def update_like(post_id):
    # get all like of that post
    post = Post.objects.get(id=int(post_id))
    up_votes = Like.objects.filter(post=post, value="up").count()
    down_votes = Like.objects.filter(post=post, value="down").count()
    return up_votes - down_votes


def profile(request, username):
    user = User.objects.get(username=username)
    posts = Post.objects.filter(user=user).order_by('-time_stamp')
    # get all votes
    for post in posts:
        up_votes = Like.objects.filter(post=post, value="up").count()
        down_votes = Like.objects.filter(post=post, value="down").count()
        post.votes = up_votes - down_votes
        if request.user.is_authenticated:
            try:
                post.user_vote = Like.objects.get(
                    user=request.user, post=post).value
            except:
                post.user_vote = None
        else:
            post.user_vote = None

    # get follower and following
    followers_count = user.following.count()
    following_count = user.follower.count()
    is_following = False
    if request.user.is_authenticated:
        is_following = user.following.filter(follower=request.user).exists()

    return render(request, "network/profile.html",
                  {"posts": posts,
                   "profile_user": user,
                   "followers_count": followers_count,
                   "following_count": following_count,
                   "is_following": is_following
                   })


def follow(request, username):
    if request.method == "POST" and request.user.is_authenticated:
        data = json.loads(request.body)
        action, user_follow = data["action"].split(
            '-')[0], data["action"].split('-')[1]
        following = User.objects.get(username=user_follow)
        if action == "follow":
            # check is user already follows
            if not Follow.objects.filter(follower=request.user, following=following).exists():
                # follow user
                Follow(follower=request.user, following=following).save()
        elif action == "unfollow":
            Follow.objects.filter(follower=request.user,
                                  following=following).delete()

        return JsonResponse({"success": True,
                             "message": {"action": action
                                         }}, status=200)

    else:
        # get total followers a user has
        user = User.objects.get(username=username)
        total_followers = Follow.objects.filter(following=user).count()
        return JsonResponse({"status": True,
                            "message": {"total": total_followers}}, status=200)


def following(request):
    if request.user.is_authenticated:
        user = request.user
        # get all user this 'user' follows
        follow_users = Follow.objects.filter(follower=user)
        follow_users = [f.following for f in follow_users]
        post_followers = []
        for follower in follow_users:
            post_followers.extend(Post.objects.filter(user=follower))

        post_followers.sort(key=lambda post: post.time_stamp, reverse=True)

        paginator = Paginator(post_followers, 10)
        page_number = request.GET.get('page')
        post_followers = paginator.get_page(page_number)
        for post in post_followers:
            up_votes = Like.objects.filter(post=post, value="up").count()
            down_votes = Like.objects.filter(post=post, value="down").count()

            post.votes = up_votes - down_votes

            if request.user.is_authenticated:
                try:
                    post.user_vote = Like.objects.get(
                        user=request.user, post=post).value
                except:
                    post.user_vote = None
            else:
                post.user_vote = None

        return render(request, "network/index.html",
                      {"posts": post_followers
                       })

    else:
        return HttpResponseRedirect(reverse("index"))


def edit_post(request):
    if request.method == "POST" and request.user.is_authenticated:
        print(request.POST)
        title = request.POST.get("title")
        content = request.POST.get("content")
        image = request.FILES.get("image")
        # get post and update
        post = Post.objects.get(id=request.POST.get("post_id"))
        if post.user != request.user:
            return HttpResponseRedirect(reverse("index"))

        # update object
        post.title = title
        post.content = content
        if image:
            post.image = image

        post.save()

        return JsonResponse({"success": True,
                             "message":
                             {"title": title, "content": content,
                              "image": post.image.url if post.image else ""
                              }}, status=200)

    return JsonResponse({"success": False, "message": "Invalid request"}, status=400)
