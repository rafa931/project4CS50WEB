document.addEventListener("DOMContentLoaded", function () {

    // button for vote likes
    document.querySelectorAll(".btn-like").forEach((button) => {
        button.addEventListener("click", clickBtn)
    })

    // close hamburger menu or open
    document.addEventListener("click", function (event) {
        const navItemsMobile = document.querySelector(".nav-mobile-menu");
        const hamburger = document.getElementById("hamburger")

        if (navItemsMobile.style.display === "block" ||
            !navItemsMobile.contains(event.target) &&
            !hamburger.contains(event.target)) {
            navItemsMobile.style.display = "none";
        }
        else {
            navItemsMobile.style.display = "block";
        }

    })

    // check is follow-form and editbtn exsit before adding event Listener
    const followForm = document.querySelector("#follow-form");
    if (followForm) {
        followForm.addEventListener("submit", function (event) {
            handleFollow(event);
        })
    }

    const editBtn = document.querySelectorAll(".edit-btn");
    if (editBtn) {
        editBtn.forEach(btn => {
            btn.addEventListener("click", function (event) {
                editPost(event)
            })

        })
    }

})


function clickBtn(event) {
    event.stopPropagation();
    event.preventDefault();

    const button = event.currentTarget;
    const buttonId = button.id;

    const postLink = button.closest('.post-item');
    const postId = postLink ? postLink.id : null;

    if (buttonId === `up-${postId}` || buttonId === `down-${postId}`) {
        updateVote(buttonId, postId, event);
    } else {
        return;
    }
}

// update vote
function updateVote(btnId, postId, event) {
    const button = event.currentTarget;

    fetch(`/update/${parseInt(postId)}/${btnId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ post_id: postId, value: btnId })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === "unnotarized") {
                login_modal();
                return;
            }
            updateBtnClass(data.message, button)
        })
}

// update button class
function updateBtnClass(data, button) {
    const upBtn = document.getElementById(`up-${data.post_id}`);
    const downBtn = document.getElementById(`down-${data.post_id}`);
    let otherBtn = data.value === "up" ? downBtn : upBtn;

    if (button.classList.contains("active")) {
        button.classList.remove("active");
    } else {
        button.classList.add("active");
        // remove other btn if has active
        if (otherBtn && otherBtn.classList.contains("active")) {
            otherBtn.classList.remove("active");
        }
    }
    updateLikes(data.post_id, data.likes);
}


function updateLikes(post_id, likes) {
    likesElement = document.getElementById(`likes-${post_id}`);
    likesElement.innerHTML = likes;

}



// get cookie for csrf token 
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


function login_modal() {
    const backdrop = document.createElement("div");
    backdrop.id = "modal-backdrop";
    backdrop.style.position = "fixed";
    backdrop.style.top = "0";
    backdrop.style.left = "0";
    backdrop.style.width = "100%";
    backdrop.style.height = "100%";
    backdrop.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    backdrop.style.zIndex = "999";
    backdrop.onclick = function () {
        divElement.remove();
        backdrop.remove();
    };

    divElement = document.createElement("div");
    divElement.id = "login-modal";
    divElement.style.position = "fixed";
    divElement.style.top = "50%";
    divElement.style.left = "50%";
    divElement.style.transform = "translate(-50%, -50%)";
    divElement.style.width = "200px";
    divElement.style.backgroundColor = "white";
    divElement.style.color = "black";
    divElement.style.padding = "20px";
    divElement.style.border = "1px solid #ccc";
    divElement.style.borderRadius = "8px";
    divElement.style.zIndex = "1000";
    divElement.innerHTML = "You need to log in to vote. ";

    aElement = document.createElement("a");
    aElement.href = "/login";
    aElement.textContent = "Log in Here";
    aElement.style.display = "block";
    aElement.style.marginTop = "10px";

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "5px";
    closeBtn.style.right = "10px";
    closeBtn.style.border = "none";
    closeBtn.style.background = "transparent";
    closeBtn.style.fontSize = "24px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.color = "black";
    closeBtn.onclick = function () {
        backdrop.remove();
        divElement.remove();
    };

    divElement.appendChild(closeBtn);
    divElement.append(aElement);
    document.querySelector("body").append(backdrop);
    document.querySelector("body").append(divElement);
}


function handleFollow(event) {
    event.preventDefault();
    const form = event.currentTarget;
    let username = ""
    fetch(form.action, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({
            action: form.querySelector('[name=follow_action]').value
        })
    })
        .then(response => response.json())
        .then(data => {
            data = data.message
            if (data.action === "follow") {
                username = updateFollowBtn("unfollow");
                updateFollowers(username);
            }
            else if (data.action === "unfollow") {
                username = updateFollowBtn("follow");
                updateFollowers(username);
            }
        })
        .catch(error => console.log(error));


}


function updateFollowBtn(action) {
    const btn = document.querySelector(".btn-foll");
    const input = document.querySelector("[name=follow_action]");
    user_name = input.value.split("-")[1];
    input.value = `${action}-${user_name}`;
    btn.textContent = action;

    return user_name;
}


function updateFollowers(user_name) {
    const followersField = document.querySelector("#followers-id");

    fetch(`/follow/${user_name}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        }
    })
        .then(response => response.json())
        .then(data => {
            followersField.textContent = `Followers: ${data.message.total}`
        })
        .catch(error => console.log(error));
}


function editPost(event) {
    // prevent to tag a to fire
    event.stopPropagation();
    event.preventDefault();

    const post_id = event.currentTarget.id;
    post_content = getContent(post_id);

    // backdrop to more style look
    const backdrop = document.createElement("div");
    backdrop.id = "modal-backdrop";
    backdrop.style.position = "fixed";
    backdrop.style.top = "0";
    backdrop.style.left = "0";
    backdrop.style.width = "100%";
    backdrop.style.height = "100%";
    backdrop.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    backdrop.style.zIndex = "999";
    backdrop.onclick = function () {
        divElement.remove();
        backdrop.remove();
    };

    // open cartel and fill info
    const divElement = document.createElement("div");

    divElement.id = "edit-modal";
    divElement.style.position = "fixed";
    divElement.style.top = "50%";
    divElement.style.left = "50%";
    divElement.style.transform = "translate(-50%, -50%)";
    divElement.style.backgroundColor = "#131212ff";
    divElement.style.color = "black";
    divElement.style.padding = "20px";
    divElement.style.border = "1px solid #ccc";
    divElement.style.borderRadius = "8px";
    divElement.style.zIndex = "1000";

    // close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "5px";
    closeBtn.style.right = "10px";
    closeBtn.style.border = "none";
    closeBtn.style.background = "transparent";
    closeBtn.style.fontSize = "24px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.color = "white";
    closeBtn.onclick = function () {
        backdrop.remove();
        divElement.remove();
    };

    formElement = document.createElement("form");
    formElement.action = "/edit_post";
    formElement.method = "PUT";
    formElement.classList.add("form-add-post");
    formElement.id = "form-edit";


    // input fields etc
    h4Eelement = document.createElement("h3");
    h4Eelement.style.color = "orange";
    h4Eelement.textContent = "Edit Post";
    h4Eelement.style.textAlign = "center";

    labelTitle = document.createElement("label");
    labelTitle.textContent = "Title:";
    labelTitle.htmlFor = "post-title";

    inputTitle = document.createElement("input");
    inputTitle.id = "post-title";
    inputTitle.value = post_content.title;

    labelContent = document.createElement("label");
    labelContent.textContent = "Content:";
    labelContent.htmlFor = "post-content"

    inputContent = document.createElement("textarea");
    inputContent.id = "post-content";
    inputContent.value = post_content.content;

    labelFile = document.createElement("label");
    labelFile.textContent = "Photo (Optional):";
    labelFile.htmlFor = "post-image";

    fileElemnt = document.createElement("input");
    fileElemnt.type = "file";
    fileElemnt.id = "post-image";

    fileElemnt.id = "post-image";
    fileElemnt.name = "image";
    fileElemnt.accept = "image/*";

    submitEleent = document.createElement("input");
    submitEleent.id = "submit-add";
    submitEleent.value = "Save";
    submitEleent.style.textAlign = "center";
    submitEleent.style.color = "black";
    submitEleent.style.fontSize = "16px";
    submitEleent.type = "submit";

    submitEleent.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        data = getContent();
        backdrop.remove();
        divElement.remove();
        sendEditPost(post_id, data);
    }

    divElement.appendChild(closeBtn);
    divElement.appendChild(h4Eelement);

    formElement.append(labelTitle)
    formElement.append(inputTitle);

    formElement.append(labelContent);
    formElement.append(inputContent);

    formElement.append(labelFile);
    formElement.append(fileElemnt)

    formElement.append(submitEleent);

    divElement.append(formElement);
    document.querySelector("body").append(backdrop);
    document.querySelector("body").append(divElement);

}


function getContent(post_id = "") {
    let postElement;
    let title;
    let content;
    let image = "";
    if (post_id) {
        postElement = document.getElementById(post_id);
        title = postElement.querySelector(".post-element").textContent;
        content = postElement.querySelector(".post-content").textContent;
    } else {
        formElement = document.getElementById("form-edit");
        title = document.getElementById("post-title").value;
        content = document.getElementById("post-content").value;
        image = fileElemnt.files && fileElemnt.files.length > 0 ? fileElemnt.files[0] : "";
    }

    return { title: title, content: content, image: image };
}

function sendEditPost(post_id, data) {
    const formData = new FormData()
    formData.append("title", data.title);
    formData.append("content", data.content);
    formData.append("post_id", post_id);
    if (data.image){
        formData.append("image", data.image);
    }

    fetch("/edit_post", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            updateInfoPost(post_id, data)
        })
        .catch(error => console.log(error))
}

function updateInfoPost(post_id = "", data) {
    if (post_id) {
        postEl = document.getElementById(post_id);
        postEl.querySelector(".post-element").textContent = data.message.title;
        postEl.querySelector(".post-content").textContent = data.message.content;
        postEl.querySelector(".img-post").src = data.message.image;
    }
}